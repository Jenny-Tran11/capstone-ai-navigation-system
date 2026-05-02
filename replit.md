# BaselineJS Core

## Overview

BaselineJS is an open-source, fullstack TypeScript, serverless-first framework designed for building cloud-native applications on AWS.

## Project Structure

This is a **pnpm monorepo** with the following workspaces:

- `apps/web` — Public-facing React/Vite frontend (runs on port 5000)
- `apps/admin` — Admin portal React/Vite frontend (uses AWS Amplify/Cognito auth)
- `apps/api` — Express/Serverless backend (requires AWS credentials + Java for DynamoDB local)
- `apps/infra` — AWS CDK infrastructure definitions
- `packages/client-api` — Shared API client library
- `packages/types` — Shared TypeScript types
- `commands/add-object` — CLI tool for scaffolding new objects

## Running in Replit

Only the `web` frontend is configured to run locally in Replit (port 5000). The `api` and `admin` apps require AWS infrastructure (DynamoDB local needs Java, Cognito for auth).

### Dev Server
- **Workflow:** "Start application" — runs `cd apps/web && npx vite --port 5000 --host 0.0.0.0`
- **Port:** 5000 (webview)

## Key Technologies

- **Frontend:** React 18, Vite 5, TypeScript, reactstrap (Bootstrap)
- **Backend:** Express, Serverless Framework, serverless-offline
- **Database:** DynamoDB (local via serverless-dynamodb plugin for development)
- **Auth:** AWS Cognito + Amplify
- **Package Manager:** pnpm v9+
- **Node:** v20+

## Important Configuration

- `apps/web/vite.config.ts` — Configured with `host: '0.0.0.0'`, `port: 5000`, `allowedHosts: true` for Replit proxy compatibility
- Environment variables for the web app (Cognito IDs, API URL) are given default empty values in vite.config.ts so the dev server starts without AWS setup
- `scripts/project-variables.sh` — Sets `APP_NAME=baseline-core`, `AWS_PROFILE=baseline-core`, `REGION=ap-southeast-2`

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
