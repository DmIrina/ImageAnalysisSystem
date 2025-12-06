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

#
# # === Випадкові патчі для аналізу локальних артефактів ===
# def random_patches(img: Image.Image, patch_size=128, count=5):
#     W, H = img.size
#     patches = []
#     for _ in range(count):
#         if W < patch_size or H < patch_size:
#             continue
#         x = np.random.randint(0, W - patch_size)
#         y = np.random.randint(0, H - patch_size)
#         patches.append(img.crop((x, y, x + patch_size, y + patch_size)))
#     return patches
#
#
# # === Нормалізація теплової карти (0-1) ===
# def normalize_heatmap(cam):
#     cam = cam - cam.min()
#     cam = cam / (cam.max() + 1e-6)
#     return cam
