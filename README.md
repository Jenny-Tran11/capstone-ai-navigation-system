# Baseline

A fullstack TypeScript monorepo for building cloud-native applications on AWS. Built with React, Express, AWS CDK, and a shared design system.

## Project Structure

```
apps/
├── admin       — Admin dashboard (React + Vite)
├── api         — Express API (Lambda-deployed)
├── infra       — AWS CDK infrastructure
└── web         — Public website (React + Vite + Amplify auth)

packages/
├── client-api  — Shared API client (axios singleton)
├── swr-client  — SWR data-fetching hooks
├── types       — Shared TypeScript types
├── ui          — Design system (Tailwind v4 + shadcn/ui)
└── utils       — Shared utilities and Zod schemas

commands/
└── add-object  — CLI scaffolding tool
```

## Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript 5, React Router 6 |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **Backend** | Node.js 20+, Express, AWS Lambda |
| **Infrastructure** | AWS CDK 2.x, CloudFormation |
| **Database** | DynamoDB |
| **Auth** | AWS Cognito + Amplify |
| **Local AWS emulation** | MiniStack (via Docker) |
| **Package Management** | pnpm 9+ monorepo |
| **Linting & Formatting** | ESLint 9, Prettier |

## AWS Services

- Cognito
- S3
- Lambda
- DynamoDB
- CloudFormation
- Route53
- Systems Manager
- CloudFront
- API Gateway
- CloudWatch
- SNS

## Features

- **Admin dashboard** — workspace and permission management, user admin
- **Public website** — authenticated pages via Cognito + Amplify (Home, About, Contact, Sign In, Get Started)
- **Workspace system** — create workspaces, assign users via `WORKSPACE` permissions
- **Permission system** — `SUPER` and `WORKSPACE` permission types with middleware enforcement
- **Design system** — 50+ shadcn/ui primitives + composite components in `@baseline/ui`
- **SWR data layer** — `@baseline/swr-client` hooks wrapping all API calls

## Setup

### Requirements

- macOS / Linux / WSL
- Node.js v20+ [(install via nvm)](https://github.com/nvm-sh/nvm#install--update-script)
- pnpm v9+ (`npm install -g pnpm@9`)
- [AWS CLI v2](https://aws.amazon.com/cli)
- [Docker](https://docs.docker.com/get-docker/) — for MiniStack local AWS emulation
- [jq](https://stedolan.github.io/jq/download/)

### Getting Started

1. `pnpm install`
2. `pnpm run setup` — name the project and set the AWS region
3. `pnpm run aws:profile` — configure AWS credentials
4. `pnpm run deploy:staging` — build and deploy to staging
5. `pnpm run add:user:staging` — create an admin user
6. `pnpm run urls:staging` — view deployment URLs

## Local Development

MiniStack emulates DynamoDB, Cognito, Lambda, and API Gateway locally via Docker. No AWS account needed for local dev.

```bash
# Start MiniStack (keep running in a dedicated terminal)
docker compose up

# Generate local env files
pnpm run generate:env:local

# Start all apps concurrently
pnpm run start:all
```

Or start each individually:

```bash
pnpm run start:api     # Express API on port 4000 (creates tables + Cognito pool on first run)
pnpm run start:admin   # Admin dashboard on port 5002
pnpm run start:web     # Public website on port 5173
```

**Default local credentials:** `example@devika.com` / `Password123!`

**Reset local state:**

```bash
docker compose down -v   # wipe MiniStack state
docker compose up -d
```

### Local Limitations

- No local S3 — falls back to staging S3
- Admin Cognito UI requires an active AWS Cognito user pool (staging or MiniStack)

## Deployment

Uses AWS CDK. Swap `staging` for `prod` to target production.

```bash
pnpm run deploy:staging       # build admin + web, then deploy via CDK
pnpm run deploy:prod          # production deploy (requires approval)
pnpm run diff:staging         # preview CDK changes before deploying
pnpm run destroy:staging      # tear down staging stack
```

## Scaffolding

Generate a new data model with the CLI tool:

```bash
pnpm run add:object
```

## License

Original Frameworks belong to Devika Pty Ltd
This framework is opensourced, this version is the newest customised update
MIT
