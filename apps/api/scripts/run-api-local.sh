#!/usr/bin/env bash
set -euo pipefail

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)/.."
cd "$PARENT_PATH" || exit

# Sets REGION, APP_NAME, AWS_REGION, AWS_PROFILE
. ../../scripts/project-variables.sh

export APP_NAME
export NODE_ENV=local
export IS_OFFLINE=false
unset AWS_PROFILE
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export API_REGION="${REGION}"
export AWS_DEFAULT_REGION="${REGION}"
export AWS_ENDPOINT_URL=http://localhost:4566
export API_CORS_ORIGIN="*"
export NODE_OPTIONS=--enable-source-maps

TSX="./node_modules/.bin/tsx"

# ── Wait-for-port helper ────────────────────────────────────────────────────────
wait_for_port() {
  local port=$1 label=$2 timeout_secs=${3:-30}
  local deadline=$(( SECONDS + timeout_secs ))
  while ! lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "ERROR: $label did not start within ${timeout_secs}s"
      echo "Ensure MiniStack is running: docker compose up -d"
      return 1
    fi
    sleep 0.2
  done
}

# ── Ensure Docker is running ────────────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon not running — launching Docker Desktop..."
  open -a Docker
  echo "Waiting for Docker daemon..."
  until docker info >/dev/null 2>&1; do sleep 1; done
  echo "Docker ready"
fi

# ── Ensure MiniStack is up ──────────────────────────────────────────────────────
echo "Starting MiniStack..."
docker compose -f ../../docker-compose.yml up -d
echo "Waiting for MiniStack (port 4566)..."
wait_for_port 4566 "MiniStack" 30
echo "MiniStack ready"

# ── Bootstrap: create tables, Cognito pool, seed data (idempotent) ─────────────
echo "Running bootstrap..."
$TSX src/local/bootstrap-local.ts

# ── Source generated Cognito IDs and primary user sub ──────────────────────────
# shellcheck source=/dev/null
[ -f .env.local ] && . .env.local

# Build AUTHORIZER from the real Cognito sub written by bootstrap
export AUTHORIZER="{\"claims\":{\"email\":\"${PRIMARY_USER_EMAIL:-example@devika.com}\",\"sub\":\"${PRIMARY_USER_SUB:-}\"}}"

# ── Generate frontend env vars in background ────────────────────────────────────
bash ../../scripts/generate-env-vars.sh local &

# ── Start API server ────────────────────────────────────────────────────────────
echo "Starting API server on http://localhost:4000 ..."
$TSX --watch src/local/server.ts

cd "$CURRENT_DIR" || exit
