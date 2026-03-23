# AWS CDK

Two stacks (same app — deploy with `--all` or by stack name):

| Stack | Contents |
|-------|-----------|
| **BlindNavDetectionStack** | Docker Lambda (YOLO), REST API `POST /detect`, API key, S3, CloudWatch |
| **BlindNavUserApiStack** | Cognito User Pool + app client, DynamoDB users table, Node 20 Lambda ([`packages/api`](../../packages/api)), HTTP API (v2) with **JWT authorizer**, CORS |

User-API layout is inspired by [Baseline-JS/core](https://github.com/Baseline-JS/core) (monorepo API package + serverless AWS services); deployment here is **CDK only** (no Serverless Framework).

## Prerequisites

- Node.js 20+ and **`npm install` at the monorepo root** (required for `NodejsFunction` to bundle `packages/api`)
- Python 3.11+ and venv at `apps/aws/.venv`
- Docker Desktop (detection image build; Node bundling may use Docker if local esbuild is unavailable)
- AWS CLI configured

## Setup

```bash
cd apps/aws
python -m venv .venv
# Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
```

Copy weights into `lambda/detect/yolo12n.pt` before deploying **BlindNavDetectionStack**.

## Deploy

From `apps/aws`:

```bash
npx aws-cdk@latest bootstrap aws://<ACCOUNT>/<REGION> --context account=<ACCOUNT> --context region=<REGION>

# Both stacks
npx aws-cdk@latest deploy --all --require-approval never --context account=<ACCOUNT> --context region=<REGION>

# Or individually
npx aws-cdk@latest deploy BlindNavDetectionStack --require-approval never --context account=<ACCOUNT> --context region=<REGION>
npx aws-cdk@latest deploy BlindNavUserApiStack --require-approval never --context account=<ACCOUNT> --context region=<REGION>
```

After **BlindNavUserApiStack**, note outputs: **UserHttpApiUrl**, **UserPoolId**, **UserPoolClientId**, **CognitoIssuer** — use them in the mobile app `.env`.

See [`scripts/aws_model_deploy.txt`](../../scripts/aws_model_deploy.txt) at the repo root.

## Synth only

```bash
npx aws-cdk@latest synth --context account=<ACCOUNT> --context region=<REGION>
```

## User API routes

- `GET /me` — profile (or `profileExists: false` until first update)
- `PUT /me` — JSON `{ "displayName": "..." }`  
  Requires `Authorization: Bearer <Cognito ID token>` (HTTP API JWT authorizer).
