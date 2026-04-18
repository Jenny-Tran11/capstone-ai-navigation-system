# Python desktop prototype

Local Tkinter + YOLO + TTS navigation prototype.

## Setup

From this directory:

```bash
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Place your YOLO weights as `yolo12n.pt` in **this directory** (same folder as `config.py`), or update `MODEL_PATH` in `config.py`.

## Run

```bash
python main.py
```

## Train

Dataset lives in `img/Visually impaired dataset.v2i.yolov12/` (see `data.yaml` inside that export).

**The `img/` folder is gitignored** (large files + some Roboflow image names exceed Windows path limits and break `git commit`). Download/export the dataset from Roboflow (YOLOv12 format) and unzip into `img/` on your machine.

```bash
python train.py
```

## Sidewalk segmentation (optional)

Dataset: YOLO **segmentation** (polygon labels). Place `data.yaml` at either:

- `<repo>/img/sidewalk.v1i.yolov12/data.yaml`, or  
- `img/sidewalk-dataset/data.yaml` under this app (e.g. OneDrive export).

Install (if needed): `pip install ultralytics torch`

```bash
python train_sidewalk.py --fast          # 60 epochs, imgsz 512
python train_sidewalk.py                 # 150 epochs, imgsz 640
python train_sidewalk.py --fast --device cpu --no-export
```

After training, copy `runs/train/sidewalk-seg-v1/weights/best.pt` to `../../models/yolo/sidewalk-seg.pt` (from this directory). The app loads it via `SIDEWALK_MODEL_PATH` / `SIDEWALK_MODEL_FILE` in `config.py`; if the file is missing, obstacle detection still runs and a warning is printed.

## Notes

- Run commands with the working directory set to `apps/python-desktop` so relative paths resolve correctly.
- If Git still lists old dataset paths after a failed commit, run from repo root:  
  `git rm -r --cached apps/python-desktop/img`  
  then commit again.
