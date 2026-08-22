from fastapi import FastAPI
from sqlalchemy import text

from backend.app.core.database import engine

app = FastAPI(
    title="RegIntelX API",
    description="AI-powered regulatory intelligence and compliance platform",
    version="0.1.0",
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
