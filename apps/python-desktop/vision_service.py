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

        # Sort detections by box height (largest/closest/most prominent first)
        detections.sort(key=lambda x: (x['box'][3] - x['box'][1]), reverse=True)

        top = detections[:3]

        def _distance_bucket(box_h: float, height: int) -> str:
            if box_h > height * 0.6:
                return "very close"
            if box_h > height * 0.3:
                return "nearby"
            return "detected"

        def _position_bucket(center_x: float, width: int) -> str:
            if center_x < width * 0.33:
                return "on the left"
            if center_x > width * 0.66:
                return "on the right"
            return "ahead"

        phrases = []
        for det in top:
            name = det['name']
            x1, y1, x2, y2 = det['box']
            box_h = y2 - y1
            center_x = (x1 + x2) / 2.0

            dist = _distance_bucket(box_h, img_height)
            pos = _position_bucket(center_x, img_width)

            phrases.append(f"{name} {pos}, {dist}")

        if not phrases:
            return "Path is clear."

        # Join phrases into short sentences suitable for TTS
        message = ". ".join(phrases) + "."
        return message