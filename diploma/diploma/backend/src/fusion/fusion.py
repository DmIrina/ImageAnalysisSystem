# backend/src/fusion/fusion.py
from typing import Dict

import numpy as np

# ==== Ваги візуальних модулів ====
AI_WEIGHT = 1.0
MANIP_WEIGHT = 1.0

# ==== Метадані (EXIF) ====
META_SUSP_THRESHOLD = 0.75
META_MAX_BOOST = 0.25


def _clip01(x: float) -> float:
    return float(max(0.0, min(1.0, x)))


def build_fusion_features(sample: Dict[str, float]) -> Dict[str, float]:
    return {
        "ai_score": float(sample.get("ai_score", 0.0)),
        "manipulation_score": float(sample.get("manipulation_score", 0.0)),
        "patch_score": float(sample.get("patch_score", 0.0)),
        "metadata_score": float(sample.get("metadata_score", 0.0)),
    }


def _dampen_manipulation_by_area(manip_score: float, patch_score: float) -> float:
    m_score = _clip01(manip_score)
    p_area = _clip01(patch_score)

    SMALL_AREA_THRESHOLD = 0.05
    HIGH_CONFIDENCE_THRESHOLD = 0.85

    # Якщо площа достатня АБО впевненість неймовірно висока - віримо повністю
    if p_area > SMALL_AREA_THRESHOLD or m_score > HIGH_CONFIDENCE_THRESHOLD:
        return m_score

    damping_ratio = p_area / SMALL_AREA_THRESHOLD
    damping_factor = np.sqrt(damping_ratio)

    adjusted_score = m_score * damping_factor
    return float(adjusted_score)


def _combine_visual_scores(
        ai_score: float,
        manipulation_score: float,
) -> float:
    s_ai = _clip01(ai_score)
    s_manip = _clip01(manipulation_score)
    p_not_ai = (1.0 - s_ai) ** AI_WEIGHT
    p_not_manip = (1.0 - s_manip) ** MANIP_WEIGHT

    combined_suspicion = 1.0 - (p_not_ai * p_not_manip)

    return _clip01(combined_suspicion)


def _apply_metadata_boost(
        base_suspicion: float,
        metadata_score: float,
) -> float:
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
    effective_manip_score = _dampen_manipulation_by_area(manipulation_score, patch_score)

    visual_suspicion = _combine_visual_scores(
        ai_score=ai_score,
        manipulation_score=effective_manip_score,
    )
    final_suspicion = _apply_metadata_boost(
        base_suspicion=visual_suspicion,
        metadata_score=metadata_score,
    )

    return _clip01(final_suspicion)
