# BaselineJS Core

## Overview

BaselineJS is an open-source, fullstack TypeScript, serverless-first framework designed for building cloud-native applications on AWS.

## Project Structure

This is a **pnpm monorepo** with the following workspaces:

- `apps/web` — Public-facing React/Vite frontend (runs on port 5000)
- `apps/admin` — Admin portal React/Vite frontend (Tailwind v4 + shadcn/ui, AWS Amplify/Cognito auth)
- `apps/api` — Express/Serverless backend (requires AWS credentials + Java for DynamoDB local)
- `apps/infra` — AWS CDK infrastructure definitions
- `packages/client-api` — Shared API client library
- `packages/types` — Shared TypeScript types
- `packages/ui` — Shared UI package: Tailwind v4 globals + 50+ shadcn/ui primitives
- `commands/add-object` — CLI tool for scaffolding new objects

## Running in Replit

Only the `web` frontend is configured to run locally in Replit (port 5000). The `api` and `admin` apps require AWS infrastructure (DynamoDB local needs Java, Cognito for auth).

### Dev Server
- **Workflow:** "Start application" — runs `cd apps/web && npx vite --port 5000 --host 0.0.0.0`
- **Port:** 5000 (webview)

## Key Technologies

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS v4, shadcn/ui (new-york style)
- **UI Package:** `packages/ui` — `@baseline/ui` — exports all primitives + `globals.css` with OKLch color tokens
- **Backend:** Express, Serverless Framework, serverless-offline
- **Database:** DynamoDB (local via serverless-dynamodb plugin for development)
- **Auth:** AWS Cognito + Amplify
- **Package Manager:** pnpm v9+
- **Node:** v20+

## UI / Styling Architecture

`packages/ui` is the design system:
- `src/globals.css` — Tailwind v4 `@import 'tailwindcss'` + `@theme` block with OKLch color tokens (light + dark)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `src/primitives/` — 50+ shadcn/ui primitives (new-york style)
- `src/index.ts` — barrel export of all primitives + `cn`
- `package.json` exports: `"."` → `src/index.ts`, `"./globals.css"` → `src/globals.css`

`apps/admin` consumes it via:
- `src/index.css` → `@import '@baseline/ui/globals.css'`
- Vite aliases: `@baseline/ui` → `packages/ui/src`, `@baseline/ui/lib` → `packages/ui/src/lib`
- `@tailwindcss/vite` plugin handles CSS compilation
- `components.json` — shadcn config pointing at `@baseline/ui/primitives` for code-gen

### Migration: SCSS → Tailwind
All SCSS module files have been removed from `apps/admin`. All components now use Tailwind utility classes. Reactstrap has been replaced with shadcn/ui Dialog, Input, Label primitives.

## Important Configuration

- `apps/web/vite.config.ts` — Configured with `host: '0.0.0.0'`, `port: 5000`, `allowedHosts: true`
- `apps/admin/vite.config.ts` — Tailwind v4 plugin, path aliases for `@` and `@baseline/ui`
- Environment variables given default empty values in vite configs so dev servers start without AWS setup
- `scripts/project-variables.sh` — Sets `APP_NAME=baseline-bolt`, `AWS_PROFILE=baseline-bolt`, `REGION=ap-southeast-2`

## Deployment

Configured as a **static** deployment:
- Build command: `cd apps/web && npx vite build`
- Public directory: `apps/web/.dist`

## AWS / Full Setup

For full functionality (API + Admin), you need:
1. AWS account + IAM credentials
2. Java (for DynamoDB local)
3. `pnpm run setup` to configure project name and region
4. `pnpm run aws:profile` to set up AWS credentials
5. `pnpm run deploy:staging` to deploy to AWS
