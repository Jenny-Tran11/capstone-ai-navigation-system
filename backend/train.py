"""
Fine-tune YOLO12n on the Roboflow visually-impaired dataset (30 classes).
Produces best.pt and evaluates mAP@0.5 on the test split.
"""
from pathlib import Path

import torch
from ultralytics import YOLO

# Absolute path to data.yaml (prefer latest cleaned export under repo-root `img/`).
_ROOT = Path(__file__).resolve().parent.parent
_CANDIDATE_DATA_YAMLS = [
    _ROOT / "img" / "Visually impaired dataset.v1-visually-impaired-dataset-iooiwv3.yolov12" / "data.yaml",
    _ROOT / "img" / "Visually impaired dataset.v2i.yolov12" / "data.yaml",
    Path(__file__).resolve().parent / "img" / "Visually impaired dataset.v2i.yolov12" / "data.yaml",
]
DATA_YAML = next((p for p in _CANDIDATE_DATA_YAMLS if p.exists()), _CANDIDATE_DATA_YAMLS[0])


def train():
    if not DATA_YAML.exists():
        raise FileNotFoundError(f"Dataset config not found: {DATA_YAML}")

    device = 0 if torch.cuda.is_available() else "cpu"
    # Prefer local file if present; otherwise Ultralytics downloads yolo12n.pt.
    _here = Path(__file__).resolve().parent
    for candidate in ("yolov12n.pt", "yolo12n.pt"):
        p = _here / candidate
        if p.exists():
            model = YOLO(str(p))
            break
    else:
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
