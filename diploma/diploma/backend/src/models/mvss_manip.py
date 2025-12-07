# backend/src/models/mvss_manip.py
import numpy as np
import torch

from thirdparty.mvss_net.common.transforms import direct_val
from thirdparty.mvss_net.models.mvssnet import get_mvss

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def load_mvss_model(model_path: str):
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


def _pad_to_multiple_32(img: np.ndarray, mult: int = 32):
    """
    Падить зображення до розмірів, кратних mult.
    Повертає (img_padded, (orig_h, orig_w)).
    """
    h, w = img.shape[:2]
    new_h = ((h + mult - 1) // mult) * mult
    new_w = ((w + mult - 1) // mult) * mult

    pad_h = new_h - h
    pad_w = new_w - w

    if pad_h == 0 and pad_w == 0:
        return img, (h, w)

    # падимо вниз і вправо (можна й по-іншому, але так простіше)
    img_padded = np.pad(
        img,
        ((0, pad_h), (0, pad_w), (0, 0)),
        mode="reflect",
    )
    return img_padded, (h, w)


@torch.no_grad()
def predict_mvss(model, img_np: np.ndarray):
    """
    img_np: H x W x 3, RGB (як ти отримуєш через np.array(PIL.Image)).

    Повертає:
      - score: float, max по карті ймовірностей (наскільки сильна маніпуляція)
      - seg:   H x W, float32 в [0,1] — карта ймовірностей маніпуляцій
               у вихідному розмірі зображення
    """
    img_padded, (orig_h, orig_w) = _pad_to_multiple_32(img_np)
    img_t = direct_val([img_padded]).to(DEVICE)  # [B, C, H, W]
    _, seg = model(img_t)
    seg = torch.sigmoid(seg).detach().cpu().numpy()[0, 0]  # [H_pad, W_pad]
    seg = seg[:orig_h, :orig_w]
    score = float(seg.max())
    return score, seg
