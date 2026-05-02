#!/usr/bin/env bash
set -euo pipefail

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)/.."
cd "$PARENT_PATH" || exit

. ../../scripts/project-variables.sh

export APP_NAME
export NODE_ENV=local
export IS_OFFLINE=false
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export API_REGION="${REGION}"
export AWS_DEFAULT_REGION="${REGION}"
export AWS_ENDPOINT_URL=http://localhost:4566

./node_modules/.bin/tsx src/local/bootstrap-local.ts

cd "$CURRENT_DIR" || exit
