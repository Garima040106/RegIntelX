# RegIntelX

## 🤖 AI-Powered Regulatory Intelligence & Compliance Command Center

> **From regulation to action.**

RegIntelX is an AI-driven regulatory intelligence platform for financial institutions. It monitors regulatory sources, detects meaningful changes, assesses their potential impact, and turns important updates into trackable compliance work with supporting evidence.

RegIntelX follows a simple operating model:

**Regulation → Change Detection → Impact Analysis → Compliance Action → Evidence Tracking**

## 🚀 Product Overview

* 📡 Monitors trusted regulatory sources and ingests new or updated documents.
* 📄 Processes regulatory webpages, PDFs, and scanned documents.
* 🧠 Extracts structured metadata, regulatory text, and source information.
* 🗂️ Maintains regulation versions and document hashes for traceability and duplicate detection.
* 🔍 Detects meaningful changes between regulatory versions.
* ⚠️ Classifies impact level and affected regulatory domains.
* ✅ Generates compliance actions with priority, risk score, status, due date, and required evidence.
* 🔎 Supports semantic search across the regulation library using vector embeddings.
* 🔗 Provides regulation-level intelligence with links back to the authoritative source.
* 🖥️ Presents the complete workflow through a focused regulatory intelligence command center.

## 🔄 Core Workflow

```text
📡 Regulatory Source
       ↓
📥 Document Ingestion
       ↓
🧠 Text & Metadata Extraction
       ↓
🗂️ Version Tracking
       ↓
🔍 Change Detection
       ↓
⚠️ Impact Analysis
       ↓
✅ Compliance Action
       ↓
🧾 Evidence Tracking
```

## 🏗️ Architecture

* ⚙️ **Backend:** FastAPI, SQLAlchemy, PostgreSQL, pgvector, and ingestion services.
* 📥 **Ingestion:** Playwright, Scrapy, BeautifulSoup, PDF extraction, OCR, document hashing, and metadata extraction.
* 🧠 **Intelligence:** Regulation version comparison, change detection, impact classification, embeddings, semantic retrieval, and compliance risk scoring.
* 🎨 **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Motion, and lucide-react.
* 🗄️ **Database:** PostgreSQL with pgvector for regulatory data and semantic search.

## 📋 Requirements

* 🐍 Python 3.12 or newer
* 🟢 Node.js 20 or newer
* 📦 npm
* 🗄️ PostgreSQL with the `pgvector` extension enabled
* 🤗 A Hugging Face access token for embedding generation

## 💻 Local Development

Clone the repository and run the backend and frontend in separate terminals.

### ⚙️ Backend

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Create `backend/.env` with the required database setting. Do not commit this file or share its values:

```dotenv
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

Set the Hugging Face token in the shell that runs the backend:

```bash
export HF_TOKEN=<your_huggingface_token>
uvicorn backend.app.main:app --reload
```

The API runs at:

```text
http://localhost:8000
```

Useful checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/database
```

### 🎨 Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Available frontend checks:

```bash
npm run lint
npm run build
```

`npm install` is only needed the first time, or after `package.json` or `package-lock.json` changes.

The frontend reads the backend API configuration from:

```text
frontend/src/lib/regintelx/api.ts
```

The deployed backend currently allows the production Vercel origin through CORS. A local frontend may therefore show an unavailable API state unless the backend CORS allowlist is updated to include:

```text
http://localhost:3000
http://127.0.0.1:3000
```

## 🧭 Product Workflow

### 📊 Overview

The command center provides a high-level view of the regulatory environment, including:

* 📜 Monitored regulations
* 🚨 High-impact changes
* 📋 Open compliance actions
* 📈 Average risk
* 👀 Items requiring attention

### 🔍 Changes

Each detected regulatory change provides:

* Change type
* Impact level
* Affected domains
* AI confidence
* Explanation of what changed
* Related compliance actions

### ✅ Actions

Compliance actions provide an operational work queue with:

* 🎯 Priority
* 📊 Risk score
* 🔄 Status
* 📅 Due date
* 🧾 Required evidence
* 📝 Action description

Actions can move from:

```text
Pending → In Progress → Completed
```

### 📚 Regulations

The regulation library supports semantic search, allowing users to search by meaning rather than relying only on exact keywords.

Search results provide:

* 🎯 Relevance score
* 🔎 Matching evidence
* 📋 Regulatory metadata
* 🧠 Access to the full intelligence view

### 🧠 Regulation Intelligence

Each regulation can be opened through **Open intelligence** to view its metadata, summary, source, and connections to detected changes and compliance actions.

### 🌐 Sources

The Sources section provides visibility into the regulatory authorities and source systems feeding the platform, along with their status and source URLs.

## 🎬 Demo Flow

The intended product walkthrough is:

```text
📊 Overview
   ↓
🔍 Changes
   ↓
⚠️ Compliance Impact
   ↓
✅ Actions
   ↓
📚 Regulations
   ↓
🔎 Semantic Search
   ↓
🧠 Open Intelligence
   ↓
🌐 Sources
```

The demo highlights the complete journey from discovering a regulatory update to understanding its impact and tracking the resulting compliance work.

## ☁️ Deployment

The backend is configured for Render through `render.yaml`:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

The frontend is a standard Next.js application and can be deployed to Vercel or another Node-compatible hosting platform.

For a production build:

```bash
cd frontend
npm install
npm run build
npm run start
```

### 🌍 Current Deployment

**Frontend**

```text
https://reg-intel-x.vercel.app
```

**Backend**

```text
https://regintelx-backend.onrender.com
```

## 💡 Why RegIntelX?

Traditional regulatory monitoring often looks like:

```text
📢 Regulation published
       ↓
👤 Someone finds it
       ↓
📖 Someone reads it
       ↓
🧠 Someone identifies the impact
       ↓
📝 Someone creates tasks
       ↓
📋 Someone tracks them manually
```

RegIntelX turns this into:

```text
📢 Regulatory Update
       ↓
📥 Automated Ingestion
       ↓
🔍 Change Detection
       ↓
⚠️ Impact Analysis
       ↓
✅ Compliance Action
       ↓
🧾 Evidence & Traceability
```

**Less searching.
Less manual interpretation.
More structured action.**

## 🎯 Built for Regulated Fintech

RegIntelX is designed for financial institutions and fintechs where regulatory changes can affect areas such as:

* 🔐 KYC and onboarding
* 🛡️ AML controls
* 💳 Payment operations
* 📊 Risk management
* 🔒 Cybersecurity
* 🗃️ Data handling
* ⚙️ Internal controls
* 📑 Regulatory reporting

For a company operating in a regulated environment, knowing that a new circular exists is only the first step.

**The real challenge is knowing what changed, what it affects, and what needs to happen next.**

## 🧠 The Bigger Idea

RegIntelX is built around a simple shift in how regulatory technology should work.

**Compliance shouldn't start when someone notices a circular.**

It should start when the regulatory environment changes.

RegIntelX aims to make that process:

**Discoverable → Understandable → Actionable → Trackable → Auditable**

## 🏆 Built for the Razorpay AI Buildathon 2026

RegIntelX was built for the **Open Track**, focusing on a real operational problem in regulated fintech.

The project explores how AI can be used beyond chat interfaces to create systems that continuously interpret changing information and connect it to real-world workflows.

### 💬 One-line pitch

> **RegIntelX turns regulatory change into actionable, traceable compliance work.**

---

<p align="center">

**🚀 RegIntelX**

*Don't just know what changed. Know what to do next.*

</p>

## 📄 License

MIT. See [LICENSE](LICENSE).
