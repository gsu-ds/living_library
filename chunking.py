"""
Working PDF processing script that avoids SQLAlchemy parameter binding issues.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
import asyncpg  # Use asyncpg directly instead of SQLAlchemy
from sentence_transformers import SentenceTransformer
import fitz
from typing import List

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# asyncpg uses postgresql:// format
if DATABASE_URL and DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

PDF_BASE_DIR = Path(os.getenv("PDF_BASE_DIR", "./pdfs"))

print("🚀 Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✓ Model loaded")


def clean_text(text: str) -> str:
    """Remove null bytes and other problematic characters."""
    # Remove null bytes and other control characters except newlines and tabs
    cleaned = ''.join(char for char in text if char == '\n' or char == '\t' or ord(char) >= 32)
    return cleaned.strip()


def chunk_text(text_content: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    # Clean the text first
    text_content = clean_text(text_content)
    
    chunks = []
    start = 0
    text_length = len(text_content)
    
    while start < text_length:
        end = start + chunk_size
        chunk = text_content[start:end]
        
        if end < text_length:
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            
            if break_point > chunk_size * 0.5:
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1
        
        chunks.append(chunk.strip())
        start = end - overlap
    
    return [c for c in chunks if len(c) > 50]


async def process_pdf(conn, material_id: int, file_path: Path) -> int:
    """Process a single PDF file."""
    print(f"📄 Processing: {file_path.name}")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return 0
    
    # Get file_id
    row = await conn.fetchrow(
        "SELECT file_id FROM file_asset WHERE material_id = $1 AND is_primary = TRUE LIMIT 1",
        material_id
    )
    
    if not row:
        print(f"❌ No file_asset record found for material_id {material_id}")
        return 0
    
    file_id = row['file_id']
    
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        print(f"❌ Error opening PDF: {e}")
        return 0
    
    total_chunks = 0
    
    # Process in batches to avoid huge transactions
    batch_size = 100
    batch_chunks = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()
        
        if not page_text.strip():
            continue
        
        text_chunks = chunk_text(page_text)
        
        for chunk_content in text_chunks:
            # Generate embedding
            embedding = model.encode(chunk_content).tolist()
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            
            batch_chunks.append((file_id, page_num + 1, chunk_content, embedding_str))
            
            # Insert in batches
            if len(batch_chunks) >= batch_size:
                await insert_batch(conn, batch_chunks)
                total_chunks += len(batch_chunks)
                batch_chunks = []
        
        if (page_num + 1) % 10 == 0:
            print(f"  Processed {page_num + 1}/{len(doc)} pages... ({total_chunks} chunks so far)")
    
    # Insert remaining chunks
    if batch_chunks:
        await insert_batch(conn, batch_chunks)
        total_chunks += len(batch_chunks)
    
    doc.close()
    print(f"✓ Generated {total_chunks} chunks for {file_path.name}")
    return total_chunks


async def insert_batch(conn, batch_chunks):
    """Insert a batch of chunks and embeddings."""
    async with conn.transaction():
        for file_id, page_num, chunk_text, embedding_str in batch_chunks:
            # Insert chunk
            chunk_id = await conn.fetchval(
                "INSERT INTO text_chunk (file_id, page_number, chunk_text) VALUES ($1, $2, $3) RETURNING chunk_id",
                file_id, page_num, chunk_text
            )
            
            # Insert embedding
            await conn.execute(
                "INSERT INTO chunk_embedding (chunk_id, embedding) VALUES ($1, $2::vector)",
                chunk_id, embedding_str
            )


async def get_materials_to_process(conn):
    """Get list of materials that need processing."""
    rows = await conn.fetch("""
        SELECT DISTINCT m.material_id, fa.storage_path, fa.storage_provider
        FROM material m
        JOIN file_asset fa ON fa.material_id = m.material_id
        WHERE fa.is_primary = TRUE
          AND fa.storage_provider IN ('onedrive', 'local')
          AND NOT EXISTS (
              SELECT 1 FROM text_chunk tc WHERE tc.file_id = fa.file_id
          )
        ORDER BY m.material_id
    """)
    return [(row['material_id'], row['storage_path']) for row in rows]


async def main():
    """Main processing function."""
    print("\n" + "="*60)
    print("Living Library - Embedding Generator")
    print("="*60 + "\n")
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Get materials to process
        materials = await get_materials_to_process(conn)
        
        if not materials:
            print("✓ No materials need processing. All done!")
            return
        
        print(f"Found {len(materials)} materials to process\n")
        
        total_chunks = 0
        for idx, (material_id, storage_path) in enumerate(materials, 1):
            print(f"[{idx}/{len(materials)}] Material ID: {material_id}")
            file_path = PDF_BASE_DIR / storage_path
            chunks = await process_pdf(conn, material_id, file_path)
            total_chunks += chunks
            print()
        
        print("="*60)
        print(f"✓ Processing complete!")
        print(f"  Total chunks generated: {total_chunks}")
        print("="*60 + "\n")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())