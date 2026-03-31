"""
Basic tests for the Job Queue API.
Run with: pytest test_api.py -v

Uses a temporary file-based SQLite DB (not :memory:) to sidestep
aiosqlite's per-connection in-memory isolation across async tasks.
"""
import os
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

import database

# Use a temp file DB so every connection within the same process sees the same data.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
database.DB_PATH = _tmp.name

from main import app


@pytest_asyncio.fixture(autouse=True, scope="module")
async def init():
    """Initialise the DB schema once for the whole test module."""
    await database.init_db()
    yield
    os.unlink(database.DB_PATH)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── Happy-path ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_submit_job_valid(client):
    resp = await client.post("/jobs", json={"name": "Test Job", "duration": 5})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Job"
    assert data["duration"] == 5
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data
    assert data["completed_at"] is None


@pytest.mark.asyncio
async def test_list_jobs(client):
    await client.post("/jobs", json={"name": "List Test", "duration": 5})
    resp = await client.get("/jobs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_job_by_id(client):
    create_resp = await client.post("/jobs", json={"name": "Single Job", "duration": 7})
    job_id = create_resp.json()["id"]
    resp = await client.get(f"/jobs/{job_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == job_id


# ── Validation errors ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_submit_job_duration_too_short(client):
    resp = await client.post("/jobs", json={"name": "Bad Job", "duration": 2})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submit_job_duration_too_long(client):
    resp = await client.post("/jobs", json={"name": "Bad Job", "duration": 60})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submit_job_missing_name(client):
    resp = await client.post("/jobs", json={"duration": 10})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    resp = await client.get("/jobs/nonexistent-id")
    assert resp.status_code == 404
