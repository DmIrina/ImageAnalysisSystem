# backend/src/models/manip_detector.py

# import timm
#
#
# def build_manip_convnext(num_classes: int = 2, pretrained: bool = True, freeze_backbone: bool = True):
#     model = timm.create_model("convnext_tiny", pretrained=pretrained, num_classes=num_classes)
#     if freeze_backbone:
#         for n, p in model.named_parameters():
#             if "head" not in n:
#                 p.requires_grad = False
#     return model
#
#
# def get_cam_target_layer(model):
#     return model.stages[1].blocks[-1]  # stage1
