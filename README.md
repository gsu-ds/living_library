# The Living Library

The Living Library is a comprehensive digital asset management system designed to store, organize, and retrieve study materials. It leverages modern web technologies and machine learning to provide rich metadata, learning workflows, and semantic search capabilities.

## Features

- **Semantic Search**: Utilize vector embeddings to search for materials based on meaning rather than just keywords.
- **PDF Management**: Upload, store, and view PDF documents directly within the application.
- **Hybrid Storage**: Supports file storage both locally and via Supabase Storage.
- **Metadata Management**: Rich tagging with topics, authors, and tiers.
- **Duplicate Detection**: Automated detection of potential duplicate materials.

## Tech Stack

- **Backend**: Python, FastAPI
- **Database**: PostgreSQL (with `pgvector` for embeddings)
- **ORM**: SQLAlchemy (Async)
- **ML/AI**: Sentence Transformers (for generating embeddings)
- **PDF Processing**: PyMuPDF
- **Storage**: Local Filesystem / Supabase Storage

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+**
- **PostgreSQL 15+** (with `pgvector` extension enabled)
- **Supabase Account** (optional, for cloud storage)

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Create a virtual environment** (recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Connection
# Format: postgresql://user:password@host:port/dbname
# (Supabase users: use the transaction pooler URL, typically port 6543.)
DATABASE_URL=postgresql://postgres:password@localhost:5432/living_library

# Supabase Configuration (Optional if using local storage only)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Local PDF Storage Path
PDF_BASE_DIR=./pdfs
```

**Notes**:

- The application automatically converts `postgresql://` (and `postgresql+psycopg2://`) to `postgresql+asyncpg://` for async compatibility with FastAPI and Supabase.
- `DATABASE_URL` is required at startup; the API raises a clear error if it is missing.

## Running the Application

1.  **Start the server**:
    ```bash
    python main.py
    ```
    Alternatively, you can run it using `uvicorn` directly:
    ```bash
    uvicorn main:app --reload
    ```

2.  **Access the Application**:
    -   **Web Interface**: Open `http://localhost:8000` in your browser.
    -   **API Documentation (Swagger UI)**: Open `http://localhost:8000/docs`.
    -   **ReDoc**: Open `http://localhost:8000/redoc`.

## Chunking & Vectorization with pgvector

Use the `python/vector_pipeline.py` helper to create text chunks from a PDF and
store their embeddings in PostgreSQL (using the `vector` type). The script
automatically creates the `vector` extension when needed and registers the type
for async connections.

```bash
# file_id corresponds to file_asset.file_id for the PDF
python python/vector_pipeline.py <file_id> /path/to/document.pdf \
  --chunk-size 500 \
  --overlap 50
```

Environment variables in `.env` (especially `DATABASE_URL`) are reused, so make
sure they are populated before running the script.

## API Documentation

The backend provides a RESTful API documented via OpenAPI. Key endpoints include:

-   `GET /api/library/browse`: Browse materials with filters (topic, tier, status).
-   `POST /api/search/semantic`: Perform semantic search on document chunks.
-   `GET /api/pdf/{id}/page/{num}`: Retrieve a specific page of a PDF as an image.
-   `GET /api/stats`: View library statistics.

For full details, refer to the `/docs` endpoint when the server is running.

## Development

This project includes a `devcontainer` configuration for use with GitHub Codespaces, ensuring a consistent development environment.

### Project Structure

-   `main.py`: The entry point for the FastAPI application.
-   `python/`: Helper scripts and notebooks.
-   `static/`: Static assets (HTML, CSS, JS) for the frontend.
-   `sql/`: Database schema and migration scripts (if applicable).
