#!/usr/bin/env bash
# Shared AWS CLI helpers for Baseline repo scripts (local SSO, named profiles, GitHub OIDC).
#
# Typical usage (from repo root after `cd`):
#   . ./scripts/project-variables.sh
#   . ./scripts/aws-context.sh
#   : "${BASELINE_AWS_USE_DEFAULT_CHAIN:=1}"
#   baseline_apply_default_aws_chain
#
# project-variables.sh exports AWS_PROFILE (e.g. baseline-bolt). That profile may not exist when
# using `aws login` / SSO or CI OIDC. With BASELINE_AWS_USE_DEFAULT_CHAIN=1 (default in
# generate-env and add-user helpers), AWS_PROFILE is cleared so the SDK uses the ambient chain.
# Set BASELINE_AWS_USE_DEFAULT_CHAIN=0 to keep the named profile.

baseline_apply_default_aws_chain() {
  if [ "${BASELINE_AWS_USE_DEFAULT_CHAIN:-}" = "1" ]; then
    unset AWS_PROFILE
  fi
}

# Prefer over `aws ... "${AWS_PROFILE:+--profile $AWS_PROFILE}"` — avoids nounset/empty-array issues under `set -u`.
baseline_aws() {
  if [ -n "${AWS_PROFILE:-}" ]; then
    aws --profile "$AWS_PROFILE" "$@"
  else
    aws "$@"
  fi
}

# Bash 3.2 (macOS) has no `declare -g`; safe dynamic exports for CloudFormation output keys.
baseline_export() {
  eval "$(printf 'export %s=%q' "$1" "$2")"
}

# Requires: APP_NAME, REGION (from project-variables), baseline_aws, and optionally UserPoolId from get-stack-outputs.
# CDK emits hashed OutputKeys; pool id is also available via ExportName `${APP_NAME}-${stage}-UserPoolId`.
baseline_resolve_cognito_user_pool_id() {
  local stage="$1"
  local pool="${UserPoolId:-}"
  if [ -n "${pool}" ] && [ "${pool}" != "None" ]; then
    printf '%s' "${pool}"
    return 0
  fi
  local stack="${APP_NAME}-${stage}-auth"
  local exp="${APP_NAME}-${stage}-UserPoolId"
  baseline_aws cloudformation describe-stacks \
    --region "${REGION}" \
    --stack-name "${stack}" \
    --query "Stacks[0].Outputs[?ExportName=='${exp}'].OutputValue | [0]" \
    --output text 2>/dev/null || true
}
