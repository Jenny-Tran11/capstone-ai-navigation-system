# Plan: Add `swr-client` and `utils` to `packages/`

## Context

Reference implementation: `/Users/khiem/Developing/FinalTransportApp/packages/swr-user` and `packages/utils`.

- **`swr-client`** — SWR data-fetching hooks that wrap `@baseline/client-api` calls, keeping components free of raw fetch logic. Named `swr-client` (not `swr-user`) to match Baseline's naming convention.
- **`utils`** — Shared Zod validation schemas and a `generateId()` utility for prefixed nano IDs.

Both packages scope to the types and API calls that currently exist (`admin`). Workspace/permission stubs are included as empty files for when those baseblocks are added.

---

## Package 1: `packages/swr-client`

### File structure

```
packages/swr-client/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── admin.ts
```

### `package.json`

```json
{
  "name": "@baseline/swr-client",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "lint": "npx eslint '*.ts' --no-error-on-unmatched-pattern",
    "type-check": "npx tsc --noEmit",
    "pretty": "npx prettier --write '*.{ts,tsx,js,json,css,scss,md,yml,yaml,html}'"
  },
  "dependencies": {
    "@baseline/types": "workspace:1.0.0",
    "@baseline/client-api": "workspace:1.0.0",
    "swr": "2.3.5"
  },
  "devDependencies": {
    "@types/node": "20.11.26"
  }
}
```

### `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDirs": ["./"],
    "outDir": ".esbuild",
    "typeRoots": ["./node_modules/@types"]
  },
  "include": ["../../packages/types", "."],
  "watchOptions": {
    "excludeDirectories": ["node_modules", ".esbuild"]
  }
}
```

### `eslint.config.mjs`

```js
import globals from 'globals';
import rootConfig from '../../eslint.config.mjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(...rootConfig, {
  files: ['*.ts'],
  languageOptions: {
    parserOptions: { project: './tsconfig.json' },
    globals: { ...globals.browser, process: 'readonly' },
  },
  rules: {},
});
```

### `admin.ts`

```typescript
import useSWR from 'swr';
import { type Admin } from '@baseline/types/admin';
import { getAllAdmins } from '@baseline/client-api/admin';
import { type RequestHandler } from '@baseline/client-api/request-handler';

export const useAdmins = (requestHandler: RequestHandler | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Admin[], unknown>(
    requestHandler ? 'admin/list' : null,
    requestHandler ? () => getAllAdmins(requestHandler) : null,
  );

  return {
    admins: data,
    isLoading,
    error,
    mutateAdmins: mutate,
  };
};
```

> When workspace/permission baseblocks are added, create `workspace.ts` and `permission.ts` here following the same pattern.

---

## Package 2: `packages/utils`

### File structure

```
packages/utils/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── admin.ts
└── service-object.ts
```

### `package.json`

```json
{
  "name": "@baseline/utils",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "lint": "npx eslint '*.ts'",
    "type-check": "npx tsc --noEmit",
    "pretty": "npx prettier --write '*.{ts,tsx,js,json,css,scss,md,yml,yaml,html}'"
  },
  "dependencies": {
    "@baseline/types": "workspace:1.0.0",
    "nanoid": "5.1.5",
    "zod": "4.0.16"
  }
}
```

> No `lodash-es` yet — add it if/when a consumer needs it.

### `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDirs": ["./"],
    "outDir": ".esbuild"
  },
  "include": ["../../packages/types", "."],
  "watchOptions": {
    "excludeDirectories": ["node_modules", ".esbuild"]
  }
}
```

### `eslint.config.mjs`

Same as `swr-client` above (copy verbatim, change `project` path to `./tsconfig.json`).

### `admin.ts`

```typescript
import { z } from 'zod';

export const createAdminSchema = z.object({
  userEmail: z.string().email(),
});

export const deleteAdminSchema = z.object({
  adminId: z.string(),
});
```

### `service-object.ts`

```typescript
import { customAlphabet } from 'nanoid';

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const nanoid = customAlphabet(alphabet, 16);

// Extend this map as new entity types are introduced
const prefixes: Record<string, string> = {
  admin: 'adm',
  workspace: 'ws',
  permission: 'prm',
};

export const generateId = (entity: string): string => {
  const prefix = prefixes[entity] ?? 'id';
  return `${prefix}_${nanoid()}`;
};
```

> When `@baseline/types` defines a typed `ObjectIdPrefixes` map (as in FinalTransportApp), replace the plain `Record<string, string>` with that typed import.

---

## Steps

### 1. Create package directories and files

```
packages/swr-client/package.json
packages/swr-client/tsconfig.json
packages/swr-client/eslint.config.mjs
packages/swr-client/admin.ts

packages/utils/package.json
packages/utils/tsconfig.json
packages/utils/eslint.config.mjs
packages/utils/admin.ts
packages/utils/service-object.ts
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Add `swr` to `swr-client` and `zod` + `nanoid` to `utils`

pnpm resolves these from workspace root — `pnpm install` after adding `package.json` files is sufficient.

### 4. Wire into consumers (optional first pass)

- `apps/admin` — import `useAdmins` from `@baseline/swr-client/admin` to replace raw `getAllAdmins` calls
- `apps/api` — import `createAdminSchema` from `@baseline/utils/admin` to validate request bodies

---

## Critical files

| Action | Path |
|--------|------|
| Create | `packages/swr-client/package.json` |
| Create | `packages/swr-client/tsconfig.json` |
| Create | `packages/swr-client/eslint.config.mjs` |
| Create | `packages/swr-client/admin.ts` |
| Create | `packages/utils/package.json` |
| Create | `packages/utils/tsconfig.json` |
| Create | `packages/utils/eslint.config.mjs` |
| Create | `packages/utils/admin.ts` |
| Create | `packages/utils/service-object.ts` |

---

## Verification

```bash
# Types resolve
cd packages/swr-client && ../../node_modules/.bin/tsc --noEmit
cd packages/utils     && ../../node_modules/.bin/tsc --noEmit

# Importable from admin app (smoke check)
node -e "require('@baseline/swr-client/admin')"
node -e "require('@baseline/utils/admin')"
```
