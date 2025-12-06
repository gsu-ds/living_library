import asyncio
import asyncpg
from dotenv import load_dotenv
import os
from sentence_transformers import SentenceTransformer

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

model = SentenceTransformer('all-MiniLM-L6-v2')

async def test():
    conn = await asyncpg.connect(DATABASE_URL)
    
    query = "machine learning"
    embedding = model.encode(query).tolist()
    embedding_str = '[' + ','.join(map(str, embedding)) + ']'
    
    results = await conn.fetch("""
        SELECT 
            tc.chunk_id,
            m.material_id,
            m.title,
            tc.page_number,
            tc.chunk_text,
            1 - (ce.embedding <=> $1::vector) AS similarity
        FROM chunk_embedding ce
        JOIN text_chunk tc ON tc.chunk_id = ce.chunk_id
        JOIN file_asset fa ON fa.file_id = tc.file_id
        JOIN material m ON m.material_id = fa.material_id
        ORDER BY ce.embedding <=> $1::vector
        LIMIT 5
    """, embedding_str)
    
    for r in results:
        print(f"{r['title'][:50]} - Page {r['page_number']} - Similarity: {r['similarity']:.3f}")
    
    await conn.close()

asyncio.run(test())
