# backend/src/models/image_history.py

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship

from backend.src.db import Base  # тут має бути твій Base з db.py


class ImageHistory(Base):
    __tablename__ = "image_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    # Базова інформація про файл
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # Щось про аналіз — збережемо у вигляді JSON-рядка
    analysis_summary = Column(String(500), nullable=True)  # коротко для відображення в UI
    analysis_raw = Column(Text, nullable=True)  # повний JSON (str)

    # зв’язок із користувачем (якщо ти вже маєш модель User)
    user = relationship("User", back_populates="images")
