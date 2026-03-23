# AWS CDK

Two stacks (see [`app.py`](app.py)):

| Stack | Contents |
|-------|----------|
| `BlindNavDetectionStack` | Docker Lambda `POST /detect`, S3, REST API + API key, CloudWatch ([`stacks/detection_stack.py`](stacks/detection_stack.py)) |
| `BlindNavUserApiStack` | Cognito, DynamoDB, HTTP API (JWT), Node Lambda from [`packages/api`](../../packages/api) ([`stacks/user_stack.py`](stacks/user_stack.py)) |

[`cdk.json`](cdk.json) sets `@aws-cdk/core:bootstrapQualifier` to **`blindnav`**. Use matching `--context account=` and `--context region=` for bootstrap and every deploy.

## Prerequisites

- **Node.js 20+** (run `npm ci` from the **repo root** before deploy so `NodejsFunction` can bundle)
- **Python 3.11+** and a venv under `apps/aws` (below)
- **Docker Desktop** (detection Lambda image build)
- **AWS CLI** configured (`aws sts get-caller-identity`)

## Setup

From the **repository root**:

```bash
npm ci
```

From **`apps/aws`**:

```bash
cd apps/aws
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Copy trained weights to **`lambda/detect/yolo12n.pt`** before deploying detection (the Docker build copies this file; `*.pt` is gitignored).

## One-time bootstrap (per account + region)

Run from **`apps/aws`** (replace account and region):

```bash
npx aws-cdk@2 bootstrap aws://<ACCOUNT>/<REGION> \
  --context account=<ACCOUNT> \
  --context region=<REGION>
```

## Deploy from terminal

Always run **`npx aws-cdk@2`** from **`apps/aws`**, with the same context as bootstrap:

```bash
# Detection API only
npx aws-cdk@2 deploy BlindNavDetectionStack --require-approval never \
  --context account=<ACCOUNT> \
  --context region=<REGION>

# User API (Cognito + HTTP API + profile Lambda)
npx aws-cdk@2 deploy BlindNavUserApiStack --require-approval never \
  --context account=<ACCOUNT> \
  --context region=<REGION>

# Both (stacks are independent; order does not matter)
npx aws-cdk@2 deploy --all --require-approval never \
  --context account=<ACCOUNT> \
  --context region=<REGION>
```

## Synth only (no deploy)

```bash
cd apps/aws
npx aws-cdk@2 synth --all \
  --context account=<ACCOUNT> \
  --context region=<REGION>
```

Synth still builds the detection Docker asset locally; you need **`lambda/detect/yolo12n.pt`** present (or a placeholder file for a dry run).

## GitHub Actions

CI/CD setup, OIDC IAM trust, and required GitHub variables/secrets: [`docs/AWS_CICD.md`](../../docs/AWS_CICD.md).

## See also

- [`scripts/aws_model_deploy.txt`](../../scripts/aws_model_deploy.txt) — deploy notes and Docker troubleshooting
