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
VAL_DIR = BASE / "data" / "manipulated_old4" / "val"

MAX_PER_CLASS = 200


def main():
    print(f"[MVSS EVAL] Device: {DEVICE}")
    print(f"[MVSS EVAL] Weights: {MVSS_WEIGHTS}")
    print(f"[MVSS EVAL] Val dir: {VAL_DIR}")

    if not MVSS_WEIGHTS.exists():
        raise FileNotFoundError(f"Відсутні ваги моделі: {MVSS_WEIGHTS}")

    model = load_mvss_model(str(MVSS_WEIGHTS))

    classes = ["manipulated", "real"]
    scores_by_class: dict[str, list[float]] = {c: [] for c in classes}

    for cls in classes:
        img_dir = VAL_DIR / cls
        if not img_dir.exists():
            print(f"[WARN] Папка {img_dir} відсутня, пропуск класу {cls}.")
            continue

        all_images = sorted(
            [p for p in img_dir.glob("*.*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]]
        )

        if not all_images:
            print(f"[WARN] У {img_dir} немає .jpg/.jpeg/.png файлів, пропуск класу {cls}.")
            continue

        images = all_images[:MAX_PER_CLASS]
        print(f"[MVSS EVAL] Клас '{cls}': знайшли {len(all_images)} файлів, "
              f"беремо {len(images)} для оцінки.")

        for img_path in images:
            img = Image.open(img_path).convert("RGB")
            score, _ = predict_mvss(model, np.array(img))
            scores_by_class[cls].append(float(score))

    all_scores = np.array(
        [s for lst in scores_by_class.values() for s in lst],
        dtype=np.float32,
    )

    if all_scores.size == 0:
        raise RuntimeError("Не вдалося зібрати жодного score для MVSS (перевір наявність зображень).")

    stats = {
        "model_name": "mvssnetplus_casia",
        "evaluated_at": datetime.now().isoformat() + "Z",
        "device": str(DEVICE),
        "max_per_class": MAX_PER_CLASS,
        "total_images": int(all_scores.size),
        "stats_overall": {
            "mean": float(all_scores.mean()),
            "std": float(all_scores.std()),
            "min": float(all_scores.min()),
            "max": float(all_scores.max()),
            "p50": float(np.percentile(all_scores, 50)),
            "p90": float(np.percentile(all_scores, 90)),
        },
        "stats_by_class": {
            cls: {
                "count": len(scores),
                "mean": float(np.mean(scores)) if scores else None,
                "std": float(np.std(scores)) if scores else None,
                "min": float(np.min(scores)) if scores else None,
                "max": float(np.max(scores)) if scores else None,
            }
            for cls, scores in scores_by_class.items()
        },
    }

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = LOGS_DIR / "mvss_scores_runtime.json"

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"[MVSS EVAL] Saved stats to {out_path}")
    print(f"[MVSS EVAL] Загальна кількість використаних зображень: {all_scores.size}")


if __name__ == "__main__":
    main()
