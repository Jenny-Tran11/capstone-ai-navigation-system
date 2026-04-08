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

## Notes

- Run commands with the working directory set to `apps/python-desktop` so relative paths resolve correctly.
- If Git still lists old dataset paths after a failed commit, run from repo root:  
  `git rm -r --cached apps/python-desktop/img`  
  then commit again.
