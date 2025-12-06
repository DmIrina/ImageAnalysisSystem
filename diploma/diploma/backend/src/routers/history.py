# backend/src/routers/history.py

from typing import List

from backend.src.auth.dependencies import get_current_user  # де в тебе логіка JWT / поточного користувача
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models.image_history import ImageHistory
from backend.src.models.user import User
from backend.src.schemas.image_history import ImageHistoryRead

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/me", response_model=List[ImageHistoryRead])
def get_my_history(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
        limit: int = 100,
        offset: int = 0,
):
    """
    Повертає історію оброблених зображень для поточного користувача.
    """
    q = (
        db.query(ImageHistory)
        .filter(ImageHistory.user_id == current_user.id)
        .order_by(ImageHistory.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return q.all()


@router.get("/{item_id}", response_model=ImageHistoryRead)
def get_history_item(
        item_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Повертає один запис історії, якщо він належить поточному користувачу.
    """
    item = db.query(ImageHistory).filter(ImageHistory.id == item_id).first()
    if item is None or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запис не знайдено")
    return item
