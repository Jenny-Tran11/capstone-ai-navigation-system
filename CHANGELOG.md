# Changelog

All notable changes to this project are documented here.

## [Unreleased] — 2026-05-03

### Added
- **Workspace system** — create/manage workspaces via admin and user-facing API routes
- **Permission system** — `SUPER` and `WORKSPACE` permission types with `checkPermission` middleware; DynamoDB table with GSIs for owner and type lookups
- **`@baseline/swr-client` package** — SWR data-fetching hooks wrapping all API calls, keeping components free of raw fetch logic
- **`@baseline/utils` package** — shared Zod validation schemas and `generateId()` utility for prefixed nano IDs
- **`@baseline/ui` design system** — 50+ shadcn/ui primitives and composite components (DataTable, Modal, Entity views) extracted into a shared package

### Changed
- Admin dashboard rebuilt with shadcn/ui components and Tailwind CSS v4
- Serverless YML configs fully removed from `apps/admin` and `apps/web`; infrastructure now owned entirely by `apps/infra` (AWS CDK)

---

## [0.3.0] — 2026-05-02

### Added
- **MiniStack local dev** (`[FEAT-001]`) — Docker-based AWS emulation replacing `serverless-dynamodb` Java JAR; emulates DynamoDB, Cognito, Lambda, and API Gateway locally with no signup required
- `docker-compose.yml` — MiniStack container with persistent state volume
- `apps/api/scripts/setup-ministack.sh` — idempotent script that creates DynamoDB tables, Cognito user pool, and seeds test users on first run
- `apps/infra` — AWS CDK 2.x app owning all infrastructure (Lambda, API Gateway, Cognito, S3, CloudFront, DynamoDB); replaces Serverless Framework for deployments
- Web app auth — Amplify + Cognito sign-in flow with protected routes (`SignIn`, `GetStarted` pages)
- Web app pages — `Home`, `About`, `Contact`, `GetStarted`, `SignIn` with responsive layout down to 375px

### Changed
- **Infrastructure migrated from Serverless Framework to AWS CDK** (`[REF-001]`) — `serverless.yml` in `apps/api`, `apps/admin`, `apps/web` removed; `apps/api/serverless.yml` kept as `serverless.local.yml` for local dev only
- **SCSS removed, fully migrated to Tailwind CSS v4** — `apps/admin` and `apps/web` now use Tailwind; `@baseline/ui` is the single source of styled components
- Fixed local Cognito auth — Amplify redirected to MiniStack endpoint via `AWS_ENDPOINT_URL`
- Fixed TypeScript resolution for `@baseline/ui` primitive imports in admin
- Replit artifacts removed; project folder structure cleaned up and renamed (`[REF-001]`)
- Website copy and links replaced with real content
- Warm editorial design applied to website components

### Removed
- `serverless-dynamodb` plugin (Java JAR on port 8000) — replaced by MiniStack
- Hardcoded `AUTHORIZER` Cognito bypass in local start script — Cognito is now fully emulated
- Bootstrap dependency from `apps/web`

---

## [0.2.0] — 2025-01-23

### Changed
- ESLint upgraded to v9 flat config (`eslint.config.mjs`)
- Vite, stylelint, and PostCSS version bumps
- `nanoid` resolution fix

---

## [0.1.0] — 2024-04-15

### Added
- pnpm 9 monorepo workspace structure
- GitHub CI/CD pipelines
- Requirements installation script (`pnpm run install:requirements`)

### Changed
- Upgraded to Node.js 20, npm 10, AWS SDK v3
- Upgraded to React 18 with new `react-router-dom` data router structure
- Switched from unmaintained `serverless-dynamodb-local` to `serverless-dynamodb`
- Switched ESLint config to `tseslint`
- Moved Sidebar into a Layout component
- pnpm upgraded from v7 → v8 → v9
- Express, axios, Vite, AWS Amplify version bumps
- License updated to MIT
