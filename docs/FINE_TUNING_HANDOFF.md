# Fine-tuning handoff — visually impaired YOLO (30 classes)

This document summarizes custom YOLO fine-tuning runs and how to load weights locally or in another repo.

## Model artifacts (`models/yolo/`)

| File | Description |
|------|-------------|
| **`best.pt`** | First fine-tuned run (Kaggle / original export). ~5.5 MiB, tracked on `local-model`. |
| **`bestv2.pt`** | Second run after **label cleanup** (see below). Place Kaggle output here and commit if the team tracks it in Git. |
| **`yolo12n.pt`** | Pretrained baseline (Ultralytics). Use for stable `person` detection vs early fine-tuned weights. |

Default desktop load: `MODEL_FILE` in `apps/python-desktop/config.py` (env var, default `best.pt`). Examples:

```bash
cd apps/python-desktop
MODEL_FILE=bestv2.pt python main.py   # second fine-tune
MODEL_FILE=yolo12n.pt python main.py # baseline
```

## Training data and exports

### Original reference (Roboflow Universe v2)

- **Source:** [visually-impaired-dataset / version 2](https://universe.roboflow.com/all-mix/visually-impaired-dataset/dataset/2)
- **Classes (`nc`):** 30  
- **Class names:** Must match `data.yaml` order (see `apps/python-desktop/config.py` / `backend/config.py` `CLASS_NAMES`).

### Forked export + local cleanup (v1-style folder name)

- Local folder: `img/Visually impaired dataset.v1-visually-impaired-dataset-iooiwv3.yolov12/`
- **Issue:** Some label lines were not valid YOLO detection rows (not exactly 5 fields: class + xywh normalized).
- **Fix applied locally:** polygon-like lines were converted to axis-aligned bounding boxes; invalid rows dropped. After cleanup: **0 malformed lines** over all splits.
- **`data.yaml` paths:** Set to `train/images`, `valid/images`, `test/images` (same folder as `data.yaml`).

Training scripts resolve `data.yaml` in this order:

1. `img/Visually impaired dataset.v1-visually-impaired-dataset-iooiwv3.yolov12/data.yaml`  
2. then legacy `img/Visually impaired dataset.v2i.yolov12/data.yaml`  
3. then `apps/python-desktop/img/...` fallback  

(`apps/python-desktop/train.py` and `backend/train.py`.)

## How training was run

### Run 1 — `best.pt`

- **Where:** Kaggle GPU, Internet on for installs / weights.  
- **Data:** Original-style export (issues above present before local fix in later iteration).  
- **Output:** `best.pt` (repo: `models/yolo/best.pt`).  
- **Qualitative result:** `person` often confused with `Dog` (close range) and `Motorcycle` (farther range); baseline `yolo12n.pt` behaved more stably for `person`.

### Run 2 — `bestv2.pt` (retrain after label cleanup)

- **Where:** Kaggle (same pattern as run 1).  
- **Data:** Cleaned labels under `Visually impaired dataset.v1-visually-impaired-dataset-iooiwv3.yolov12` (or equivalent ZIP uploaded as a Kaggle Dataset, e.g. `visually-impaired-dataset-v3`).  
- **Typical notebook pattern:** `YOLO("yolo12n.pt").train(data=<path-to-data.yaml>, epochs=..., imgsz=640, batch=16, device=0, project="/kaggle/working/runs/train", name="blind-nav-clean-v1", ...)` then copy `weights/best.pt` → `bestv2.pt` for download.  
- **Qualitative result:** Slight improvement vs `best.pt`; **close-range `person` → `Dog` still frequent**; distance-related `person` ↔ `motorcycle` confusion can still occur (dataset bias: full-body `person` vs face-heavy `dog`, riders in `motorcycle` images).

Sidewalk segmentation fine-tuning is documented separately in:

- `docs/SIDEWALK_SEGMENTATION_HANDOFF.md`

Paste/append any future rerun metrics from Kaggle `results.csv` here when finalizing object-detection runs:

- **mAP@0.5 (val):** _[optional]_  
- **mAP@0.5:0.95 (val):** _[optional]_  

## Using weights in another repository

1. Copy `best.pt`, `bestv2.pt`, and/or `yolo12n.pt` as needed.  
2. Load with Ultralytics:

   ```python
   from ultralytics import YOLO
   model = YOLO("bestv2.pt")
   results = model(image, imgsz=640, verbose=False)
   ```

3. **Class IDs:** 0–29 follow `data.yaml` `names` order.  
4. **Confidence threshold:** Tune in product `config` (desktop default `0.4`).

## Quick model test steps (teammates)

1. Checkout **`local-model`**, pull.  
2. Ensure `models/yolo/` contains the weight to test (`best.pt`, `bestv2.pt`, `yolo12n.pt`).  
3. `cd apps/python-desktop`, venv, `pip install -r requirements.txt`.  
4. Run:

   ```bash
   MODEL_FILE=bestv2.pt python main.py
   ```

5. Compare with `MODEL_FILE=yolo12n.pt` on the same webcam or `--video` path.

### What to record

- Which file (`best.pt` / `bestv2.pt` / `yolo12n.pt`)  
- Webcam vs video path  
- `person` vs `Dog` / `Motorcycle` confusion notes  
- FPS and any errors  

## Known limitations

- **Class confusion after fine-tuning:** Even with cleaned YOLO lines, **distribution mismatch** (e.g. full-body `person` vs close-up `dog`, motorcycle + rider) can dominate over label-format fixes.  
- **Person instance share:** Roughly ~7–8% of label instances were `person` in the audited export; increasing representative `person` samples (including face / webcam distance) is the main lever for the next iteration.  
- **TTS:** `vision_service.py` shortens Roboflow-style names for speech; other clients may apply their own display rules.

## Malformed-label audit helper

- Report CSV (pre-cleanup reference): `docs/malformed_labels_report.csv`  
- Re-run audit after any new export if needed.

## Branch policy

- Fine-tuning docs and weights land on **`local-model`** unless the team merges elsewhere. **`main`** is not the default target for this work.

## Contact

- **Fine-tuning owner:** _[add name / Slack handle]_  
- Cloud/mobile integration: coordinate with owners of Lambda / app repos in parallel.
