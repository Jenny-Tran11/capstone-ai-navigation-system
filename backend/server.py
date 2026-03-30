"""
HTTP API for vision inference (Docker / EC2). Contract matches Lambda handler POST /detect.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Any, Dict

import cv2
import numpy as np
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

import config

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("vision_server")


def _ensure_local_model(path: str) -> None:
    if os.path.exists(path):
        return
    bucket = config.MODEL_BUCKET
    key = config.MODEL_KEY
    if not bucket or not key:
        return
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    try:
        import boto3
    except ImportError as e:  # pragma: no cover
        raise FileNotFoundError(
            f"Model not found at {path} and boto3 is not installed for S3 download."
        ) from e
    s3 = boto3.client("s3")
    try:
        s3.download_file(bucket, key, path)
        logger.info(
            json.dumps(
                {
                    "msg": "model_downloaded_s3",
                    "bucket": bucket,
                    "key": key,
                    "path": path,
                }
            )
        )
    except (BotoCoreError, ClientError) as e:
        raise FileNotFoundError(
            f"Failed to download model from s3://{bucket}/{key}: {e}"
        ) from e


def _decode_image_from_base64(image_b64: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as e:
        raise ValueError(f"Failed to base64-decode image: {e}") from e
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes into an image.")
    return img


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ensure_local_model(config.MODEL_PATH)
    from vision_service import ObjectDetector

    detector = ObjectDetector()
    app.state.detector = detector
    loaded = detector.model is not None
    logger.info(
        json.dumps(
            {
                "msg": "model_load_complete",
                "model_path": config.MODEL_PATH,
                "model_loaded": loaded,
            }
        )
    )
    yield
    app.state.detector = None


app = FastAPI(title="Vision Service", lifespan=lifespan)


class DetectRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image bytes")


def _get_detector(request: Request):
    detector = getattr(request.app.state, "detector", None)
    if detector is None:
        raise HTTPException(status_code=503, detail="Detector not initialized.")
    return detector


@app.get("/health")
def health(request: Request) -> Dict[str, Any]:
    detector = getattr(request.app.state, "detector", None)
    model_loaded = bool(detector and detector.model is not None)
    return {"status": "ok", "model_loaded": model_loaded}


@app.post("/detect")
def detect(payload: DetectRequest, request: Request) -> Dict[str, Any]:
    detector = _get_detector(request)
    if detector.model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")

    t0 = time.perf_counter()
    try:
        img = _decode_image_from_base64(payload.image_base64)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    height, width = img.shape[:2]
    detections = detector.detect(img)
    description = detector.analyze_scene(detections, width, height)
    inference_ms = (time.perf_counter() - t0) * 1000.0

    logger.info(
        json.dumps(
            {
                "msg": "inference_complete",
                "inference_ms": round(inference_ms, 2),
                "detection_count": len(detections),
            }
        )
    )

    return {
        "detections": detections,
        "scene_description": description,
    }
