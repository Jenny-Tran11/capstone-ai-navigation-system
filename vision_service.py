import cv2
import os
from ultralytics import YOLO
import config

class ObjectDetector:
    def __init__(self):
        self.model = self._load_model()

    def _load_model(self):
        if not os.path.exists(config.MODEL_PATH):
            print(f"Error: Model {config.MODEL_PATH} not found.")
            return None
        
        print(f"Loading YOLO model from {config.MODEL_PATH}...")
        try:
            return YOLO(config.MODEL_PATH)
        except Exception as e:
            print(f"Model load failed: {e}")
            return None

    def detect(self, image):
        """
        Runs inference on the image and returns a list of valid detections.
        """
        if self.model is None:
            return []

        # Run inference
        results = self.model(image, verbose=False)[0]
        valid_detections = []

        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            # Filter logic
            if class_id in config.TARGET_CLASS_IDS and confidence > config.CONFIDENCE_THRESHOLD:
                coords = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                name = results.names[class_id]
                
                valid_detections.append({
                    'name': name,
                    'confidence': confidence,
                    'box': coords
                })
        
        return valid_detections

    def analyze_scene(self, detections, img_width, img_height):
        """
        Converts detection data into a natural language string.
        """
        if not detections:
            return "Path is clear."

        # Sort detections by box height (largest/closest first)
        detections.sort(key=lambda x: (x['box'][3] - x['box'][1]), reverse=True)
        
        # Focus on the most critical object (the first one)
        target = detections[0]
        name = target['name']
        
        # Calculate Logic
        box_h = target['box'][3] - target['box'][1]
        center_x = (target['box'][0] + target['box'][2]) / 2

        # Distance logic
        if box_h > img_height * 0.6:
            dist = "Critical! Very close"
        elif box_h > img_height * 0.3:
            dist = "Nearby"
        else:
            dist = "Detected"

        # Position logic
        if center_x < img_width * 0.33:
            pos = "on the left"
        elif center_x > img_width * 0.66:
            pos = "on the right"
        else:
            pos = "ahead"

        message = f"{dist} {name} {pos}."
        
        # Count others
        if len(detections) > 1:
            message += f" Plus {len(detections)-1} other objects."

        return message