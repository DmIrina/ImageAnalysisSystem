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
    ai_path = logs_dir / "ai_metrics.json"

    ai_raw = _load_json(ai_path)

    if ai_raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл з метриками AI-детектора не знайдено. "
                   "Спочатку запусти training/eval_ai_metrics.py.",
        )

    # AI-детектор
    if not isinstance(ai_raw, dict):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ai_metrics.json має невалідний формат.",
        )

    m = (ai_raw.get("metrics") or {}) if isinstance(ai_raw, dict) else {}

    ai_summary = {
        "model_name": ai_raw.get("model_name", "ai_vit_b16"),
        "n_val_samples": ai_raw.get("n_val_samples"),
        "evaluated_at": ai_raw.get("evaluated_at"),
        "accuracy": m.get("accuracy"),
        "precision": m.get("precision"),
        "recall": m.get("recall"),
        "f1": m.get("f1"),
        "roc_auc": m.get("roc_auc"),
        # матриця помилок як 2x2 масив [[TN, FP], [FN, TP]]
        "confusion_matrix": m.get("confusion_matrix"),
        "source_file": str(ai_path),
    }

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "ai_detector": ai_summary,
    }
