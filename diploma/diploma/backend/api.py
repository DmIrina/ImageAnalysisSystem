# backend/api.py

import io
import json
from typing import Optional

import numpy as np
import torch
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
from backend.src.models.mvss_manip import predict_mvss, load_mvss_model
from backend.src.models.user import User
from backend.src.routers import admin_model_metrics
from backend.src.routers import auth, history, admin_stats
from backend.src.utils.gradcam import ViTGradCAM
from backend.src.utils.helpers import to_tensor
from backend.src.utils.metadata import analyze_metadata

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODELS_DIR = "backend/models"

app = FastAPI(title="Image Analysis API")

# ----- CORS -----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(admin_stats.router)
app.include_router(admin_model_metrics.router)

AI_POS_IDX = 0  # індекс класу "ai_generated"

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MVSS_MODEL_PATH = BASE_DIR / "thirdparty" / "mvss_net" / "ckpt" / "mvssnetplus_casia.pt"
mvss_model = load_mvss_model(str(MVSS_MODEL_PATH))

ai_model = build_ai_vit(num_classes=2, pretrained=False, freeze_backbone=False).to(DEVICE)
try:
    ai_model.load_state_dict(torch.load(f"{MODELS_DIR}/ai_vit_b16.pt", map_location=DEVICE))
except FileNotFoundError:
    print(f"Warning: {MODELS_DIR}/ai_vit_b16.pt not found. AI model will use random weights.")

ai_model.eval()
ai_cam = ViTGradCAM(ai_model, get_vit_cam_layer(ai_model))


def prob_pos(logits: torch.Tensor, pos_idx: int) -> float:
    proba = torch.softmax(logits, dim=1)[0, pos_idx].item()
    return float(proba)


def read_image_with_size(upload: UploadFile) -> tuple[Image.Image, int]:
    img_bytes = upload.file.read()
    size = len(img_bytes)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return img, size


def normalize_map(m: np.ndarray) -> np.ndarray:
    m = np.array(m)
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
    Повний мультимодальний аналіз.
    """
    img, file_size = read_image_with_size(file)

    # 1. AI DETECTOR
    x_ai = to_tensor(img, 224)
    cam_ai, logits_ai = ai_cam(x_ai)
    p_ai = prob_pos(logits_ai, AI_POS_IDX)
    ai_heatmap = cam_ai[0, 0].detach().cpu().numpy()
    ai_norm = normalize_map(ai_heatmap)

    # 2. MANIPULATION DETECTOR
    mvss_results = predict_mvss(mvss_model, np.array(img))

    manip_score = mvss_results["manipulation_score"]
    manip_heatmap = mvss_results["manip_heatmap"]

    patch_score = mvss_results["patch_score"]
    patch_heatmap = mvss_results["patch_heatmap"]

    # 3. METADATA
    meta = analyze_metadata(img)
    metadata_score = float(meta["metadata_score"])

    # 4. FUSION
    fusion_score = fusion_predict(
        ai_score=p_ai,
        manipulation_score=manip_score,
        patch_score=patch_score,
        metadata_score=metadata_score,
    )

    # 5. Підготовка відповіді
    response = {
        "ai_score": round(p_ai, 3),
        "ai_heatmap": ai_norm.tolist(),

        "manipulation_score": round(manip_score, 3),
        "manip_heatmap": manip_heatmap if isinstance(manip_heatmap, list) else manip_heatmap.tolist(),
        "patch_score": round(patch_score, 3),
        "patch_heatmap": patch_heatmap if isinstance(patch_heatmap, list) else patch_heatmap.tolist(),

        "metadata_score": round(metadata_score, 3),
        "metadata_reason": meta["reason"],
        "metadata_software": meta.get("software", ""),

        "fusion_score": round(fusion_score, 3),
        "fusion_heatmap": patch_heatmap if isinstance(patch_heatmap, list) else patch_heatmap.tolist(),
    }

    # 6. Збереження історії
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
