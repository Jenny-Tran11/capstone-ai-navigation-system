from __future__ import annotations

import base64
import logging
from typing import Any

import cv2
import numpy as np

from .config import settings

logger = logging.getLogger(__name__)

# How urgently each class needs to be reported. Higher = spoken first regardless of size.
_DANGER_LEVEL: dict[str, int] = {
    "Pothole": 2, "Step": 2, "Stairs": 2, "Stones": 2,
    "Traffic signal": 2, "Person": 2,
    "Bicycle": 1, "Motorcycle": 1, "Dog": 1,
    "Auto": 1, "Car": 1, "Bus": 1, "Truck": 1,
    "Barrier": 1, "Gate": 1,
}


def _proximity_score(box: list[float], img_height: int) -> float:
    """0–1 score: higher = closer to camera.

    Combines bounding-box height (larger object fills more frame) and vertical
    position (objects lower in frame are closer on a ground plane).
    """
    _, y1, _, y2 = box
    box_h = y2 - y1
    bottom = y2 / img_height
    return (box_h / img_height) * 0.6 + bottom * 0.4


class ObjectDetector:
    def __init__(self) -> None:
        self.model = self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO  # deferred: heavy import
            model = YOLO(settings.model_path)
            logger.info("Model loaded from %s", settings.model_path)
            return model
        except FileNotFoundError:
            logger.error(
                "Model weights not found at %s. Place yolo12s.pt in the weights/ directory.",
                settings.model_path,
            )
            return None
        except Exception:
            logger.exception("Model load failed")
            return None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def detect(self, image: np.ndarray) -> list[dict[str, Any]]:
        if self.model is None:
            return []

        results = self.model(image, imgsz=settings.input_size, verbose=False)[0]
        detections: list[dict[str, Any]] = []

        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id not in settings.target_class_ids:
                continue

            name: str = results.names.get(class_id, f"class_{class_id}")
            threshold = (
                settings.low_confidence_threshold
                if name in settings.low_threshold_classes
                else settings.confidence_threshold
            )
            if confidence <= threshold:
                continue

            coords: list[float] = box.xyxy[0].tolist()
            detections.append({"name": name, "confidence": round(confidence, 4), "box": coords})

        return detections

    def analyze_scene(self, detections: list[dict[str, Any]], img_width: int, img_height: int) -> str:
        if not detections:
            return "Path is clear."

        def _sort_key(d: dict[str, Any]) -> tuple[int, float]:
            # Primary: danger level (high first). Secondary: proximity (closer first).
            return (-_DANGER_LEVEL.get(d["name"], 0), -_proximity_score(d["box"], img_height))

        top = sorted(detections, key=_sort_key)[:3]

        def _distance(box: list[float]) -> str:
            box_h = box[3] - box[1]
            bottom = box[3] / img_height
            if box_h > img_height * 0.5 or bottom > 0.85:
                return "very close"
            if box_h > img_height * 0.25 or bottom > 0.6:
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
            phrases.append(
                f"{det['name']} {_position((x1 + x2) / 2)}, {_distance(det['box'])}"
            )

        return ". ".join(phrases) + "."


def decode_image(image_b64: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as exc:
        raise ValueError(f"Invalid base64 image data: {exc}") from exc

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Ensure it is a valid JPEG or PNG.")
    return img


# Module-level singleton — loaded once at startup
detector = ObjectDetector()
