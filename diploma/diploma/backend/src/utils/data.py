from typing import Tuple

from torch.utils.data import DataLoader
from torchvision import datasets, transforms

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def make_train_transforms(img_size: int):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


def make_val_transforms(img_size: int):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


def make_loaders(train_dir: str, val_dir: str, img_size: int = 224, batch_size: int = 32,
                 num_workers: int = 2) -> Tuple[DataLoader, DataLoader, list]:
    tfm_train = make_train_transforms(img_size)
    tfm_val = make_val_transforms(img_size)

    train_ds = datasets.ImageFolder(train_dir, transform=tfm_train)
    val_ds = datasets.ImageFolder(val_dir, transform=tfm_val)

    train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_dl = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_dl, val_dl, train_ds.classes
