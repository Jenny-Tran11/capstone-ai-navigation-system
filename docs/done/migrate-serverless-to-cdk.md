# Migrating from Serverless Framework to AWS CDK v2

Serverless Framework v3 is no longer open source. This guide covers what changes,
what stays, and how to operate the new CDK app.

For the full implementation spec (all source files), see [`build-infra-cdk.md`](./build-infra-cdk.md).

---

## Why CDK

| | Serverless Framework v3 | AWS CDK v2 |
|---|---|---|
| License | Closed source (v3+) | Apache 2.0 |
| Language | YAML | TypeScript |
| Type safety | None | Full |
| Reuse | Copy-paste YAML | Constructs + classes |
| Local dev | serverless-offline | serverless-offline (kept) |
| State management | Serverless Dashboard | CloudFormation |
| Cost | Paid (v3+) | Free |

---

## What changes, what stays

**Removed (IaC only — delete these files):**
- `apps/api/serverless.yml`
- `apps/admin/serverless.yml`
- `apps/web/serverless.yml`
- `serverless-esbuild`, `serverless-s3-sync`, `serverless-baseline-invalidate-cloudfront` from dependencies

**Kept for local development (unchanged):**
- `serverless-offline` — still powers `pnpm start:api`
- `serverless-dynamodb` — still runs DynamoDB locally on port 8000
- All seed files (`admin.seed.json`, etc.)
- Rename `apps/api/serverless.yml` → `apps/api/serverless.local.yml` to make clear this file is local-only

**Added:**
- `apps/infra/` — CDK TypeScript app that owns all AWS infrastructure

---

## New structure

```
apps/infra/
├── bin/
│   └── infra.ts                    # CDK App entry point
├── src/
│   ├── config/
│   │   ├── stage-config.ts         # StageConfig type + getStageConfig()
│   │   └── tables.ts               # DynamoDB table definitions (shared source of truth)
│   ├── constructs/
│   │   ├── baseline-function.ts    # Lambda construct (Node 20, ARM64, esbuild)
│   │   ├── baseline-spa-app.ts     # SPA hosting (S3 + CloudFront + optional BucketDeployment)
│   │   ├── baseline-alarms.ts      # CloudWatch alarms per Lambda (errors + throttles → SNS)
│   │   └── baseline-dashboard.ts   # CloudWatch dashboard (invocations, errors, duration)
│   └── stacks/
│       ├── shared-stack.ts         # STATEFUL — Cognito + all DynamoDB tables
│       ├── api-stack.ts            # STATELESS — REST API Gateway + Lambdas + alarms + dashboard
│       ├── admin-stack.ts          # STATELESS — admin SPA (S3 + CloudFront)
│       └── web-stack.ts            # STATELESS — web SPA (S3 + CloudFront)
├── cdk.json
├── package.json
└── tsconfig.json
```

---

## Mapping: `apps/api/serverless.yml` → CDK

| Serverless concept | CDK replacement |
|---|---|
| `provider.runtime: nodejs20.x` | `Runtime.NODEJS_20_X` in `BaselineFunction` |
| `provider.architecture: arm64` | `Architecture.ARM_64` in `BaselineFunction` |
| `provider.timeout: 30` | `Duration.seconds(30)` in `BaselineFunction` |
| `provider.memorySize: 2048` | `memorySize: 2048` in `BaselineFunction` |
| `provider.logRetentionInDays: 90` | `logRetentionDays` from `StageConfig` (90 prod / 14 staging) |
| `provider.environment` | `environment` prop on `BaselineFunction` |
| `provider.iam.role.statements` | `fn.addToRolePolicy(new PolicyStatement(...))` in `ApiStack` |
| `plugins: serverless-esbuild` | Built into `NodejsFunction` via `bundling` in `BaselineFunction` |
| `plugins: serverless-dynamodb` | **Kept** — local dev only |
| `plugins: serverless-offline` | **Kept** — local dev only |
| `resources: CognitoUserPool` | `cognito.UserPool` in `SharedStack` |
| `resources: adminTable (DynamoDB)` | `dynamodb.Table` in `SharedStack` via `getTableDefs()` loop |
| `functions: ApiAdmin` | `BaselineFunction` + `addRoute()` helper in `ApiStack` |
| `custom.deletionPolicy: prod → Retain` | `RemovalPolicy.RETAIN` when `config.retain === true` |
| `Outputs` | `new CfnOutput(...)` in each construct |

## Mapping: `apps/admin/serverless.yml` + `apps/web/serverless.yml` → CDK

| Serverless concept | CDK replacement |
|---|---|
| `plugins: serverless-s3-sync` | `BucketDeployment` in `BaselineSpaApp` (when `sourceDir` provided) |
| `plugins: serverless-baseline-invalidate-cloudfront` | `distribution` prop on `BucketDeployment` (auto-invalidates `/*`) |
| `WebsiteS3Bucket` (raw CFN) | `s3.Bucket` in `BaselineSpaApp` |
| `WebsiteCloudFrontDistributionOriginAccessControl` | `S3OriginAccessControl` + `S3BucketOrigin.withOriginAccessControl()` |
| `WebsiteCloudFrontDistribution` | `cloudfront.Distribution` in `BaselineSpaApp` |
| `CloudfrontResponsePolicy` (no-cache) | `ResponseHeadersPolicy` in `BaselineSpaApp` |
| `CustomErrorResponses: 403/404 → index.html` | `errorResponses` on `Distribution` |
| `Outputs: CDNDistributionId, S3Bucket` | `CfnOutput` in `BaselineSpaApp` |

---

## Stack deploy order

CDK resolves dependencies automatically. `ApiStack` receives Cognito + table references
as constructor props, which implicitly declares the dependency.

```
shared  ──→  api     (depends on shared for UserPool + tables)
             admin   (independent — parallel with api)
             web     (independent — parallel with api)
```

1. `shared` — Cognito UserPool + all DynamoDB tables (stateful, no deps)
2. `api` — Lambda + REST API Gateway (depends on shared)
3. `admin` — admin SPA bucket + CloudFront (no deps, parallel with api)
4. `web` — web SPA bucket + CloudFront (no deps, parallel with api)

---

## Adding a new DynamoDB table

Only `src/config/tables.ts` changes:

```typescript
// Add to the array returned by getTableDefs():
{
  tableName:        name('my-table'),
  partitionKeyName: 'myId',
}
```

`SharedStack` iterates `getTableDefs()` automatically — no stack code changes needed.
The same definitions can be read by `serverless.local.yml` for local seeding.

---

## Adding a new Lambda route

In `src/stacks/api-stack.ts`, call the `addRoute` helper:

```typescript
const myFn = addRoute({
  constructId: 'MyLambda',
  entryPath:   'baseblocks/my-feature/my-feature-api.ts',
  pathSegment: 'my-feature',
});
```

This mounts both `/my-feature` and `/my-feature/{proxy+}` with the Cognito JWT authorizer,
grants the shared DynamoDB + Cognito IAM policies, and adds the function to alarms and
the dashboard automatically.

---

## Bootstrap (one-time per AWS account + region)

```bash
npm install -g aws-cdk

APP_NAME=myapp cdk bootstrap \
  --context stage=staging \
  aws://ACCOUNT_ID/ap-southeast-2

# Verify
aws cloudformation describe-stacks \
  --stack-name CDKToolkit \
  --region ap-southeast-2 \
  --query "Stacks[0].StackStatus"
```

---

## Deployment workflow

```bash
# 1. Preview what will change
APP_NAME=myapp pnpm diff:staging

# 2. Deploy to staging
APP_NAME=myapp AWS_PROFILE=myprofile pnpm deploy:staging

# 3. Deploy to prod
APP_NAME=myapp AWS_PROFILE=myprofile pnpm deploy:prod
```

Root `package.json` scripts (add these):

```json
{
  "scripts": {
    "synth":           "pnpm --filter @baseline/infra run synth",
    "deploy:staging":  "pnpm --filter @baseline/admin run build && pnpm --filter @baseline/web run build && pnpm --filter @baseline/infra run deploy:staging",
    "deploy:prod":     "pnpm --filter @baseline/admin run build && pnpm --filter @baseline/web run build && pnpm --filter @baseline/infra run deploy:prod",
    "destroy:staging": "pnpm --filter @baseline/infra run destroy:staging",
    "diff:staging":    "pnpm --filter @baseline/infra run diff:staging",
    "diff:prod":       "pnpm --filter @baseline/infra run diff:prod"
  }
}
```

The `deploy:staging` and `deploy:prod` scripts build both SPAs first because
`WebStack` resolves `sourceDir` at synth time — the `.dist/` folder must exist before
`cdk deploy` runs.

---

## Environment variables for frontends

After deploying, pull the Cognito IDs from CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name myapp-staging-shared \
  --query "Stacks[0].Outputs" \
  --output table
```

| CloudFormation Output | Frontend env var |
|---|---|
| `UserPoolId` | `VITE_COGNITO_USER_POOL_ID` |
| `UserPoolClientId` | `VITE_COGNITO_USER_POOL_WEB_CLIENT_ID` |

---

## Rollback

CloudFormation rolls back automatically on failure. For manual rollback:

```bash
aws cloudformation cancel-update-stack \
  --stack-name myapp-staging-api
```

On `prod`, the `shared` stack uses `RemovalPolicy.RETAIN` — Cognito and DynamoDB
resources are never deleted even if the stack is destroyed.
