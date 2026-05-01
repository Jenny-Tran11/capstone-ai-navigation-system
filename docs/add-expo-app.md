# Mobile App Scaffold Script Plan

This document replaces the manual setup guide with a plan to create a repeatable script that scaffolds `apps/mobile` in the Baseline monorepo.

Reference implementation and design:
- Reference repo: `/Users/khiem/Developing/FinalTransportApp`
- Design target: the Mobile App Design Doc folder architecture (Expo Router route groups, NativeWind, Amplify, SWR, shared client-api/types packages, UI primitives, and feature-first structure)

---

## Goal

Create a single script (Node ESM) that:
1. Creates a production-ready Expo app at `apps/mobile`.
2. Writes all required config/files for the agreed architecture.
3. Installs dependencies in the correct workspace package.
4. Fails safely if `apps/mobile` already exists.
5. Generates placeholder assets (icons/splash) with no external image dependency.

---

## Proposed Script Location

- `scripts/mobile/add-mobile-app.ts`

Optional npm script in root `package.json`:

```json
{
  "scripts": {
    "mobile:add": "tsx scripts/mobile/add-mobile-app.ts"
  }
}
```

---

## Script Design (based on your snippet)

### Safety and structure

- Resolve monorepo root from script location.
- Abort if `apps/mobile` already exists:
  - print a clear error
  - exit code `1`
- Use idempotent directory creation (`mkdirSync(..., { recursive: true })`).

### File generation strategy

- Keep all templates embedded as string constants in the script for easy versioning.
- Use a helper `write(path, content)` that:
  - creates parent directories
  - writes UTF-8 content
  - preserves LF line endings
- Use a helper `writeExecutable(path, content)` for shell scripts (`chmod 0o755`).

### Asset generation strategy

Use the minimal PNG generator approach from your snippet:
- internal `crc32`, PNG chunk helpers, and `createPlaceholderPng(width, height, color)`
- generate these defaults:
  - `assets/images/icon.png` (1024x1024)
  - `assets/images/adaptive-icon.png` (1024x1024)
  - `assets/images/splash.png` (1242x2436 or 1179x2556)
  - `assets/images/favicon.png` (48x48)

---

## Files the Script Will Create

### App shell

- `apps/mobile/package.json`
- `apps/mobile/app.json` (or `app.config.ts` if dynamic env is needed immediately)
- `apps/mobile/tsconfig.json`
- `apps/mobile/babel.config.js`
- `apps/mobile/metro.config.js`
- `apps/mobile/tailwind.config.js`
- `apps/mobile/nativewind-env.d.ts`
- `apps/mobile/global.css`
- `apps/mobile/eas.json`
- `apps/mobile/.gitignore`

### Expo Router structure

- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/app/error.tsx`
- `apps/mobile/app/+not-found.tsx`
- `apps/mobile/app/(auth)/_layout.tsx`
- `apps/mobile/app/(auth)/sign-in.tsx`
- `apps/mobile/app/(auth)/sign-up.tsx`
- `apps/mobile/app/(app)/_layout.tsx`
- `apps/mobile/app/(app)/(tabs)/_layout.tsx`
- `apps/mobile/app/(app)/(tabs)/home/index.tsx`
- `apps/mobile/app/(app)/(tabs)/more/index.tsx`

### Feature modules

- `apps/mobile/src/features/auth/SignInScreen.tsx`
- `apps/mobile/src/features/auth/SignUpScreen.tsx`
- `apps/mobile/src/features/home/HomeScreen.tsx`
- `apps/mobile/src/features/more/MoreScreen.tsx`

### Core shared UI and utilities (minimal first pass)

- `apps/mobile/src/components/ui/text.tsx`
- `apps/mobile/src/components/ui/button.tsx`
- `apps/mobile/src/components/ScreenContent.tsx`
- `apps/mobile/src/components/screen-loader/ScreenLoader.tsx`
- `apps/mobile/src/components/error-state/ErrorState.tsx`
- `apps/mobile/src/hooks/useIsAuthenticated.ts`
- `apps/mobile/src/lib/cn.ts`
- `apps/mobile/src/lib/amplify.ts`
- `apps/mobile/src/styles/typography.ts`
- `apps/mobile/src/test-ids/index.ts`

### Assets

- `apps/mobile/assets/images/icon.png`
- `apps/mobile/assets/images/adaptive-icon.png`
- `apps/mobile/assets/images/splash.png`
- `apps/mobile/assets/images/favicon.png`

---

## Dependency Plan

The script should install the same core stack used by `FinalTransportApp` mobile, excluding TanStack Query/tRPC. Keep versions aligned with that repo where possible.

Minimum baseline:

```bash
pnpm --filter @baseline/mobile add expo expo-router react-native react react-dom
pnpm --filter @baseline/mobile add nativewind tailwindcss
pnpm --filter @baseline/mobile add aws-amplify @aws-amplify/react-native
pnpm --filter @baseline/mobile add swr zustand zod react-hook-form @hookform/resolvers axios
pnpm --filter @baseline/mobile add @shopify/flash-list expo-notifications expo-device @sentry/react-native
pnpm --filter @baseline/mobile add @baseline/types @baseline/client-api @baseline/swr-user @baseline/utils
pnpm --filter @baseline/mobile add -D babel-plugin-nativewind typescript @types/react @types/react-native
```

---

## Implementation Phases

### Phase 1: Script foundation

- Create script file and utility helpers:
  - `write`, `writeExecutable`, `ensureDir`, `run`, `abortIfExists`
- Add PNG generation helpers from your snippet.

### Phase 2: App skeleton

- Generate package/config files.
- Generate route groups and basic screen re-exports.
- Generate minimal `src/features/*` screen content.

### Phase 3: Styling/auth/data baseline

- Wire NativeWind and `global.css`.
- Add Amplify bootstrap and auth guard flow in router layouts.
- Add SWR config/provider setup in root layout.

### Phase 4: Quality and ergonomics

- Add root command (`mobile:add`).
- Add post-run output summary (created files + next steps).
- Add optional `--force` flag in a second iteration if needed.

---

## Acceptance Criteria

- Running `pnpm mobile:add` on a clean repo creates `apps/mobile` with no manual edits required to start.
- `pnpm --filter @baseline/mobile start` boots Expo with valid routing.
- Sign-in route and app route groups exist and navigate correctly.
- NativeWind classes compile correctly.
- Placeholder image assets are generated and referenced in Expo config.
- Script exits safely when `apps/mobile` already exists.

---

## Example Script Skeleton

```ts
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..', '..');
const pkgDir = join(root, 'apps', 'mobile');

if (existsSync(pkgDir)) {
  console.error('\\nError: apps/mobile/ already exists. Aborting.\\n');
  process.exit(1);
}

const write = (path: string, content: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
};

const writeExecutable = (path: string, content: string) => {
  write(path, content);
  chmodSync(path, 0o755);
};

// TODO: add PNG helpers from design snippet
// TODO: write all config files and route files
// TODO: print next steps
```

---

## Next Step

After this plan is approved, implement the script in `scripts/mobile/add-mobile-app.ts` and run it once to verify the generated app builds and starts with the `FinalTransportApp`-aligned stack and the folder structure from your design doc.
