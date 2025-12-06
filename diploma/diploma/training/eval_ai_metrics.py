# training/eval_ai_metrics.py

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

from training.train_core import train_ai_detector, DEVICE, MODELS_DIR  # noqa: E402


def main():
    print(f"[AI EVAL] Device: {DEVICE}")
    print(f"[AI EVAL] Models dir: {MODELS_DIR}")
    print("[AI EVAL] Loading existing ai_vit_b16 and evaluating on val set...")

    # do_train=False → НІЧОГО не тренуємо, тільки збираємо ймовірності + метрики
    ai_p, ai_y = train_ai_detector(do_train=False)

    print(f"[AI EVAL] Done. Val samples: {len(ai_y)}")


if __name__ == "__main__":
    main()
