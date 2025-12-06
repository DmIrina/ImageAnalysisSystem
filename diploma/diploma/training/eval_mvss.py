# training/eval_mvss_metrics.py

import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from thirdparty.mvss_net.common.transforms import direct_val
from thirdparty.mvss_net.models.mvssnet import get_mvss

# ================== Налаштування шляхів ==================

BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Шлях до збереженої MVSS-моделі
MVSS_WEIGHTS = BASE / "thirdparty" / "mvss_net" / "ckpt" / "mvssnetplus_casia.pth"

# Корінь валідаційного датасета для сегментації
# Ти МАЄШ підставити свої реальні папки:
#   data/mvss_val/images/*.jpg (або .png)
#   data/mvss_val/masks/*.png   (ground truth маски) data/manipulated
VAL_ROOT = BASE / "data" / "manipulated" / "val"
VAL_IMAGES_DIR = VAL_ROOT / "images"
VAL_MASKS_DIR = VAL_ROOT / "masks"

# Поріг бінаризації карти ймовірностей
THRESH = 0.5


# ================== Модель MVSS + предикт ==================


def load_mvss_model(model_path: str | Path):
    """
    Завантаження MVSS-моделі зі збереженими вагами.
    Працює як з "чистим" state_dict, так і з чекпоінтами формату:
        {"epoch": ..., "model_dict": ...} або {"state_dict": ...}
    """
    model = get_mvss(
        backbone="resnet50",
        pretrained_base=True,
        nclass=1,
        sobel=True,
        constrain=True,
        n_input=3,
    )

    ckpt = torch.load(str(model_path), map_location=DEVICE)

    if isinstance(ckpt, dict) and "model_dict" in ckpt:
        state = ckpt["model_dict"]
    elif isinstance(ckpt, dict) and "state_dict" in ckpt:
        state = ckpt["state_dict"]
    else:
        state = ckpt

    model.load_state_dict(state, strict=False)
    model.to(DEVICE)
    model.eval()
    return model


@torch.no_grad()
def predict_mvss(model, img_np: np.ndarray):
    """
    img_np: H x W x 3, uint8 (RGB або BGR — див. нижче).

    Повертає:
      - score: float, max по карті ймовірностей (наскільки сильна маніпуляція)
      - seg:   H x W, float32 в [0,1] — карта ймовірностей маніпуляцій
    """
    # Якщо твої зображення вже у RGB, скипни цю строку або закоментуй:
    # img = img_np[:, :, ::-1]  # BGR → RGB
    img = img_np

    # direct_val очікує список зображень у форматі np.ndarray (H, W, 3)
    img_t = direct_val([img]).to(DEVICE)  # [B, C, H, W]

    _, seg = model(img_t)
    seg = torch.sigmoid(seg).detach().cpu().numpy()[0, 0]  # [H, W]

    score = float(seg.max())
    return score, seg


# ================== Метрики для сегментації ==================


def update_confusion_pixels(cm, gt: np.ndarray, pred: np.ndarray):
    """
    Оновлює сумарні TP/FP/FN/TN для піксельної сегментації.

    gt, pred: маски 0/1 однакового розміру.
    cm: dict зі лічильниками tp, fp, fn, tn.
    """
    gt = (gt.astype(np.uint8) > 0).ravel()
    pred = (pred.astype(np.uint8) > 0).ravel()

    tp = np.logical_and(pred == 1, gt == 1).sum()
    fp = np.logical_and(pred == 1, gt == 0).sum()
    fn = np.logical_and(pred == 0, gt == 1).sum()
    tn = np.logical_and(pred == 0, gt == 0).sum()

    cm["tp"] += int(tp)
    cm["fp"] += int(fp)
    cm["fn"] += int(fn)
    cm["tn"] += int(tn)


def compute_segmentation_metrics(cm):
    """
    Обчислення IoU, Dice/F1, pixel accuracy, precision, recall
    на основі сумарних TP/FP/FN/TN.
    """
    tp, fp, fn, tn = cm["tp"], cm["fp"], cm["fn"], cm["tn"]
    eps = 1e-8

    pixel_acc = (tp + tn) / max(tp + tn + fp + fn, 1)

    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)

    iou = tp / max(tp + fp + fn, 1)
    dice = (2 * tp) / max(2 * tp + fp + fn, 1)

    return {
        "pixel_acc": float(pixel_acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1_dice": float(dice),
        "iou": float(iou),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }


# ================== Основний eval-скрипт ==================


def main():
    print(f"[MVSS EVAL] Device: {DEVICE}")
    print(f"[MVSS EVAL] Model path: {MVSS_WEIGHTS}")
    print(f"[MVSS EVAL] Val images: {VAL_IMAGES_DIR}")
    print(f"[MVSS EVAL] Val masks : {VAL_MASKS_DIR}")

    if not MVSS_WEIGHTS.exists():
        raise FileNotFoundError(f"Не знайдено ваги MVSS: {MVSS_WEIGHTS}")

    if not VAL_IMAGES_DIR.exists() or not VAL_MASKS_DIR.exists():
        raise FileNotFoundError(
            f"Перевір, що існують папки {VAL_IMAGES_DIR} та {VAL_MASKS_DIR} з картинками та масками."
        )

    model = load_mvss_model(MVSS_WEIGHTS)

    image_paths = sorted(
        [p for p in VAL_IMAGES_DIR.glob("*.*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]]
    )

    if not image_paths:
        raise RuntimeError(f"У {VAL_IMAGES_DIR} немає .jpg/.png файлів для валідації.")

    cm = {"tp": 0, "fp": 0, "fn": 0, "tn": 0}

    n_ok = 0
    n_skip = 0

    for img_path in image_paths:
        mask_path_png = VAL_MASKS_DIR / f"{img_path.stem}.png"
        mask_path_jpg = VAL_MASKS_DIR / f"{img_path.stem}.jpg"

        if mask_path_png.exists():
            mask_path = mask_path_png
        elif mask_path_jpg.exists():
            mask_path = mask_path_jpg
        else:
            print(f"[WARN] Немає маски для {img_path.name} → пропуск.")
            n_skip += 1
            continue

        # --- зчитуємо зображення та маску ---
        img = np.array(Image.open(img_path).convert("RGB"))
        mask = np.array(Image.open(mask_path).convert("L"))

        # GT: 0/1 маска (наприклад, > 0 = маніпуляція)
        gt = (mask > 0).astype(np.uint8)

        # --- прогін через MVSS ---
        score, seg_prob = predict_mvss(model, img)

        # Бінаризація карти ймовірностей
        pred = (seg_prob >= THRESH).astype(np.uint8)

        # Переконаємось, що розміри збігаються
        if pred.shape != gt.shape:
            print(
                f"[WARN] Shape mismatch для {img_path.name}: pred={pred.shape}, gt={gt.shape} → ресайз GT."
            )
            # Ресайз GT під pred
            gt = np.array(
                Image.fromarray(gt * 255).resize(pred.shape[::-1], Image.NEAREST)
            ) > 0
            gt = gt.astype(np.uint8)

        # Оновлюємо сумарні лічильники
        update_confusion_pixels(cm, gt, pred)
        n_ok += 1

    if n_ok == 0:
        raise RuntimeError("Не опрацьовано жодного зображення (нема пар image+mask).")

    metrics = compute_segmentation_metrics(cm)

    print("\n[MVSS EVAL] Результати на валідаційному наборі:")
    print(f"  Оброблено пар image+mask: {n_ok}")
    print(f"  Пропущено (без маски):   {n_skip}")
    print("  TP / FP / FN / TN:", cm["tp"], cm["fp"], cm["fn"], cm["tn"])
    print(f"  Pixel accuracy : {metrics['pixel_acc']:.4f}")
    print(f"  Precision      : {metrics['precision']:.4f}")
    print(f"  Recall         : {metrics['recall']:.4f}")
    print(f"  F1 (Dice)      : {metrics['f1_dice']:.4f}")
    print(f"  IoU            : {metrics['iou']:.4f}")


if __name__ == "__main__":
    main()
