# Running Baseline Locally with MiniStack

This guide replaces `serverless-dynamodb` (DynamoDB Local on port 8000) and the
hardcoded `AUTHORIZER` Cognito bypass with [MiniStack](https://ministack.org) —
a free, MIT-licensed, zero-signup Docker container that emulates 45+ AWS services
including DynamoDB, Cognito, Lambda, and API Gateway.

---

## MiniStack vs Floci vs LocalStack

| | LocalStack Community | Floci | **MiniStack** |
|---|---|---|---|
| Price | Free (now requires auth token) | Free, MIT | **Free, MIT, no signup** |
| DynamoDB | ✓ | ✓ | ✓ |
| Cognito | ✗ (paid) | ✓ | ✓ |
| Lambda | ✗ (paid) | ✓ Docker containers | ✓ Docker containers |
| API Gateway v1+v2 | ✗ (paid) | ✓ | ✓ |
| CloudFormation | Partial | Partial | ✓ |
| Startup time | ~15-30s | ~24ms | ~2s |
| RAM at idle | ~500MB | ~13MB | ~30MB |
| Image size | ~1GB | ~90MB | ~250MB |
| Auth token required | Yes | No | **No** |

**MiniStack wins for convenience** — no account, no token, no environment variables to
configure before you can `docker compose up`. Floci is lighter but MiniStack has broader
service coverage and CloudFormation support, which matters when you want to use
`cdklocal deploy` locally.

---

## What changes

| Service | Before | After |
|---|---|---|
| DynamoDB | `serverless-dynamodb` Java JAR · port 8000 | MiniStack · port 4566 |
| Cognito | Bypassed via hardcoded `AUTHORIZER` | Fully emulated · port 4566 |
| API routing | `serverless-offline` · port 4000 | Unchanged |
| Lambda bundling | `serverless-esbuild` | Unchanged |

---

## Step 1 — Add `docker-compose.yml`

Create at the repo root:

```yaml
# docker-compose.yml
services:
  ministack:
    image: ministackorg/ministack:latest
    ports:
      - "4566:4566"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock   # required for Lambda execution
      - ministack-state:/tmp/ministack-state
    environment:
      - PERSIST_STATE=1          # keeps tables + user pools between restarts
      - LAMBDA_EXECUTOR=docker   # run Lambda in real Docker containers

volumes:
  ministack-state:
```

Start it:

```bash
docker compose up -d
```

Verify:

```bash
aws --endpoint-url=http://localhost:4566 \
    --region ap-southeast-2 \
    dynamodb list-tables
```

---

## Step 2 — Point the Cognito SDK client at MiniStack

`apps/api/src/baseblocks/cognito/cognito.service.ts` creates the client with no
`endpoint`, so it always calls real AWS. Add one line:

```typescript
// apps/api/src/baseblocks/cognito/cognito.service.ts
import * as AWS_CognitoIdentityServiceProvider from '@aws-sdk/client-cognito-identity-provider';

const { CognitoIdentityProvider: CognitoIdentityServiceProvider } =
  AWS_CognitoIdentityServiceProvider;

const cognito = new CognitoIdentityServiceProvider({
  region: process.env.API_REGION || 'ap-southeast-2',
  ...(process.env.AWS_ENDPOINT_URL && {
    endpoint: process.env.AWS_ENDPOINT_URL,
  }),
});
```

When `AWS_ENDPOINT_URL` is unset (staging, prod) the client is unchanged.

---

## Step 3 — Update the local start script

Replace `apps/api/scripts/run-api-local.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

CURRENT_DIR="$(pwd -P)"
PARENT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$PARENT_PATH" || exit

. ../../scripts/project-variables.sh

# ── MiniStack ─────────────────────────────────────────────────────────────
# Any non-empty credentials work — MiniStack doesn't validate them
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION="${REGION}"

# Single endpoint for DynamoDB, Cognito, and all other AWS services
export AWS_ENDPOINT_URL=http://localhost:4566

# Stop @baselinejs/dynamodb using its hardcoded IS_OFFLINE → :8000 path
export IS_OFFLINE=false

# ── API ───────────────────────────────────────────────────────────────────
export NODE_OPTIONS=--enable-source-maps

# 1. Create DynamoDB tables + Cognito user pool + seed data (idempotent).
#    Writes .cognito/local-config.json with userPoolId + userPoolClientId.
pnpm run setup:ministack

# 2. Source the generated pool IDs for this process
# shellcheck source=/dev/null
[ -f .env.local ] && . .env.local

# 3. Generate apps/admin/.env.development (reads .cognito/local-config.json)
pnpm -w run generate:env:local

npx serverless offline start \
  --stage local \
  --region "${REGION}" \
  --httpPort 4000 \
  --verbose "$@"

cd "$CURRENT_DIR" || exit
```

> The `AUTHORIZER` bypass is removed. Cognito is now real — the API validates JWTs
> from MiniStack. See Step 5 for how to get a local token. If you want to keep
> bypassing auth for rapid iteration, add `AUTHORIZER` back — `serverless-offline`
> will still accept it.

---

## Step 4 — Create the setup script

Create `apps/api/scripts/setup-ministack.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-ap-southeast-2}"
APP_NAME="${APP_NAME:?APP_NAME is required}"
STAGE="local"
ENDPOINT="http://localhost:4566"

ms() {
  aws --endpoint-url "$ENDPOINT" --region "$REGION" --no-cli-pager "$@"
}

# ── DynamoDB tables ────────────────────────────────────────────────────────
echo "Creating DynamoDB tables..."

ms dynamodb create-table \
  --table-name "${APP_NAME}-${STAGE}-admin" \
  --attribute-definitions AttributeName=userSub,AttributeType=S \
  --key-schema AttributeName=userSub,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "  admin table already exists"

# ── Seed DynamoDB ──────────────────────────────────────────────────────────
echo "Seeding admin table..."

ms dynamodb batch-write-item \
  --request-items "{
    \"${APP_NAME}-${STAGE}-admin\": [
      {\"PutRequest\":{\"Item\":{\"userSub\":{\"S\":\"ed805890-d66b-4126-a5d9-0b22e70fce80\"},\"userEmail\":{\"S\":\"example@devika.com\"}}}},
      {\"PutRequest\":{\"Item\":{\"userSub\":{\"S\":\"ed805890-d66b-4126-a5d9-0b22e70fce81\"},\"userEmail\":{\"S\":\"example+1@devika.com\"}}}},
      {\"PutRequest\":{\"Item\":{\"userSub\":{\"S\":\"ed805890-d66b-4126-a5d9-0b22e70fce82\"},\"userEmail\":{\"S\":\"example+2@devika.com\"}}}}
    ]
  }"

# ── Cognito user pool ──────────────────────────────────────────────────────
echo "Creating Cognito user pool..."

POOL_ID=$(ms cognito-idp create-user-pool \
  --pool-name "${APP_NAME}-${STAGE}-user-pool" \
  --username-attributes email \
  --auto-verified-attributes email \
  --query "UserPool.Id" --output text 2>/dev/null || \
  ms cognito-idp list-user-pools --max-results 10 \
    --query "UserPools[?Name=='${APP_NAME}-${STAGE}-user-pool'].Id | [0]" \
    --output text)

CLIENT_ID=$(ms cognito-idp create-user-pool-client \
  --user-pool-id "$POOL_ID" \
  --client-name "${APP_NAME}-${STAGE}-client" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --query "UserPoolClient.ClientId" --output text 2>/dev/null || \
  ms cognito-idp list-user-pool-clients \
    --user-pool-id "$POOL_ID" \
    --query "UserPoolClients[?ClientName=='${APP_NAME}-${STAGE}-client'].ClientId | [0]" \
    --output text)

echo "  User pool:  ${POOL_ID}"
echo "  Client:     ${CLIENT_ID}"

# ── Seed Cognito users ─────────────────────────────────────────────────────
echo "Seeding Cognito users..."

seed_user() {
  local email="$1" password="$2"
  ms cognito-idp admin-create-user \
    --user-pool-id "$POOL_ID" \
    --username "$email" \
    --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
    --message-action SUPPRESS 2>/dev/null || true
  ms cognito-idp admin-set-user-password \
    --user-pool-id "$POOL_ID" \
    --username "$email" --password "$password" --permanent \
    2>/dev/null || true
}

seed_user "example@devika.com"   "Password123"
seed_user "example+1@devika.com" "Password123"
seed_user "example+2@devika.com" "Password123"

# ── Write config files ─────────────────────────────────────────────────────
# .cognito/local-config.json — read by generate-env-vars.sh local
# This is the integration point: generate:env:local reads userPoolId +
# userPoolClientId from here and writes apps/admin/.env.development
BUCKET_NAME="${APP_NAME}-local-files"
mkdir -p .cognito
cat > .cognito/local-config.json <<EOF
{
  "userPoolId": "${POOL_ID}",
  "userPoolClientId": "${CLIENT_ID}",
  "bucketName": "${BUCKET_NAME}"
}
EOF

# .env.local — sourced by run-api-local.sh to set COGNITO_USER_POOL_ID
# for the serverless-offline process itself
cat > .env.local <<EOF
export COGNITO_USER_POOL_ID=${POOL_ID}
export COGNITO_CLIENT_ID=${CLIENT_ID}
EOF

echo ""
echo "Done. Sign in: example@devika.com / Password123"
echo ".cognito/local-config.json written — generate:env:local will pick this up"
```

Make it executable and wire it up in `apps/api/package.json`:

```bash
chmod +x apps/api/scripts/setup-ministack.sh
```

```json
{
  "scripts": {
    "setup:ministack":  ". ../../scripts/project-variables.sh && ./scripts/setup-ministack.sh",
    "install:dynamodb": "echo 'Replaced by MiniStack — run: docker compose up'"
  }
}
```

Add `.env.local` to `apps/api/.gitignore`.

---

## Step 5 — Get a local JWT for API testing

```bash
# Source the generated IDs
. apps/api/.env.local

# Get an IdToken
aws cognito-idp initiate-auth \
  --endpoint-url http://localhost:4566 \
  --region ap-southeast-2 \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=example@devika.com,PASSWORD=Password123 \
  --client-id "$COGNITO_CLIENT_ID" \
  --no-cli-pager \
  --query "AuthenticationResult.IdToken" \
  --output text
```

Use it in requests:

```bash
curl -H "Authorization: Bearer <IdToken>" http://localhost:4000/admin
```

---

## Step 6 — (Optional) Deploy CDK stacks via `cdklocal`

MiniStack supports CloudFormation, so you can use `cdklocal` to deploy the CDK stacks
from `apps/infra` directly to MiniStack instead of maintaining a manual setup script.

```bash
npm install -g aws-cdk-local aws-cdk

# Deploy all stacks to MiniStack
APP_NAME=myapp cdklocal deploy --all --context stage=local
```

This provisions DynamoDB tables, Cognito user pools, Lambda functions, and API Gateway
exactly as defined in the CDK stacks — no separate setup script needed. Replace Step 4
with this once `apps/infra` is in place.

---

## Step 7 — Remove `serverless-dynamodb`

```bash
pnpm --filter @baseline/api remove serverless-dynamodb
```

In `apps/api/serverless.yml`, remove:
- `serverless-dynamodb` from `plugins`
- The entire `custom.serverless-dynamodb` block

`serverless-esbuild` and `serverless-offline` stay.

---

## Daily workflow

```bash
# Terminal 1 — start MiniStack (keep running)
docker compose up

# Terminal 2 — start API (creates tables + user pool + seeds on first run, then starts)
APP_NAME=myapp pnpm start:api

# Terminal 3 — start frontend
pnpm start:admin
```

**Reset all local state:**

```bash
docker compose down -v   # removes ministack-state volume
docker compose up -d
APP_NAME=myapp pnpm --filter @baseline/api run setup:ministack
```

---

## Verify everything is working

```bash
# DynamoDB — list tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables \
  --region ap-southeast-2

# DynamoDB — scan admin table
aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name myapp-local-admin \
  --region ap-southeast-2

# Cognito — list user pools
aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools \
  --max-results 10 \
  --region ap-southeast-2
```

---

## Summary of changes

| File | Change |
|---|---|
| `docker-compose.yml` | **New** — MiniStack container |
| `apps/api/src/baseblocks/cognito/cognito.service.ts` | Spread `AWS_ENDPOINT_URL` into client constructor |
| `apps/api/scripts/run-api-local.sh` | Set `AWS_ENDPOINT_URL`, `IS_OFFLINE=false`, call `setup:ministack` then `generate:env:local`, remove `AUTHORIZER` |
| `apps/api/scripts/setup-ministack.sh` | **New** — creates DynamoDB tables + Cognito pool + seeds both, writes `.cognito/local-config.json` + `.env.local` |
| `apps/api/package.json` | Add `setup:ministack`; replace `install:dynamodb` |
| `apps/api/serverless.yml` | Remove `serverless-dynamodb` plugin + custom block |
| `apps/api` deps | Remove `serverless-dynamodb` |
