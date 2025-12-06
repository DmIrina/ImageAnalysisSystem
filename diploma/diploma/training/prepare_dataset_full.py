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

# маркери етапів, щоб скіпати, якщо вже виконано
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


# -------- CIFAKE (автоматично з HuggingFace, якщо ще не створений) ----------
def prepare_cifake():
    target_train = BASE / "train" / "real"
    target_val = BASE / "val" / "real"

    # SKIP: якщо вже є хоч один cifake_real_*.jpg у train
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
    log("Перевіряю структуру GenImage...")

    # SKIP: якщо маркер вже є
    if GENIMAGE_MARK.exists():
        log("GenImage вже був оброблений раніше (marker). Скіп.")
        return

    if not GENIMAGE_RAW.exists():
        log("GenImage не знайдено. Пропускаю.")
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

    # створимо маркер, що GenImage вже оброблено
    GENIMAGE_MARK.write_text("ok\n")


# # -------- Patches ----------
# def prepare_patches():
#     log("Генерація патчів 128x128…")
#
#     # SKIP: якщо вже існують будь-які патчі
#     patches_root = BASE / "patches" / "train"
#     if patches_root.exists() and any(patches_root.rglob("*.jpg")):
#         log("Патчі вже існують у data/patches/train. Скіп.")
#         return
#
#     for cls in ["real", "ai_generated"]:
#         src = BASE / "train" / cls
#         if not src.exists():
#             log(f"пропуск (нема {src})")
#             continue
#         files = list(src.glob("*.jpg"))
#         for f in tqdm(files, desc=f"patches {cls}"):
#             try:
#                 img = pil_open_rgb(f)
#                 W, H = img.size
#                 for k in range(PATCHES_PER_IMAGE):
#                     if W < IMG_SIZE_PATCH or H < IMG_SIZE_PATCH:
#                         continue
#                     x = random.randint(0, W - IMG_SIZE_PATCH)
#                     y = random.randint(0, H - IMG_SIZE_PATCH)
#                     crop = img.crop((x, y, x + IMG_SIZE_PATCH, y + IMG_SIZE_PATCH))
#                     out = BASE / "patches" / "train" / cls / f"{f.stem}_p{k}.jpg"
#                     ensure_dir(out.parent)
#                     crop.save(out, "JPEG", quality=SAVE_QUALITY)
#             except Exception:
#                 continue
#
#     PATCHES_MARK.write_text("ok\n")


# # -------- Manipulated ----------
# def prepare_manipulated():
#     # SKIP: якщо вже є готова структура manipulated/train та manipulated/val з файлами
#     manip_train = BASE / "manipulated" / "train"
#     manip_val = BASE / "manipulated" / "val"
#     # if (
#     #         manip_train.exists()
#     #         and manip_val.exists()
#     #         and any(manip_train.rglob("*.jpg"))
#     #         and any(manip_val.rglob("*.jpg"))
#     # ):
#     #     log("manipulated/train та manipulated/val вже заповнені. Скіп.")
#     #     return
#
#     if not MANIP_RAW.exists():
#         log("manip_raw не знайдено. У data/manip_raw/{real,manipulated} повинен бути CASIA/ForgeryNet.")
#         return
#
#     log("Формування manipulated/train із data/manip_raw/…")
#     for cls in ["real", "manipulated"]:
#         src = MANIP_RAW / cls
#         if not src.exists():
#             log(f"пропуск {src}")
#             continue
#         files = list(src.glob("*.*"))
#         idx = list(range(len(files)))
#         random.shuffle(idx)
#         cut = int(0.8 * len(idx))
#         for split, arr in [("train", idx[:cut]), ("val", idx[cut:])]:
#             for j, i in enumerate(tqdm(arr, desc=f"{cls}→{split}")):
#                 try:
#                     im = pil_open_rgb(files[i])
#                     out = BASE / "manipulated" / split / cls / f"{cls}_{j}.jpg"
#                     save_jpg(im, out, IMG_SIZE_MANIP)
#                 except Exception:
#                     log(f"Пропуск пошкодженого файлу: {files[i].name}")
#                     continue
#
#     MANIP_MARK.write_text("ok\n")


# # -------- EXIF index ----------
# def build_exif_index():
#     # SKIP: якщо exif_index.csv вже існує
#     if EXIF_INDEX_PATH.exists():
#         log("exif_index.csv вже існує. Скіп.")
#         return
#
#     log("Скан EXIF → data/exif_index.csv")
#     rows = []
#     for p in BASE.rglob("*.jpg"):
#         try:
#             im = Image.open(p)
#             exif = im.getexif()
#             has = 1 if exif and len(exif.items()) > 0 else 0
#             m = {}
#             if has:
#                 from PIL import ExifTags
#                 for k, v in exif.items():
#                     m[ExifTags.TAGS.get(k, k)] = str(v)[:200]
#             rows.append({
#                 "path": str(p),
#                 "has_exif": has,
#                 "Software": m.get("Software", ""),
#                 "DateTime": m.get("DateTime", ""),
#                 "Make": m.get("Make", ""),
#                 "Model": m.get("Model", "")
#             })
#         except Exception:
#             continue
#     df = pd.DataFrame(rows)
#     df.to_csv(EXIF_INDEX_PATH, index=False)
#     log(f"EXIF: {len(df)} записів")


def main():
    ensure_dir(BASE)
    prepare_cifake()
    prepare_genimage()
    # prepare_patches()
    # prepare_manipulated()
    # build_exif_index()
    log("Підготовка даних завершена успішно.")


if __name__ == "__main__":
    main()
