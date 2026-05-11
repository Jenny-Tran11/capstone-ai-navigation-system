#!/usr/bin/env python3
"""Download pretrained YOLOv12s weights into the weights/ directory.

Run once before starting the service:
    python scripts/download_weights.py
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

WEIGHTS_FILENAME = "yolov12s.pt"

dest = Path(__file__).parent.parent / "weights" / WEIGHTS_FILENAME
dest.parent.mkdir(exist_ok=True)

if dest.exists():
    print(f"Already present: {dest}")
    raise SystemExit(0)

# ultralytics downloads to CWD on first YOLO() call; cd to weights/ so the
# file lands there directly without a copy step.
os.chdir(dest.parent)

from ultralytics import YOLO  # noqa: E402

YOLO(WEIGHTS_FILENAME)

if dest.exists():
    print(f"Saved → {dest}")
else:
    # Ultralytics may have placed it in its own cache; do a best-effort search.
    candidates = [
        Path.home() / ".config" / "Ultralytics" / WEIGHTS_FILENAME,
        Path.home() / WEIGHTS_FILENAME,
    ]
    for candidate in candidates:
        if candidate.exists():
            shutil.copy(candidate, dest)
            print(f"Copied {candidate} → {dest}")
            raise SystemExit(0)
    print(f"Could not locate downloaded weights. Copy {WEIGHTS_FILENAME} manually to {dest}")
    raise SystemExit(1)
