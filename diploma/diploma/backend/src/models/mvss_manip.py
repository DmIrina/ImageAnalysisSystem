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

    # деякі чекпойнти MVSS зберігаються як {"epoch": ..., "model_dict": ...}
    if isinstance(ckpt, dict) and "model_dict" in ckpt:
        state = ckpt["model_dict"]
    elif isinstance(ckpt, dict) and "state_dict" in ckpt:
        state = ckpt["state_dict"]
    else:
        # якщо це «чистий» state_dict без обгортки
        state = ckpt

    # strict=False, щоб ігнорувати дрібні розбіжності у ключах
    model.load_state_dict(state, strict=False)

    model.to(DEVICE)
    model.eval()
    return model


def predict_mvss(model, img_np: np.ndarray):
    img = img_np[:, :, ::-1]  # BGR → RGB, якщо потрібно
    img = img.reshape(1, img.shape[2], img.shape[0], img.shape[1])
    img = direct_val([img_np]).to(DEVICE)

    with torch.no_grad():
        _, seg = model(img)
        seg = torch.sigmoid(seg).detach().cpu().numpy()[0, 0]

    score = float(seg.max())
    return score, seg  # повертаємо score + heatmap
