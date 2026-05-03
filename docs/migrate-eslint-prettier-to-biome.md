# Migrate ESLint + Prettier → Biome

Biome replaces both ESLint and Prettier with a single Rust-based tool. It is 10–100× faster, requires zero plugins, and produces identical formatting output from one config file at the repo root.

---

## What we have today

| Tool | Version | Purpose |
|---|---|---|
| `eslint` | 9.17.0 | Linting |
| `@typescript-eslint/eslint-plugin` | 8.18.1 | TypeScript rules |
| `@typescript-eslint/parser` | 8.18.1 | TypeScript parsing |
| `typescript-eslint` | 8.18.1 | Config helper |
| `@eslint/js` | 9.17.0 | JS recommended rules |
| `eslint-plugin-react` | per app | React rules |
| `eslint-plugin-react-hooks` | per app | Hooks rules |
| `eslint-config-prettier` | 9.1.0 | Disables ESLint formatting rules |
| `prettier` | 2.4.1 | Formatting |

Config files that will be deleted:

```
eslint.config.mjs                        (root)
apps/admin/eslint.config.mjs
apps/web/eslint.config.mjs
apps/api/eslint.config.mjs
packages/types/eslint.config.mjs
packages/utils/eslint.config.mjs
packages/client-api/eslint.config.mjs
packages/swr-client/eslint.config.mjs
.prettierrc.js                           (root)
apps/admin/.prettierrc.js
apps/web/.prettierrc.js
```

---

## Step 1 — Install Biome

Add Biome once at the workspace root. It runs across all packages from one install.

```bash
pnpm add -D -w @biomejs/biome
```

Remove all ESLint and Prettier packages:

```bash
pnpm remove -w \
  eslint \
  @eslint/js \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  typescript-eslint \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-config-prettier \
  prettier
```

Also remove per-package `prettier` devDependencies from:
- `apps/admin/package.json`
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/ui/package.json`
- `packages/types/package.json`
- `packages/utils/package.json`
- `packages/client-api/package.json`
- `packages/swr-client/package.json`

---

## Step 2 — Create `biome.json` at the repo root

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "node_modules",
      "dist",
      ".cognito",
      "pnpm-lock.yaml",
      "**/*.d.ts"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "arrowParentheses": "always",
      "semicolons": "always"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
```

This mirrors the current Prettier config (`semi: true`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'all'`, `arrowParens: 'always'`, `printWidth: 80`).

---

## Step 3 — Update `package.json` scripts

### Root `package.json`

Replace:

```json
"lint":  "pnpm --if-present --recursive --parallel run lint",
"pretty": "pnpm --if-present --recursive --parallel run pretty"
```

With:

```json
"lint":   "biome lint ./apps ./packages",
"format": "biome format --write ./apps ./packages",
"check":  "biome check --write ./apps ./packages"
```

`check` runs lint + format + import organisation in one pass — use it as the main pre-commit command.

### Per-package `package.json` scripts

Remove the `lint` and `pretty` scripts from every workspace package. They are no longer needed — all linting and formatting is driven from the root.

Affected packages:
- `apps/admin`, `apps/web`, `apps/api`
- `packages/ui`, `packages/types`, `packages/utils`, `packages/client-api`, `packages/swr-client`

---

## Step 4 — Delete old config files

```bash
# ESLint configs
rm eslint.config.mjs
rm apps/admin/eslint.config.mjs
rm apps/web/eslint.config.mjs
rm apps/api/eslint.config.mjs
rm packages/types/eslint.config.mjs
rm packages/utils/eslint.config.mjs
rm packages/client-api/eslint.config.mjs
rm packages/swr-client/eslint.config.mjs

# Prettier configs
rm .prettierrc.js
rm apps/admin/.prettierrc.js
rm apps/web/.prettierrc.js
```

---

## Step 5 — Format the entire codebase once

Run the formatter once to rewrite files to Biome's output. Commit this as a standalone formatting commit so it doesn't pollute feature history.

```bash
pnpm biome format --write ./apps ./packages
git add -A
git commit -m "chore: reformat codebase with Biome"
```

---

## Step 6 — VS Code integration (optional)

Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) and add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "[typescript]":       { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]":  { "editor.defaultFormatter": "biomejs.biome" },
  "[javascript]":       { "editor.defaultFormatter": "biomejs.biome" },
  "[javascriptreact]":  { "editor.defaultFormatter": "biomejs.biome" },
  "[json]":             { "editor.defaultFormatter": "biomejs.biome" }
}
```

Disable the ESLint extension for this workspace so there are no conflicts.

---

## Rule mapping reference

Key ESLint rules we use and their Biome equivalents:

| ESLint rule | Biome equivalent | Notes |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | `suspicious/noExplicitAny` | warn by default |
| `@typescript-eslint/no-unused-vars` | `correctness/noUnusedVariables` | in recommended |
| `@typescript-eslint/no-floating-promises` | `suspicious/noFloatingPromises` | in recommended |
| `react-hooks/rules-of-hooks` | `correctness/useHookAtTopLevel` | in recommended |
| `react-hooks/exhaustive-deps` | not yet supported | track [biomejs/biome#1984](https://github.com/biomejs/biome/issues/1984) |
| `no-console` | `suspicious/noConsole` | add to rules if wanted |

The `react-hooks/exhaustive-deps` rule has no Biome equivalent yet. If you rely on it, keep a minimal ESLint config for that rule only while removing everything else.

---

## Known differences

- **Import order**: Biome's `organizeImports` groups imports differently from `eslint-plugin-import`. The one-time format commit will settle this.
- **JSX quote style**: Biome defaults to double quotes for JSX attributes. Set `"jsxQuoteStyle": "single"` under `javascript.formatter` if you want single quotes in JSX too.
- **CSS/YAML/Markdown**: Biome does not format CSS, YAML, or Markdown. If you need those, keep Prettier scoped to `*.{css,yml,md}` only, or use dprint/taplo for YAML/TOML.
