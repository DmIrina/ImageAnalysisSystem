# # backend/src/utils/gradcam.py

import torch

import torch.nn.functional as F


class ViTGradCAM:
    def __init__(self, model, target_layer, num_patches_side: int = 14):
        self.model = model.eval()
        self.target_layer = target_layer
        self.num_patches_side = num_patches_side

        self.activations = None  # [B, N, C]
        self.gradients = None  # [B, N, C]

        self._h_fwd = target_layer.register_forward_hook(self._hook_acts)
        self._h_bwd = target_layer.register_full_backward_hook(self._hook_grads)

    def _hook_acts(self, module, inputs, output):
        self.activations = output.detach()

    def _hook_grads(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def __call__(self, x, class_idx=None):
        self.model.zero_grad(set_to_none=True)

        logits = self.model(x)  # [B, num_classes]
        if class_idx is None:
            class_idx = logits.argmax(dim=1)

        scores = logits[torch.arange(logits.size(0)), class_idx]
        scores.sum().backward()

        acts = self.activations  # [B, N, C]
        grads = self.gradients  # [B, N, C]

        if acts is None or grads is None:
            raise RuntimeError("ViTGradCAM: hooks did not capture activations/gradients.")

        acts = acts[:, 1:, :]  # [B, N-1, C]
        grads = grads[:, 1:, :]  # [B, N-1, C]

        B, N, C = grads.shape
        side = self.num_patches_side
        if side * side != N:
            side = int(N ** 0.5)

        token_importance = grads.abs().mean(dim=2)  # [B, N]

        # reshape до [B, 1, H, W]
        cam = token_importance.view(B, 1, side, side)

        # ReLU + нормалізація
        cam = F.relu(cam)
        cam_min = cam.min(dim=2, keepdim=True)[0].min(dim=3, keepdim=True)[0]
        cam_max = cam.max(dim=2, keepdim=True)[0].max(dim=3, keepdim=True)[0]
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)

        return cam, logits

    def close(self):
        self._h_fwd.remove()
        self._h_bwd.remove()
