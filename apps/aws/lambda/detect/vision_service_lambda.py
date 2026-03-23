import os
from typing import List, Dict, Any

import boto3
import cv2
import numpy as np
from botocore.exceptions import BotoCoreError, ClientError
from ultralytics import YOLO

import config_lambda as config


class ObjectDetector:
    def __init__(self) -> None:
        self.model = self._load_model()

    def _ensure_local_model(self, path: str) -> str:
        """
        Ensure the model file exists locally. If not, try to download from S3
        using MODEL_BUCKET and MODEL_KEY.
        """
        if os.path.exists(path):
            return path

        bucket = config.MODEL_BUCKET
        key = config.MODEL_KEY
        if not bucket or not key:
            raise FileNotFoundError(f"Model not found at {path} and no S3 fallback configured.")

        os.makedirs(os.path.dirname(path), exist_ok=True)
        s3 = boto3.client("s3")

        try:
            s3.download_file(bucket, key, path)
        except (BotoCoreError, ClientError) as e:
            raise FileNotFoundError(f"Failed to download model from s3://{bucket}/{key}: {e}") from e

        return path

    def _load_model(self):
        local_path = self._ensure_local_model(config.MODEL_PATH)
        try:
            return YOLO(local_path)
        except Exception as e:
            # In Lambda we want a clear error for logs
            print(f"Model load failed: {e}")
            return None

    def detect(self, image) -> List[Dict[str, Any]]:
        """
        Runs inference on the image and returns a list of valid detections.
        The image should be a numpy array in BGR format (as used by OpenCV).
        """
        if self.model is None:
            return []

        results = self.model(image, verbose=False)[0]
        valid_detections: List[Dict[str, Any]] = []

        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id in config.TARGET_CLASS_IDS and confidence > config.CONFIDENCE_THRESHOLD:
                coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                name = results.names[class_id]

                valid_detections.append(
                    {
                        "name": name,
                        "confidence": confidence,
                        "box": coords,
                    }
                )

        return valid_detections

    def analyze_scene(self, detections: List[Dict[str, Any]], img_width: int, img_height: int) -> str:
        """
        Converts detection data into a natural language string.
        Mirrors the logic from the local vision_service.py.
        """
        if not detections:
            return "Path is clear."

        detections.sort(key=lambda x: (x["box"][3] - x["box"][1]), reverse=True)
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
            name = det["name"]
            x1, y1, x2, y2 = det["box"]
            box_h = y2 - y1
            center_x = (x1 + x2) / 2.0

            dist = _distance_bucket(box_h, img_height)
            pos = _position_bucket(center_x, img_width)

            phrases.append(f"{name} {pos}, {dist}")

        if not phrases:
            return "Path is clear."

        message = ". ".join(phrases) + "."
        return message


def decode_image_from_base64(image_b64: str):
    """
    Decode a base64-encoded image into a BGR numpy array compatible with OpenCV.
    """
    import base64

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as e:
        raise ValueError(f"Failed to base64-decode image: {e}") from e

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes into an image.")
    return img

