"""
Train YOLO segmentation on the sidewalk dataset (polygon labels in YOLO seg format).

Default data roots (first existing wins):
  <repo>/img/sidewalk.v1i.yolov12/data.yaml
  <this-app>/img/sidewalk-dataset/data.yaml
"""
from __future__ import annotations

import argparse
from pathlib import Path

import torch
from ultralytics import YOLO

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent

_CANDIDATE_DATA_YAMLS = [
    _ROOT / "img" / "sidewalk.v1i.yolov12" / "data.yaml",
    _HERE / "img" / "sidewalk-dataset" / "data.yaml",
]


def _resolve_data_yaml() -> Path:
    for p in _CANDIDATE_DATA_YAMLS:
        if p.exists():
            return p
    return _CANDIDATE_DATA_YAMLS[0]


def _default_device(cli_device: str | None) -> str | int:
    if cli_device is not None:
        return cli_device
    return 0 if torch.cuda.is_available() else "cpu"


def main() -> None:
    parser = argparse.ArgumentParser(description="Train sidewalk YOLO segmentation.")
    parser.add_argument(
        "--fast",
        action="store_true",
        help="60 epochs, imgsz 512 (quick iteration).",
    )
    parser.add_argument(
        "--device",
        default=None,
        help='Torch device, e.g. "0", "cpu". Default: GPU 0 if available else cpu.',
    )
    parser.add_argument(
        "--no-export",
        action="store_true",
        help="Skip ONNX export after training.",
    )
    parser.add_argument(
        "--base",
        default="yolov8n-seg.pt",
        help="Ultralytics segmentation checkpoint (downloaded on first use).",
    )
    args = parser.parse_args()

    data_yaml = _resolve_data_yaml()
    if not data_yaml.exists():
        raise FileNotFoundError(
            f"Dataset config not found. Expected one of:\n"
            + "\n".join(f"  - {p}" for p in _CANDIDATE_DATA_YAMLS),
        )

    epochs = 60 if args.fast else 150
    imgsz = 512 if args.fast else 640
    device = _default_device(args.device)
    if device == "cpu":
        batch = 2 if args.fast else 4
    elif args.fast:
        batch = 8
    else:
        batch = 16

    model = YOLO(args.base)
    model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        patience=15,
        project="runs/train",
        name="sidewalk-seg-v1",
        task="segment",
    )

    best_weights = Path(model.trainer.best)
    print(f"\nBest weights saved to: {best_weights.resolve()}")
    dest = _ROOT / "models" / "yolo" / "sidewalk-seg.pt"
    print(
        "Copy to models folder:\n"
        f"  cp {best_weights} {dest}\n"
        "Then set SIDEWALK_MODEL_FILE=sidewalk-seg.pt (default) or update config.\n"
        "Check the training summary above for Mask mAP@0.5 / Mask mAP@0.5:0.95 / Box mAP."
    )

    if not args.no_export:
        export_m = YOLO(str(best_weights))
        export_m.export(format="onnx", imgsz=imgsz, simplify=True)
        print("ONNX export written next to weights (see Ultralytics log).")


if __name__ == "__main__":
    main()
