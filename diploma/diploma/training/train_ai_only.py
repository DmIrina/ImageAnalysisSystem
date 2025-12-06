# training/train_ai_only.py
"""
train_ai_only.py
Донавчання тільки AI-детектора (ai_vit_b16) на оновленому AI-датасеті:
- data/train/{real, ai_generated}
- data/val/{real, ai_generated}
"""

import sys
from pathlib import Path

# Робимо так само, як у train_core.py – додаємо BASE у sys.path
BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

from training.train_core import train_ai_detector  # noqa: E402


def main():
    print(f"BASE = {BASE}")
    print("=== Файнтюн AI-детектора (ai_vit_b16) на оновленому датасеті ===")
    # do_train=True означає:
    # - якщо модель є → завантажує і донавчає
    # - якщо нема → тренує з нуля
    train_ai_detector(do_train=True)
    print("=== Готово: ai_vit_b16 оновлений і збережений у backend/models ===")


if __name__ == "__main__":
    main()
