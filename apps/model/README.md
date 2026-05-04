# apps/model

Standalone YOLOv12n obstacle detection service. Runs on any VPS or local machine via Docker.

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Liveness check, reports model load status |
| `POST` | `/detect` | `X-API-Key` | Run inference on a base64-encoded image |

### POST /detect

**Request:**
```json
{ "image_base64": "<base64-encoded image bytes>" }
```

**Response:**
```json
{
  "detections": [
    { "name": "Person", "confidence": 0.87, "box": [x1, y1, x2, y2] }
  ],
  "scene_description": "Person ahead, very close. Bicycle on the left, nearby."
}
```

## Setup

```bash
cp .env.example .env
# Place yolo12n.pt into weights/
docker compose up
```

For local dev without Docker:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.api:app --host 0.0.0.0 --port 8080 --reload
```

## Model weights

Download `yolo12n.pt` and place it in `weights/`. The file is gitignored.
The path is configurable via `MODEL_PATH` env var.
