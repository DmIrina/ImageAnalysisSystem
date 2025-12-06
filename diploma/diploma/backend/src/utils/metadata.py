# backend/src/utils/metadata.py

from __future__ import annotations

from typing import Any, Dict

from PIL import Image, ExifTags

# Ключові слова для поля Software, які сигналять про явне втручання
EDIT_SOFTWARE_KEYWORDS = [
    "photoshop",
    "lightroom",
    "gimp",
    "paint.net",
    "affinity",
    "snapseed",
    "vsco",
    "pixlr",
    "fotor",
    "canva",
    "topaz",
    "skylum",
    "luminar",
    "photo editor",
]

AI_SOFTWARE_KEYWORDS = [
    "midjourney",
    "stable diffusion",
    "dall-e",
    "dalle",
    "ai generated",
    "ai image",
    "generative",
    "diffusion",
]


def _safe_get_exif(img: Image.Image) -> Dict[str, Any]:
    try:
        exif = img.getexif() or {}
    except Exception:
        return {}

    exif_dict: Dict[str, Any] = {}
    for k, v in exif.items():
        tag = ExifTags.TAGS.get(k, str(k))
        try:
            exif_dict[tag] = str(v)
        except Exception:
            exif_dict[tag] = repr(v)
    return exif_dict


def analyze_metadata(img: Image.Image) -> Dict[str, Any]:
    """
    Повертає:
      - metadata_score ∈ [0, 1]:
          0.0  → EXIF немає або все виглядає типово → НЕ впливає на Fusion
          ~0.6 → підозріла/неповна структура EXIF
          ≥0.8 → сильна підозра (графічний редактор / AI-пайплайн)
      - reason         → текстове пояснення
      - software       → значення поля Software (якщо є)
      - raw_exif       → сирий словник EXIF-полів
    """

    exif_dict = _safe_get_exif(img)

    # Взагалі немає EXIF → нейтрально, не впливає на інтегральну оцінку
    if not exif_dict:
        return {
            "metadata_score": 0.0,
            "reason": "EXIF відсутній або порожній — модуль метаданих не впливає на загальну оцінку.",
            "software": "",
            "raw_exif": {},
        }

    software = exif_dict.get("Software", "").strip()
    make = exif_dict.get("Make", "").strip()
    model = exif_dict.get("Model", "").strip()
    datetime = exif_dict.get("DateTime", "").strip()

    score = 0.0
    reasons: list[str] = []

    # 1) Аналіз поля Software
    if software:
        s_low = software.lower()

        # 1.1. Явні AI- або генеративні сервіси
        if any(kw in s_low for kw in AI_SOFTWARE_KEYWORDS):
            score = max(score, 1.0)
            reasons.append(
                "Поле Software містить згадки про AI / генеративні сервіси (висока підозра редагування)."
            )

        # 1.2. Популярні графічні редактори
        elif any(kw in s_low for kw in EDIT_SOFTWARE_KEYWORDS):
            score = max(score, 0.85)
            reasons.append(
                "EXIF містить сліди графічного редактора (Photoshop/аналогічні)."
            )

        else:
            # Наприклад, вбудлене ПЗ камери чи простий імпортер
            reasons.append(
                "Поле Software присутнє, але не містить явних ознак складного редагування."
            )

    # 2) Перевірка ключових полів (Make/Model/DateTime)
    missing_core = []
    if not make:
        missing_core.append("Make")
    if not model:
        missing_core.append("Model")
    if not datetime:
        missing_core.append("DateTime")

    if missing_core:
        # Якщо є EXIF, але немає базових полів — це трохи підозріло,
        # але не «максимально», якщо немає редакторів
        if score < 0.85:
            score = max(score, 0.6)
        reasons.append(
            "EXIF неповний (відсутні поля: " + ", ".join(missing_core) + ")."
        )

    # 3) Якщо жодної сильної ознаки не знайшли — залишаємо 0.0
    if score == 0.0 and not reasons:
        reasons.append("EXIF виглядає типовим; явних ознак редагування не виявлено.")

    reason = " ".join(reasons)

    return {
        "metadata_score": float(max(0.0, min(1.0, score))),
        "reason": reason,
        "software": software,
        "raw_exif": exif_dict,
    }
