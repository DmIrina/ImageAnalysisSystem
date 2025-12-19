# backend/src/models/mvss_manip.py

import os

import cv2
import numpy as np
import torch
from torchvision import transforms

from thirdparty.mvss_net.models.mvssnet import get_mvss

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

norm_mean = [0.485, 0.456, 0.406]
norm_std = [0.229, 0.224, 0.225]

transform_fn = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(norm_mean, norm_std)
])


def load_mvss_model(model_path: str):
    print(f"Loading MVSS model from: {model_path}")
    model = get_mvss(
        backbone='resnet50',
        pretrained_base=True,
        nclass=1,
        sobel=True,
        constrain=True,
        n_input=3,
    )
    ckpt = torch.load(model_path, map_location=DEVICE)

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


def get_suppression_mask(image_rgb: np.ndarray) -> np.ndarray:
    try:
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'

        if not os.path.exists(cascade_path):
            pass

        face_cascade = cv2.CascadeClassifier(cascade_path)

        if face_cascade.empty():
            return np.ones((image_rgb.shape[0], image_rgb.shape[1]), dtype=np.float32)

        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        suppression_mask = np.ones_like(gray, dtype=np.float32)

        for (x, y, w, h) in faces:
            pad_w = int(0.1 * w)
            pad_h = int(0.2 * h)

            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(gray.shape[1], x + w + pad_w)
            y2 = min(gray.shape[0], y + h + pad_h)

            suppression_mask[y1:y2, x1:x2] = 0.0

        return suppression_mask
    except Exception as e:
        print(f"Warning: Face detection failed ({e}), skipping suppression.")
        return np.ones((image_rgb.shape[0], image_rgb.shape[1]), dtype=np.float32)


def calculate_refined_score(mask_tensor, suppression_mask=None) -> float:
    if isinstance(mask_tensor, torch.Tensor):
        mask_np = mask_tensor.squeeze().cpu().numpy()
    else:
        mask_np = mask_tensor

    if suppression_mask is not None:
        if suppression_mask.shape != mask_np.shape:
            suppression_mask = cv2.resize(suppression_mask, (mask_np.shape[1], mask_np.shape[0]),
                                          interpolation=cv2.INTER_NEAREST)

        mask_np = mask_np * suppression_mask

    binary_threshold = 0.50
    binary_mask = (mask_np > binary_threshold).astype(np.uint8)

    kernel = np.ones((3, 3), np.uint8)
    cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)

    pixel_count = np.sum(cleaned_mask)
    if pixel_count == 0:
        return 0.0

    total_pixels = mask_np.shape[0] * mask_np.shape[1]
    area_ratio = pixel_count / total_pixels

    if area_ratio > 0.25:
        return 0.0

    masked_prob = mask_np * cleaned_mask
    base_confidence = np.sum(masked_prob) / pixel_count

    min_area_threshold = 0.001

    if area_ratio >= min_area_threshold:
        area_factor = 1.0
    else:
        area_factor = (area_ratio / min_area_threshold) ** 2

    final_score = base_confidence * area_factor
    return float(final_score)


def predict_mvss(model, image_rgb: np.ndarray):
    #  Resize 512x512
    img_resized = cv2.resize(image_rgb, (512, 512), interpolation=cv2.INTER_AREA)
    suppression_mask = get_suppression_mask(img_resized)
    input_tensor = transform_fn(img_resized).unsqueeze(0)
    if torch.cuda.is_available():
        input_tensor = input_tensor.cuda()
        model = model.cuda()

    model.eval()
    with torch.no_grad():
        preds = model(input_tensor)
        if isinstance(preds, (list, tuple)):
            pred_mask = preds[-1]
        else:
            pred_mask = preds

        prob_mask = torch.sigmoid(pred_mask).squeeze().cpu()

    manipulation_score = calculate_refined_score(prob_mask, suppression_mask)
    mask_np = prob_mask.numpy() if isinstance(prob_mask, torch.Tensor) else prob_mask

    if suppression_mask is not None:
        if suppression_mask.shape != mask_np.shape:
            s_mask = cv2.resize(suppression_mask, (mask_np.shape[1], mask_np.shape[0]), interpolation=cv2.INTER_NEAREST)
        else:
            s_mask = suppression_mask
        visual_heatmap = mask_np * s_mask
    else:
        visual_heatmap = mask_np

    patch_score = float(np.mean(visual_heatmap))

    return {
        "manipulation_score": manipulation_score,
        "manip_heatmap": visual_heatmap,
        "patch_score": patch_score,
        "patch_heatmap": visual_heatmap
    }
