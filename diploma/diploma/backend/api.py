# backend/api.py

import io
import json
from typing import Optional

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from fastapi import Depends
from fastapi import FastAPI
from fastapi import File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.src.auth.dependencies import get_current_user_optional
from backend.src.db import get_db
from backend.src.fusion.fusion import fusion_predict
from backend.src.models.ai_detector import build_ai_vit, get_vit_cam_layer
from backend.src.models.image_history import ImageHistory
from backend.src.models.mvss_manip import load_mvss_model, predict_mvss
from backend.src.models.user import User
from backend.src.routers import auth, history, admin_stats
from backend.src.utils.gradcam import ViTGradCAM
from backend.src.utils.helpers import to_tensor
from backend.src.utils.metadata import analyze_metadata

# backend/api.py

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODELS_DIR = "backend/models"

app = FastAPI(title="Image Analysis API")

# ----- CORS -----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для розробки можна все; у проді звузиш
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(admin_stats.router)  # НОВЕ

AI_POS_IDX = 0  # індекс класу "ai_generated"
MANIP_POS_IDX = 0  # індекс класу "manipulated"

MVSS_MODEL_PATH = "thirdparty/mvss_net/ckpt/mvssnetplus_casia.pt"

mvss_model = load_mvss_model(MVSS_MODEL_PATH)

ai_model = build_ai_vit(num_classes=2, pretrained=False, freeze_backbone=False).to(DEVICE)
ai_model.load_state_dict(torch.load(f"{MODELS_DIR}/ai_vit_b16.pt", map_location=DEVICE))
ai_model.eval()
ai_cam = ViTGradCAM(ai_model, get_vit_cam_layer(ai_model))


def prob_pos(logits: torch.Tensor, pos_idx: int) -> float:
    """
    Повертає ймовірність 'позитивного' класу з логітів.
    pos_idx – індекс класу, який вважаємо підозрілим (ai_generated / manipulated).
    """
    proba = torch.softmax(logits, dim=1)[0, pos_idx].item()
    return float(proba)


def read_image_with_size(upload: UploadFile) -> tuple[Image.Image, int]:
    img_bytes = upload.file.read()
    size = len(img_bytes)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return img, size


def resize_heatmap(src: np.ndarray, target_shape) -> np.ndarray:
    th, tw = target_shape
    t = torch.from_numpy(src).float().unsqueeze(0).unsqueeze(0)  # 1x1xH xW
    t = F.interpolate(t, size=(th, tw), mode="bilinear", align_corners=False)
    return t[0, 0].cpu().numpy()


def normalize_map(m: np.ndarray) -> np.ndarray:
    min_v = float(m.min())
    max_v = float(m.max())
    denom = max_v - min_v
    if denom < 1e-8:
        return np.zeros_like(m, dtype=np.float32)
    return (m - min_v) / (denom + 1e-8)


@app.post("/analyze_full")
def analyze_full(
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Повний мультимодальний аналіз:
    - AI-детектор (ШІ) + GradCAM
    - Детектор маніпуляцій (Photoshop) + GradCAM
    - Патч-аналіз локальних артефактів
    - Аналіз EXIF
    - Злиття результатів (fusion)
    Якщо current_user не None – записуємо історію в БД.
    """
    img, file_size = read_image_with_size(file)

    # 1. AI DETECTOR
    x_ai = to_tensor(img, 224)
    cam_ai, logits_ai = ai_cam(x_ai)
    p_ai = prob_pos(logits_ai, AI_POS_IDX)
    ai_heatmap = cam_ai[0, 0].detach().cpu().numpy()

    # 2. MANIP DETECTOR (MVSS-Net++)
    p_m, manip_heatmap = predict_mvss(mvss_model, np.array(img))

    # 3. PATCH ANALYZER (на основі тієї ж MVSS heatmap)
    # інтерпретуємо середнє значення heatmap як "середню локальну підозрілість"
    patch_score = float(np.mean(manip_heatmap))

    # 4. METADATA
    meta = analyze_metadata(img)
    metadata_score = float(meta["metadata_score"])

    # 5. FUSION
    fusion_score = fusion_predict(
        ai_score=p_ai,
        manipulation_score=p_m,
        patch_score=patch_score,
        metadata_score=metadata_score,
    )

    # 6. HEATMAPS
    ai_norm = normalize_map(ai_heatmap)
    manip_norm = normalize_map(manip_heatmap)
    if manip_norm.shape != ai_norm.shape:
        manip_norm_resized = resize_heatmap(manip_norm, ai_norm.shape)
    else:
        manip_norm_resized = manip_norm
    combined_heatmap = np.maximum(ai_norm, manip_norm_resized)

    response = {
        "ai_score": round(p_ai, 3),
        "manipulation_score": round(p_m, 3),
        "patch_score": round(patch_score, 3),
        "metadata_score": round(metadata_score, 3),
        "metadata_reason": meta["reason"],
        "metadata_software": meta.get("software", ""),
        "fusion_score": round(fusion_score, 3),
        "ai_heatmap": ai_norm.tolist(),
        "manip_heatmap": manip_norm.tolist(),
        "fusion_heatmap": combined_heatmap.tolist(),
    }

    # 7. Якщо користувач залогінений – зберігаємо історію
    if current_user is not None:
        summary = (
            f"AI={response['ai_score']}, "
            f"manip={response['manipulation_score']}, "
            f"patch={response['patch_score']}, "
            f"meta={response['metadata_score']}, "
            f"fusion={response['fusion_score']}"
        )

        history_row = ImageHistory(
            user_id=current_user.id,
            filename=file.filename or "unnamed",
            file_size_bytes=file_size,
            mime_type=file.content_type,
            analysis_summary=summary,
            analysis_raw=json.dumps(response),
        )
        db.add(history_row)
        db.commit()

    return response
