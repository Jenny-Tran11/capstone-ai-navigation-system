"""
Fine-tune YOLO12n on the Roboflow visually-impaired dataset (30 classes).
Produces best.pt and evaluates mAP@0.5 on the test split.
"""
from pathlib import Path

import torch
from ultralytics import YOLO

# Absolute path to data.yaml so training works regardless of cwd
DATA_YAML = (
    Path(__file__).resolve().parent
    / "img"
    / "Visually impaired dataset.v2i.yolov12"
    / "data.yaml"
)


def train():
    if not DATA_YAML.exists():
        raise FileNotFoundError(f"Dataset config not found: {DATA_YAML}")

    device = 0 if torch.cuda.is_available() else "cpu"
    model = YOLO("yolo12n.pt")
    model.train(
        data=str(DATA_YAML),
        epochs=100,
        imgsz=640,
        batch=16,
        device=device,
        patience=10,
        project="runs/train",
        name="blind-nav",
    )

    # Evaluate on test split
    metrics = model.val(data=str(DATA_YAML), split="test")
    print(f"\n--- Test split evaluation ---")
    print(f"mAP@0.5:    {metrics.box.map50:.4f}")
    print(f"mAP@0.5:95: {metrics.box.map:.4f}")
    print(f"Precision:  {metrics.box.mp:.4f}")
    print(f"Recall:     {metrics.box.mr:.4f}")
    best_weights = Path(model.trainer.best)
    print(f"Best weights: {best_weights.resolve()}")


if __name__ == "__main__":
    train()
