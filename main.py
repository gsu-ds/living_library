# main.py -FastAPI Backend for Living Library
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from supabase import Client, create_client
import io
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select
from sentence_transformers import SentenceTransformer
import fitz  # PyMuPDF
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables
load_dotenv()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
# Convert postgresql:// to postgresql+asyncpg://
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

PDF_BASE_DIR = Path(os.getenv("PDF_BASE_DIR", "./pdfs"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set in environment variables.")
    supabase_client: Client = None
else:
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global embedding model (loaded once at startup)
embedding_model = None

# Database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# ============================================================================
# LIFESPAN EVENTS (Load model at startup)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load resources at startup, cleanup at shutdown."""
    global embedding_model
    
    # Startup
    print("🚀 Loading embedding model...")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✓ Embedding model loaded")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await engine.dispose()


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Living Library API",
    description="Semantic search and knowledge management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class Material(BaseModel):
    material_id: int
    title: str
    subtitle: Optional[str] = None
    edition: Optional[str] = None
    year: Optional[int] = None
    type: Optional[str] = None
    tier: Optional[int] = None
    status: Optional[str] = None
    topic: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    topic: Optional[str] = None
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    limit: int = 10

class SearchResult(BaseModel):
    chunk_id: int
    material_id: int
    title: str
    page_number: int
    chunk_text: str
    similarity: float


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Serve the main index page."""
    return FileResponse(BASE_DIR / "index.html")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    async with async_session() as session:
        try:
            result = await session.execute(text("SELECT 1"))
            return {"status": "healthy", "database": "connected"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}


@app.get("/api/stats")
async def get_stats():
    """Get database statistics."""
    async with async_session() as session:
        try:
            result = await session.execute(
                text("SELECT * FROM get_material_stats()")
            )
            stats = result.fetchone()
            
            if stats:
                return {
                    "total_materials": stats[0],
                    "total_authors": stats[1],
                    "total_topics": stats[2],
                    "total_chunks": stats[3],
                    "total_embeddings": stats[4],
                    "materials_by_tier": stats[5]
                }
            return {"error": "No stats available"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/library/browse")
async def browse_library(
    topic: Optional[str] = None,
    tier: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Browse materials with filters."""
    async with async_session() as session:
        try:
            # Build query
            query = """
                SELECT 
                    m.material_id,
                    m.title,
                    m.subtitle,
                    m.edition,
                    m.year,
                    m.type,
                    m.tier,
                    m.status,
                    STRING_AGG(DISTINCT t.topic_name, ', ') as topics,
                    STRING_AGG(DISTINCT a.author_name, ', ') as authors,
                    fa.pages,
                    fa.is_accessible,
                    fa.storage_provider
                FROM material m
                LEFT JOIN material_topic mt ON mt.material_id = m.material_id
                LEFT JOIN topic t ON t.topic_id = mt.topic_id
                LEFT JOIN material_author ma ON ma.material_id = m.material_id
                LEFT JOIN author a ON a.author_id = ma.author_id
                LEFT JOIN file_asset fa ON fa.material_id = m.material_id AND fa.is_primary = TRUE
                WHERE m.is_global = TRUE
            """
            
            params = {}
            
            if topic:
                query += " AND t.topic_name = :topic"
                params['topic'] = topic
            
            if tier:
                query += " AND m.tier = :tier"
                params['tier'] = tier
            
            if status:
                query += " AND m.status = :status"
                params['status'] = status
            
            query += """
                GROUP BY m.material_id, m.title, m.subtitle, m.edition, 
                         m.year, m.type, m.tier, m.status,
                         fa.pages, fa.is_accessible, fa.storage_provider
                ORDER BY m.title
                LIMIT :limit OFFSET :offset
            """
            
            params['limit'] = limit
            params['offset'] = offset
            
            result = await session.execute(text(query), params)
            materials = result.fetchall()
            
            return {
                "total": len(materials),
                "materials": [
                    {
                        "material_id": m[0],
                        "title": m[1],
                        "subtitle": m[2],
                        "edition": m[3],
                        "year": m[4],
                        "type": m[5],
                        "tier": m[6],
                        "status": m[7],
                        "topics": m[8],
                        "authors": m[9],
                        "pages": m[10],
                        "is_accessible": m[11],
                        "storage_provider": m[12]
                    }
                    for m in materials
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/library/topics")
async def get_topics():
    """Get all unique topics."""
    async with async_session() as session:
        try:
            result = await session.execute(
                text("SELECT DISTINCT topic_name FROM topic ORDER BY topic_name")
            )
            topics = [row[0] for row in result.fetchall()]
            return {"topics": topics}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/semantic")
async def semantic_search(request: SearchRequest):
    """Semantic search using vector embeddings."""
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Embedding model not loaded")
    
    async with async_session() as session:
        try:
            # Create query embedding
            query_embedding = embedding_model.encode(request.query).tolist()
            
            # Build SQL query with filters
            query_sql = """
                SELECT 
                    tc.chunk_id,
                    m.material_id,
                    m.title,
                    tc.page_number,
                    tc.chunk_text,
                    1 - (ce.embedding <=> :embedding::vector) AS similarity
                FROM chunk_embedding ce
                JOIN text_chunk tc ON tc.chunk_id = ce.chunk_id
                JOIN file_asset fa ON fa.file_id = tc.file_id
                JOIN material m ON m.material_id = fa.material_id
            """
            
            params = {"embedding": query_embedding}
            where_clauses = []
            
            if request.topic:
                query_sql += """
                    JOIN material_topic mt ON mt.material_id = m.material_id
                    JOIN topic t ON t.topic_id = mt.topic_id
                """
                where_clauses.append("t.topic_name = :topic")
                params['topic'] = request.topic
            
            if request.year_min:
                where_clauses.append("m.year >= :year_min")
                params['year_min'] = request.year_min
            
            if request.year_max:
                where_clauses.append("m.year <= :year_max")
                params['year_max'] = request.year_max
            
            if where_clauses:
                query_sql += " WHERE " + " AND ".join(where_clauses)
            
            query_sql += """
                ORDER BY ce.embedding <=> :embedding::vector
                LIMIT :limit
            """
            params['limit'] = request.limit
            
            result = await session.execute(text(query_sql), params)
            results = result.fetchall()
            
            return {
                "query": request.query,
                "results": [
                    {
                        "chunk_id": r[0],
                        "material_id": r[1],
                        "title": r[2],
                        "page_number": r[3],
                        "chunk_text": r[4][:500],  # Truncate for display
                        "similarity": float(r[5])
                    }
                    for r in results
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pdf/{material_id}/page/{page_num}")

async def get_pdf_page(material_id: int, page_num: int):

    """Serve PDF page as image, fetching from local or Supabase Storage."""

   

    doc = None  # PyMuPDF document

   

    async with async_session() as session:

        try:

            # Get file info, NOW including storage_bucket

            result = await session.execute(

                text("""

                    SELECT

                        fa.storage_path,

                        fa.storage_provider,

                        fa.storage_bucket,

                        fa.is_accessible

                    FROM file_asset fa

                    WHERE fa.material_id = :material_id

                    AND fa.is_primary = TRUE

                    LIMIT 1

                """),

                {"material_id": material_id}

            )

            file_info = result.fetchone()

           

            if not file_info:

                raise HTTPException(status_code=404, detail="File metadata not found in database")

           

            # Unpack the data from the query

            storage_path, storage_provider, storage_bucket, is_accessible = file_info



            if not is_accessible:

                raise HTTPException(status_code=403, detail="File not accessible")



            # --- NEW HYBRID LOGIC ---

           

            if storage_provider == 'supabase':

                # --- CASE 1: Get from Supabase Storage ---

                if not supabase_client:

                    raise HTTPException(status_code=500, detail="Supabase client not configured")

               

                if not storage_bucket:

                    raise HTTPException(status_code=500, detail="Supabase file is missing storage_bucket")



                try:

                    # storage_path is just the filename, e.g., "my_book.pdf"

                    # storage_bucket is "living_library_materials"

                    file_bytes = supabase_client.storage.from_(storage_bucket).download(storage_path)

                    doc = fitz.open(stream=file_bytes, filetype="pdf")

               

                except Exception as e:

                    print(f"Error downloading from Supabase: {e}")

                    raise HTTPException(status_code=500, detail=f"Failed to download from Supabase: {storage_bucket}/{storage_path}")



            else:  

                # --- CASE 2: Get from Local 'onedrive' folder ---

                # storage_path is "data_pdfs/my_book.pdf"

                pdf_path = PDF_BASE_DIR / storage_path

               

                if not pdf_path.exists():

                    print(f"File not found on disk: {pdf_path}")

                    raise HTTPException(status_code=404, detail="PDF file not found on disk")

               

                doc = fitz.open(pdf_path)

           

            # --- END HYBRID LOGIC ---



            if not doc:

                raise HTTPException(status_code=500, detail="Failed to open PDF document")



            if page_num < 1 or page_num > len(doc):

                doc.close()

                raise HTTPException(status_code=404, detail="Page not found in document")

           

            # Render page as image

            page = doc[page_num - 1]

            pix = page.get_pixmap(dpi=150)

            img_bytes = pix.tobytes("png")

            doc.close()

           

            return Response(content=img_bytes, media_type="image/png")

           

        except HTTPException:

            if doc: doc.close()

            raise

        except Exception as e:

            if doc: doc.close()

            print(f"Unexpected error in get_pdf_page: {e}")

            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/material/{material_id}/info")
async def get_material_info(material_id: int):
    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT 
                    m.title,
                    fa.storage_path, 
                    fa.storage_provider,
                    fa.storage_bucket, 
                    fa.is_accessible
                FROM material m
                JOIN file_asset fa ON m.material_id = fa.material_id
                WHERE m.material_id = :material_id
                  AND fa.is_primary = TRUE
                LIMIT 1
            """),
            {"material_id": material_id}
        )
        file_info = result.fetchone()

        if not file_info:
            raise HTTPException(status_code=404, detail="Material not found")

        title, storage_path, storage_provider, storage_bucket, is_accessible = file_info

        if not is_accessible:
            raise HTTPException(status_code=403, detail="File not accessible")

        if storage_provider == 'supabase':
            if not supabase_client:
                raise HTTPException(status_code=500, detail="Supabase client not configured")

            # Get the public URL
            try:
                public_url = supabase_client.storage.from_(storage_bucket).get_public_url(storage_path)
                return {
                    "title": title,
                    "type": "supabase",
                    "url": public_url
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Could not get Supabase URL: {e}")

        else: # 'onedrive' or local
            return {
                "title": title,
                "type": "local"
                # We will use the page-by-page API for local files
            }
        
@app.get("/api/duplicates")
async def get_duplicates(status: str = "pending"):
    """Get duplicate candidates."""
    async with async_session() as session:
        try:
            result = await session.execute(
                text("""
                    SELECT 
                        dc.candidate_id,
                        m1.title as title_1,
                        m2.title as title_2,
                        dc.similarity_score,
                        dc.detection_method,
                        dc.status
                    FROM duplicate_candidate dc
                    JOIN material m1 ON m1.material_id = dc.material_id_1
                    JOIN material m2 ON m2.material_id = dc.material_id_2
                    WHERE dc.status = :status
                    ORDER BY dc.similarity_score DESC
                """),
                {"status": status}
            )
            duplicates = result.fetchall()
            
            return {
                "duplicates": [
                    {
                        "candidate_id": d[0],
                        "title_1": d[1],
                        "title_2": d[2],
                        "similarity_score": float(d[3]),
                        "detection_method": d[4],
                        "status": d[5]
                    }
                    for d in duplicates
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# Mount static files (for serving HTML/CSS/JS)
app.mount("/assets", StaticFiles(directory=BASE_DIR / "static/assets"), name="assets")
app.mount("/app", StaticFiles(directory=BASE_DIR / "static/app"), name="app")

if __name__ == "__main__":
    import uvicorn
    import logging
    from logging.handlers import RotatingFileHandler
    from rich.logging import RichHandler

    # --- New Logging Setup ---
    LOG_FILE = "living_library.log" # The file to save logs to
    
    # 1. Clear any existing handlers
    logging.root.handlers = []

    # 2. Create handler for the console (using rich)
    console_handler = RichHandler(
        rich_tracebacks=True,
        markup=True
    )

    # 3. Create handler for the file
    # This will create a new log file when it reaches 5MB, and keep 3 old ones
    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=5*1024*1024, backupCount=3
    )
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s"
    ))

    # 4. Add both handlers to the root logger
    logging.basicConfig(
        level="INFO",
        format="%(message)s",
        datefmt="[%X]",
        handlers=[console_handler, file_handler] # Send logs to both places
    )
    
    # Silence Uvicorn's default loggers
    logging.getLogger("uvicorn.access").handlers = [console_handler, file_handler]
    logging.getLogger("uvicorn.error").handlers = [console_handler, file_handler]
    # --- End New Logging Setup ---

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None  # We've already configured logging
    )