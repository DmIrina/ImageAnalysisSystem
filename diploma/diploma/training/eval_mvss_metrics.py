# training/eval_mvss_metrics.py

import json
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

from backend.src.models.mvss_manip import load_mvss_model, predict_mvss  # noqa: E402
from training.train_core import DEVICE, LOGS_DIR  # noqa: E402

MVSS_WEIGHTS = BASE / "thirdparty" / "mvss_net" / "ckpt" / "mvssnetplus_casia.pt"
VAL_IMAGES_DIR = BASE / "data" / "manipulated" / "val" / "images"


def main():
    print(f"[MVSS EVAL] Device: {DEVICE}")
    print(f"[MVSS EVAL] Model path: {MVSS_WEIGHTS}")
    print(f"[MVSS EVAL] Val images: {VAL_IMAGES_DIR}")

    if not MVSS_WEIGHTS.exists():
        raise FileNotFoundError(f"Не знайдено ваги MVSS: {MVSS_WEIGHTS}")

    if not VAL_IMAGES_DIR.exists():
        raise FileNotFoundError(f"Не знайдено папку з зображеннями: {VAL_IMAGES_DIR}")

    model = load_mvss_model(str(MVSS_WEIGHTS))

    image_paths = sorted(
        [p for p in VAL_IMAGES_DIR.glob("*.*")
         if p.suffix.lower() in [".jpg", ".jpeg", ".png"]]
    )

    if not image_paths:
        raise RuntimeError(f"У {VAL_IMAGES_DIR} немає .jpg/.png файлів для валідації.")

    scores = []

    for img_path in image_paths:
        img = Image.open(img_path).convert("RGB")
        img_np = np.array(img)

        score, seg = predict_mvss(model, img_np)
        scores.append(score)

    scores = np.array(scores, dtype=np.float32)

    stats = {
        "model_name": "mvssnetplus_casia",
        "n_val_images": int(len(scores)),
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
        "score_mean": float(scores.mean()),
        "score_std": float(scores.std()),
        "score_min": float(scores.min()),
        "score_max": float(scores.max()),
        "score_p50": float(np.percentile(scores, 50)),
        "score_p90": float(np.percentile(scores, 90)),
    }

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = LOGS_DIR / "mvss_scores_runtime.json"

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"[MVSS EVAL] Saved runtime scores stats to {out_path}")


if __name__ == "__main__":
    main()
