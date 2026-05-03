#!/usr/bin/env bash
# Create a Cognito user, admin row, and SUPER permission in DynamoDB.
# See scripts/aws-context.sh for AWS credentials (SSO vs named profile).
#
# Usage:
#   ./scripts/add-staging-user-and-permission.sh [email] [password]
#   pnpm run add:staging:admin -- user@host 'Password1!'
#   STAGE=staging ./scripts/add-staging-user-and-permission.sh
#
set -euo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)/.."
cd "$ROOT" || exit

# pnpm injects a literal "--" before script args
while [ "${1:-}" = "--" ]; do
  shift
done

STAGE="${STAGE:-staging}"
USER_EMAIL="${1:-}"
USER_PASSWORD="${2:-}"

: "${BASELINE_AWS_USE_DEFAULT_CHAIN:=1}"
export BASELINE_AWS_USE_DEFAULT_CHAIN

echo "Loading stack outputs…"
# shellcheck source=get-stack-outputs.sh
. "$ROOT/scripts/get-stack-outputs.sh" "$STAGE" >/dev/null

ADMIN_TABLE="${APP_NAME}-${STAGE}-admin"
PERMISSION_TABLE="${APP_NAME}-${STAGE}-permission"

echo "Stage: [$STAGE]  App: [$APP_NAME]  Region: [$REGION]"
echo "AWS: ${AWS_PROFILE:-<default credential chain>}"

COGNITO_USER_POOL_ID="$(baseline_resolve_cognito_user_pool_id "$STAGE")"
if [ -z "${COGNITO_USER_POOL_ID}" ] || [ "${COGNITO_USER_POOL_ID}" = "None" ]; then
  echo "Failed to read Cognito User Pool Id (check auth stack and ExportName ${APP_NAME}-${STAGE}-UserPoolId)."
  exit 1
fi
echo "User pool: [$COGNITO_USER_POOL_ID]"

if [ -z "$USER_EMAIL" ]; then
  printf "Email: "
  read -r USER_EMAIL
fi
if [ -z "$USER_EMAIL" ]; then
  echo "Error: email is required"
  exit 1
fi

if [ -z "$USER_PASSWORD" ]; then
  echo
  echo "Password requirements (Cognito): ≥8 chars, number, lower, upper, special character"
  printf "Password: "
  read -sr USER_PASSWORD
  echo ""
fi
if [ -z "$USER_PASSWORD" ]; then
  echo "Error: password is required for new users"
  exit 1
fi

set +e
baseline_aws cognito-idp admin-get-user \
  --region "${REGION}" \
  --user-pool-id "${COGNITO_USER_POOL_ID}" \
  --username "${USER_EMAIL}" \
  >/dev/null 2>&1
COGNITO_EXISTS=$?
set -e

if [ "$COGNITO_EXISTS" -eq 0 ]; then
  echo "Cognito user already exists (password unchanged)."
else
  echo "Creating Cognito user…"
  baseline_aws cognito-idp admin-create-user \
    --region "${REGION}" \
    --user-pool-id "${COGNITO_USER_POOL_ID}" \
    --username "${USER_EMAIL}" \
    --user-attributes Name=email,Value="${USER_EMAIL}" Name=email_verified,Value=true \
    --message-action SUPPRESS >/dev/null

  echo "Setting permanent password…"
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

if [ -z "$USER_SUB" ]; then
  echo "Error: could not resolve Cognito username/sub for ${USER_EMAIL}"
  exit 1
fi
echo "User sub: [$USER_SUB]"

echo "Upserting admin row → ${ADMIN_TABLE}"
baseline_aws dynamodb put-item \
  --region "${REGION}" \
  --table-name "${ADMIN_TABLE}" \
  --item "{\"userSub\": {\"S\": \"${USER_SUB}\"}, \"userEmail\": {\"S\": \"${USER_EMAIL}\"}}"

PERMISSION_ID="prm_${STAGE}_super_${USER_SUB}"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Upserting SUPER permission → ${PERMISSION_TABLE} (${PERMISSION_ID})"
baseline_aws dynamodb put-item \
  --region "${REGION}" \
  --table-name "${PERMISSION_TABLE}" \
  --item "$(
    jq -nc \
      --arg id "$PERMISSION_ID" \
      --arg owner "$USER_SUB" \
      --arg now "$NOW" \
      '{
        permissionId: { S: $id },
        type: { S: "SUPER" },
        compositeKey: { S: "SUPER" },
        ownerId: { S: $owner },
        createdAt: { S: $now },
        updatedAt: { S: $now }
      }'
  )"

echo "Done. Sign in to the admin app with ${USER_EMAIL}"
