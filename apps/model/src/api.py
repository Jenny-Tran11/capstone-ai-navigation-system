from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from .config import settings
from .schemas import DetectRequest, DetectResponse, Detection, HealthResponse
from .vision_service import decode_image, detector

app = FastAPI(title="AI-Detect model service", version="1.0.0")


@app.exception_handler(ValueError)
async def value_error_handler(_request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


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

    # decode_image raises ValueError on bad input → caught by exception_handler → 400
    img = decode_image(body.image_base64)
    height, width = img.shape[:2]
    raw_detections = detector.detect(img)
    description = detector.analyze_scene(raw_detections, width, height)

    detections = [
        Detection(name=d["name"], confidence=d["confidence"], box=d["box"])
        for d in raw_detections
    ]

    return DetectResponse(detections=detections, scene_description=description)
