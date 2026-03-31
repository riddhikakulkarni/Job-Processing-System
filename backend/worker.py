import asyncio
import logging
from datetime import datetime, timezone

from database import get_next_pending_job, update_job_status

logger = logging.getLogger(__name__)

POLL_INTERVAL = 2  # seconds between polling for new jobs


async def process_job(job: dict):
    job_id = job["id"]
    duration = job["duration"]
    logger.info(f"Starting job {job_id} (duration={duration}s)")

    await update_job_status(job_id, "processing")

    try:
        await asyncio.sleep(duration)
        completed_at = datetime.now(timezone.utc).isoformat()
        await update_job_status(job_id, "completed", completed_at)
        logger.info(f"Completed job {job_id}")
    except asyncio.CancelledError:
        # Worker is shutting down mid-job — mark as failed so it can be retried
        await update_job_status(job_id, "failed")
        logger.warning(f"Job {job_id} cancelled during processing — marked as failed")
        raise
    except Exception as exc:
        await update_job_status(job_id, "failed")
        logger.error(f"Job {job_id} raised an unexpected error: {exc}", exc_info=True)


async def start_worker():
    logger.info("Background worker started")
    while True:
        try:
            job = await get_next_pending_job()
            if job:
                await process_job(job)
            else:
                await asyncio.sleep(POLL_INTERVAL)
        except asyncio.CancelledError:
            logger.info("Worker shutting down")
            break
        except Exception as exc:
            # Don't crash the worker loop on unexpected errors
            logger.error(f"Worker loop error: {exc}", exc_info=True)
            await asyncio.sleep(POLL_INTERVAL)
