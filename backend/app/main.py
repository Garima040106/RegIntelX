from fastapi import FastAPI

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
