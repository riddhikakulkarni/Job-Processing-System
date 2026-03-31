# Job Queue

A lightweight async job queue with a FastAPI backend and a React frontend. Submit jobs, watch them get picked up by a background worker, and see status updates in real time via polling.

---

## Project Structure

```
jobqueue/
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── models.py        # Pydantic request/response models
│   ├── database.py      # aiosqlite helpers (init, CRUD)
│   ├── worker.py        # Async background worker loop
│   ├── test_api.py      # Pytest test suite
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api/client.ts        # fetch wrappers
    │   ├── components/
    │   │   ├── JobForm.tsx      # submission form
    │   │   └── JobTable.tsx     # live job list
    │   ├── hooks/useJobs.ts     # polling hook (2.5s interval)
    │   └── types/index.ts
    └── package.json
```

---

## Backend

### Requirements

- Python 3.11+

### Setup & Run

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-reloads on file changes)
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

Interactive docs: `http://localhost:8000/docs`

### API Endpoints

| Method | Path          | Description                     |
|--------|---------------|---------------------------------|
| POST   | `/jobs`       | Submit a new job                |
| GET    | `/jobs`       | List all jobs (newest first)    |
| GET    | `/jobs/{id}`  | Get a single job by ID          |

**POST /jobs payload**

```json
{
  "name": "My job",
  "duration": 15
}
```

- `name` — required, 1–100 characters
- `duration` — required integer, 5–30 seconds

### Running Tests

```bash
pip install pytest pytest-asyncio httpx
pytest test_api.py -v
```

---

## Frontend

### Requirements

- Node.js 18+

### Setup & Run

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

It polls `GET /jobs` every 2.5 seconds. Submitting a job also triggers an immediate refresh.

---

## Design Decisions

**Single async worker, serial processing**
The worker picks up one pending job at a time in FIFO order. This keeps the implementation simple and predictable — no concurrency headaches, no partial-completion edge cases. Horizontal scaling would be a natural next step (e.g. Celery, ARQ, or a task queue with a distributed lock).

**aiosqlite over SQLAlchemy**
SQLAlchemy Async adds ceremony without benefit at this scale. aiosqlite gives non-blocking SQLite access with a minimal API surface. For a production system I'd switch to PostgreSQL with asyncpg.

**Lifespan-managed worker**
The background worker is a single `asyncio.Task` started in FastAPI's `lifespan` context. This keeps it tightly coupled to the server lifecycle — no orphaned processes, clean shutdown.

**CancelledError → failed status**
If the server shuts down mid-job, the worker catches `CancelledError` and marks the job as `failed` rather than leaving it stuck in `processing`. A production system would want a recovery mechanism (e.g. re-queuing `processing` jobs on startup).

**Validation at the Pydantic layer**
Duration bounds (5–30) and name length are enforced by Pydantic field constraints. FastAPI returns a 422 with a structured error body automatically — no manual validation code needed.

**Polling over WebSockets**
The spec explicitly allows polling. 2.5s is short enough to feel responsive without hammering the server. WebSockets would be a straightforward upgrade if needed.
