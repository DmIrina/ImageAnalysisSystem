# training/augment_ai_reals_from_manip.py
"""
augment_ai_reals_from_manip.py
Домішує частину зображень із data/manipulated/* у data/train/real і data/val/real,
щоб AI-детектор бачив "живі" фотографії як клас real (NOT AI).
"""

import random
import shutil
from pathlib import Path

from tqdm import tqdm

# База проєкту (.. відносно цього файлу)
BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data"

# Папки manip-датасету
MANIP_TRAIN_REAL = DATA / "manipulated" / "train" / "real"
MANIP_TRAIN_MANIP = DATA / "manipulated" / "train" / "manipulated"
MANIP_VAL_REAL = DATA / "manipulated" / "val" / "real"
MANIP_VAL_MANIP = DATA / "manipulated" / "val" / "manipulated"

# Куди домішуємо – AI-датасет
AI_TRAIN_REAL = DATA / "train" / "real"
AI_VAL_REAL = DATA / "val" / "real"

# Скільки картинок беремо з кожної папки (можеш підкрутити)
N_TRAIN_FROM_REAL = 2000
N_TRAIN_FROM_MANIP = 2000
N_VAL_FROM_REAL = 500
N_VAL_FROM_MANIP = 500

# Маркер, щоб не додавати двічі
MARKER = DATA / "ai_reals_from_manip.marker"


def log(msg: str):
    print(f"[augment_ai_reals_from_manip] {msg}")


def sample_and_copy(
        src_dir: Path,
        dst_dir: Path,
        n_samples: int,
        prefix: str,
):
    """
    Випадково вибирає до n_samples .jpg із src_dir
    і копіює в dst_dir з новими іменами prefix_XXXXXX.jpg
    """
    if not src_dir.exists():
        log(f"   джерело {src_dir} не існує – пропуск.")
        return

    files = sorted(list(src_dir.glob("*.jpg")))
    if not files:
        log(f"   у {src_dir} немає .jpg – пропуск.")
        return

    random.shuffle(files)
    selected = files[: min(n_samples, len(files))]

    dst_dir.mkdir(parents=True, exist_ok=True)

    for i, p in enumerate(tqdm(selected, desc=f"{prefix} → {dst_dir}", ncols=80)):
        new_name = f"{prefix}_{i:06d}{p.suffix.lower()}"
        out_path = dst_dir / new_name
        shutil.copy2(p, out_path)


def main():
    random.seed(42)

    if MARKER.exists():
        log("Маркер уже існує – домішування вже було виконано. Якщо хочеш перезапустити, видали marker та extra-файли.")
        return

    log(f"BASE = {BASE}")
    log("Домішуємо manip-дані у AI real-клас...")

    # --- TRAIN ---
    log("TRAIN: додаємо з manip/train/real → train/real")
    sample_and_copy(
        MANIP_TRAIN_REAL,
        AI_TRAIN_REAL,
        N_TRAIN_FROM_REAL,
        prefix="extra_manip_real_train",
    )

    log("TRAIN: додаємо з manip/train/manipulated → train/real")
    sample_and_copy(
        MANIP_TRAIN_MANIP,
        AI_TRAIN_REAL,
        N_TRAIN_FROM_MANIP,
        prefix="extra_manip_manip_train",
    )

    # --- VAL ---
    log("VAL: додаємо з manip/val/real → val/real")
    sample_and_copy(
        MANIP_VAL_REAL,
        AI_VAL_REAL,
        N_VAL_FROM_REAL,
        prefix="extra_manip_real_val",
    )

    log("VAL: додаємо з manip/val/manipulated → val/real")
    sample_and_copy(
        MANIP_VAL_MANIP,
        AI_VAL_REAL,
        N_VAL_FROM_MANIP,
        prefix="extra_manip_manip_val",
    )

    MARKER.write_text("ok\n", encoding="utf-8")
    log("ГОТОВО. Маркер створено: ai_reals_from_manip.marker")


if __name__ == "__main__":
    main()
