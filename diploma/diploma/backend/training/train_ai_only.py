# training/train_ai_only.py

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

from backend.training.train_core import train_ai_detector  # noqa: E402


def main():
    print(f"BASE = {BASE}")
    print("=== Файнтюн AI-детектора (ai_vit_b16) на оновленому датасеті ===")
    train_ai_detector(do_train=True)
    print("=== Готово: ai_vit_b16 оновлений і збережений у backend/models ===")


if __name__ == "__main__":
    main()
