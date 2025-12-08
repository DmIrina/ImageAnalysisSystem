# backend/src/fusion/fusion.py

from typing import Dict

import numpy as np

# ==== Ваги візуальних модулів ====
AI_WEIGHT = 1.0  # детектор ШІ (ViT)
MANIP_WEIGHT = 1.0  # детектор маніпуляцій (MVSS / Photoshop)

# ==== Метадані (EXIF) ====
META_SUSP_THRESHOLD = 0.75  # з якого значення metadata_score вважаємо EXIF реально підозрілим
META_MAX_BOOST = 0.25  # максимум, наскільки метадані можуть підняти підозрілість


def _clip01(x: float) -> float:
    """Обрізає значення до [0,1]."""
    return float(max(0.0, min(1.0, x)))


def build_fusion_features(sample: Dict[str, float]) -> Dict[str, float]:
    """
    Допоміжна функція для логування / аналізу.
    """
    return {
        "ai_score": float(sample.get("ai_score", 0.0)),
        "manipulation_score": float(sample.get("manipulation_score", 0.0)),
        "patch_score": float(sample.get("patch_score", 0.0)),
        "metadata_score": float(sample.get("metadata_score", 0.0)),
    }


def _combine_visual_scores(
        ai_score: float,
        manipulation_score: float,
) -> float:
    """
    Обчислює базову ПІДОЗРІЛІСТЬ S_vis з виходів двох
    незалежних візуальних модулів (AI та MVSS)
    за схемою "noisy-OR" з вагами.

    Ідея: якщо хоча б один модуль дуже впевнений у фейку,
    загальна підозрілість різко зростає.

    Нехай:
      s_ai, s_manip ∈ [0,1]  — підозрілість від відповідних модулів
      w_ai, w_manip          — їх ваги

    Тоді:
      S_vis = 1 - Π (1 - s_i)^{w_i}
    """

    # кліп до [0,1]
    s_ai = _clip01(ai_score)
    s_manip = _clip01(manipulation_score)

    scores = np.array([s_ai, s_manip], dtype=np.float32)

    # нормалізовані ваги
    weights = np.array([AI_WEIGHT, MANIP_WEIGHT], dtype=np.float32)
    weights = weights / (weights.sum() + 1e-8)

    # Noisy-OR: S = 1 - Π (1 - s_i)^{w_i}
    one_minus = 1.0 - scores
    one_minus = np.clip(one_minus, 0.0, 1.0)  # захист від артефактів
    combined = 1.0 - float(np.prod(one_minus ** weights))

    return _clip01(combined)


def _apply_metadata_boost(
        base_suspicion: float,
        metadata_score: float,
) -> float:
    """
    Коригує підозрілість за рахунок метаданих.

    Логіка:
      - якщо metadata_score ≤ META_SUSP_THRESHOLD:
            → EXIF або нормальний, або відсутній
            → підозрілість НЕ змінюємо
      - якщо metadata_score > META_SUSP_THRESHOLD:
            → вважаємо EXIF підозрілим (наприклад, зазначений генератор ШІ)
            → додаємо до підозрілості додатковий буст не більше META_MAX_BOOST.

    Формула:
      m ∈ [0,1] — підозрілість метаданих;
      norm ∈ [0,1] — наскільки сильно m перевищує поріг;
      boost = META_MAX_BOOST * norm;
      s_final = s_base + boost * (1 - s_base)
    """

    s = _clip01(base_suspicion)
    m = _clip01(metadata_score)

    if m <= META_SUSP_THRESHOLD:
        return s

    norm = (m - META_SUSP_THRESHOLD) / (1.0 - META_SUSP_THRESHOLD + 1e-8)
    norm = float(max(0.0, min(1.0, norm)))

    boost = META_MAX_BOOST * norm

    s_final = s + boost * (1.0 - s)
    return _clip01(s_final)


def fusion_predict(
        ai_score: float,
        manipulation_score: float,
        patch_score: float,
        metadata_score: float,
) -> float:
    """
    Повертає інтегральну ОЦІНКУ ДОСТОВІРНОСТІ зображення (fusion_score ∈ [0,1]).

    Вхідні аргументи (усі інтерпретуються як ПІДОЗРІЛІСТЬ):
      ai_score           ∈ [0,1] — наскільки AI-модуль бачить ознаки ШІ / фейку;
      manipulation_score ∈ [0,1] — наскільки MVSS бачить локальні маніпуляції;
      patch_score        ∈ [0,1] — локальні артефакти (зараз НЕ впливає на підсумок,
                                   використовується лише для візуалізації);
      metadata_score     ∈ [0,1] — підозрілість метаданих EXIF.

    Кроки:
      1) комбінуємо ai_score та manipulation_score у базову ПІДОЗРІЛІСТЬ S_vis
         через noisy-OR з вагами;
      2) за потреби підсилюємо підозрілість за рахунок метаданих (якщо вони
         справді дивні / підозрілі);
      3) перетворюємо підозрілість у ДОСТОВІРНІСТЬ:
            fusion_score = authenticity = 1 - suspicion.

    Інтерпретація:
      - fusion_score ≈ 1.0 → система довіряє зображенню (низька підозра);
      - fusion_score ≈ 0.5 → змішаний сигнал, бажано дивитись на окремі модулі;
      - fusion_score ≈ 0.0 → висока підозрілість, зображення скоріше за все
                             фейкове / скомпозитоване.
    """

    # 1. Базова підозрілість з двох незалежних візуальних модулів
    visual_suspicion = _combine_visual_scores(
        ai_score=ai_score,
        manipulation_score=manipulation_score,
    )

    # 2. Корекція за метаданими (тільки якщо вони справді підозрілі)
    final_suspicion = _apply_metadata_boost(
        base_suspicion=visual_suspicion,
        metadata_score=metadata_score,
    )

    # 3. Перетворюємо підозрілість у достовірність
    authenticity = 1.0 - final_suspicion
    final_suspicion = 1.0 - authenticity
    # return _clip01(authenticity)
    return _clip01(final_suspicion)
