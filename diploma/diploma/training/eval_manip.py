import glob
import json
import os
import sys

import cv2
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import torch
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc
)
from tqdm import tqdm

from backend.src.models.mvss_manip import load_mvss_model, predict_mvss

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
sys.path.append(ROOT_DIR)

MODEL_PATH = os.path.join(ROOT_DIR, "thirdparty/mvss_net/ckpt/mvssnetplus_casia.pt")
# REAL_DIR = os.path.join(ROOT_DIR, "data/test_metrics/real")
# FAKE_DIR = os.path.join(ROOT_DIR, "data/test_metrics/fake")
REAL_DIR = os.path.join(ROOT_DIR, "data/manipulated_old2/val/real")
FAKE_DIR = os.path.join(ROOT_DIR, "data/manipulated_old2/val/manipulated")
DEBUG_DIR = os.path.join(ROOT_DIR, "data/test_metrics/debug_errors")
METRICS_FILE = os.path.join(ROOT_DIR, "manip_metrics.json")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

os.makedirs(DEBUG_DIR, exist_ok=True)


def load_image(path):
    img_bgr = cv2.imread(path)
    if img_bgr is None:
        raise ValueError(f"Не вдалося завантажити зображення: {path}")
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    return img_rgb


def save_visualization(img_path, mask_input, score, label, threshold, output_dir):
    filename = os.path.basename(img_path)

    orig = cv2.imread(img_path)
    if orig is None: return
    orig = cv2.resize(orig, (512, 512))

    if isinstance(mask_input, torch.Tensor):
        mask = mask_input.squeeze().cpu().numpy()
    else:
        mask = mask_input

    # Нормалізація для збереження картинки
    mask_uint8 = (mask * 255).astype(np.uint8)
    mask_color = cv2.cvtColor(mask_uint8, cv2.COLOR_GRAY2BGR)

    # Heatmap
    heatmap = cv2.applyColorMap(mask_uint8, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(orig, 0.6, heatmap, 0.4, 0)

    combined = np.hstack([orig, mask_color, overlay])

    status = "FP" if (label == 0 and score >= threshold) else "FN"
    save_name = f"{status}_Sc{score:.2f}_Tr{threshold:.2f}_{filename}"
    cv2.imwrite(os.path.join(output_dir, save_name), combined)


def evaluate():
    # 1. Завантаження моделі
    model = load_mvss_model(MODEL_PATH)
    records = []

    # 2. Збір файлів
    real_files = glob.glob(os.path.join(REAL_DIR, "*.*"))
    fake_files = glob.glob(os.path.join(FAKE_DIR, "*.*"))
    all_files = [(p, 0) for p in real_files] + [(p, 1) for p in fake_files]

    print(f"Знайдено {len(all_files)} зображень. Починаємо аналіз...")

    # 3. Прохід по датасету
    for path, label in tqdm(all_files):
        try:
            img = load_image(path)
            res = predict_mvss(model, img)

            records.append({
                "path": path,
                "label": label,
                "score": res['manipulation_score']
            })
        except Exception as e:
            print(f"Помилка {path}: {e}")

    if not records:
        print("Немає даних для аналізу.")
        return

    # 4. Розрахунок метрик
    df = pd.DataFrame(records)
    y_true = df['label'].values
    y_scores = df['score'].values

    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    roc_auc = auc(fpr, tpr)
    optimal_idx = np.argmax(tpr - fpr)
    best_threshold = thresholds[optimal_idx]

    y_pred = (y_scores >= best_threshold).astype(int)
    acc = accuracy_score(y_true, y_pred)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0
    rec = recall_score(y_true, y_pred, zero_division=0)
    prec = precision_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    # 5. Вивід результатів
    print("\n" + "=" * 60)
    print(f"РЕЗУЛЬТАТИ (Backend Logic Mirror)")
    print("=" * 60)
    print(f"Optimal Threshold: {best_threshold:.4f}")
    print(f"AUC Score:         {roc_auc:.4f}")
    print("-" * 30)
    print(f"Accuracy:    {acc:.2%}")
    print(f"Specificity: {spec:.2%} (Чисті)")
    print(f"Recall:      {rec:.2%} (Фейки)")
    print(f"Precision:   {prec:.2%}")
    print(f"F1-Score:    {f1:.2%}")
    print("-" * 30)
    print(f"Матриця: TP={tp} | FP={fp} | TN={tn} | FN={fn}")

    # 6. Графіки
    print("\n--- Графік розподілу ---")
    plt.figure(figsize=(10, 6))
    sns.histplot(y_scores[y_true == 0], color='green', label='Clean', kde=True, bins=20, alpha=0.5)
    sns.histplot(y_scores[y_true == 1], color='red', label='Fake', kde=True, bins=20, alpha=0.5)
    plt.axvline(best_threshold, color='blue', linestyle='--', label=f'Threshold {best_threshold:.2f}')
    plt.legend()
    plt.show()

    print("\n--- Threshold Tuning ---")
    print(f"{'Threshold':<10} | {'Acc':<10} | {'Spec':<10} | {'Rec':<10} | {'F1':<10}")
    print("-" * 60)
    for thresh in np.arange(0.50, 0.96, 0.05):
        t_preds = (y_scores >= thresh).astype(int)
        tn_t, fp_t, fn_t, tp_t = confusion_matrix(y_true, t_preds).ravel()
        s_t = tn_t / (tn_t + fp_t) if (tn_t + fp_t) > 0 else 0
        r_t = tp_t / (tp_t + fn_t) if (tp_t + fn_t) > 0 else 0
        f1_t = f1_score(y_true, t_preds, zero_division=0)
        print(
            f"{thresh:.2f}       | {accuracy_score(y_true, t_preds):.3f}      | {s_t:.3f}      | {r_t:.3f}      | {f1_t:.3f}")

    # 7. Збереження візуалізації помилок
    print(f"\nГенеруємо візуалізацію помилок в: {DEBUG_DIR}")
    if os.path.exists(DEBUG_DIR):
        for f in os.listdir(DEBUG_DIR):
            try:
                os.remove(os.path.join(DEBUG_DIR, f))
            except:
                pass

    # Повторний прохід тільки для помилок, щоб отримати маски
    for i, row in df.iterrows():
        pred = 1 if row['score'] >= best_threshold else 0
        if pred != row['label']:
            try:
                img = load_image(row['path'])
                res = predict_mvss(model, img)

                save_visualization(
                    row['path'],
                    res['manip_heatmap'],
                    row['score'],
                    row['label'],
                    best_threshold,
                    DEBUG_DIR
                )
            except Exception as e:
                print(f"Err {row['path']}: {e}")

    # 8. Збереження JSON
    metrics_data = {
        "auc_score": float(roc_auc), "accuracy": float(acc),
        "specificity": float(spec), "recall": float(rec),
        "precision": float(prec), "f1_score": float(f1)
    }
    with open(METRICS_FILE, "w") as f:
        json.dump(metrics_data, f, indent=4)


if __name__ == "__main__":
    evaluate()
