from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.api.routes.sources import router as sources_router
from backend.app.api.routes.regulations import router as regulations_router
from backend.app.api.routes.ingestion import router as ingestion_router
from backend.app.core.database import engine


app = FastAPI(
    title="RegIntelX API",
    description="AI-powered regulatory intelligence and compliance platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://reg-intel-x.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(
    sources_router,
    prefix="/api/v1",
)
app.include_router(
    regulations_router,
    prefix="/api/v1",
)

app.include_router(
    ingestion_router,
    prefix="/api/v1",
)
app.include_router(
    regulations_router,
    prefix="/api/v1",
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "regintelx-api",
        "version": "0.1.0",
    }


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }
