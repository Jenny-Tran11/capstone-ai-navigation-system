#!/usr/bin/env python3
"""
Fine-tune the AI-Detect obstacle detection model on a custom dataset.

Quickstart:
    1. Export your dataset from Roboflow:
       Format → YOLOv8 → "show download code" → copy the YAML path
    2. Run:
       python scripts/train.py --data /path/to/dataset.yaml

    Trained weights land in weights/best.pt (best mAP) and weights/last.pt.
    Update MODEL_PATH in .env to weights/best.pt to use the fine-tuned model.

All flags:
    --data      Path to dataset YAML  (required)
    --base      Starting weights      (default: yolov12s.pt)
    --epochs    Training epochs       (default: 50)
    --imgsz     Input image size      (default: 416)
    --batch     Batch size            (default: 8, reduce if OOM)
    --device    '' auto | 'cpu' | '0' GPU | 'mps' Apple Silicon
    --project   Output dir            (default: runs/train)
    --name      Run name              (default: ai-detect)
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Fine-tune AI-Detect YOLO model")
    p.add_argument("--data", required=True, help="Path to dataset YAML")
    p.add_argument("--base", default="yolov12s.pt", help="Base weights to start from")
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--imgsz", type=int, default=416)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--device", default="", help="'' auto-detect, 'cpu', '0' GPU, 'mps' Apple Silicon")
    p.add_argument("--project", default="runs/train")
    p.add_argument("--name", default="ai-detect")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    data_path = Path(args.data).resolve()
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset YAML not found: {data_path}")

    print(f"Base model  : {args.base}")
    print(f"Dataset     : {data_path}")
    print(f"Epochs      : {args.epochs}")
    print(f"Image size  : {args.imgsz}")
    print(f"Batch size  : {args.batch}")
    print(f"Device      : {args.device or 'auto'}")
    print()

    from ultralytics import YOLO  # deferred: heavy import

    model = YOLO(args.base)
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device or None,
        project=args.project,
        name=args.name,
        save=True,
        save_period=-1,  # only save best + last, not every N epochs
        # Augmentation tuned for outdoor footpath / urban navigation footage:
        flipud=0.0,    # no vertical flip — gravity direction must stay consistent
        fliplr=0.5,    # horizontal flip is fine (left/right obstacles)
        mosaic=1.0,    # mosaic helps with small-object detection
        degrees=5.0,   # mild rotation simulates camera tilt
        translate=0.1,
        scale=0.3,
        hsv_h=0.015,   # colour shift for lighting variation
        hsv_s=0.5,
        hsv_v=0.3,
    )

    # Copy best/last weights to weights/ for easy deployment
    weights_dir = Path(__file__).parent.parent / "weights"
    weights_dir.mkdir(exist_ok=True)
    run_dir = Path(args.project) / args.name

    for fname in ("best.pt", "last.pt"):
        src = run_dir / "weights" / fname
        if src.exists():
            shutil.copy(src, weights_dir / fname)
            print(f"Saved → weights/{fname}")

    # Print final metrics
    if results and hasattr(results, "results_dict"):
        m = results.results_dict
        print("\nFinal metrics:")
        print(f"  mAP50    : {m.get('metrics/mAP50(B)', 'n/a'):.4f}")
        print(f"  mAP50-95 : {m.get('metrics/mAP50-95(B)', 'n/a'):.4f}")
        print(f"  Precision: {m.get('metrics/precision(B)', 'n/a'):.4f}")
        print(f"  Recall   : {m.get('metrics/recall(B)', 'n/a'):.4f}")

    print("\nDone. Set MODEL_PATH=./weights/best.pt in .env to deploy the fine-tuned model.")


if __name__ == "__main__":
    main()
