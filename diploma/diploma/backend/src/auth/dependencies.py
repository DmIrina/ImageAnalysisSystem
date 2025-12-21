from typing import Optional

from fastapi import Depends, Header
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.src.auth.utils import SECRET_KEY, ALGORITHM
from backend.src.db import get_db
from backend.src.models.user import User


def decode_token(token: str, db: Session) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        return None

    return db.query(User).filter(User.id == user_id).first()


async def get_current_user(
        authorization: Optional[str] = Header(None),
        db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необхідна авторизація",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний формат токена",
        )

    user = decode_token(token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний або протермінований токен",
        )

    return user


async def get_current_user_optional(
        authorization: Optional[str] = Header(None),
        db: Session = Depends(get_db),
) -> Optional[User]:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    user = decode_token(token, db)
    return user


async def get_current_admin(
        current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ заборонено. Потрібні права адміністратора.",
        )
    return current_user
