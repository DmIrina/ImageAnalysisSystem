# backend/src/models/user.py

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from backend.src.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_admin = Column(Boolean, nullable=False, server_default="0")

    images = relationship(
        "ImageHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )
