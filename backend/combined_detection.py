from detection import detect_objects


def detect_all(frame):
    detections = detect_objects(frame)

    for detection in detections:
        detection["detection_type"] = "object"

    return detections