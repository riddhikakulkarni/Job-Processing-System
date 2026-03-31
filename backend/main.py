import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_all_jobs, get_job_by_id, create_job, update_job_status
from models import JobCreate, JobResponse
from worker import start_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    worker_task = asyncio.create_task(start_worker())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Job Queue API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/jobs", response_model=JobResponse, status_code=201)
async def submit_job(payload: JobCreate):
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    job = await create_job(job_id, payload.name, payload.duration, now)
    return job


@app.get("/jobs", response_model=list[JobResponse])
async def list_jobs():
    return await get_all_jobs()


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = await get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return job
