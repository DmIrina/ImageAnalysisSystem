# backend/src/db_init.py
from backend.src.db import Base, engine
from backend.src.models import user, image_history  # noqa: F401
from sqlalchemy import inspect

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    print("Таблиці в БД:", insp.get_table_names())
