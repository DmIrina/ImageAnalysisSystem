# training/train_core.py

import sys
from copy import deepcopy
from functools import partial
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    roc_auc_score,
    confusion_matrix,
)
from torch.utils.data import DataLoader, Subset
from tqdm import tqdm

from backend.src.models.ai_detector import build_ai_vit
from backend.src.utils.data import make_loaders

BASE = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE))

# from backend.src.models.manip_detector import build_manip_convnext

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODELS_DIR = BASE / "backend" / "models"
LOGS_DIR = BASE / "backend" / "logs"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

AI_TRAIN = BASE / "data" / "train"
AI_VAL = BASE / "data" / "val"
MAN_TRAIN = BASE / "data" / "manipulated" / "train"
MAN_VAL = BASE / "data" / "manipulated" / "val"
PATCH_TRAIN = BASE / "data" / "patches" / "train"
PATCH_VAL = BASE / "data" / "patches" / "val"

EXIF_INDEX = BASE / "data" / "exif_index.csv"


# ---------- TRAINING CORE ----------
def train_one(model,
              train_dl,
              val_dl,
              epochs: int = 3,
              lr: float = 1e-4,
              patience: int = 2,
              class_weights: torch.Tensor | None = None):
    model = model.to(DEVICE)

    if class_weights is not None:
        class_weights = class_weights.to(DEVICE)
        crit = nn.CrossEntropyLoss(weight=class_weights)
        print(f"[train_one] Використовуємо class_weights = {class_weights.cpu().numpy().tolist()}")
    else:
        crit = nn.CrossEntropyLoss()

    opt = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)

    best_acc = 0.0
    best_state = deepcopy(model.state_dict())
    no_improve = 0

    for ep in range(epochs):
        model.train()
        total = 0.0
        for x, y in tqdm(train_dl, desc=f"train ep{ep + 1}"):
            x, y = x.to(DEVICE), y.to(DEVICE)
            opt.zero_grad()
            logits = model(x)
            loss = crit(logits, y)
            loss.backward()
            opt.step()
            total += loss.item()
        mean_loss = total / max(1, len(train_dl))
        val_acc = evaluate(model, val_dl)
        print(f"[ep {ep + 1}] loss={mean_loss:.4f} val_acc={val_acc:.4f}")

        # Early stopping
        if val_acc > best_acc + 1e-4:
            best_acc = val_acc
            best_state = deepcopy(model.state_dict())
            no_improve = 0
        else:
            no_improve += 1
            print(f"No improvement for {no_improve} epochs.")
            if no_improve >= patience:
                print("Early stopping triggered.")
                break

    model.load_state_dict(best_state)
    return model


@torch.no_grad()
def evaluate(model, val_dl):
    model.eval()
    correct, total = 0, 0
    for x, y in tqdm(val_dl, desc="validation"):
        x, y = x.to(DEVICE), y.to(DEVICE)
        pred = model(x).argmax(dim=1)
        correct += (pred == y).sum().item()
        total += y.numel()
    return correct / max(1, total)


@torch.no_grad()
def collect_probs(model, val_dl, positive_index: int = 1):
    model.eval()
    probs, labels = [], []
    for x, y in val_dl:
        x = x.to(DEVICE)
        p = torch.softmax(model(x), dim=1)[:, positive_index].cpu().numpy()
        probs.extend(p.tolist())
        labels.extend(y.numpy().tolist())
    return np.array(probs), np.array(labels)


# ---------- MODULES ----------
def load_or_train(model_name,
                  builder_fn,
                  train_dl,
                  val_dl,
                  pos_label: str,
                  epochs: int,
                  lr: float,
                  pretrained: bool = True,
                  freeze_backbone: bool = True,
                  do_train: bool = True,
                  classes_override=None):
    """
    Якщо do_train=True:
        - якщо моделі нема → створюємо pre-trained, навчаємо, зберігаємо
        - якщо модель є → завантажуємо, донавчаємо, зберігаємо
    Якщо do_train=False:
        - просто завантажуємо існуючу модель і збираємо ймовірності (без тренування)
    """
    model_path = MODELS_DIR / f"{model_name}.pt"

    if model_path.exists():
        print(f"Found existing {model_name} at {model_path}")
        model = builder_fn(num_classes=2, pretrained=False, freeze_backbone=freeze_backbone)
        state = torch.load(model_path, map_location=DEVICE)
        model.load_state_dict(state, strict=False)
        model.to(DEVICE)

        if do_train:
            print(f"Fine-tuning {model_name} ...")
            model = train_one(model, train_dl, val_dl, epochs=epochs, lr=lr)
            torch.save(model.state_dict(), model_path)
            print(f"Updated {model_name} saved to {model_path}")
    else:
        if not do_train:
            raise RuntimeError(f"Model {model_name} not found, but do_train=False. "
                               f"Model training is required.")
        print(f"Training new {model_name} ...")
        model = builder_fn(num_classes=2, pretrained=pretrained, freeze_backbone=freeze_backbone)
        model = train_one(model, train_dl, val_dl, epochs=epochs, lr=lr)
        torch.save(model.state_dict(), model_path)
        print(f"Saved new {model_name} to {model_path}")

    if classes_override is not None:
        classes = classes_override
    else:
        base_ds = val_dl.dataset
        while isinstance(base_ds, Subset):
            base_ds = base_ds.dataset
        classes = getattr(base_ds, "classes", None)

    if classes is None:
        pos_idx = 1
    else:
        pos_idx = classes.index(pos_label)

    p, y = collect_probs(model, val_dl, positive_index=pos_idx)
    y_bin = (y == pos_idx).astype(int)
    return p, y_bin


def train_ai_detector(
        do_train: bool = True,
        max_train_samples: int = 40000,
        max_val_samples: int = 8000,
):
    # 1. Беремо повні дані
    base_train_dl, base_val_dl, classes = make_loaders(
        str(AI_TRAIN),
        str(AI_VAL),
        img_size=224,
        batch_size=32,
    )

    train_ds = base_train_dl.dataset
    val_ds = base_val_dl.dataset

    original_classes = classes

    if max_train_samples is not None and max_train_samples < len(train_ds):
        indices = np.random.choice(len(train_ds), size=max_train_samples, replace=False)
        train_ds = Subset(train_ds, indices)

    if max_val_samples is not None and max_val_samples < len(val_ds):
        indices = np.random.choice(len(val_ds), size=max_val_samples, replace=False)
        val_ds = Subset(val_ds, indices)

    train_dl = DataLoader(train_ds, batch_size=32, shuffle=True, num_workers=2)
    val_dl = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=2)

    vit_builder = partial(build_ai_vit, unfreeze_last_n_blocks=2)

    ai_p, ai_y = load_or_train(
        "ai_vit_b16",
        vit_builder,
        train_dl,
        val_dl,
        pos_label="ai_generated",
        epochs=10,
        lr=5e-5,
        pretrained=True,
        freeze_backbone=True,
        do_train=do_train,
        classes_override=original_classes,
    )

    metrics = compute_binary_metrics(
        name="AI detector (ai_vit_b16, positive = ai_generated)",
        y_true=ai_y,
        y_prob=ai_p,
        threshold=0.5,
    )

    return ai_p, ai_y, metrics


def compute_binary_metrics(
        name: str,
        y_true: np.ndarray,
        y_prob: np.ndarray,
        threshold: float = 0.5,
):
    y_true = np.asarray(y_true).astype(int).ravel()
    y_prob = np.asarray(y_prob).astype(float).ravel()
    y_pred = (y_prob >= threshold).astype(int)

    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="binary", zero_division=0
    )

    try:
        auc = roc_auc_score(y_true, y_prob)
    except ValueError:
        auc = float("nan")

    cm = confusion_matrix(y_true, y_pred)

    print(f"\n[{name}] validation metrics")
    print(f"  threshold      = {threshold:.2f}")
    print(f"  accuracy       = {acc:.4f}")
    print(f"  precision      = {precision:.4f}")
    print(f"  recall         = {recall:.4f}")
    print(f"  F1-score       = {f1:.4f}")
    print(f"  ROC-AUC        = {auc:.4f}")
    print("  confusion matrix [ [TN FP], [FN TP] ]:")
    print(f"  {cm}")

    return {
        "name": name,
        "threshold": float(threshold),
        "accuracy": float(acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(auc),
        "confusion_matrix": cm.tolist(),
    }
