#!/usr/bin/env bash
# Build Admin + Web Vite bundles (optional) and deploy only the SPA CDK stack
# (S3 + CloudFront for both SPAs — no auth/data/storage/api stacks).
#
# Usage:
#   bash scripts/deploy-spa.sh staging
#   bash scripts/deploy-spa.sh prod
#   bash scripts/deploy-spa.sh staging --no-build   # reuse existing apps/{admin,web}/.dist
#
# Env:
#   SKIP_GENERATE_ENV=1  — skip pnpm generate:env:<stage> when .env.production are already correct
#
# Requires: AWS credentials for CloudFormation/deploy (same as pnpm deploy:staging).

set -euo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)/.."
cd "$ROOT" || exit

# `pnpm run … -- …` may forward a literal "--"
while [ "${1:-}" = "--" ]; do
  shift
done

usage() {
  cat <<'USAGE'
deploy-spa.sh <staging|prod> [--no-build]

  --no-build     Skip Vite builds; reuse apps/admin/.dist and apps/web/.dist.

  SKIP_GENERATE_ENV=1  Skip regenerate of .env.* before builds (staging|prod vars).
USAGE
}

NO_BUILD=0
STAGE=""

while [ "${1:-}" != "" ]; do
  case "$1" in
    staging | prod)
      STAGE="$1"
      shift
      ;;
    --no-build)
      NO_BUILD=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$STAGE" ]]; then
  echo "Error: missing stage — use staging or prod" >&2
  usage >&2
  exit 1
fi

# shellcheck source=project-variables.sh
. "$ROOT/scripts/project-variables.sh"
# shellcheck source=aws-context.sh
. "$ROOT/scripts/aws-context.sh"

SPA_STACK="${APP_NAME}-${STAGE}-spa"

if [[ "$NO_BUILD" -eq 0 ]]; then
  if [[ "${SKIP_GENERATE_ENV:-}" != "1" ]]; then
    echo "Generating env (${STAGE})…"
    pnpm run "generate:env:${STAGE}"
  else
    echo "SKIP_GENERATE_ENV=1 — not regenerating apps/*/.env.production"
  fi
  echo "Building Admin + Web bundles…"
  pnpm --filter @baseline/admin run build:deploy
  pnpm --filter @baseline/web run build:deploy
else
  echo "--no-build: using existing bundles under apps/*/ .dist"
fi

for SPA_APP in admin web; do
  if [[ ! -d "$ROOT/apps/$SPA_APP/.dist" ]] ||
    [[ ! -f "$ROOT/apps/$SPA_APP/.dist/index.html" ]]; then
    echo "Error: missing or empty build at apps/$SPA_APP/.dist (run without --no-build)" >&2
    exit 1
  fi
done

echo "Deploying SPA stack [$SPA_STACK] in [$REGION]…"
export BASELINE_AWS_USE_DEFAULT_CHAIN="${BASELINE_AWS_USE_DEFAULT_CHAIN:-1}"
baseline_apply_default_aws_chain

if [[ "$STAGE" == "prod" ]]; then
  REQUIRE_APPROVAL="broadening"
else
  REQUIRE_APPROVAL="never"
fi

pnpm --filter @baseline/infra exec cdk deploy "$SPA_STACK" \
  --context "stage=${STAGE}" \
  --require-approval "$REQUIRE_APPROVAL"

echo "Done. URLs: pnpm run urls:${STAGE}"
