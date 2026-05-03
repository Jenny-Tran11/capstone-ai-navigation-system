#!/usr/bin/env bash
# Re-run CDK bootstrap for the account/region in project-variables (upgrades toolkit stack, e.g. v25 → v30+).
# cdk.json still runs src/app.ts, which requires --context stage=… (bootstrap does not use the stage for the toolkit).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=project-variables.sh
. "$ROOT/scripts/project-variables.sh"
# shellcheck source=aws-context.sh
. "$ROOT/scripts/aws-context.sh"
: "${BASELINE_AWS_USE_DEFAULT_CHAIN:=1}"
baseline_apply_default_aws_chain
cd "$ROOT/apps/infra"
STAGE="${CDK_BOOTSTRAP_STAGE:-staging}"
ACCOUNT="$(baseline_aws sts get-caller-identity --query Account --output text)"
echo "Bootstrapping CDK toolkit: aws://${ACCOUNT}/${AWS_REGION} (app context stage=${STAGE})"
pnpm exec cdk bootstrap "aws://${ACCOUNT}/${AWS_REGION}" --context "stage=${STAGE}"
