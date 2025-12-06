# backend/src/routers/admin_stats.py
import json
from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.src.auth.dependencies import get_current_admin
from backend.src.db import get_db
from backend.src.models.image_history import ImageHistory
from backend.src.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


def parse_analysis_raw(raw: str | None) -> Dict[str, Any]:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except Exception:
        return {}


@router.get("/overview")
def admin_overview(
        db: Session = Depends(get_db),
        admin_user: User = Depends(get_current_admin),
):
    """
    Адмінська зведена статистика по користувачах і зображеннях.
    """
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # --- КОРИСТУВАЧІ ---
    total_users = db.query(func.count(User.id)).scalar() or 0
    users_last_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    users_last_month = db.query(func.count(User.id)).filter(User.created_at >= month_ago).scalar() or 0

    # --- ЗОБРАЖЕННЯ ---
    total_images = db.query(func.count(ImageHistory.id)).scalar() or 0
    images_last_week = db.query(func.count(ImageHistory.id)).filter(ImageHistory.created_at >= week_ago).scalar() or 0
    images_last_month = db.query(func.count(ImageHistory.id)).filter(ImageHistory.created_at >= month_ago).scalar() or 0

    # --- Агрегати по оцінках (fusion, ai, manip, patch, metadata) ---
    rows = db.query(ImageHistory).all()

    sum_ai = sum_manip = sum_patch = sum_meta = sum_fusion = 0.0
    c_ai = c_manip = c_patch = c_meta = c_fusion = 0

    low = mid = high = 0  # за fusion

    # розподіл fusion по інтервалах (0.0–0.1, 0.1–0.2, ... 0.9–1.0)
    fusion_bins = [0] * 10

    # Кількість зображень на користувача
    user_image_counts: dict[int, int] = {}

    for r in rows:
        data = parse_analysis_raw(r.analysis_raw)
        ai = data.get("ai_score")
        manip = data.get("manipulation_score")
        patch = data.get("patch_score")
        meta = data.get("metadata_score")
        fusion = data.get("fusion_score")

        if ai is not None:
            sum_ai += float(ai)
            c_ai += 1
        if manip is not None:
            sum_manip += float(manip)
            c_manip += 1
        if patch is not None:
            sum_patch += float(patch)
            c_patch += 1
        if meta is not None:
            sum_meta += float(meta)
            c_meta += 1
        if fusion is not None:
            fusion = float(fusion)
            sum_fusion += fusion
            c_fusion += 1

            if fusion < 0.3:
                low += 1
            elif fusion < 0.7:
                mid += 1
            else:
                high += 1

            # бінування
            idx = int(min(fusion * 10, 9))
            fusion_bins[idx] += 1

        # лічильник по користувачах
        if r.user_id:
            user_image_counts[r.user_id] = user_image_counts.get(r.user_id, 0) + 1

    def avg(sum_val, count):
        return (sum_val / count) if count else None

    # топ-5 користувачів за кількістю зображень
    top_users_data = (
        db.query(User)
        .filter(User.id.in_(user_image_counts.keys()))
        .all()
    )
    top_users = []
    for u in top_users_data:
        top_users.append({
            "user_id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "images_count": user_image_counts.get(u.id, 0),
        })
    top_users.sort(key=lambda x: x["images_count"], reverse=True)
    top_users = top_users[:5]

    return {
        "users": {
            "total": total_users,
            "last_week": users_last_week,
            "last_month": users_last_month,
        },
        "images": {
            "total": total_images,
            "last_week": images_last_week,
            "last_month": images_last_month,
        },
        "scores": {
            "avg_ai": avg(sum_ai, c_ai),
            "avg_manip": avg(sum_manip, c_manip),
            "avg_patch": avg(sum_patch, c_patch),
            "avg_meta": avg(sum_meta, c_meta),
            "avg_fusion": avg(sum_fusion, c_fusion),
        },
        "fusion_distribution": {
            "low": low,
            "mid": mid,
            "high": high,
            "bins": fusion_bins,  # 10 інтервалів по 0.1
        },
        "top_users_by_images": top_users,
    }
