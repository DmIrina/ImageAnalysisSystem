from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.src.auth.dependencies import get_current_user
from backend.src.auth.utils import hash_password, verify_password, create_access_token
from backend.src.db import get_db
from backend.src.models.user import User
from backend.src.schemas.user import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Користувач з таким email уже існує",
        )

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний email або пароль",
        )

    token = create_access_token(user)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user

# # backend/src/routers/auth.py
#
# from fastapi import APIRouter, Depends, HTTPException, status, Form
# from fastapi.responses import HTMLResponse
# from sqlalchemy.orm import Session
#
# from backend.src.auth.utils import hash_password, verify_password, create_access_token
# from backend.src.db import get_db
# from backend.src.models.user import User
# from backend.src.schemas.user import UserCreate, UserLogin, UserOut
#
# router = APIRouter(prefix="/auth", tags=["auth"])
#
#
# # --- ПРОСТА HTML-СТОРІНКА ЛОГІН/РЕЄСТРАЦІЯ ---
#
#
# @router.get("/login", response_class=HTMLResponse)
# def login_page():
#     # дуже простий HTML, без фронтенд-фреймворків
#     return """
# <!DOCTYPE html>
# <html lang="uk">
# <head>
#     <meta charset="UTF-8"/>
#     <title>Логін / Реєстрація</title>
# </head>
# <body>
#     <h2>Логін</h2>
#     <form method="post" action="/auth/login_form">
#         <label>Email: <input type="email" name="email" required/></label><br/>
#         <label>Пароль: <input type="password" name="password" required/></label><br/>
#         <button type="submit">Увійти</button>
#     </form>
#
#     <h2>Реєстрація</h2>
#     <form method="post" action="/auth/register_form">
#         <label>Email: <input type="email" name="email" required/></label><br/>
#         <label>Ім'я: <input type="text" name="full_name"/></label><br/>
#         <label>Пароль: <input type="password" name="password" required/></label><br/>
#         <button type="submit">Зареєструватися</button>
#     </form>
# </body>
# </html>
#     """
#
#
# # --- JSON API для реєстрації ---
#
#
# @router.post("/register", response_model=UserOut)
# def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
#     # перевіряємо, що такого email ще нема
#     existing = db.query(User).filter(User.email == user_in.email).first()
#     if existing:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Користувач з таким email уже існує",
#         )
#
#     user = User(
#         email=user_in.email,
#         full_name=user_in.full_name,
#         password_hash=hash_password(user_in.password),
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user
#
#
# # --- JSON API для логіну (повертаємо токен) ---
#
#
# @router.post("/login")
# def login(user_in: UserLogin, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.email == user_in.email).first()
#     if not user or not verify_password(user_in.password, user.password_hash):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Невірний email або пароль",
#         )
#
#     token = create_access_token(user)
#     return {"access_token": token, "token_type": "bearer"}
#
#
# # --- Обробка HTML-форм (POST із /auth/login) ---
#
#
# @router.post("/register_form", response_class=HTMLResponse)
# def register_form(
#         email: str = Form(...),
#         password: str = Form(...),
#         full_name: str = Form(""),
#         db: Session = Depends(get_db),
# ):
#     user_in = UserCreate(email=email, password=password, full_name=full_name or None)
#     try:
#         user = register_user(user_in, db)
#     except HTTPException as e:
#         return f"<h3>Помилка реєстрації: {e.detail}</h3><a href='/auth/login'>Назад</a>"
#
#     return f"""
# <h3>Реєстрація успішна!</h3>
# <p>Користувач: {user.email}</p>
# <a href="/auth/login">Перейти до логіну</a>
#     """
#
#
# @router.post("/login_form", response_class=HTMLResponse)
# def login_form(
#         email: str = Form(...),
#         password: str = Form(...),
#         db: Session = Depends(get_db),
# ):
#     user = db.query(User).filter(User.email == email).first()
#     if not user or not verify_password(password, user.password_hash):
#         return "<h3>Невірний email або пароль</h3><a href='/auth/login'>Назад</a>"
#
#     token = create_access_token(user)
#     # для простоти просто показуємо токен на екрані
#     # (на практиці збережеш у localStorage на фронті або в cookie)
#     return f"""
# <h3>Логін успішний</h3>
# <p>Привіт, {user.full_name or user.email}!</p>
# <p>Твій access_token (для API-запитів):</p>
# <code>{token}</code>
#     """
