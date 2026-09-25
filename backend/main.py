import subprocess

from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

import cv2

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from combined_detection import detect_all
from detection import get_model_status, load_model
from threat_engine import classify_threat


# ============================================================
# CONFIGURATION
# ============================================================

FFMPEG_PATH = (
    r"C:\Users\rawal\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
)

BASE_DIR = Path(__file__).resolve().parent

UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
MODELS_DIR = BASE_DIR / "models"

ALLOWED_EXTENSIONS = {".mp4"}

ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "application/mp4",
    "application/octet-stream",
}

MAX_UPLOAD_BYTES = 500 * 1024 * 1024


# ============================================================
# CREATE DIRECTORIES
# ============================================================

for directory in (
    UPLOADS_DIR,
    OUTPUTS_DIR,
    MODELS_DIR,
):
    directory.mkdir(
        parents=True,
        exist_ok=True,
    )


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(_app: FastAPI):

    # Load existing YOLOv8 model
    load_model()

    yield


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="AegisVision AI Backend",
    description="Local API for video ingest and YOLO detection.",
    version="0.2.0",
    lifespan=lifespan,
)


# ============================================================
# SERVE GENERATED VIDEOS
# ============================================================

app.mount(
    "/outputs",
    StaticFiles(
        directory=str(OUTPUTS_DIR)
    ),
    name="outputs",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def root():

    return {
        "success": True,
        "service": "AegisVision AI Backend",
        "version": "0.2.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():

    return {
        "success": True,
        "status": "ok",
        "uploads_dir": str(
            UPLOADS_DIR
        ),
        "model_loaded": get_model_status()[
            "loaded"
        ],
    }


@app.get("/model-status")
def model_status():

    return get_model_status()


# ============================================================
# FILE NAME SANITIZATION
# ============================================================

def _safe_stem(filename: str) -> str:

    stem = Path(filename).stem

    cleaned = "".join(
        ch
        if ch.isalnum() or ch in ("-", "_")
        else "_"
        for ch in stem
    )

    cleaned = (
        cleaned.strip("._")
        or "video"
    )

    return cleaned[:80]


# ============================================================
# UPLOAD ENDPOINT
# ============================================================

@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...)
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided.",
        )

    extension = Path(
        file.filename
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only MP4 video files are accepted.",
        )

    content_type = (
        file.content_type or ""
    ).lower()

    if (
        content_type
        and content_type not in ALLOWED_CONTENT_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported content type: "
                f"{file.content_type}. "
                "Upload an MP4 file."
            ),
        )

    stored_name = (
        f"{uuid4().hex}_"
        f"{_safe_stem(file.filename)}"
        f"{extension}"
    )

    destination = (
        UPLOADS_DIR / stored_name
    )

    try:

        size = 0

        with destination.open("wb") as buffer:

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                size += len(chunk)

                if size > MAX_UPLOAD_BYTES:

                    destination.unlink(
                        missing_ok=True
                    )

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "File exceeds the "
                            "500 MB upload limit."
                        ),
                    )

                buffer.write(chunk)

    except HTTPException:
        raise

    except OSError as exc:

        destination.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {exc}",
        ) from exc

    finally:

        await file.close()

    if size == 0:

        destination.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    return {
        "success": True,
        "filename": stored_name,
        "file_path": str(destination),
    }


# ============================================================
# DETECTION + ANNOTATED VIDEO ENDPOINT
# ============================================================

@app.post("/detect")
def detect_video(
    filename: str
):

    # --------------------------------------------------------
    # INPUT FILE
    # --------------------------------------------------------

    input_path = (
        UPLOADS_DIR
        / Path(filename).name
    )

    if not input_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found.",
        )

    if input_path.suffix.lower() != ".mp4":

        raise HTTPException(
            status_code=400,
            detail="Only MP4 videos are supported.",
        )

    if not get_model_status()["loaded"]:

        raise HTTPException(
            status_code=503,
            detail="YOLO model is not loaded.",
        )

    # --------------------------------------------------------
    # OPEN VIDEO
    # --------------------------------------------------------

    cap = cv2.VideoCapture(
        str(input_path)
    )

    if not cap.isOpened():

        raise HTTPException(
            status_code=400,
            detail="Could not open the video.",
        )

    fps = (
        cap.get(cv2.CAP_PROP_FPS)
        or 30.0
    )

    frame_count = int(
        cap.get(
            cv2.CAP_PROP_FRAME_COUNT
        )
        or 0
    )

    width = int(
        cap.get(
            cv2.CAP_PROP_FRAME_WIDTH
        )
        or 0
    )

    height = int(
        cap.get(
            cv2.CAP_PROP_FRAME_HEIGHT
        )
        or 0
    )

    if width <= 0 or height <= 0:

        cap.release()

        raise HTTPException(
            status_code=400,
            detail="Invalid video dimensions.",
        )

    # --------------------------------------------------------
    # OUTPUT FILES
    # --------------------------------------------------------

    temp_output_name = (
        f"temp_{Path(filename).stem}.mp4"
    )

    temp_output_path = (
        OUTPUTS_DIR
        / temp_output_name
    )

    output_name = (
        f"annotated_{Path(filename).stem}.mp4"
    )

    output_path = (
        OUTPUTS_DIR
        / output_name
    )

    # Remove old files
    temp_output_path.unlink(
        missing_ok=True
    )

    output_path.unlink(
        missing_ok=True
    )

    # --------------------------------------------------------
    # OPEN OPENCV VIDEO WRITER
    # --------------------------------------------------------

    fourcc = cv2.VideoWriter_fourcc(
        *"mp4v"
    )

    writer = cv2.VideoWriter(
        str(temp_output_path),
        fourcc,
        fps,
        (width, height),
    )

    if not writer.isOpened():

        cap.release()

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not create temporary "
                "annotated video."
            ),
        )

    # --------------------------------------------------------
    # PROCESS FRAMES
    # --------------------------------------------------------

    detections = []
    frames_processed = 0

    try:

        while True:

            success, frame = cap.read()

            if not success:
                break

            # =================================================
            # RUN BOTH DETECTORS
            # =================================================

            frame_detections = detect_all(
                frame
            )

            # Detections from THIS frame
            threat_detections = []

            # =================================================
            # DRAW DETECTIONS
            # =================================================

            for detection in frame_detections:

                # ---------------------------------------------
                # CLASSIFY THREAT
                # ---------------------------------------------

                threat_detection = (
                    classify_threat(
                        detection
                    )
                )

                threat_detections.append(
                    threat_detection
                )

                # ---------------------------------------------
                # GET BOUNDING BOX
                # ---------------------------------------------

                bbox = detection["bbox"]

                x1 = bbox["x1"]
                y1 = bbox["y1"]
                x2 = bbox["x2"]
                y2 = bbox["y2"]

                confidence = float(
                    detection["confidence"]
                )

                class_name = detection[
                    "class_name"
                ]

                threat_level = (
                    threat_detection[
                        "threat_level"
                    ]
                )

                detection_type = (
                    detection.get(
                        "detection_type",
                        "object",
                    )
                )

                # ---------------------------------------------
                # COLOR
                # ---------------------------------------------

                if detection_type == "weapon":

                    # Weapon = red
                    box_color = (
                        0,
                        0,
                        255,
                    )

                elif threat_level == "CRITICAL":

                    box_color = (
                        0,
                        0,
                        255,
                    )

                elif threat_level == "HIGH":

                    box_color = (
                        0,
                        80,
                        255,
                    )

                elif threat_level == "MEDIUM":

                    box_color = (
                        0,
                        180,
                        255,
                    )

                else:

                    box_color = (
                        255,
                        220,
                        0,
                    )

                # ---------------------------------------------
                # BOUNDING BOX
                # ---------------------------------------------

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    box_color,
                    2,
                )

                # ---------------------------------------------
                # LABEL
                # ---------------------------------------------

                if detection_type == "weapon":

                    label = (
                        f"WEAPON: "
                        f"{class_name.upper()} "
                        f"{confidence * 100:.0f}%"
                    )

                else:

                    label = (
                        f"{class_name.upper()} "
                        f"{confidence * 100:.0f}% | "
                        f"{threat_level}"
                    )

                text_y = max(
                    y1 - 10,
                    20,
                )

                label_width = max(
                    180,
                    len(label) * 8,
                )

                # Label background
                cv2.rectangle(
                    frame,
                    (
                        x1,
                        max(
                            text_y - 22,
                            0,
                        ),
                    ),
                    (
                        x1 + label_width,
                        text_y + 5,
                    ),
                    box_color,
                    -1,
                )

                # Label text
                cv2.putText(
                    frame,
                    label,
                    (
                        x1 + 5,
                        text_y,
                    ),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (
                        255,
                        255,
                        255,
                    ),
                    1,
                    cv2.LINE_AA,
                )

            # =================================================
            # SAVE DETECTIONS FOR THIS FRAME
            # =================================================

            if threat_detections:

                detections.append(
                    {
                        "frame": frames_processed,
                        "detections": (
                            threat_detections
                        ),
                    }
                )

            # =================================================
            # WATERMARK
            # =================================================

            cv2.putText(
                frame,
                "AEGISVISION AI | YOLOv8 + WEAPON AI",
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (
                    0,
                    255,
                    180,
                ),
                2,
                cv2.LINE_AA,
            )

            # =================================================
            # WRITE FRAME
            # =================================================

            writer.write(frame)

            frames_processed += 1

    finally:

        cap.release()
        writer.release()

    # --------------------------------------------------------
    # VERIFY TEMP FILE
    # --------------------------------------------------------

    if (
        not temp_output_path.exists()
        or temp_output_path.stat().st_size == 0
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "Temporary annotated video "
                "was not created."
            ),
        )

    # --------------------------------------------------------
    # FFMPEG → H.264
    # --------------------------------------------------------

    try:

        subprocess.run(
            [
                FFMPEG_PATH,
                "-y",
                "-i",
                str(temp_output_path),
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                "-an",
                str(output_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

    except FileNotFoundError:

        raise HTTPException(
            status_code=500,
            detail=(
                "FFmpeg executable was not found."
            ),
        )

    except subprocess.CalledProcessError as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "FFmpeg conversion failed: "
                f"{exc.stderr[-1500:]}"
            ),
        )

    finally:

        temp_output_path.unlink(
            missing_ok=True
        )

    # --------------------------------------------------------
    # VERIFY FINAL VIDEO
    # --------------------------------------------------------

    if (
        not output_path.exists()
        or output_path.stat().st_size == 0
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "Browser-compatible annotated "
                "video was not created."
            ),
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "success": True,

        "filename": filename,

        "annotated_video": output_name,

        "annotated_video_url": (
            f"/outputs/{output_name}"
        ),

        "video": {

            "width": width,

            "height": height,

            "fps": round(
                fps,
                2,
            ),

            "frame_count": frame_count,
        },

        "frames_processed": (
            frames_processed
        ),

        "frames_with_detections": len(
            detections
        ),

        "output_size_bytes": (
            output_path.stat().st_size
        ),

        "detections": detections,
    }