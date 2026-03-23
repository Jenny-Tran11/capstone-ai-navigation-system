# AWS CDK — detection API

Deploys Lambda (Docker image), API Gateway `POST /detect`, S3 buckets, CloudWatch dashboard/alarms.

## Prerequisites

- Node.js (for `npx aws-cdk`)
- Python 3.11+ and venv at `apps/aws/.venv` (see below)
- Docker Desktop (for building the Lambda image)
- AWS CLI configured

## Setup

```bash
cd apps/aws
python -m venv .venv
# Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
```

Copy your weights into `lambda/detect/yolo12n.pt` before deploy (image build expects this file).

## Deploy

From `apps/aws`:

```bash
npx aws-cdk@latest bootstrap aws://<ACCOUNT>/<REGION> --context account=<ACCOUNT> --context region=<REGION>
npx aws-cdk@latest deploy BlindNavDetectionStack --require-approval never --context account=<ACCOUNT> --context region=<REGION>
```

See also [`scripts/aws_model_deploy.txt`](../../scripts/aws_model_deploy.txt) at the repo root.

## Synth only

```bash
npx aws-cdk@latest synth --context account=<ACCOUNT> --context region=<REGION>
```
