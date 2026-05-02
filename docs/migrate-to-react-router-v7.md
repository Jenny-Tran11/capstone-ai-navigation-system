# Plan: Migrate to React Router v7

## Context

Both `apps/admin` and `apps/web` use `react-router-dom` v6.22.3. React Router v7 merges `react-router` and `react-router-dom` into a single `react-router` package. Reference implementation: `/Users/khiem/Developing/FinalTransportApp/apps/admin`.

Key changes in v7:
- Package renamed: `react-router-dom` → `react-router` (one package, same API surface)
- `useLoaderData()` is now generic: `useLoaderData<typeof myLoader>()`  — eliminates manual `as { ... }` casts
- `RouterProvider` drops the `fallbackElement` prop
- Route objects prefer `Component:` over `element:` (both work, `Component:` is idiomatic v7)
- `index: true` is the idiomatic way to declare index routes (replacing `path: '/'` inside a nested group)

---

## Step 1 — Update dependencies

### `apps/admin/package.json` and `apps/web/package.json`

Remove `react-router-dom`, add `react-router`:

```diff
- "react-router-dom": "6.22.3",
+ "react-router": "7.14.2",
```

Run from repo root:

```bash
pnpm install
```

---

## Step 2 — Update all imports

### Admin app

Every file that imports from `'react-router-dom'` must change to `'react-router'`.

Files affected:

| File | Current import | New import |
|------|---------------|------------|
| `src/App.tsx` | `from 'react-router-dom'` | `from 'react-router'` |
| `src/components/layout/Layout.tsx` | `from 'react-router-dom'` | `from 'react-router'` |
| `src/baseblocks/user/pages/User.tsx` | `from 'react-router-dom'` | `from 'react-router'` |
| `src/baseblocks/admin/pages/Admins.tsx` | `from 'react-router-dom'` | `from 'react-router'` |

Run to verify no `react-router-dom` imports remain:
```bash
grep -r "react-router-dom" apps/admin/src/
# must return zero results
```

### Web app

```diff
// src/App.tsx
- import { RouterProvider, createBrowserRouter } from 'react-router-dom';
+ import { RouterProvider, createBrowserRouter } from 'react-router';
```

---

## Step 3 — Type `useLoaderData` calls

### `src/baseblocks/user/pages/User.tsx`

Before (v6 — manual cast, unsafe):
```typescript
const { user } = useLoaderData() as {
  user: { email: string; email_verified: boolean };
};
```

After (v7 — generic inferred from loader):
```typescript
const { user } = useLoaderData<typeof userLoader>();
```

`userLoader` returns `{ user: { email, email_verified } }` so the type is inferred automatically. Remove the `as` cast entirely.

### `src/baseblocks/admin/pages/Admins.tsx`

Before:
```typescript
const { admins } = useLoaderData() as { admins: Admin[] };
```

After:
```typescript
const { admins } = useLoaderData<typeof adminListLoader>();
```

---

## Step 4 — Update `App.tsx` (admin)

### 4a. Remove `fallbackElement`

`fallbackElement` was removed in React Router v7. The `Loader` component it rendered was the full-page spinner during initial hydration.

```diff
  return (
-   <RouterProvider
-     router={router}
-     fallbackElement={<Loader hasStartedLoading={true} />}
-   />
+   <RouterProvider router={router} />
  );
```

The per-route loading state in `Layout.tsx` (`useNavigation` check) already handles in-navigation loading, so no functionality is lost.

### 4b. Update route config to use idiomatic v7 patterns

Switch public index route from `path: '/'` to `index: true`, and update the `/dashboard` redirect:

```typescript
const router = createBrowserRouter([
  {
    id: 'public',
    path: '/',
    Component: Outlet,
    children: [
      { index: true, Component: Home },
      { path: '/not-admin', Component: NotAdmin },
      { path: '/login', Component: Login, loader: loginLoader },
    ],
  },
  {
    id: 'protected',
    path: '/',
    Component: Layout,
    loader: protectedLoader,
    children: [
      { path: '/dashboard', Component: Dashboard },
      { path: '/admins', Component: Admins, loader: adminListLoader },
      { path: '/settings', Component: User, loader: userLoader },
    ],
  },
]);
```

### 4c. Update Hub navigation targets

In v6 the app navigated to `/dashboard` on sign-in and `/` on sign-out. Keep as-is or align with FinalTransportApp pattern:

```typescript
case 'signedIn':
  router.navigate('/dashboard').catch((e) => console.error(e));
  break;
case 'signedOut':
  router.navigate('/').catch((e) => console.error(e));
  break;
```

---

## Step 5 — Update `App.tsx` (web)

Web app currently uses `element:` syntax:

```typescript
const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
]);
```

Update to `Component:` pattern for consistency:

```typescript
const router = createBrowserRouter([
  { index: true, Component: Home },
  { path: '/about', Component: About },
]);
```

---

## Step 6 — Add `useNavigateWithReturn` hook (admin)

FinalTransportApp introduces this hook for navigating to detail pages while preserving a breadcrumb return path in URL params. Add it to admin now so it's available when detail pages are added.

Create `apps/admin/src/hooks/useNavigateWithReturn.ts`:

```typescript
import { useNavigate } from 'react-router';

export const useNavigateWithReturn = () => {
  const navigate = useNavigate();

  const navigateWithReturn = (to: string, returnLabel: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('return', btoa(`${window.location.pathname}?${params.toString()}`));
    params.set('returnLabel', btoa(returnLabel));
    void navigate(`${to}?${params.toString()}`);
  };

  const rawReturnLabel = new URLSearchParams(window.location.search).get('returnLabel');
  const returnLabel = rawReturnLabel ? atob(rawReturnLabel) : undefined;

  const rawReturnUrl = new URLSearchParams(window.location.search).get('return');
  const returnUrl = rawReturnUrl ? atob(rawReturnUrl) : undefined;

  return { navigateWithReturn, returnUrl, returnLabel };
};
```

Usage pattern (for future detail pages):
```typescript
// On a list page
const { navigateWithReturn } = useNavigateWithReturn();
<button onClick={() => navigateWithReturn(`/admins/${id}`, 'Admins')}>View</button>

// On the detail page — renders a back link if navigated via navigateWithReturn
const { returnUrl, returnLabel } = useNavigateWithReturn();
{returnUrl && <a href={returnUrl}>{returnLabel}</a>}
```

---

## Step 7 — Remove `@types/react-router-dom` if present

```bash
grep "react-router-dom" apps/admin/package.json apps/web/package.json
```

If `@types/react-router-dom` appears in devDependencies, remove it — React Router v7 ships its own types.

---

## Critical files

| Action | Path |
|--------|------|
| Edit | `apps/admin/package.json` — replace `react-router-dom` with `react-router@7.8.0` |
| Edit | `apps/web/package.json` — same |
| Edit | `apps/admin/src/App.tsx` — update import, remove `fallbackElement`, `index: true` on home route |
| Edit | `apps/admin/src/components/layout/Layout.tsx` — update import |
| Edit | `apps/admin/src/baseblocks/user/pages/User.tsx` — update import + typed `useLoaderData` |
| Edit | `apps/admin/src/baseblocks/admin/pages/Admins.tsx` — update import + typed `useLoaderData` |
| Edit | `apps/web/src/App.tsx` — update import + `Component:` syntax |
| Create | `apps/admin/src/hooks/useNavigateWithReturn.ts` |

---

## Verification

```bash
# 1. Install
pnpm install

# 2. Confirm no react-router-dom imports remain
grep -r "react-router-dom" apps/admin/src/ apps/web/src/
# Expected: no output

# 3. Type-check both apps
cd apps/admin && ../../node_modules/.bin/tsc --noEmit
cd apps/web   && ../../node_modules/.bin/tsc --noEmit

# 4. Start and test routes manually
pnpm --filter @baseline/admin start
pnpm --filter @baseline/web start
```

**Manual checks:**
- [ ] Unauthenticated visit to `/dashboard` redirects to `/login`
- [ ] Sign in navigates to `/dashboard`
- [ ] Sign out navigates to `/`
- [ ] `/admins` loads admin list via `adminListLoader`
- [ ] `/settings` loads user email via `userLoader`
- [ ] Web `/` and `/about` both render without errors
- [ ] No TypeScript errors from `useLoaderData` calls
