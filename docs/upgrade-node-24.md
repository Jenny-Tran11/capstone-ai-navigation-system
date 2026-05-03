# Upgrade to Node.js 24

## Context

The project currently pins Node.js 20 across tooling, CI, and the `engines` field.
AWS CDK 2.177.0 (the installed version) tops out at `NODEJS_22_X` for Lambda — AWS Lambda
has not yet added Node 24 support and neither has the CDK. The Lambda runtime therefore
stays at `NODEJS_22_X` for now and will be bumped in a follow-up once `NODEJS_24_X`
is available.

This plan covers the parts we **can** upgrade today:
local development tooling, CI, and package engine constraints.

---

## Files to change

### 1. Root `package.json`
**File:** `package.json` line 5

```json
// before
"node": ">=20"

// after
"node": ">=24"
```

### 2. `apps/api/package.json`
**File:** `apps/api/package.json` line 6

```json
// before
"node": "20"

// after
"node": "24"
```

### 3. GitHub Actions — deploy workflow
**File:** `.github/workflows/deploy.yml` line 22

```yaml
# before
node-version: 20

# after
node-version: 24
```

### 4. GitHub Actions — build & lint workflow
**File:** `.github/workflows/build-lint.yml` line 22

```yaml
# before
node-version: 20

# after
node-version: 24
```

### 5. Requirements install script
**File:** `scripts/install-requirements.sh` line 38

```bash
# before
bash -i -c 'source ~/.bashrc; nvm install 20; nvm use 20; nvm alias default 20; nvm install-latest-npm; npm install -g pnpm@9; exit;'

# after
bash -i -c 'source ~/.bashrc; nvm install 24; nvm use 24; nvm alias default 24; nvm install-latest-npm; npm install -g pnpm@9; exit;'
```

---

### 6. `apps/infra/package.json` — CDK and constructs bump

`NODEJS_24_X` was added in CDK 2.200.0+. Bump all three CDK packages:

```json
// before
"aws-cdk-lib": "2.177.0",
"cdk-nag": "2.34.0",
"constructs": "10.4.2",
// devDependencies
"aws-cdk": "2.177.0",

// after
"aws-cdk-lib": "2.252.0",
"cdk-nag": "2.38.2",
"constructs": "10.6.0",
// devDependencies
"aws-cdk": "2.252.0",
```

### 7. `apps/infra/src/constructs/baseline-function.ts` — Lambda runtime

```typescript
// before
runtime: lambda.Runtime.NODEJS_22_X,

// after
runtime: lambda.Runtime.NODEJS_24_X,
```

---

## Local developer steps

After the files above are updated, each developer runs:

```bash
nvm install 24 && nvm use 24 && nvm alias default 24
node -v          # should print v24.x.x
pnpm install     # reinstall native addons compiled for Node 24
pnpm build       # verify build passes
pnpm run start:all
```

---

## Verification

1. `node -v` → `v24.x.x`
2. `pnpm build` — all packages build without errors
3. `pnpm lint` — no new lint errors introduced by the runtime change
4. `pnpm run start:all` — api, admin, and web start cleanly
5. Push a branch — CI (build-lint workflow) runs on Node 24 and passes
