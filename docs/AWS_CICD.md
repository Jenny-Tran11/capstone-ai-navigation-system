# AWS CI/CD (GitHub Actions)

This repo runs **CI** on every pull request and push to `main` (lint + `cdk synth`). **Deploy** is manual via **Actions → Deploy AWS (CDK) → Run workflow**.

## Repository variables (Actions)

| Name | Purpose |
|------|---------|
| `AWS_ACCOUNT` | 12-digit AWS account ID (used for `--context account=` and required for deploy). |
| `AWS_REGION` | Region for synth/deploy and for `configure-aws-credentials` (e.g. `ap-southeast-2`). |

**Settings → Secrets and variables → Actions → Variables**

CI `cdk synth` falls back to the placeholder account/region in [`apps/aws/cdk.json`](../apps/aws/cdk.json) if these are unset (useful for forks). **Deploy** fails if they are missing.

## Repository secrets (Actions)

| Name | Purpose |
|------|---------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC, e.g. `arn:aws:iam::123456789012:role/GitHubActionsCdkDeploy`. |

**Settings → Secrets and variables → Actions → Secrets**

## IAM: trust policy for GitHub OIDC

Create an IAM role (e.g. `GitHubActionsCdkDeploy`) with a trust policy that **only** allows your repository. Replace `OWNER`, `REPO`, and optionally restrict `ref:refs/heads/main`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
        }
      }
    }
  ]
}
```

Add the GitHub OIDC provider in **IAM → Identity providers** if it does not exist yet (provider URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`).

## IAM: permissions for CDK deploy

Attach policies that allow CDK/CloudFormation to create and update resources for this app (Lambda, API Gateway, Cognito, DynamoDB, S3, CloudWatch, IAM for execution roles, ECR if used, etc.). For a capstone, teams often start with **`AdministratorAccess`** on a dedicated sandbox account, then tighten. For least privilege, use a policy scoped to CloudFormation stack name prefixes and pass-role conditions; iterate using failed deploy events in CloudTrail.

## One-time bootstrap

From [`apps/aws/README.md`](../apps/aws/README.md): bootstrap each account/region once with the same `--context account=` / `--context region=` as deploy. This project sets `@aws-cdk/core:bootstrapQualifier` to `blindnav` in [`apps/aws/cdk.json`](../apps/aws/cdk.json); use the same context when bootstrapping so the toolkit stack matches.

## Workflows

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `turbo run lint`, then `cdk synth --all` with a **dummy** `yolo12n.pt` so the detection Docker asset can build (not a valid model).
- [`.github/workflows/deploy-aws.yml`](../.github/workflows/deploy-aws.yml) — downloads real **yolo12n.pt** from [Ultralytics assets](https://github.com/ultralytics/assets/releases) when deploying `BlindNavDetectionStack` or `all`; uses OIDC to assume `AWS_ROLE_ARN`.
