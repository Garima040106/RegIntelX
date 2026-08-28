# RegIntelX
RegIntelX is a regulatory intelligence platform that monitors regulatory documents, detects meaningful changes, and turns them into trackable compliance actions. It connects the workflow from Regulation → Change Detection → Impact → Compliance Action so users can understand what changed, why it matters, and what evidence is needed.

## What it does
- Registers regulatory sources and ingests documents into regulation records.
- Stores regulation versions, extracted text, and document hashes for traceability.
- Detects changes between versions and classifies impact level and affected domains.
- Generates compliance actions with priority, risk score, due date, status, and required evidence.
- Supports semantic search over regulation versions using embeddings and pgvector.
- Surfaces regulations, changes, actions, and sources in a Next.js intelligence workbench.

## How it works
Regulatory Source → Document Ingestion → Versioning & Change Detection → Impact Analysis → Compliance Actions → Evidence & Tracking

RegIntelX uses a FastAPI backend for source management, regulation/version storage, change detection, and compliance mapping. The frontend is a Next.js workbench that presents the resulting intelligence chain and supports regulation search, source traceability, and action tracking. Semantic search uses Hugging Face embeddings stored in PostgreSQL with pgvector.

## Tech Stack
- Backend: FastAPI 0.141.1, SQLAlchemy 2.0.52, PostgreSQL, pgvector 0.5.0, psycopg 3.3.4, Pydantic 2.13.4, pydantic-settings 2.15.0, uvicorn 0.52.4
- Ingestion: httpx 0.28.1, pypdf 6.16.1, pdf2image 1.17.0, pytesseract 0.3.13, beautifulsoup4 4.15.0
- Intelligence: huggingface_hub, sentence-transformers/all-MiniLM-L6-v2, slowapi 0.1.10
- Frontend: Next.js 16.3.2, React 19.2.8, TypeScript 5, Tailwind CSS 4, Motion 13.1.1, lucide-react 1.33.0

## Running locally
Backend:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export HF_TOKEN=your_huggingface_token
uvicorn backend.app.main:app --reload
```

The backend also requires `backend/.env` with `DATABASE_URL=...`.

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Project structure
```text
regintelx/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── ingestion/
│   │   ├── models/
│   │   └── services/
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   ├── src/components/regintelx/
│   └── src/lib/regintelx/
├── render.yaml
└── README.md
```

## Why RegIntelX
- Detects what changed.
- Explains why it matters.
- Turns regulatory changes into actionable compliance work.
