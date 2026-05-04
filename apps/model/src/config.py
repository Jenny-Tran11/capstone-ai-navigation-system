from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Upgraded from nano (yolo12n) to small (yolo12s) — ~2x better mAP, still VPS-viable
    model_path: str = "./weights/yolo12s.pt"
    confidence_threshold: float = 0.4
    # Ground-level hazards are often small; lower threshold catches more of them
    low_threshold_classes: set[str] = {"Pothole", "Step", "Stones", "Stairs"}
    low_confidence_threshold: float = 0.25
    # YOLO internal resize — 416 is faster than 640 with minimal accuracy loss on this task
    input_size: int = 416
    # If empty, auth middleware is skipped — intended for local dev only
    api_key: str = ""
    host: str = "0.0.0.0"
    port: int = 8080

    target_class_ids: list[int] = list(range(30))
    class_names: list[str] = [
        "Dog", "Door", "Table", "Auto", "Barrier", "Bench", "Bicycle",
        "Bus", "Car", "Cattle", "Chair", "Dustbin", "Electric pole",
        "Footpath", "Fridge", "Gate", "Motorcycle", "Pothole", "Person",
        "Pillar", "Plant", "Sign board", "Stairs", "Step", "Stones",
        "Traffic signal", "Tree", "Truck", "Wash basin", "Zebra crossing",
    ]

    @field_validator("confidence_threshold", "low_confidence_threshold")
    @classmethod
    def validate_threshold(cls, v: float) -> float:
        if not 0.0 < v < 1.0:
            raise ValueError("threshold must be between 0 and 1 (exclusive)")
        return v


settings = Settings()
