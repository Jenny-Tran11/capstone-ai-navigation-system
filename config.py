# Configuration settings for the Blind Navigation System

# Model settings (current YOLO model path)
# NOTE: This points to the existing yolo12n.pt file in the project root
#       (same directory as this config.py). Update this path to your
#       custom-trained weights (e.g. best.pt) once FR1.1 is complete.
MODEL_PATH = 'yolo12n.pt'
CONFIDENCE_THRESHOLD = 0.4

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