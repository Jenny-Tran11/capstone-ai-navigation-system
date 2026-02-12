# Configuration settings for the Blind Navigation System

# Model settings
MODEL_PATH = 'yolov12n.pt'
CONFIDENCE_THRESHOLD = 0.4

# COCO Class IDs
# 0: person, 1: bicycle, 2: car, 3: motorcycle, 5: bus, 
# 7: truck, 9: traffic light, 11: stop sign, 13: bench, 15: cat, 16: dog
TARGET_CLASS_IDS = [0, 1, 2, 3, 5, 7, 9, 11, 13, 15, 16]

# Voice settings
VOICE_RATE = 160  # Words per minute