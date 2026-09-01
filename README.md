# RegIntelX

RegIntelX is an AI-driven regulatory intelligence platform for financial institutions. It monitors regulatory sources, detects meaningful change, assesses impact, and turns important updates into trackable compliance work with supporting evidence.

RegIntelX follows a simple operating model: Regulation -> Change Detection -> Impact Analysis -> Compliance Action -> Evidence Tracking.

## Product Overview
- Monitors regulatory sources and ingests new or updated documents.
- Keeps version history, extracted text, and document hashes for traceability.
- Detects changes between versions and classifies impact level and affected domains.
- Generates compliance actions with priority, risk score, status, due date, and required evidence.
- Supports semantic search over the regulation library.
- Presents the workflow in a focused Next.js intelligence workspace.

## Architecture
- Backend: FastAPI, SQLAlchemy, PostgreSQL, pgvector, and background ingestion services.
- Intelligence: document extraction, change detection, embeddings, and semantic retrieval.
- Frontend: Next.js, React, TypeScript, Tailwind CSS, Motion, and lucide-react.

## Local Development
Backend:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export HF_TOKEN=your_huggingface_token
uvicorn backend.app.main:app --reload
```

Set `DATABASE_URL` in `backend/.env` before running the backend.

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Deployment
The application is configured for production deployment with the existing backend and frontend services.

## License
MIT. See [LICENSE](LICENSE).
