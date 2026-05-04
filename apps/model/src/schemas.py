from pydantic import BaseModel


class DetectRequest(BaseModel):
    image_base64: str


class Detection(BaseModel):
    name: str
    confidence: float
    box: list[float]  # [x1, y1, x2, y2]


class DetectResponse(BaseModel):
    detections: list[Detection]
    scene_description: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
