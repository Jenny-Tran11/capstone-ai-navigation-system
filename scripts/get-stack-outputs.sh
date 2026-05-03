#!/usr/bin/env bash
# Export CloudFormation stack outputs as shell variables (UserPoolId, ServiceEndpoint, …).
# CDK uses hashed OutputKeys; we mirror stable names from ExportName (see aws-context.sh).
# shellcheck disable=SC2207

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)/.."
cd "$PARENT_PATH" || exit

# shellcheck source=project-variables.sh
. ./scripts/project-variables.sh
# shellcheck source=aws-context.sh
. ./scripts/aws-context.sh

baseline_apply_default_aws_chain

STAGE=$1

echo "Begin: exporting cloudformation outputs as environment variables"
start=$(date +%s)

echo "App Name: [${APP_NAME}]"
echo "Profile: [${AWS_PROFILE:-<default chain>}]"
echo "Region: [${REGION}]"
echo "Stage: [${STAGE}]"

if [ "$STAGE" = "" ] || [ "$REGION" = "" ]; then
  echo "Error: stage or region missing"
  exit 1
fi

STACK_PREFIX="${APP_NAME}-${STAGE}-"

if ! stacks_json="$(baseline_aws cloudformation describe-stacks --region "${REGION}" --output json 2>/dev/null)"; then
  echo "Failed to describe stacks in ${REGION}"
elif [[ "$(echo "${stacks_json}" | jq '.Stacks | length')" = "0" ]]; then
  echo "No stacks found in region, nothing to export"
else
  echo "Env stack prefix: [${STACK_PREFIX}]"

  while IFS= read -r stack_name; do
    [[ -z "${stack_name}" ]] && continue

    echo
    echo "Outputs for: ${stack_name}"
    echo

    stack_info="$(baseline_aws cloudformation describe-stacks \
      --region "$REGION" \
      --stack-name "$stack_name" \
      --output json)"

    EXP_PREFIX="${APP_NAME}-${STAGE}-"

    while IFS= read -r line; do
      [[ -z "${line}" ]] && continue
      key="$(echo "${line}" | jq -r '.OutputKey')"
      val="$(echo "${line}" | jq -r '.OutputValue')"
      exp="$(echo "${line}" | jq -r '.ExportName // empty')"
      [[ -z "${key}" || "${key}" = "null" ]] && continue
      echo "export ${key}=…"
      baseline_export "${key}" "${val}"

      if [[ -n "${exp}" && "${exp}" = "${EXP_PREFIX}"* && "${exp}" != *":"* ]]; then
        rest="${exp#"${EXP_PREFIX}"}"
        if [[ "${rest}" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
          case "${rest}" in
            ApiUrl) baseline_export ServiceEndpoint "${val}" ;;
            WebUrl) baseline_export WebCloudFrontUrl "${val#https://}" ;;
            AdminUrl) baseline_export AdminCloudFrontUrl "${val#https://}" ;;
            *) baseline_export "${rest}" "${val}" ;;
          esac
          echo "export ${rest}=… (from ExportName)"
        fi
      fi
    done < <(echo "${stack_info}" | jq -c '.Stacks[0].Outputs // [] | .[]')
  done < <(
    echo "${stacks_json}" | jq -r \
      --arg p "${STACK_PREFIX}" \
      '.Stacks[]
        | select(.StackName | startswith($p))
        | select(.StackStatus | test("DELETE_(COMPLETE|IN_PROGRESS)") | not)
        | .StackName'
  )
fi

AWS_ACCOUNT_ID="$(baseline_aws sts get-caller-identity --region us-east-1 --output text --query 'Account')"
export AWS_ACCOUNT_ID

echo "AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}"

end=$(date +%s)
runtime=$((end - start))
echo "Finish (${runtime} secs): exporting cloudformation outputs as environment variables"

cd "$CURRENT_DIR" || exit
