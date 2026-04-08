# Configuration settings for the Blind Navigation System

import os

# Model settings (YOLO weights path)
# Place your weights inside the `backend/` folder (same directory as this file).
# Example filenames:
# - yolov12n.pt (base weights)
# - best.pt     (your fine-tuned weights from training)
# Override with env MODEL_PATH (e.g. /opt/ml/model/yolo12n.pt in Docker).
MODEL_PATH = os.getenv("MODEL_PATH", "yolo12n.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.4"))

# Optional S3 fallback: if the file at MODEL_PATH is missing, server startup can download
# from s3://MODEL_BUCKET/MODEL_KEY before loading YOLO.
MODEL_BUCKET = os.getenv("MODEL_BUCKET")
MODEL_KEY = os.getenv("MODEL_KEY", "yolo12n.pt")

# Custom model: 30 domain-specific classes (see data.yaml / train.py)
TARGET_CLASS_IDS = list(range(30))
CLASS_NAMES = [
    'Dog', 'Door', 'Table', 'Auto', 'Barrier', 'Bench', 'Bicycle', 'Bus',
    'Car', 'Cattle', 'Chair', 'Dustbin', 'Electric pole', 'Footpath',
    'Fridge', 'Gate', 'Motorcycle', 'Pothole', 'Person', 'Pillar', 'Plant',
    'Sign board', 'Stairs', 'Step', 'Stones', 'Traffic signal', 'Tree',
    'Truck', 'Wash basin', 'Zebra crossing',
]

# Voice settings
VOICE_RATE = 160  # Words per minute

# Video / runtime settings
MIN_VOICE_INTERVAL_SEC = 2.5  # Minimum seconds between spoken alerts
TARGET_FPS = 10               # Target minimum FPS for real-time processing
VIDEO_SOURCE_DEFAULT = 0      # Default webcam index

# Navigation / geocoding settings
NAV_STEP_INTERVAL_SEC = 15            # Seconds between navigation instructions
NOMINATIM_USER_AGENT = "blind-nav-capstone/1.0"