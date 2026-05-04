from __future__ import annotations

import base64
from typing import Any

import cv2
import numpy as np

from .config import settings


class ObjectDetector:
    def __init__(self) -> None:
        self.model = self._load_model()

    def _load_model(self):
        from ultralytics import YOLO  # deferred: heavy import

        try:
            return YOLO(settings.model_path)
        except Exception as e:
            print(f"Model load failed: {e}")
            return None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def detect(self, image: np.ndarray) -> list[dict[str, Any]]:
        if self.model is None:
            return []

        results = self.model(image, verbose=False)[0]
        detections: list[dict[str, Any]] = []

        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id in settings.target_class_ids and confidence > settings.confidence_threshold:
                coords = box.xyxy[0].tolist()
                name = results.names[class_id]
                detections.append({"name": name, "confidence": confidence, "box": coords})

        return detections

    def analyze_scene(self, detections: list[dict[str, Any]], img_width: int, img_height: int) -> str:
        if not detections:
            return "Path is clear."

        detections.sort(key=lambda x: (x["box"][3] - x["box"][1]), reverse=True)
        top = detections[:3]

        def _distance(box_h: float) -> str:
            if box_h > img_height * 0.6:
                return "very close"
            if box_h > img_height * 0.3:
                return "nearby"
            return "detected"

        def _position(center_x: float) -> str:
            if center_x < img_width * 0.33:
                return "on the left"
            if center_x > img_width * 0.66:
                return "on the right"
            return "ahead"

        phrases = []
        for det in top:
            x1, y1, x2, y2 = det["box"]
            phrases.append(f"{det['name']} {_position((x1 + x2) / 2)}, {_distance(y2 - y1)}")

        return ". ".join(phrases) + "."


def decode_image(image_b64: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as e:
        raise ValueError(f"Failed to base64-decode image: {e}") from e

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes.")
    return img


# Module-level singleton — loaded once on first import
detector = ObjectDetector()
