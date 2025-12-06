# backend/src/models/ai_detector.py

import timm


def build_ai_vit(num_classes: int = 2, pretrained: bool = True, freeze_backbone: bool = True,
                 unfreeze_last_n_blocks: int = 0):
    model = timm.create_model("vit_base_patch16_224", pretrained=pretrained, num_classes=num_classes)
    if freeze_backbone:
        for n, p in model.named_parameters():
            if "head" not in n:
                p.requires_grad = False

    if unfreeze_last_n_blocks > 0:
        blocks = list(model.blocks)
        for block in blocks[-unfreeze_last_n_blocks:]:
            for p in block.parameters():
                p.requires_grad = True

    return model


def get_vit_cam_layer(model):
    # для timm vit_base_patch16_224 зазвичай підходить останній блок
    return model.blocks[-1].norm1
