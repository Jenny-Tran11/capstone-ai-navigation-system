#!/usr/bin/env bash
# Run full workspace TypeScript checks (same surface as local verification).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== Typecheck workspaces (tsc --noEmit) ==="
for pkg in @baseline/api @baseline/admin @baseline/web @baseline/infra @baseline/ui; do
  echo "=== $pkg ==="
  pnpm --filter "$pkg" exec tsc --noEmit
done

echo "=== @baseline/client-api ==="
pnpm --filter @baseline/admin exec tsc --noEmit -p ../../packages/client-api/tsconfig.json

echo "=== @baseline/types ==="
pnpm --filter @baseline/api exec tsc --noEmit -p ../../packages/types/tsconfig.json

echo "=== @baseline/utils ==="
pnpm --filter @baseline/utils run type-check

echo "=== @baseline/swr-client ==="
pnpm --filter @baseline/swr-client run type-check
