#!/usr/bin/env bash
# Writes apps/web and apps/admin .env files from local ministack or CloudFormation outputs.
# CloudFormation path uses aws-context.sh behavior via get-stack-outputs.sh (SSO/OIDC-friendly).

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)/.."
cd "$PARENT_PATH" || exit

# shellcheck source=project-variables.sh
. ./scripts/project-variables.sh

STACK_STAGE=$1
echo "App Name: [${APP_NAME}]"
echo "Profile: [${AWS_PROFILE}]"
echo "Region: [${REGION}]"
echo "Stack Stage: [${STACK_STAGE}]"

if [ "$STACK_STAGE" = "local" ]; then
  OUTPUT_FILENAME=.env.development
  ServiceEndpoint=http://localhost:4000
  if [ "${CODESPACE_NAME:-}" ]; then
    ServiceEndpoint="https://${CODESPACE_NAME}-4000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  fi
  CONFIG_FILE=".cognito/local-config.json"
  if [ -f "$CONFIG_FILE" ]; then
    UserPoolId=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8')).userPoolId)")
    UserPoolClientId=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8')).userPoolClientId)")
    IdentityPoolId=""
  else
    echo "Warning: $CONFIG_FILE not found. Run 'pnpm --filter @baseline/api run setup:ministack' first."
    UserPoolId=""
    UserPoolClientId=""
    IdentityPoolId=""
  fi
else
  : "${BASELINE_AWS_USE_DEFAULT_CHAIN:=1}"
  export BASELINE_AWS_USE_DEFAULT_CHAIN
  # shellcheck source=get-stack-outputs.sh
  . ./scripts/get-stack-outputs.sh "${STACK_STAGE}" >/dev/null
  OUTPUT_FILENAME=.env.production

  if [ -z "${UserPoolId:-}" ] ||
    [ -z "${UserPoolClientId:-}" ] ||
    [ -z "${IdentityPoolId:-}" ] ||
    [ -z "${ServiceEndpoint:-}" ]; then
    echo "" >&2
    echo "Error: incomplete ${STACK_STAGE} env from CloudFormation (need User Pool, Identity Pool, client, and API URL)." >&2
    echo "  Auth stack outputs must exist (${APP_NAME}-${STACK_STAGE}-* stacks in ${REGION})." >&2
    echo "  • Verify AWS credentials: aws cloudformation describe-stacks --region ${REGION}" >&2
    echo "  • Named profile only: BASELINE_AWS_USE_DEFAULT_CHAIN=0 pnpm run generate:env:${STACK_STAGE}" >&2
    echo "" >&2
    exit 1
  fi
fi

COGNITO_ENDPOINT=""
if [ "$STACK_STAGE" = "local" ]; then
  COGNITO_ENDPOINT="http://localhost:4566"
fi

ServiceEndpoint="${ServiceEndpoint%/}"

OUTPUT=$(
  cat <<EOF
REACT_APP_APP_NAME=${APP_NAME:-}
REACT_APP_AWS_PROFILE=${AWS_PROFILE:-}
REACT_APP_API_URL=${ServiceEndpoint:-}/
REACT_APP_COGNITO_IDENTITY_POOL_ID=${IdentityPoolId:-}
REACT_APP_COGNITO_USER_POOL_ID=${UserPoolId:-}
REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=${UserPoolClientId:-}
REACT_APP_COGNITO_ENDPOINT=${COGNITO_ENDPOINT}
VITE_MODEL_API_URL=${MODEL_API_URL:-}
EOF
)

# Comment below is used to determine where to add new env vars, please do not modify
# Additional variables are set here
echo "$OUTPUT" >./apps/web/$OUTPUT_FILENAME
printf "\033[32m[%s] has been generated successfully!\033[39m\n" "./web/${OUTPUT_FILENAME}"
echo "$OUTPUT" >./apps/admin/$OUTPUT_FILENAME
printf "\033[32m[%s] has been generated successfully!\033[39m\n" "./admin/${OUTPUT_FILENAME}"

MOBILE_OUTPUT=$(
  cat <<EOF
# Local model API example: http://localhost:8080
# Roboflow workflow example: https://serverless.roboflow.com/<workspace>/workflows/<workflow-id>
EXPO_PUBLIC_DETECT_API_URL=${MODEL_API_URL:-}
EXPO_PUBLIC_DETECT_API_KEY=

EXPO_PUBLIC_COGNITO_USER_POOL_ID=${UserPoolId:-}
EXPO_PUBLIC_COGNITO_CLIENT_ID=${UserPoolClientId:-}
EXPO_PUBLIC_AWS_REGION=${REGION:-}
EXPO_PUBLIC_COGNITO_ENDPOINT=${COGNITO_ENDPOINT}

EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EOF
)
echo "$MOBILE_OUTPUT" >./apps/mobile/$OUTPUT_FILENAME
printf "\033[32m[%s] has been generated successfully!\033[39m\n" "./mobile/${OUTPUT_FILENAME}"

cd "$CURRENT_DIR" || exit
