# AI-Assisted Navigation System for the Visually Impaired (Group 11)

Monorepo: **Python desktop prototype**, **AWS CDK** backends, **TypeScript user API** package, and **Expo** mobile client.

## Packages

| Path | Description |
|------|-------------|
| [`apps/python-desktop/`](apps/python-desktop/) | Local Tkinter + YOLO + TTS prototype; training scripts and local `img/` dataset (gitignored) |
| [`apps/aws/`](apps/aws/) | CDK: **detection** stack (Docker Lambda, REST `POST /detect`, API key) + **user** stack (Cognito, DynamoDB, HTTP API JWT, Node Lambda) |
| [`packages/api/`](packages/api/) | `@capstone/api` — Hono handler for `GET/PUT /me` (deployed by `BlindNavUserApiStack`; layout inspired by [Baseline-JS/core](https://github.com/Baseline-JS/core)) |
| [`apps/mobile/`](apps/mobile/) | Expo (React Native) + NativeWind + shadcn-style UI primitives |
| [`scripts/`](scripts/) | Helper scripts (e.g. endpoint test, deploy notes) |

## Prerequisites

- **Node.js 20+** (npm workspaces at repo root; run `npm install` before CDK Node bundling)
- **Python 3.9+** for desktop + CDK
- **Docker Desktop** (detection Lambda image + optional Docker bundling for `NodejsFunction`)
- **AWS CLI** (for deploy)

## Quick start

### Install JS workspaces

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
# Edit .env (detect + optional Cognito / user API — see file)
npm run mobile
```

See [`apps/mobile/README.md`](apps/mobile/README.md).

### AWS CDK

```bash
cd apps/aws
python -m venv .venv && .\.venv\Scripts\activate   # or source .venv/bin/activate
pip install -r requirements.txt
# Detection: copy model to apps/aws/lambda/detect/yolo12n.pt
npx aws-cdk@latest deploy --all --require-approval never --context account=<ACCOUNT> --context region=<REGION>
```

Or deploy stacks separately: `BlindNavDetectionStack`, `BlindNavUserApiStack`.

See [`apps/aws/README.md`](apps/aws/README.md) and [`scripts/aws_model_deploy.txt`](scripts/aws_model_deploy.txt).

### API package (local typecheck)

```bash
npm run lint:api
```

## What this project does

- **Object detection**: YOLO-style model for urban obstacles; spatial descriptions for audio feedback.
- **Navigation**: OSRM-based walking directions (desktop prototype).
- **Cloud detection**: Container Lambda + REST API `{ "image_base64": "..." }` with `x-api-key`.
- **Users (mobile backend)**: Cognito sign-in + HTTP API (JWT) + DynamoDB profiles via [`packages/api`](packages/api).

### Deployed detection API (example — URLs change per deploy)

**Example** in `ap-southeast-2`; yours may differ.

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

### User API (after `BlindNavUserApiStack` deploy)

- Copy **UserHttpApiUrl**, **UserPoolId**, **UserPoolClientId**, **CognitoIssuer** from CloudFormation outputs into mobile `.env` (see `apps/mobile/.env.example`).
- Call `GET` / `PUT` `{UserHttpApiUrl}/me` with `Authorization: Bearer <idToken>`.

## Monorepo tooling

- **npm workspaces** (`package.json` `workspaces`: `apps/*`, `packages/*`).
- **Turbo** ([`turbo.json`](turbo.json)) — optional; e.g. `npx turbo run lint` from root.
- **`.npmrc`** uses `legacy-peer-deps=true` for Expo 55 peer resolution.

## Technical stack (summary)

- **Desktop:** Python, Ultralytics, OpenCV, pyttsx3, Tkinter, OSRM API.
- **AWS:** CDK, Lambda (container + Node 20), API Gateway REST + HTTP API, Cognito, DynamoDB, S3.
- **API source:** TypeScript, Hono, AWS SDK v3 ([Baseline-JS/core](https://github.com/Baseline-JS/core)-style split: logic in `packages/api`, IaC in CDK).
- **Mobile:** Expo, React Native, NativeWind, CVA, `@rn-primitives/slot`.

## Roadmap notes

- **Phase 1:** Local logic validation (desktop).
- **Phase 2:** Cloud detection + user API (CDK) — in place.
- **Phase 3:** Mobile — wire Cognito auth + `/me` + camera `/detect`.
