"""Utilities for chunking PDFs and storing embeddings with pgvector.

This module provides a minimal ingestion pipeline that reads a PDF, splits
its text into overlapping chunks, embeds each chunk with a SentenceTransformer
model, and writes both the chunk records and pgvector embeddings into the
database. It is intentionally standalone so it can be run as a script or
imported elsewhere in the project.
"""

from __future__ import annotations

import argparse
import asyncio
import os
from pathlib import Path
from typing import Iterable, List

import fitz  # PyMuPDF
from dotenv import load_dotenv
from pgvector.asyncpg import register_vector
from sentence_transformers import SentenceTransformer
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DATABASE_URL and DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable must be set for vectorization")


# Ensure vector type is registered on each connection so we can pass Python lists
# directly to queries that accept the `vector` column type.
def _register_vector(dbapi_conn, _) -> None:  # pragma: no cover - side-effect hook
    register_vector(dbapi_conn)


connect_args = {"statement_cache_size": 0}
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)
event.listen(engine.sync_engine, "connect", _register_vector)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


_embedding_model: SentenceTransformer | None = None


def load_embedding_model() -> SentenceTransformer:
    """Lazily load and cache the embedding model used for vectorization."""

    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> Iterable[str]:
    """Yield overlapping text chunks from a larger body of text.

    Args:
        text: The source text to split.
        chunk_size: Approximate number of words per chunk.
        overlap: Number of words shared between consecutive chunks to preserve context.
    """

    words = text.split()
    if not words:
        return []

    stride = max(chunk_size - overlap, 1)
    for start in range(0, len(words), stride):
        chunk_words = words[start : start + chunk_size]
        if chunk_words:
            yield " ".join(chunk_words)


async def ensure_pgvector(session: AsyncSession) -> None:
    """Create the pgvector extension if it does not exist."""

    await session.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))


async def vectorize_pdf(
    file_id: int,
    pdf_path: Path,
    *,
    chunk_size: int = 500,
    overlap: int = 50,
    session: AsyncSession | None = None,
) -> dict:
    """Chunk a PDF and write chunk records plus embeddings to Postgres.

    Args:
        file_id: The `file_asset.file_id` value that the chunks should be linked to.
        pdf_path: Path to the PDF on disk.
        chunk_size: Approximate number of words per chunk.
        overlap: Number of words shared between consecutive chunks.
        session: Optional existing AsyncSession; if omitted, a new session is created.

    Returns:
        A summary dictionary containing the number of processed pages and chunks.
    """

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found at {pdf_path}")

    model = load_embedding_model()
    created_session = False
    if session is None:
        session = async_session()
        created_session = True

    doc = None
    try:
        async with session.begin():
            await ensure_pgvector(session)

            doc = fitz.open(pdf_path)
            total_chunks = 0

            for page_index in range(len(doc)):
                page_number = page_index + 1
                text_content = doc[page_index].get_text()
                chunks = list(chunk_text(text_content, chunk_size=chunk_size, overlap=overlap))

                if not chunks:
                    continue

                embeddings: List[List[float]] = model.encode(chunks).tolist()

                for chunk_text_value, embedding in zip(chunks, embeddings):
                    chunk_row = await session.execute(
                        text(
                            """
                            INSERT INTO text_chunk (file_id, page_number, chunk_text)
                            VALUES (:file_id, :page_number, :chunk_text)
                            RETURNING chunk_id
                            """
                        ),
                        {
                            "file_id": file_id,
                            "page_number": page_number,
                            "chunk_text": chunk_text_value,
                        },
                    )
                    chunk_id = chunk_row.scalar_one()

                    await session.execute(
                        text(
                            """
                            INSERT INTO chunk_embedding (chunk_id, embedding)
                            VALUES (:chunk_id, :embedding)
                            """
                        ),
                        {"chunk_id": chunk_id, "embedding": embedding},
                    )

                    total_chunks += 1

        return {"pages": len(doc) if doc else 0, "chunks": total_chunks}
    finally:
        if doc is not None:
            doc.close()
        if created_session:
            await session.close()


async def _main() -> None:
    parser = argparse.ArgumentParser(description="Chunk and vectorize a PDF with pgvector")
    parser.add_argument("file_id", type=int, help="file_asset.file_id to associate chunks with")
    parser.add_argument("pdf_path", type=Path, help="Path to the PDF on disk")
    parser.add_argument("--chunk-size", type=int, default=500, help="Words per chunk")
    parser.add_argument("--overlap", type=int, default=50, help="Word overlap between chunks")
    args = parser.parse_args()

    async with async_session() as session:
        summary = await vectorize_pdf(
            args.file_id,
            args.pdf_path,
            chunk_size=args.chunk_size,
            overlap=args.overlap,
            session=session,
        )

    print(
        f"Vectorization complete: {summary['chunks']} chunks across {summary['pages']} pages"
    )


if __name__ == "__main__":
    asyncio.run(_main())

