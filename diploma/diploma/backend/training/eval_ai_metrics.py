# training/eval_ai_metrics.py

import json
import sys
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

from backend.training.train_core import train_ai_detector, DEVICE, MODELS_DIR, LOGS_DIR  # noqa: E402


def main():
    print(f"[AI EVAL] Device: {DEVICE}")
    print(f"[AI EVAL] Models dir: {MODELS_DIR}")
    print("[AI EVAL] Loading existing ai_vit_b16 and evaluating on val set...")

    ai_p, ai_y, ai_metrics = train_ai_detector(
        do_train=False,
        max_val_samples=1000,
    )

    print(f"[AI EVAL] Done. Val samples: {len(ai_y)}")

    payload = {
        "model_name": "ai_vit_b16",
        "n_val_samples": int(len(ai_y)),
        "evaluated_at": datetime.now().isoformat() + "Z",
        "metrics": ai_metrics,
    }

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = LOGS_DIR / "ai_metrics.json"

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"[AI EVAL] Saved metrics to {out_path}")


if __name__ == "__main__":
    main()
