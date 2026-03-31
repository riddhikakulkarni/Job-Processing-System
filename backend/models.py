from pydantic import BaseModel, Field
from typing import Optional


class JobCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Job name")
    duration: int = Field(..., ge=5, le=30, description="Processing duration in seconds (5–30)")


class JobResponse(BaseModel):
    id: str
    name: str
    duration: int
    status: str
    created_at: str
    completed_at: Optional[str] = None
