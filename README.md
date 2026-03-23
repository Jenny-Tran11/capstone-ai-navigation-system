# AI-Assisted Navigation System for the Visually Impaired (Group 11)

Monorepo: **Python desktop prototype**, **AWS CDK** backend, and **Expo** mobile client.

## Packages

| Path | Description |
|------|-------------|
| [`apps/python-desktop/`](apps/python-desktop/) | Local Tkinter + YOLO + TTS prototype; training scripts and `img/` dataset |
| [`apps/aws/`](apps/aws/) | CDK stack: Lambda (Docker), API Gateway `POST /detect`, S3, CloudWatch |
| [`apps/mobile/`](apps/mobile/) | Expo (React Native) + NativeWind + shadcn-style UI primitives |
| [`scripts/`](scripts/) | Helper scripts (e.g. endpoint test, deploy notes) |
| [`packages/`](packages/) | Reserved for shared code (e.g. future TS types) |

## Prerequisites

- **Node.js 20+** (npm workspaces at repo root)
- **Python 3.9+** for desktop + CDK
- **Docker Desktop** (for Lambda image builds)
- **AWS CLI** (for deploy)

## Quick start

### Install JS workspaces (mobile)

```bash
npm install
```

### Python desktop

```bash
cd apps/python-desktop
python -m venv .venv
# Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

See [`apps/python-desktop/README.md`](apps/python-desktop/README.md).

### Mobile app

```bash
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env: EXPO_PUBLIC_DETECT_API_URL, EXPO_PUBLIC_DETECT_API_KEY
npm run mobile
```

See [`apps/mobile/README.md`](apps/mobile/README.md).

### AWS CDK

```bash
cd apps/aws
python -m venv .venv && .\.venv\Scripts\activate   # or source .venv/bin/activate
pip install -r requirements.txt
# Copy model to apps/aws/lambda/detect/yolo12n.pt before deploy
npx aws-cdk@latest deploy BlindNavDetectionStack --require-approval never --context account=<ACCOUNT> --context region=<REGION>
```

See [`apps/aws/README.md`](apps/aws/README.md) and [`scripts/aws_model_deploy.txt`](scripts/aws_model_deploy.txt).

## What this project does

- **Object detection**: YOLOv12-style model for urban obstacles; spatial descriptions for audio feedback.
- **Navigation**: OSRM-based walking directions (desktop prototype).
- **Cloud**: Container Lambda exposes `/detect` with JSON `{ "image_base64": "..." }`.

### Deployed API (example — URLs change per deploy)

**Result — deploy succeeded** (example in `ap-southeast-2`; yours may differ).

- **API base URL:**  
  `https://br5i405uf7.execute-api.ap-southeast-2.amazonaws.com/prod/`
- **Detect endpoint:**  
  `POST https://br5i405uf7.execute-api.ap-southeast-2.amazonaws.com/prod/detect`
- **Auth:** header `x-api-key` (required).

**Get your API key**

- **Console:** API Gateway → **API keys** → key for **BlindNavUsagePlan**.
- **CLI:**

```bash
aws apigateway get-api-keys --include-values --region ap-southeast-2 --query "items[?name=='BlindNavApiKey'].value" --output text
```

The **mobile app** should read the base URL and key from `EXPO_PUBLIC_*` env vars (see `apps/mobile/.env.example`). Never commit real keys.

## Monorepo tooling

- **npm workspaces** (`package.json` `workspaces`: `apps/*`, `packages/*`).
- **Turbo** ([`turbo.json`](turbo.json)) — optional; e.g. `npx turbo run lint` from root.
- **`.npmrc`** uses `legacy-peer-deps=true` to tolerate current React Native / Reanimated peer ranges with Expo 55.

## Technical stack (summary)

- **Desktop:** Python, Ultralytics, OpenCV, pyttsx3, Tkinter, OSRM API.
- **AWS:** CDK, Lambda (container), API Gateway, S3.
- **Mobile:** Expo, React Native, NativeWind, CVA, `@rn-primitives/slot` (extend with [React Native Reusables](https://reactnativereusables.com/) CLI).

## Roadmap notes

- **Phase 1:** Local logic validation (desktop).
- **Phase 2:** Cloud detection API (CDK) — in place.
- **Phase 3:** Mobile client — Expo app scaffolded; wire camera + `/detect` calls next.
