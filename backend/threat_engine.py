from datetime import datetime, timezone


THREAT_RULES = {
    "person": "HIGH",
    "car": "MEDIUM",
    "truck": "MEDIUM",
    "bus": "MEDIUM",
    "motorcycle": "MEDIUM",
}


def classify_threat(detection: dict) -> dict:
    class_name = detection.get("class_name", "unknown")
    confidence = float(detection.get("confidence", 0))

    base_level = THREAT_RULES.get(class_name, "LOW")

    # Demo heuristic:
    # Lower-confidence detections are treated as lower-priority alerts.
    if confidence < 0.50:
        threat_level = "LOW"
    elif confidence < 0.75 and base_level == "HIGH":
        threat_level = "MEDIUM"
    else:
        threat_level = base_level

    return {
        **detection,
        "threat_level": threat_level,
        "alert_type": f"{threat_level} THREAT",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }