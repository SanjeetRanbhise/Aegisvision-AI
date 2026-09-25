from pathlib import Path

import numpy as np
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
WEIGHTS_PATH = MODELS_DIR / "yolov8n.pt"

TARGET_CLASSES = {
    "person",
    "car",
    "truck",
    "bus",
    "motorcycle",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
}

_model: YOLO | None = None
_load_error: str | None = None


def load_model() -> YOLO:
    """Load the pretrained YOLO model once. Safe to call again after a successful load."""
    global _model, _load_error

    if _model is not None:
        return _model

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # yolov8n is the lightweight COCO-pretrained nano model for MVP use.
        # Ultralytics downloads weights to WEIGHTS_PATH if they are not present.
        model = YOLO(str(WEIGHTS_PATH))
        _model = model
        _load_error = None
        return model
    except Exception as exc:
        _model = None
        _load_error = str(exc)
        raise


def get_model() -> YOLO | None:
    return _model


def is_model_loaded() -> bool:
    return _model is not None


def get_model_status() -> dict:
    return {
        "success": True,
        "loaded": _model is not None,
        "model": "yolov8n" if _model is not None else None,
        "weights_path": str(WEIGHTS_PATH),
        "weights_present": WEIGHTS_PATH.exists(),
        "target_classes": sorted(TARGET_CLASSES),
        "error": _load_error,
    }


def detect_objects(frame: np.ndarray) -> list[dict]:
    """Run YOLO on a single OpenCV BGR or RGB image/frame and return filtered detections."""
    if _model is None:
        raise RuntimeError("YOLO model is not loaded.")

    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        raise ValueError("frame must be a non-empty OpenCV/NumPy image.")

    results = _model.predict(source=frame, verbose=False)
    if not results:
        return []

    result = results[0]
    names = result.names or {}
    detections: list[dict] = []

    if result.boxes is None:
        return detections

    for box in result.boxes:
        class_id = int(box.cls[0].item())
        class_name = names.get(class_id, str(class_id))
        if class_name not in TARGET_CLASSES:
            continue

        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append(
            {
                "class_name": class_name,
                "confidence": round(float(box.conf[0].item()), 4),
                "bbox": {
                    "x1": int(round(x1)),
                    "y1": int(round(y1)),
                    "x2": int(round(x2)),
                    "y2": int(round(y2)),
                },
            }
        )

    return detections
