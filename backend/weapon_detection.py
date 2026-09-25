from pathlib import Path

import numpy as np
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent

WEAPON_MODEL_PATH = (
    BASE_DIR / "weapon_model" / "models" / "best.pt"
)

_weapon_model = None
_load_error = None


def load_weapon_model():
    global _weapon_model, _load_error

    if _weapon_model is not None:
        return _weapon_model

    try:
        _weapon_model = YOLO(
            str(WEAPON_MODEL_PATH)
        )

        _load_error = None

        return _weapon_model

    except Exception as exc:
        _weapon_model = None
        _load_error = str(exc)
        raise


def is_weapon_model_loaded():
    return _weapon_model is not None


def get_weapon_model_status():
    return {
        "loaded": _weapon_model is not None,
        "weights_path": str(
            WEAPON_MODEL_PATH
        ),
        "weights_present": WEAPON_MODEL_PATH.exists(),
        "error": _load_error,
    }


def detect_weapons(
    frame: np.ndarray,
) -> list[dict]:

    if _weapon_model is None:
        raise RuntimeError(
            "Weapon model is not loaded."
        )

    results = _weapon_model.predict(
        source=frame,
        verbose=False,
        conf=0.35,
    )

    if not results:
        return []

    result = results[0]

    if result.boxes is None:
        return []

    names = result.names or {}

    detections = []

    for box in result.boxes:

        class_id = int(
            box.cls[0].item()
        )

        class_name = names.get(
            class_id,
            str(class_id),
        )

        x1, y1, x2, y2 = (
            box.xyxy[0].tolist()
        )

        detections.append(
            {
                "class_name": class_name,
                "confidence": round(
                    float(
                        box.conf[0].item()
                    ),
                    4,
                ),
                "bbox": {
                    "x1": int(round(x1)),
                    "y1": int(round(y1)),
                    "x2": int(round(x2)),
                    "y2": int(round(y2)),
                },
            }
        )

    return detections