import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import precision_recall_fscore_support


def segmentation_metrics_batch(
        pred_logits: torch.Tensor,  # [B,1,H,W] або [B,H,W]
        gt_mask: torch.Tensor,  # [B,1,H,W] або [B,H,W], 0/1
        threshold: float = 0.5,
):
    """
    Метрики для batch сегментації маніпуляцій:
    - pixel accuracy
    - precision / recall / F1 (піксельний рівень)
    - IoU для класу 'manipulated'
    """

    # Приводимо до ймовірностей [0..1]
    if pred_logits.ndim == 4:
        # [B,1,H,W] або [B,C,H,W] → вважаємо канал 0 - маніпуляції
        if pred_logits.size(1) == 1:
            pred_prob = torch.sigmoid(pred_logits)
            pred_prob = pred_prob[:, 0, :, :]  # [B,H,W]
        else:
            # якщо C>1 і це логіти по класах – беремо softmax по каналах
            pred_prob = F.softmax(pred_logits, dim=1)[:, 1, :, :]  # клас 1 = manipulated
    else:
        # [B,H,W]
        pred_prob = torch.sigmoid(pred_logits)

    gt = gt_mask
    if gt.ndim == 4:
        gt = gt[:, 0, :, :]
    gt = gt.detach().cpu().numpy().astype(np.uint8)  # [B,H,W]

    pred_prob = pred_prob.detach().cpu().numpy()
    pred = (pred_prob >= threshold).astype(np.uint8)  # [B,H,W]

    # flatten
    y_true = gt.reshape(-1)
    y_pred = pred.reshape(-1)

    tp = np.logical_and(y_pred == 1, y_true == 1).sum()
    fp = np.logical_and(y_pred == 1, y_true == 0).sum()
    fn = np.logical_and(y_pred == 0, y_true == 1).sum()
    tn = np.logical_and(y_pred == 0, y_true == 0).sum()

    intersection = tp
    union = tp + fp + fn
    iou = intersection / (union + 1e-8)

    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="binary", zero_division=0
    )

    pixel_acc = (tp + tn) / (tp + tn + fp + fn + 1e-8)

    return {
        "tp": int(tp),
        "fp": int(fp),
        "fn": int(fn),
        "tn": int(tn),
        "iou": float(iou),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "pixel_acc": float(pixel_acc),
    }
