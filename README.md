# Інформаційна система аналізу достовірності зображень / Information System for Image Authenticity Analysis

Веб-система для комплексного аналізу зображень на основі:

- AI-детектор: визначення AI-згенерованих зображень
- Детектор маніпуляцій: MVSS-Net++ (виявлення локальних змін)
- Patch-аналіз: локалізація підозрілих ділянок
- Аналіз метаданих (EXIF)
- Fusion-оцінка довіри/підозрілості

Підтримуються:
- реєстрація/логін (JWT)
- історія аналізів для кожного користувача
- адмін-панель (статистика системи + метрики моделей)

### БД: 
- Postgres
- imageanalysis

---

## Технології

**Backend:**
FastAPI, PyTorch, timm, PostgreSQL

**Frontend:**
React, Axios, Recharts

---

## Запуск проєкту

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn backend.src.main:app --reload
```
API: http://127.0.0.1:8000

Документація Swagger: http://127.0.0.1:8000/docs

### Frontend
```bash
cd frontend
npm install
npm start
```

API: http://127.0.0.1:8000

Документація Swagger: http://127.0.0.1:8000/docs

Інтерфейс: http://localhost:3000
