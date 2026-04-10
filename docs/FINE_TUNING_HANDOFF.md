# Fine-tuning handoff — visually impaired YOLO (30 classes)

This document summarizes the custom YOLO fine-tuning run so cloud and mobile teammates can load the same weights without digging through chat history.

## Artifact in this repo

| Item | Location |
|------|----------|
| **Fine-tuned weights** | `models/yolo/best.pt` (~5.5 MiB, tracked in Git on `local-model`) |
| **Dataset config (reference)** | `img/Visually impaired dataset.v2i.yolov12/data.yaml` (images/labels stay local; see `.gitignore`) |

## Training data

- **Source:** Roboflow — [visually-impaired-dataset / version 2](https://universe.roboflow.com/all-mix/visually-impaired-dataset/dataset/2)
- **Workspace / project:** `all-mix` / `visually-impaired-dataset`
- **Classes (`nc`):** 30  
- **Class names:** See `data.yaml` `names:` (must stay in this order for class IDs 0–29). Application configs mirror this list in `apps/python-desktop/config.py` and `backend/config.py` under `CLASS_NAMES`.

## Base model and framework

- **Base weights:** `yolo12n.pt` (YOLO12 nano, Ultralytics)
- **Recommended inference stack:** `ultralytics==8.4.21` (see `apps/python-desktop/requirements.txt`; align versions in other repos when possible)
- **Training image size:** `imgsz=640` (match at inference unless you knowingly change preprocessing)

## How training was run (reference)

- **Environment:** Kaggle Notebook, GPU accelerator, Internet enabled (for `pip install` / weight download).
- **Run name / output layout (Kaggle):** `runs/train/blind-nav/` → `weights/best.pt`
- **Typical train call (minimal):** `YOLO("yolo12n.pt").train(data=<path-to-data.yaml>, epochs=50, imgsz=640, batch=16, device=0, ...)`
- **Local alternative:** `python apps/python-desktop/train.py` or `python backend/train.py` (both resolve `data.yaml` under repo-root `img/` or legacy `*/img/` paths).

Fill in final metrics from your Kaggle `results.csv` or notebook logs here if needed:

- **Best epoch / mAP@0.5 (val):** _[optional — paste from training]_
- **mAP@0.5:0.95 (val):** _[optional]_

## Using `best.pt` in another repository

1. Copy `models/yolo/best.pt` (or submodule / release artifact) into the target project.
2. Load with Ultralytics, for example:

   ```python
   from ultralytics import YOLO
   model = YOLO("best.pt")
   results = model(image, imgsz=640, verbose=False)
   ```

3. **Class IDs:** 0–29 map to the same order as `names` in `data.yaml` (and `CLASS_NAMES` in this repo’s configs).
4. **Confidence threshold:** Tune per product (this repo’s desktop demo uses `CONFIDENCE_THRESHOLD` in `config.py`; default `0.4`).

## Quick model test steps (for teammates)

Use this if you want to quickly sanity-check `best.pt` locally before cloud integration.

1. **Get latest branch**
   - Checkout `local-model` and pull latest changes.
   - Confirm these files exist:
     - `models/yolo/best.pt`
     - `apps/python-desktop/main.py`
     - `apps/python-desktop/config.py`

2. **Set up Python env**
   ```bash
   cd apps/python-desktop
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -U pip
   pip install -r requirements.txt
   ```

3. **Run with fine-tuned model (`best.pt`)**
   ```bash
   cd apps/python-desktop
   python main.py
   ```
   - Expected startup line includes `models/yolo/best.pt`.
   - Press `q` (or `Esc`) to exit.

4. **Optional baseline comparison (`yolo12n.pt`)**
   - Put baseline weights at `models/yolo/yolo12n.pt` (if not already present).
   - Run:
   ```bash
   cd apps/python-desktop
   MODEL_FILE=yolo12n.pt python main.py
   ```
   - Compare behavior vs `best.pt` on the same camera scene/video.

5. **Optional video-file test (repeatable)**
   ```bash
   cd apps/python-desktop
   python main.py --video /absolute/path/to/test_video.mp4
   ```
   - Use the same file for both models to compare outputs fairly.

### What to record when testing

- Which model was used (`best.pt` or `yolo12n.pt`)
- Test source (webcam or video filename)
- Notable false positives/false negatives (especially `person` vs `Dog`)
- Approximate FPS shown in the app
- Any startup/runtime errors

## Known limitations (sanity expectations)

- **Dataset-driven class confusion:** Fine-tuned `best.pt` may misclassify people as class 0 (`"Dog ahead at"`) even in outdoor checks. This points to dataset composition/label quality and class imbalance rather than runtime environment.
- **Person coverage is relatively low:** Current labels contain `person ahead at` in about 7-8% of all instances (train: 491/6376, val: 94/1258, test: 49/704). Follow-up training should increase representative person samples and re-check per-class metrics.
- **TTS wording:** Desktop app shortens Roboflow-style labels (e.g. `"Dog ahead at"`) for speech in `vision_service.py`; other clients should apply their own UX rules.

## Branch policy (team agreement)

- Fine-tuning and related doc updates land on **`local-model`** unless the team decides otherwise. **`main` is not the default target** for this work unless explicitly reviewed and merged.

## Contact

- **Fine-tuning owner:** _[add name / Slack handle]_  
- For integration questions (Lambda, mobile API), coordinate with cloud/app owners in parallel.
