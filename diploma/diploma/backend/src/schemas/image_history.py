# backend/src/schemas/image_history.py

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ImageHistoryBase(BaseModel):
    filename: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    analysis_summary: Optional[str] = None


class ImageHistoryCreate(ImageHistoryBase):
    analysis_raw: Optional[str] = None


class ImageHistoryRead(ImageHistoryBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
