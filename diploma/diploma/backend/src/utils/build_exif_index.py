# import sys
# from pathlib import Path
#
# import pandas as pd
# from PIL import Image, ImageFile
#
# BASE = Path(__file__).resolve().parents[3]
#
# sys.path.append(str(BASE))
#
# from backend.src.utils.metadata import analyze_metadata  # використовуємо функцію з utils
#
# ImageFile.LOAD_TRUNCATED_IMAGES = True
#
# DATA_DIR = BASE / "data"
# EXIF_INDEX = DATA_DIR / "exif_index.csv"
#
#
# def build_exif_index():
#     rows = []
#
#     # Проходимо по всіх JPEG-файлах у data/
#     for p in DATA_DIR.rglob("*.jpg"):
#         try:
#             with Image.open(p) as img:
#                 meta = analyze_metadata(img)
#         except Exception:
#             # Якщо зображення не відкривається – пропустити
#             continue
#
#         # Нормалізуємо шлях до вигляду з "/", бо в fusion ти шукаєш через .str.contains("/val/...")
#         norm_path = str(p).replace("\\", "/")
#
#         rows.append({
#             "path": norm_path,
#             "has_exif": 0 if meta["raw_exif"] == {} else 1,
#             "metadata_score": float(meta.get("metadata_score", 0.0)),
#             "Software": meta.get("software", ""),
#             "Reason": meta.get("reason", ""),
#         })
#
#     df = pd.DataFrame(rows)
#     df.to_csv(EXIF_INDEX, index=False)
#     print(f"EXIF index saved to {EXIF_INDEX} with {len(df)} rows.")
#
#
# if __name__ == "__main__":
#     print(f"Building EXIF index under: {DATA_DIR}")
#     build_exif_index()
