# Workspace & Permission API Plan (Alternative Approach)

This is a deeper alternative to `docs/workspace-permission-api-plan.md`, optimized for safer rollout and easier debugging.

It keeps today’s behavior stable while adding workspace/permission as an additive system.

---

## Why This Alternative Is Better For Risk

- Preserves existing `admin` flow while new permission model is introduced.
- Ships backend first so contracts are stable before frontend adoption.
- Uses phased enablement with clear rollback points.
- Avoids a large “all-or-nothing” migration.

---

## Scope

### In Scope

- New backend domains: `workspace` and `permission`.
- New DynamoDB tables and indexes.
- New API routes under `/workspace/*` and `/permission/*`.
- Shared contracts in `packages/types`.
- Shared API clients in `packages/client-api`.
- Admin UI for workspace/permission management.
- Web UI for user workspace access.

### Out of Scope (for this phase)

- Replacing every existing `isAdmin` guard immediately.
- Re-architecting deployment (stays on Serverless Framework).
- Introducing roles beyond `SUPER` and `WORKSPACE`.

---

## Architecture Decisions

1. **Deployment model**: keep `apps/api/serverless.yml`.
2. **Identity source**: keep `req.currentUserSub` from Cognito claims.
3. **Transition strategy**: additive permission middleware + additive routes.
4. **Permission model**:
   - `SUPER`: global admin capability
   - `WORKSPACE` with `value=workspaceId`: scoped membership/access
5. **Frontend integration order**: `admin` first, `web` second.

---

## Data Model

### Workspace table

- Table: `${APP_NAME}-${stage}-workspace`
- PK: `workspaceId` (string)
- Attributes:
  - `workspaceId`
  - `name`
  - `description?`
  - `imageUrl?`
  - `createdAt?`
  - `updatedAt?`

### Permission table

- Table: `${APP_NAME}-${stage}-permission`
- PK: `permissionId` (string)
- GSI: `ownerId-compositeKey-index` (`ownerId` + `compositeKey`)
- GSI: `type-compositeKey-index` (`type` + `compositeKey`)
- Attributes:
  - `permissionId`
  - `ownerId` (userSub)
  - `type` (`SUPER` | `WORKSPACE`)
  - `value?` (e.g. workspaceId for WORKSPACE)
  - `compositeKey` (`${type}#${value ?? ''}`)
  - `createdAt?`
  - `updatedAt?`

---

## API Contract (Target)

### Workspace routes

- `GET /workspace/user/list`
  - Auth: required
  - Behavior: list workspaces linked by caller’s `WORKSPACE` permissions
- `GET /workspace/user/:workspaceId`
  - Auth: required
  - Behavior: returns 403 if caller lacks `WORKSPACE` permission for id
- `POST /workspace/user`
  - Auth: required
  - Body: `{ name: string, description?: string, imageUrl?: string }`
  - Behavior: creates workspace + grants caller `WORKSPACE` permission

- `GET /workspace/admin/list`
- `GET /workspace/admin/:workspaceId`
- `POST /workspace/admin`
- `PATCH /workspace/admin`
- `DELETE /workspace/admin/:workspaceId`
  - Auth: required
  - Permission: `SUPER`

### Permission routes

- `GET /permission/admin/me`
  - Auth: required
  - Behavior: permissions for current user
- `GET /permission/admin/list?type=SUPER|WORKSPACE`
  - Auth: required
  - Permission: `SUPER`
- `GET /permission/admin/owner/:ownerId`
  - Auth: required
  - Permission: `SUPER`
- `GET /permission/admin/:permissionId`
  - Auth: required
  - Permission: `SUPER`
- `POST /permission/admin`
  - Auth: required
  - Permission: `SUPER`
  - Body: `{ ownerId: string, type: PermissionType, value?: string }`
- `DELETE /permission/admin/:permissionId`
  - Auth: required
  - Permission: `SUPER`

---

## File-by-File Implementation Plan

### Phase 1 — Backend Foundation

#### New files

- `apps/api/src/baseblocks/workspace/workspace-dynamodb.yml`
- `apps/api/src/baseblocks/workspace/workspace-functions.yml`
- `apps/api/src/baseblocks/workspace/workspace-api.ts`
- `apps/api/src/baseblocks/workspace/workspace.service.ts`
- `apps/api/src/baseblocks/workspace/workspace.ts`
- `apps/api/src/baseblocks/workspace/workspace-user-api.ts`
- `apps/api/src/baseblocks/workspace/workspace-admin-api.ts`

- `apps/api/src/baseblocks/permission/permission-dynamodb.yml`
- `apps/api/src/baseblocks/permission/permission-functions.yml`
- `apps/api/src/baseblocks/permission/permission-api.ts`
- `apps/api/src/baseblocks/permission/permission.service.ts`
- `apps/api/src/baseblocks/permission/permission.ts`
- `apps/api/src/baseblocks/permission/permission-utils.ts`
- `apps/api/src/baseblocks/permission/permission-admin-api.ts`

- `apps/api/src/middleware/check-permission.ts`

#### Existing files to update

- `apps/api/serverless.yml`
  - add resource imports for workspace/permission tables
  - add function imports for workspace/permission handlers
  - extend IAM resources for new table ARNs and indexes

#### Behavior notes

- Reuse `ServiceObject` in `apps/api/src/util/service-object.ts`.
- Keep `apps/api/src/baseblocks/admin/admin-api.ts` unchanged in phase 1.
- Keep existing `isAdmin` middleware for legacy routes.

---

### Phase 2 — Shared Contracts & Client APIs

#### New `packages/types` files

- `packages/types/base-object.d.ts`
- `packages/types/workspace.d.ts`
- `packages/types/permission.d.ts`

#### Existing `packages/types` updates

- Update package exports if required in `packages/types/package.json`.

#### New `packages/client-api` files

- `packages/client-api/workspace.ts`
- `packages/client-api/permission.ts`

Pattern: same request style used by `packages/client-api/admin.ts`.

---

### Phase 3 — Admin App Integration

#### New pages/components

- `apps/admin/src/baseblocks/workspace/pages/Workspaces.tsx`
- `apps/admin/src/baseblocks/permission/pages/Permissions.tsx`

#### Existing updates

- `apps/admin/src/App.tsx`:
  - add protected routes `/workspaces` and `/permissions`
- `apps/admin/src/components/sidebar/Sidebar.tsx`:
  - add navigation links

#### Data flow

- Start with direct `packages/client-api/*` calls.
- Add SWR hooks afterwards for optimistic updates.

---

### Phase 4 — Web App Integration

#### New pages

- `apps/web/src/pages/Workspaces.tsx`
- `apps/web/src/pages/WorkspaceDetail.tsx`

#### Existing updates

- `apps/web/src/App.tsx`
  - add routes `/workspaces`, `/workspaces/:workspaceId`
  - add auth-aware protected route wrapper/loader

#### Behavior

- Use backend-enforced workspace permission routes only.
- Active workspace tracked by URL param first.

---

## Rollout Plan and Gates

### Milestone A: Backend merged, frontend untouched

Gate:
- All new routes deployed and smoke-tested by curl/Postman.
- Existing `/admin/*` behavior unchanged.

### Milestone B: Shared packages merged

Gate:
- Type imports compile in api/admin/web.
- Client methods return expected payloads from staging API.

### Milestone C: Admin UI merged

Gate:
- Can create workspace.
- Can grant/revoke SUPER and WORKSPACE.
- Admin screens work without regressions in existing flows.

### Milestone D: Web UI merged

Gate:
- Authenticated user sees only permitted workspaces.
- Unauthorized workspace URL returns denied UX (or redirect).

---

## Testing Strategy

### API tests (manual + automated where possible)

- Workspace:
  - create, get, list, update, delete (admin)
  - create/list/get (user)
  - 403 for unauthorized workspace id
- Permission:
  - create/list/delete
  - list by owner and type
  - non-SUPER blocked from admin permission endpoints

### Frontend tests

- Admin:
  - grant/revoke flow updates UI and backend
  - workspace CRUD cycle
- Web:
  - list only allowed workspaces
  - workspace detail denied when missing permission

### Regression checks

- existing admin routes still function
- sign-in and request header auth paths unchanged

---

## Rollback Strategy

If issues occur:

1. Disable frontend routes first (admin/web UI rollback).
2. Keep backend deployed but unused.
3. If needed, disable new lambda function mappings in `serverless.yml`.
4. Leave legacy `/admin/*` path untouched for continuity.

Because all changes are additive, rollback can be done in slices without data loss to existing admin flow.

---

## Risks and Mitigations

- **Risk:** permission seeding missing -> no operator access
  - **Mitigation:** seed one SUPER permission for known staging/local userSub.
- **Risk:** inconsistent user identifier (`sub` vs custom id)
  - **Mitigation:** standardize on `currentUserSub` in this rollout; defer identity migration.
- **Risk:** duplicated checks (`isAdmin` + permissions) causing confusion
  - **Mitigation:** clear docs on which routes use which guard during transition.

---

## Deliverables

1. Backend workspace/permission infrastructure + endpoints.
2. Shared workspace/permission type contracts.
3. Shared API client modules for workspace/permission.
4. Admin workspace/permission UI.
5. Web workspace user flows.
6. Migration guide documenting transition from `isAdmin`-only to permission-first model.
