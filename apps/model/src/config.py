from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    model_path: str = "./weights/yolo12n.pt"
    confidence_threshold: float = 0.4
    # If empty, auth middleware is skipped — intended for local dev only
    api_key: str = ""
    host: str = "0.0.0.0"
    port: int = 8080

    target_class_ids: list[int] = list(range(30))
    # Display names for the 30 urban-obstacle classes from the fine-tuned dataset.
    # Index must match target_class_ids.
    class_names: list[str] = [
        "Dog", "Door", "Table", "Auto", "Barrier", "Bench", "Bicycle",
        "Bus", "Car", "Cattle", "Chair", "Dustbin", "Electric pole",
        "Footpath", "Fridge", "Gate", "Motorcycle", "Pothole", "Person",
        "Pillar", "Plant", "Sign board", "Stairs", "Step", "Stones",
        "Traffic signal", "Tree", "Truck", "Wash basin", "Zebra crossing",
    ]

    @field_validator("confidence_threshold")
    @classmethod
    def validate_threshold(cls, v: float) -> float:
        if not 0.0 < v < 1.0:
            raise ValueError("confidence_threshold must be between 0 and 1 (exclusive)")
        return v


settings = Settings()
