# Sidewalk Segmentation Handoff

This document tracks the sidewalk-only YOLO segmentation training flow and results.

## Artifact

| File | Description |
|------|-------------|
| `models/yolo/sidewalk-seg.pt` | Final selected sidewalk segmentation weights (full profile, 150/640) used by default in desktop runtime. |
| `models/yolo/sidewalk-seg-fast.pt` | Baseline sidewalk weights from fast profile (60/512), kept for comparison. |

## Dataset

- Primary local folder: `img/sidewalk.v1i.yolov12/`
- Alternative local folder: `apps/python-desktop/img/sidewalk-dataset/`
- Label format requirement: YOLO segmentation polygon rows
  - Example: `0 0.45 0.60 0.50 0.55 0.60 0.70 ...`
- `data.yaml` should point to local split folders:
  - `train: train/images`
  - `val: valid/images`
  - `test: test/images`

## Training entrypoint

- Script: `apps/python-desktop/train_sidewalk.py`
- Profiles:
  - Fast: `python train_sidewalk.py --fast`
  - Full: `python train_sidewalk.py`
  - CPU test: `python train_sidewalk.py --fast --device cpu`
  - Skip ONNX export: `python train_sidewalk.py --fast --no-export`

Notes:

- The script supports `--base` for choosing the segmentation checkpoint.
- The script normalizes Roboflow-style `../train/images` paths in `data.yaml` when needed.

## GPU run summary (completed)

### Run A — Fast profile (baseline)

- Profile: `epochs=60`, `imgsz=512`
- Local file: `models/yolo/sidewalk-seg-fast.pt`
- Metrics (`results_dict`):
  - Mask mAP@0.5 (`metrics/mAP50(M)`): **0.8527**
  - Mask mAP@0.5:0.95 (`metrics/mAP50-95(M)`): **0.7193**
  - Box mAP@0.5 (`metrics/mAP50(B)`): **0.8592**
  - Box mAP@0.5:0.95 (`metrics/mAP50-95(B)`): **0.7546**

### Run B — Full profile (current final)

- Profile: `epochs=150`, `imgsz=640`
- Local target file: `models/yolo/sidewalk-seg.pt`
- Metrics (`results_dict`):
  - Mask mAP@0.5 (`metrics/mAP50(M)`): **0.8561**
  - Mask mAP@0.5:0.95 (`metrics/mAP50-95(M)`): **0.7258**
  - Box mAP@0.5 (`metrics/mAP50(B)`): **0.8616**
  - Box mAP@0.5:0.95 (`metrics/mAP50-95(B)`): **0.7672**

## Post-training steps

1. Obtain the trained `best.pt` file from the training run output.
2. For final model, rename/copy it to `models/yolo/sidewalk-seg.pt`.
3. Optionally keep the fast baseline as `models/yolo/sidewalk-seg-fast.pt`.
4. Run desktop app (`apps/python-desktop/main.py`) to verify mask overlay appears.

## Notes for future reruns

- Save `results.csv` and append metrics here for comparison across runs.
- Keep this document focused on sidewalk segmentation only.
