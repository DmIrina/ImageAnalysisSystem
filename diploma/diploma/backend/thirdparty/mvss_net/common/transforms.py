from torchvision import transforms


# def direct_val(imgs):
#     normalize = {"mean": [0.485, 0.456, 0.406],
#                  "std": [0.229, 0.224, 0.225]}
#     if len(imgs) != 1:
#         pdb.set_trace()
#     imgs = img_to_tensor(imgs[0], normalize).unsqueeze(0)
#     return imgs

def direct_val(imgs):
    normalize = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
    img = imgs[0]
    # Перетворення в тензор + нормалізація
    t = transforms.ToTensor()(img)  # HWC -> CHW, [0,1]
    t = normalize(t)  # нормалізація
    return t.unsqueeze(0)  # додаємо batch dim
