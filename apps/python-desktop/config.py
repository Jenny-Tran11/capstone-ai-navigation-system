# Configuration settings for the Blind Navigation System

from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent  # monorepo root (apps/python-desktop -> apps -> repo)

# Fine-tuned weights tracked in Git (see models/yolo/). Override locally if needed.
MODEL_PATH = str(_ROOT / "models" / "yolo" / "best.pt")
CONFIDENCE_THRESHOLD = 0.4

# Custom model: 30 domain-specific classes — must match training data.yaml (order + spelling)
TARGET_CLASS_IDS = list(range(30))
CLASS_NAMES = [
    'Dog ahead at', 'Door ahead at', 'Table ahead at', 'auto ahead at',
    'barrier ahead at', 'bench ahead at', 'bicycle ahead at', 'bus ahead at',
    'car ahead at', 'cattle ahead at', 'chair ahead at', 'dustbin ahead at',
    'electric pole ahead at', 'footpath on', 'fridge ahead at', 'gate ahead at',
    'motorcycle ahead at', 'pathole ahead at', 'person ahead at',
    'pillar ahead at', 'plant ahead at', 'sign board ahead at',
    'stairs ahead at', 'step ahead at', 'stones ahead at',
    'traffic signal ahead at', 'tree ahead at', 'truck ahead at',
    'wash basin ahead at', 'zebra crossing ahead at',
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