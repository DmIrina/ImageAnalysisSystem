import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from backend.src.auth.dependencies import get_current_admin
from backend.src.models.user import User

router = APIRouter(prefix="/admin", tags=["admin-model-metrics"])


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


@router.get("/models-metrics")
def admin_models_metrics(
        admin_user: User = Depends(get_current_admin),
):
    project_root = Path(__file__).resolve().parents[3]
    logs_dir = project_root / "backend" / "logs"

    # Шляхи до файлів метрик
    ai_path = logs_dir / "ai_metrics.json"
    manip_path = logs_dir / "manip_metrics.json"

    ai_raw = _load_json(ai_path)
    manip_raw = _load_json(manip_path)

    if ai_raw is None and manip_raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файли з метриками не знайдено. "
                   "Запустіть скрипти оцінки моделей (eval_ai_metrics.py / eval_manip_metrics.py).",
        )

    response_data = {
        "generated_at": datetime.now().isoformat() + "Z",
        "ai_detector": None,
        "manip_detector": None
    }

    # --- Обробка AI-детектора ---
    if ai_raw and isinstance(ai_raw, dict):
        m = (ai_raw.get("metrics") or {}) if isinstance(ai_raw, dict) else {}
        response_data["ai_detector"] = {
            "model_name": ai_raw.get("model_name", "ai_vit_b16"),
            "n_val_samples": ai_raw.get("n_val_samples"),
            "evaluated_at": ai_raw.get("evaluated_at"),
            "accuracy": m.get("accuracy"),
            "precision": m.get("precision"),
            "recall": m.get("recall"),
            "specificity": m.get("specificity"),
            "f1": m.get("f1"),
            "roc_auc": m.get("roc_auc"),
            "confusion_matrix": m.get("confusion_matrix"),
            "source_file": str(ai_path),
        }

    # --- Обробка Детектора маніпуляцій ---
    if manip_raw and isinstance(manip_raw, dict):
        m = (manip_raw.get("metrics") or {}) if isinstance(manip_raw, dict) else {}
        response_data["manip_detector"] = {
            "model_name": manip_raw.get("model_name", "mvss_net"),
            "n_val_samples": manip_raw.get("n_val_samples"),
            "evaluated_at": manip_raw.get("evaluated_at"),
            "accuracy": m.get("accuracy"),
            "precision": m.get("precision"),
            "recall": m.get("recall"),
            "specificity": m.get("specificity"),  # Важливо для Manip модуля
            "f1": m.get("f1"),
            "roc_auc": m.get("roc_auc"),
            "confusion_matrix": m.get("confusion_matrix"),
            "source_file": str(manip_path),
        }

    return response_data
