from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException

from .config import settings
from .schemas import DetectRequest, DetectResponse, HealthResponse
from .vision_service import decode_image, detector

app = FastAPI(title="AI-Detect model service", version="1.0.0")


def _check_api_key(x_api_key: str | None) -> None:
    """Skip auth when API_KEY env var is not set (local dev)."""
    if not settings.api_key:
        return
    if (x_api_key or "").strip() != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=detector.is_loaded)


@app.post("/detect", response_model=DetectResponse)
def detect(
    body: DetectRequest,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> DetectResponse:
    _check_api_key(x_api_key)

    if not detector.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    img = decode_image(body.image_base64)
    height, width = img.shape[:2]
    detections = detector.detect(img)
    description = detector.analyze_scene(detections, width, height)

    return DetectResponse(
        detections=detections,  # type: ignore[arg-type]
        scene_description=description,
    )
