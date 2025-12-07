"""
helpers.py — допоміжні функції для обробки зображень і перетворення
"""

# import numpy as np
import torch
from PIL import Image
from torchvision import transforms

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# === Перетворення зображення в тензор ===
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def to_tensor(img: Image.Image, size: int = 224) -> torch.Tensor:
    tr = transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    return tr(img).unsqueeze(0).to(DEVICE)
