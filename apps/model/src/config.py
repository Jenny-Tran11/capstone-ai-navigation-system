from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    model_path: str = "./weights/yolo12n.pt"
    confidence_threshold: float = 0.4
    api_key: str = ""  # If empty, auth is skipped (local dev)
    host: str = "0.0.0.0"
    port: int = 8080

    # 30 urban obstacle classes from the fine-tuned YOLOv12 dataset
    target_class_ids: list[int] = list(range(30))
    class_names: list[str] = [
        "Dog", "Door", "Table", "Auto", "Barrier", "Bench", "Bicycle",
        "Bus", "Car", "Cattle", "Chair", "Dustbin", "Electric pole",
        "Footpath", "Fridge", "Gate", "Motorcycle", "Pothole", "Person",
        "Pillar", "Plant", "Sign board", "Stairs", "Step", "Stones",
        "Traffic signal", "Tree", "Truck", "Wash basin", "Zebra crossing",
    ]


settings = Settings()
