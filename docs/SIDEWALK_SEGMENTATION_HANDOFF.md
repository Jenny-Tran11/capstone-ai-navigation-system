# Sidewalk Segmentation Handoff

This document tracks the sidewalk-only YOLO segmentation training flow and results.

## Artifact

| File | Description |
|------|-------------|
| `models/yolo/sidewalk-seg.pt` | Sidewalk segmentation weights copied from Kaggle run output (`best.pt`). |

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

## Kaggle run summary (completed)

- Run path: `/kaggle/working/runs/train/sidewalk-seg-v1/`
- Weight output: `/kaggle/working/runs/train/sidewalk-seg-v1/weights/best.pt`
- Local target file: `models/yolo/sidewalk-seg.pt`

### Metrics (`results_dict`)

- Mask mAP@0.5 (`metrics/mAP50(M)`): **0.8527**
- Mask mAP@0.5:0.95 (`metrics/mAP50-95(M)`): **0.7193**
- Box mAP@0.5 (`metrics/mAP50(B)`): **0.8592**
- Box mAP@0.5:0.95 (`metrics/mAP50-95(B)`): **0.7546**

## Post-training steps

1. Download `best.pt` from Kaggle output.
2. Rename/copy to `models/yolo/sidewalk-seg.pt`.
3. Run desktop app (`apps/python-desktop/main.py`) to verify mask overlay appears.

## Notes for future reruns

- Save `results.csv` and append metrics here for comparison across runs.
- Keep this document focused on sidewalk segmentation only.
