# Monorepo Folder Rename Plan (Pre-Implementation)

This plan defines a prerequisite migration to align the repository with standard monorepo conventions **before** implementing workspace/permission and mobile plans.

Target rename:
- `packages` -> `apps`
- `shared` -> `packages`

Reason:
- clearer separation of deployable applications vs reusable libraries
- naming that matches common monorepo standards
- reduces future confusion when adding more apps/packages

---

## Desired End State

After migration, top-level structure should be:

```text
apps/
  admin/
  api/
  web/
packages/
  client-api/
  types/
commands/
docs/
...
```

---

## Migration Constraints

- Do this rename first, before implementing other feature plans.
- Keep behavior identical (no functional changes intended).
- Preserve git history as much as possible via `git mv`.
- Update all path-based references in config/scripts/docs.
- Complete in one focused branch to avoid path conflicts with concurrent work.

---

## Scope of Changes

### Directory moves

1. `git mv packages apps`
2. `git mv shared packages`

### Required file updates (minimum)

- `pnpm-workspace.yaml`
  - from `packages/*` and `shared/*` patterns
  - to new canonical patterns: `apps/*`, `packages/*`, `commands/*`
- root `package.json` workspace hints/scripts (if any path assumptions exist)
- `tsconfig.json` and any project `tsconfig` path mappings referencing old roots
- CI/build scripts in `scripts/` that reference `packages/` or `shared/`
- package-level scripts that use relative paths (e.g. `../../scripts/...`) if affected
- docs under `docs/` with hardcoded old paths

### Code imports to verify

Most package imports (`@baseline/client-api`, `@baseline/types`) should continue to work unchanged because they are package-name based, not folder-path based. Still validate:
- any local file-path imports crossing package boundaries
- any tooling config using raw folder paths

---

## Step-by-Step Execution Plan

## 1) Preflight inventory

- Search for references to:
  - `packages/`
  - `shared/`
  - `../shared`
  - `/packages/`
- Build a checklist of files requiring edits.

Output: a complete impact list before moving folders.

## 2) Move directories

- Perform `git mv packages apps`
- Perform `git mv shared packages`

Output: filesystem reflects new structure.

## 3) Update workspace and tooling config

- Update `pnpm-workspace.yaml` globs.
- Update root and package scripts with old paths.
- Update tsconfig/project references and any build tooling path aliases.
- Update lint/test/build configs with hardcoded paths.

Output: toolchain resolves the new folder structure.

## 4) Update docs and plan files

- Replace old path references in `docs/*.md`:
  - `packages/api` -> `apps/api`
  - `packages/admin` -> `apps/admin`
  - `packages/web` -> `apps/web`
  - `shared/types` -> `packages/types`
  - `shared/client-api` -> `packages/client-api`

Output: documentation matches actual repo layout.

## 5) Validation

Run from repo root:

```bash
pnpm install
pnpm --filter @baseline/api lint
pnpm --filter @baseline/admin lint
pnpm --filter @baseline/web lint
pnpm --filter @baseline/api build
pnpm --filter @baseline/admin build
pnpm --filter @baseline/web build
```

If available, also run:

```bash
pnpm --filter @baseline/api start
pnpm --filter @baseline/admin start
pnpm --filter @baseline/web start
```

Output: confidence that rename did not break package resolution.

## 6) Sequence with other plans

Only after this rename is merged:
1. rebase `workspace-permission-api-plan.md`
2. rebase `workspace-permission-api-plan-alternative.md`
3. rebase `add-expo-app.md` script plan

All future file paths in those plans should use:
- `apps/*` for app projects
- `packages/*` for shared libraries

---

## Risk Analysis

- **Risk:** hidden script paths break CI.
  - **Mitigation:** exhaustive preflight search + CI dry run.
- **Risk:** concurrent branches conflict heavily on moved paths.
  - **Mitigation:** do migration in isolation and merge first.
- **Risk:** old docs/plans become misleading.
  - **Mitigation:** batch-update docs in same PR.

---

## Rollback Plan

If critical breakage occurs:
- revert the rename commit/PR entirely (single rollback point)
- restore old paths
- patch missed references
- rerun migration with corrected checklist

---

## Deliverables

1. Renamed top-level folders (`apps`, `packages`) in git.
2. Updated workspace/config/scripts/docs references.
3. Green build/lint/start validation for api/admin/web.
4. Follow-up update to existing implementation plans so paths stay accurate.
