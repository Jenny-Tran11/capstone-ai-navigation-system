import os

# Model path inside the Lambda container image.
# By default we expect the model to be baked into the image at this path.
MODEL_PATH = os.getenv("MODEL_PATH", "/opt/ml/model/yolo12n.pt")

# Fallback S3 location for the model, if it is not present locally.
MODEL_BUCKET = os.getenv("MODEL_BUCKET")
MODEL_KEY = os.getenv("MODEL_KEY", "yolo12n.pt")

# Detection settings (mirrors config.py in the root project)
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.4"))

TARGET_CLASS_IDS = list(range(30))
CLASS_NAMES = [
    "Dog",
    "Door",
    "Table",
    "Auto",
    "Barrier",
    "Bench",
    "Bicycle",
    "Bus",
    "Car",
    "Cattle",
    "Chair",
    "Dustbin",
    "Electric pole",
    "Footpath",
    "Fridge",
    "Gate",
    "Motorcycle",
    "Pothole",
    "Person",
    "Pillar",
    "Plant",
    "Sign board",
    "Stairs",
    "Step",
    "Stones",
    "Traffic signal",
    "Tree",
    "Truck",
    "Wash basin",
    "Zebra crossing",
]

