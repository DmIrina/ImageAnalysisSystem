"""
training/prepare_dataset_full.py
Готує всі дані для 4 модулів:
- AI detector: CIFAKE (авто) + GenImage (опційно)
- Patch analyzer: патчі з train/real, train/ai_generated
- Manipulation detector: CASIA/ForgeryNet (вручну завантажити в data/manip_raw/)
- Metadata: створює exif_index.csv
"""

import random
from pathlib import Path

from PIL import Image, ImageFile
from tqdm import tqdm

ImageFile.LOAD_TRUNCATED_IMAGES = True
random.seed(42)

# ---- CONFIG ----
BASE = Path("../data")
IMG_SIZE_AI = 224
IMG_SIZE_PATCH = 128
IMG_SIZE_MANIP = 256
PATCHES_PER_IMAGE = 4
VAL_RATIO = 0.2
MAX_AI = 60000
MAX_REAL = 60000
SAVE_QUALITY = 95

GENIMAGE_RAW = BASE / "genimage_raw"
GENIMAGE_CLEAN = BASE / "genimage_clean"
MANIP_RAW = BASE / "manip_raw"

GENIMAGE_MARK = BASE / "genimage_prepared.marker"
PATCHES_MARK = BASE / "patches_prepared.marker"
MANIP_MARK = BASE / "manip_prepared.marker"
EXIF_INDEX_PATH = BASE / "exif_index.csv"


# ---------------

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def pil_open_rgb(x: Path) -> Image.Image:
    return Image.open(x).convert("RGB")


def save_jpg(img: Image.Image, out: Path, size: int):
    img = img.resize((size, size), Image.BICUBIC)
    ensure_dir(out.parent)
    img.save(out, "JPEG", quality=SAVE_QUALITY, optimize=True, subsampling=1)


def split_list(xs, val_ratio=0.2):
    idx = list(range(len(xs)))
    random.shuffle(idx)
    cut = int(len(xs) * (1.0 - val_ratio))
    return [xs[i] for i in idx[:cut]], [xs[i] for i in idx[cut:]]


def log(msg):
    print(f"[prepare] {msg}")


def prepare_cifake():
    target_train = BASE / "train" / "real"
    target_val = BASE / "val" / "real"

    if target_train.exists() and any(target_train.glob("cifake_real_*.jpg")):
        log("CIFAKE вже існує. Скіп.")
        return

    try:
        from datasets import load_dataset
    except Exception as e:
        log("Встанови спочатку: pip install datasets")
        raise e

    log("Завантаження CIFAKE з HuggingFace…")
    ds = load_dataset("dragonintelligence/CIFAKE-image-dataset")

    all_real, all_ai = [], []
    for split_name in ds:
        for ex in ds[split_name]:
            img = ex["image"].convert("RGB")  # 32x32
            if ex["label"] == 0:
                if len(all_real) < MAX_REAL:
                    all_real.append(img)
            else:
                if len(all_ai) < MAX_AI:
                    all_ai.append(img)

    log(f"CIFAKE: real={len(all_real)}, ai={len(all_ai)}")
    real_tr, real_val = split_list(all_real, VAL_RATIO)
    ai_tr, ai_val = split_list(all_ai, VAL_RATIO)

    for i, im in enumerate(tqdm(real_tr, desc="CIFAKE train/real")):
        save_jpg(im, BASE / "train" / "real" / f"cifake_real_{i}.jpg", IMG_SIZE_AI)
    for i, im in enumerate(tqdm(real_val, desc="CIFAKE val/real")):
        save_jpg(im, BASE / "val" / "real" / f"cifake_real_{i}.jpg", IMG_SIZE_AI)
    for i, im in enumerate(tqdm(ai_tr, desc="CIFAKE train/ai")):
        save_jpg(im, BASE / "train" / "ai_generated" / f"cifake_ai_{i}.jpg", IMG_SIZE_AI)
    for i, im in enumerate(tqdm(ai_val, desc="CIFAKE val/ai")):
        save_jpg(im, BASE / "val" / "ai_generated" / f"cifake_ai_{i}.jpg", IMG_SIZE_AI)


# -------- GenImage ----------
def prepare_genimage():
    log("Перевірка GenImage...")

    if GENIMAGE_MARK.exists():
        log("GenImage вже був оброблений раніше")
        return

    if not GENIMAGE_RAW.exists():
        log("GenImage не знайдено")
        return

    for subset in (GENIMAGE_RAW).glob("*"):
        for split in ["train", "val"]:
            for cls_old, cls_new in [("ai", "ai_generated"), ("nature", "real")]:
                src = subset / split / cls_old
                if not src.exists():
                    continue
                files = list(src.glob("*.*"))
                for p in tqdm(files, desc=f"{subset.name} → {split}/{cls_new}"):
                    try:
                        img = pil_open_rgb(p)
                        save_jpg(img, BASE / split / cls_new / p.name, IMG_SIZE_AI)
                    except Exception:
                        log(f"Пропуск пошкодженого файлу: {p.name}")
                        continue

    GENIMAGE_MARK.write_text("ok\n")


def main():
    ensure_dir(BASE)
    prepare_cifake()
    prepare_genimage()
    log("Підготовка даних завершена успішно.")


if __name__ == "__main__":
    main()
