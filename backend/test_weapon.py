import cv2

from weapon_detection import (
    load_weapon_model,
    detect_weapons,
)


VIDEO_PATH = r"outputs\browser_test2.mp4"


load_weapon_model()

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    raise RuntimeError(
        f"Could not open video: {VIDEO_PATH}"
    )

frame_number = 0
detections_found = 0

while True:
    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # Test every 30th frame
    if frame_number % 30 != 0:
        continue

    detections = detect_weapons(frame)

    if detections:
        print(
            f"\nFrame {frame_number}:"
        )

        for detection in detections:
            print(
                detection
            )

        detections_found += len(
            detections
        )

cap.release()

print("\n----------------------------")
print("WEAPON TEST COMPLETE")
print(f"Frames checked: {frame_number}")
print(f"Weapon detections: {detections_found}")
print("----------------------------")