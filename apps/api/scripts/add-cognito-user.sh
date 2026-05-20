#!/usr/bin/env bash
# Add a Cognito user and admin DynamoDB row (staging/prod).
# Credentials: scripts/aws-context.sh (default: SSO / default chain, not the baseline-bolt profile).

set -euo pipefail

CURRENT_DIR="$(pwd -P)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Repo root (scripts/get-stack-outputs.sh is at repo scripts/, not under apps/)
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$ROOT" || exit

STAGE=$1
USER_EMAIL=$2
USER_PASSWORD=$3

: "${BASELINE_AWS_USE_DEFAULT_CHAIN:=1}"
export BASELINE_AWS_USE_DEFAULT_CHAIN

# shellcheck source=get-stack-outputs.sh
. ./scripts/get-stack-outputs.sh "$STAGE" >/dev/null

TABLE="${APP_NAME}-${STAGE}-admin"
COGNITO_USER_POOL_ID="$(baseline_resolve_cognito_user_pool_id "$STAGE")"

if [ -z "${COGNITO_USER_POOL_ID}" ] || [ "${COGNITO_USER_POOL_ID}" = "None" ]; then
  echo "Failed to resolve Cognito User Pool Id."
  exit 1
fi
echo "Cognito pool: [${COGNITO_USER_POOL_ID}]"

if [ -z "$USER_EMAIL" ]; then
  printf "Email: "
  read -r USER_EMAIL
fi
if [ -z "$USER_EMAIL" ]; then
  echo "Error: No user email set"
  exit 1
fi

if [ -z "$USER_PASSWORD" ]; then
  echo
  echo "Password requirements: 8+ chars, number, lower, upper, special character"
  printf "Password: "
  read -sr USER_PASSWORD
  echo ""
fi
if [ -z "$USER_PASSWORD" ]; then
  echo "Error: No user password set"
  exit 1
fi

set +e
baseline_aws cognito-idp admin-get-user \
  --region "${REGION}" \
  --user-pool-id "${COGNITO_USER_POOL_ID}" \
  --username "${USER_EMAIL}" \
  >/dev/null 2>&1
USER_EXISTS=$?
set -e

if [ "$USER_EXISTS" -eq 0 ]; then
  echo "User already exists; skipping password change."
else
  echo "Creating user…"
  baseline_aws cognito-idp admin-create-user \
    --region "${REGION}" \
    --user-pool-id "${COGNITO_USER_POOL_ID}" \
    --username "${USER_EMAIL}" \
    --user-attributes Name=email,Value="${USER_EMAIL}" Name=email_verified,Value=true \
    --message-action SUPPRESS >/dev/null

  echo "Setting password…"
  baseline_aws cognito-idp admin-set-user-password \
    --region "${REGION}" \
    --user-pool-id "${COGNITO_USER_POOL_ID}" \
    --username "${USER_EMAIL}" \
    --password "${USER_PASSWORD}" \
    --permanent >/dev/null
fi

USER_SUB=$(baseline_aws cognito-idp admin-get-user \
  --region "${REGION}" \
  --user-pool-id "${COGNITO_USER_POOL_ID}" \
  --username "${USER_EMAIL}" |
  jq -r '.Username // empty')

echo "User sub: [${USER_SUB}]"

if [ -n "$USER_SUB" ]; then
  baseline_aws dynamodb put-item \
    --table-name "${TABLE}" \
    --item "{\"userSub\": {\"S\": \"${USER_SUB}\"}, \"userEmail\": {\"S\": \"${USER_EMAIL}\"}}" \
    --region "${REGION}"
else
  echo "Could not read user sub; skipping DynamoDB."
fi

echo "Done."

cd "$CURRENT_DIR" || exit
