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

## Requirements
- Python 3.12 or newer
- Node.js 20 or newer
- npm
- A PostgreSQL database with the `pgvector` extension enabled
- A Hugging Face access token for embedding generation

## Local Development
Clone the repository and run the backend and frontend in separate terminals.

### Backend
From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Create `backend/.env` with the required setting. Do not commit this file or share its values:

```dotenv
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

Set the Hugging Face token in the shell that runs the backend:

```bash
export HF_TOKEN=<your_huggingface_token>
uvicorn backend.app.main:app --reload
```

The API runs at `http://localhost:8000`. Useful checks are:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/database
```

### Frontend
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

`npm install` is only needed the first time, or after `package.json` or `package-lock.json` changes. The deployed frontend already has its dependencies installed by the deployment environment, so it is not needed for normal product use.

Open `http://localhost:3000` for the local workspace. Available frontend checks are:

```bash
npm run lint
npm run build
```

The frontend reads the deployed API at `https://regintelx-backend.onrender.com` from `frontend/src/lib/regintelx/api.ts`. The backend currently allows the deployed Vercel origin (`https://reg-intel-x.vercel.app`) through CORS. A local frontend may therefore show an unavailable API state unless the backend CORS allowlist is updated for `http://localhost:3000` or `http://127.0.0.1:3000`.

## Demo Flow
The intended product walkthrough is:

`Overview -> Changes -> Actions -> Regulations -> Open intelligence -> Sources -> Overview`

The Overview screen surfaces monitored regulations, high-impact changes, open actions, average risk, and attention items. Regulation detail connects the original source document to structured intelligence, detected changes, impact, and compliance actions.

## Deployment
The backend is configured for Render in `render.yaml`:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

The frontend is a standard Next.js application and can be deployed to Vercel or another Node-compatible host. For a production build:

```bash
cd frontend
npm install
npm run build
npm run start
```

The current production frontend origin referenced by the backend CORS configuration is `https://reg-intel-x.vercel.app`.

## License
MIT. See [LICENSE](LICENSE).
