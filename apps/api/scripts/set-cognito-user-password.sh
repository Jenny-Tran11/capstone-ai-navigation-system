#!/usr/bin/env bash
# Set a permanent Cognito password for an existing user (staging / prod).
# Requires AWS credentials with cognito-idp:AdminSetUserPassword on the user pool.
#
# Usage:
#   ./apps/api/scripts/set-cognito-user-password.sh staging trananhlanhuu@gmail.com 'NewStr0ng!Pass'
#   ./apps/api/scripts/set-cognito-user-password.sh prod user@example.com   # prompts for password
#
# Password policy: follow your pool rules (typically 8+ chars, upper, lower, number, special).

set -euo pipefail

CURRENT_DIR="$(pwd -P)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Repo root (scripts/ lives next to apps/, not under apps/api/)
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$ROOT" || exit

STAGE=${1:-}
USER_EMAIL=${2:-}
USER_PASSWORD=${3:-}

if [ -z "$STAGE" ] || [ -z "$USER_EMAIL" ]; then
  echo "Usage: $0 <staging|prod> <email> [new-password]" >&2
  echo "  If password is omitted, it will be prompted (hidden)." >&2
  exit 1
fi

: "${BASELINE_AWS_USE_DEFAULT_CHAIN:=1}"
export BASELINE_AWS_USE_DEFAULT_CHAIN

# shellcheck source=get-stack-outputs.sh
. ./scripts/get-stack-outputs.sh "$STAGE" >/dev/null

COGNITO_USER_POOL_ID="$(baseline_resolve_cognito_user_pool_id "$STAGE")"
if [ -z "${COGNITO_USER_POOL_ID}" ] || [ "${COGNITO_USER_POOL_ID}" = "None" ]; then
  echo "Failed to resolve Cognito User Pool Id for stage [${STAGE}]." >&2
  exit 1
fi

USER_EMAIL_LOWER="$(printf '%s' "$USER_EMAIL" | tr '[:upper:]' '[:lower:]')"

if [ -z "$USER_PASSWORD" ]; then
  echo "Password requirements: follow Cognito pool policy (often 8+ chars, number, lower, upper, special)."
  printf "New password: "
  read -sr USER_PASSWORD
  echo ""
fi
if [ -z "$USER_PASSWORD" ]; then
  echo "Error: empty password" >&2
  exit 1
fi

echo "Pool: [${COGNITO_USER_POOL_ID}]  User: [${USER_EMAIL_LOWER}]  Region: [${REGION}]"

baseline_aws cognito-idp admin-set-user-password \
  --region "${REGION}" \
  --user-pool-id "${COGNITO_USER_POOL_ID}" \
  --username "${USER_EMAIL_LOWER}" \
  --password "${USER_PASSWORD}" \
  --permanent

echo "Password updated for ${USER_EMAIL_LOWER}."

cd "$CURRENT_DIR" || exit
