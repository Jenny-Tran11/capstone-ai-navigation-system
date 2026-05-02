# Plan: SCSS → Tailwind CSS + shadcn/ui

## Context

Both `apps/admin` and `apps/web` use SCSS Modules + Reactstrap for styling. Goal: replace the entire CSS stack with Tailwind CSS v4 + a shared `packages/ui` design system containing design tokens, shadcn/ui primitives, and customised composite components.

**Current stack to remove:**
- `sass` / `sass-embedded`
- CSS Modules (`.module.scss` files)
- `reactstrap` (Bootstrap-based component library)
- `stylelint-config-scss` / `stylelint-config-sass-guidelines` / `postcss-scss`

**Target stack:**
- `tailwindcss` v4 (via `@tailwindcss/vite`)
- `packages/ui` — shared design tokens (`globals.css`), `cn()` helper, shadcn/ui primitives, custom composite components
- `shadcn/ui` CLI for scaffolding additional primitives on demand

---

## Current SCSS design tokens to preserve

These must be converted to CSS custom properties in `packages/ui/src/globals.css`.

### Colors
| Role | Value |
|------|-------|
| Background page | `#efefef` |
| Background card/input | `#ffffff` |
| Foreground primary | `#000000` |
| Foreground muted | `#707070` |
| Foreground subtle | `#b2b2b2` |
| Border | `#bababa` |
| Border hover | `#707070` |
| Brand | `#3a3838` |
| White | `#ffffff` |

### Typography
| Scale | Desktop | Mobile (< 768px) |
|-------|---------|------------------|
| tiny | 12px / 20px | 8px / 16px |
| small | 16px / 24px | 12px / 20px |
| medium | 24px / 32px | 16px / 24px |
| large | 40px / 49px | 24px / 32px |
| huge | 72px / 88px | 40px / 49px |

### Fonts
- **All text**: Be Vietnam Pro (weights 300, 400, 500, 600, 700, 800, 900)
- Source: Google Fonts CDN

### Breakpoints (Tailwind custom)
| Name | px |
|------|----|
| `sm` | 576px |
| `md` | 768px |
| `lg` | 992px |
| `xl` | 1200px |

### Spacing & shape
- Border radius — small: 10px, large: 32px
- Button padding — `12px 108px`
- Sidebar width — 250px (collapsed: 0, margin-left transition 250ms)
- Page content padding — `98px` vertical, `clamp(0px, 12vw, 144px)` horizontal
- Animation speed — 150ms

---

## Step 1 — Create `packages/ui`

This is the shared design system package consumed by all apps.

### 1a. File structure

```
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── globals.css          ← design tokens + Tailwind import
│   ├── index.ts             ← barrel export for all primitives + components
│   ├── lib/
│   │   └── utils.ts         ← cn() helper
│   ├── primitives/          ← shadcn/ui components (auto-generated + hand-built)
│   └── components/          ← custom composite components
```

### 1b. `packages/ui/package.json`

```json
{
  "name": "@baseline/ui",
  "version": "1.0.0",
  "main": "src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./globals.css": "./src/globals.css",
    "./lib/utils": "./src/lib/utils.ts",
    "./package.json": "./package.json"
  },
  "scripts": {
    "type-check": "npx tsc --noEmit",
    "pretty": "npx prettier --write 'src/**/*.{ts,tsx,css}'"
  },
  "dependencies": {
    "@baseline/types": "workspace:1.0.0",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "3.3.0",
    "lucide-react": "0.511.0",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.2",
    "@radix-ui/react-label": "2.1.0",
    "@radix-ui/react-separator": "1.1.0",
    "@radix-ui/react-slot": "1.1.0",
    "@radix-ui/react-toast": "1.2.2",
    "@radix-ui/react-tooltip": "1.1.5",
    "@radix-ui/react-avatar": "1.1.1",
    "@radix-ui/react-checkbox": "1.1.2",
    "@radix-ui/react-select": "2.1.2",
    "@radix-ui/react-tabs": "1.1.1"
  },
  "devDependencies": {
    "tailwindcss": "4.1.11",
    "@types/node": "20.11.26",
    "@types/react": "18.2.67",
    "react": "18.2.0",
    "typescript": "5.4.2"
  },
  "peerDependencies": {
    "react": ">=18"
  }
}
```

> Add more `@radix-ui/*` packages as primitives are needed. Versions should match those already in `apps/admin`.

### 1c. `packages/ui/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "rootDirs": ["./src"],
    "outDir": ".esbuild",
    "skipLibCheck": true
  },
  "include": ["../../packages/types", "src"],
  "watchOptions": {
    "excludeDirectories": ["node_modules", ".esbuild"]
  }
}
```

### 1d. `packages/ui/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 1e. `packages/ui/src/globals.css`

This file is the single source of truth for design tokens. It is imported by each app's CSS entry point.

```css
@import 'tailwindcss';

/* ── Custom breakpoints ───────────────────────────────────────── */
@theme {
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;

  /* ── Color tokens ─────────────────────────────────────────────── */
  --color-background: oklch(97% 0 0);          /* #efefef */
  --color-surface: oklch(100% 0 0);            /* #ffffff */
  --color-foreground: oklch(0% 0 0);           /* #000000 */
  --color-muted: oklch(46% 0 0);               /* #707070 */
  --color-subtle: oklch(72% 0 0);              /* #b2b2b2 */
  --color-border: oklch(76% 0 0);              /* #bababa */
  --color-border-hover: oklch(46% 0 0);        /* #707070 */
  --color-brand: oklch(25% 0.008 20);          /* #3a3838 */
  --color-brand-foreground: oklch(100% 0 0);   /* #ffffff */

  /* ── Radius tokens ────────────────────────────────────────────── */
  --radius-sm: 10px;
  --radius-lg: 32px;
  --radius: 10px;

  /* ── Font families ────────────────────────────────────────────── */
  --font-sans: 'Be Vietnam Pro', sans-serif;

  /* ── Typography scale ─────────────────────────────────────────── */
  --text-tiny: 0.75rem;        /* 12px */
  --text-tiny--line-height: 1.25rem;
  --text-small: 1rem;          /* 16px */
  --text-small--line-height: 1.5rem;
  --text-medium: 1.5rem;       /* 24px */
  --text-medium--line-height: 2rem;
  --text-large: 2.5rem;        /* 40px */
  --text-large--line-height: 3.0625rem;
  --text-huge: 4.5rem;         /* 72px */
  --text-huge--line-height: 5.5rem;

  /* ── Sidebar ──────────────────────────────────────────────────── */
  --sidebar-width: 250px;

  /* ── Animation ────────────────────────────────────────────────── */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 500ms;

  /* shadcn/ui semantic aliases */
  --background: var(--color-surface);
  --foreground: var(--color-foreground);
  --card: var(--color-surface);
  --card-foreground: var(--color-foreground);
  --primary: var(--color-brand);
  --primary-foreground: var(--color-brand-foreground);
  --secondary: var(--color-background);
  --secondary-foreground: var(--color-foreground);
  --muted: var(--color-background);
  --muted-foreground: var(--color-muted);
  --accent: var(--color-background);
  --accent-foreground: var(--color-foreground);
  --border: var(--color-border);
  --input: var(--color-border);
  --ring: var(--color-brand);
  --destructive: oklch(55% 0.22 27);
  --destructive-foreground: oklch(100% 0 0);
}

/* ── Google Fonts ─────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');

/* ── Base layer ───────────────────────────────────────────────── */
@layer base {
  * {
    @apply border-border;
  }
  *:focus-visible {
    @apply outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
  :where(a, a:hover, a:focus, a:active, a:visited) {
    color: inherit;
    text-decoration: none;
  }
}

/* ── Responsive typography utilities ─────────────────────────── */
@layer utilities {
  .text-tiny {
    font-size: var(--text-tiny);
    line-height: var(--text-tiny--line-height);
  }
  .text-small {
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
  }
  .text-medium {
    font-size: var(--text-medium);
    line-height: var(--text-medium--line-height);
  }
  .text-large {
    font-size: var(--text-large);
    line-height: var(--text-large--line-height);
  }
  .text-huge {
    font-size: var(--text-huge);
    line-height: var(--text-huge--line-height);
  }

  /* mobile overrides */
  @media (max-width: 768px) {
    .text-tiny  { font-size: 0.5rem;  line-height: 1rem; }
    .text-small { font-size: 0.75rem; line-height: 1.25rem; }
    .text-medium { font-size: 1rem;   line-height: 1.5rem; }
    .text-large { font-size: 1.5rem;  line-height: 2rem; }
    .text-huge  { font-size: 2.5rem;  line-height: 3.0625rem; }
  }
}
```

---

## Step 2 — Scaffold shadcn/ui primitives into `packages/ui`

Use the shadcn CLI with `--output-dir` pointing at `packages/ui/src/primitives`. Each primitive uses the tokens from `globals.css` automatically.

### 2a. Add `components.json` to `packages/ui`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@baseline/ui/components",
    "utils": "@baseline/ui/lib/utils",
    "ui": "@baseline/ui/primitives",
    "lib": "@baseline/ui/lib",
    "hooks": "@baseline/ui/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 2b. Primitives required for this codebase

Run from `packages/ui`:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add dialog       # replaces reactstrap Modal
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add tooltip
npx shadcn@latest add select       # replaces react-select
npx shadcn@latest add checkbox
npx shadcn@latest add tabs
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add form         # wraps react-hook-form
```

Each command writes a `.tsx` file to `packages/ui/src/primitives/`.

### 2c. Export all primitives from `packages/ui/src/index.ts`

```typescript
// primitives
export * from './primitives/button';
export * from './primitives/input';
export * from './primitives/label';
export * from './primitives/dialog';
export * from './primitives/badge';
export * from './primitives/separator';
export * from './primitives/avatar';
export * from './primitives/dropdown-menu';
export * from './primitives/toast';
export * from './primitives/tooltip';
export * from './primitives/select';
export * from './primitives/checkbox';
export * from './primitives/tabs';
export * from './primitives/card';
export * from './primitives/table';
export * from './primitives/form';
// lib
export { cn } from './lib/utils';
```

---

## Step 3 — Build custom composite components in `packages/ui/src/components/`

These replace the hand-rolled SCSS Module components that exist in both apps. Writing them once in `packages/ui` means both admin and web share the same implementation.

### `loader.tsx` — replaces `Loader.module.scss`

The existing loader uses a custom baseline SVG with a grayscale pulse animation. Re-implement with inline SVG + Tailwind animation utilities.

```
packages/ui/src/components/loader.tsx
```

Key classes: `animate-pulse`, `opacity-0 data-[loaded=true]:opacity-100 transition-opacity`, centered overlay positioning.

Export from `index.ts` as `Loader`.

### `sidebar.tsx` — replaces `Sidebar.module.scss`

Fixed-position sidebar, 250px wide, collapses via `data-collapsed` attribute on container toggling margin-left. Receives `items: { label, href, icon }[]` and `collapsed: boolean` as props.

```
packages/ui/src/components/sidebar.tsx
```

Key classes: `fixed left-0 top-0 h-screen w-[250px] bg-surface border-r border-border transition-all duration-[250ms]`, collapse: `translate-x-[-250px]`.

### `page-content.tsx` — replaces `PageContent.module.scss`

Flex container with page-level padding. Children fade in via `animate-in fade-in` (from `tailwindcss-animate`).

```
packages/ui/src/components/page-content.tsx
```

Key classes: `flex-1 bg-[#efefef] py-[98px] px-[clamp(0px,12vw,144px)] min-h-screen`.

### `confirm-delete-dialog.tsx` — replaces `ConfirmDelete.tsx` + `ConfirmDelete.module.scss`

Wraps the shadcn `Dialog` primitive. Renders a text input where the user must type the item name to confirm. Disables the confirm button until input matches. Replaces the reactstrap `Modal` currently used.

```
packages/ui/src/components/confirm-delete-dialog.tsx
```

Props: `open`, `onOpenChange`, `itemName`, `onConfirm`.

### `admin-list-item.tsx` — replaces admin list card pattern

Flex row with avatar/icon, large name text, muted detail text, and a role badge on the right. Exported as `AdminListItem`.

```
packages/ui/src/components/admin-list-item.tsx
```

### Update `index.ts` exports

```typescript
// components
export { Loader } from './components/loader';
export { Sidebar } from './components/sidebar';
export { PageContent } from './components/page-content';
export { ConfirmDeleteDialog } from './components/confirm-delete-dialog';
export { AdminListItem } from './components/admin-list-item';
```

---

## Step 4 — Wire Tailwind into each app

Both apps need identical wiring changes.

### 4a. Install dependencies

Run from **`apps/admin`** and **`apps/web`**:

```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @baseline/ui   # already a workspace dep via package.json
```

Remove from each app:

```bash
pnpm remove sass reactstrap stylelint-config-scss stylelint-config-sass-guidelines stylelint-config-css-modules postcss-scss
```

Also remove from `apps/admin` specifically:
```bash
pnpm remove react-select   # replaced by shadcn Select
```

### 4b. Update `vite.config.ts` in both apps

Add `@tailwindcss/vite` plugin and path aliases:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    EnvironmentPlugin([
      'REACT_APP_APP_NAME',
      'REACT_APP_AWS_PROFILE',
      'REACT_APP_API_URL',
      'REACT_APP_COGNITO_IDENTITY_POOL_ID',
      'REACT_APP_COGNITO_USER_POOL_ID',
      'REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID',
      'REACT_APP_COGNITO_ENDPOINT',
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@baseline/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
      '@baseline/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  build: {
    outDir: '.dist',
    minify: 'esbuild',
  },
});
```

> The alias order matters — more specific (`@baseline/ui/lib`) must come before the broader `@baseline/ui`.

### 4c. Replace CSS entry points

**`apps/admin/src/index.tsx`** — change import:
```diff
- import './styles/fonts.scss';
- import './index.scss';
+ import './index.css';
```

**`apps/web/src/index.tsx`** — same change.

**Create `apps/admin/src/index.css`**:
```css
@import '@baseline/ui/globals.css';
```

**Create `apps/web/src/index.css`**:
```css
@import '@baseline/ui/globals.css';
```

### 4d. Update `.stylelintrc.json` (or delete it)

If kept, remove all `scss`-specific extends and replace with:
```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {}
}
```

Or delete `.stylelintrc.json` and remove `stylelint` + `stylelint-order` entirely from devDependencies if no custom CSS linting is needed.

### 4e. Update `pretty` scripts in both `package.json` files

Remove `scss` from prettier glob patterns:
```json
"pretty": "npx prettier --write 'src/**/*.{ts,tsx,js,json,css,md,yml,yaml,html}'"
```

---

## Step 5 — Migrate `apps/admin` components

Work through each component. Delete the `.module.scss` file after migrating. Pattern: inline Tailwind classes directly on JSX elements, use `cn()` for conditional classes, pull composite components from `@baseline/ui`.

### Component migration map

| File | SCSS to delete | Approach |
|------|---------------|----------|
| `src/index.tsx` | `index.scss` | Remove import, add `./index.css` |
| `components/layout/Layout.tsx` | — | Add `flex min-h-screen` to wrapper |
| `components/sidebar/Sidebar.tsx` | `Sidebar.module.scss` | Replace with `<Sidebar>` from `@baseline/ui` |
| `components/page-content/PageContent.tsx` | `PageContent.module.scss` | Replace with `<PageContent>` from `@baseline/ui` |
| `components/page-content/loader/Loader.tsx` | `Loader.module.scss` | Replace with `<Loader>` from `@baseline/ui` |
| `components/confirm-delete/ConfirmDelete.tsx` | `ConfirmDelete.module.scss` | Replace with `<ConfirmDeleteDialog>` from `@baseline/ui` |
| `baseblocks/home/Home.tsx` | `Home.module.scss` | Inline Tailwind classes |
| `baseblocks/login/Login.tsx` | `Login.module.scss` | Inline Tailwind classes, keep `<Authenticator>` |
| `baseblocks/not-admin/NotAdmin.tsx` | `NotAdmin.module.scss` | Inline Tailwind classes |
| `baseblocks/dashboard/DashboardContent.tsx` | `DashboardContent.module.scss` | Inline Tailwind classes |
| `baseblocks/admin/Admins.tsx` | — | Use `<AdminListItem>` from `@baseline/ui` |
| `baseblocks/admin/add-admin/AddAdmin.tsx` | `AddAdmin.module.scss` | Replace reactstrap `Modal/Input/FormGroup` with `<ConfirmDeleteDialog>` / shadcn `Input/Label` |
| `baseblocks/admin/admin-list/AdminList.tsx` | `AdminList.module.scss` | Use `<AdminListItem>` from `@baseline/ui`, remove reactstrap |
| `baseblocks/user/user-settings/UserSettings.tsx` | `UserSettings.module.scss` | Replace reactstrap `Input` with shadcn `Input/Label`, inline Tailwind |

### SCSS class → Tailwind translation

| Old pattern | Tailwind equivalent |
|-------------|---------------------|
| `display: flex; flex: 1 1 auto` | `flex flex-auto` |
| `min-height: 100vh; overflow: hidden` | `min-h-screen overflow-hidden` |
| `padding: 98px clamp(0px,12vw,144px)` | `py-[98px] px-[clamp(0px,12vw,144px)]` |
| `background: #efefef` | `bg-background` |
| `background: #fff` | `bg-surface` |
| `color: #707070` | `text-muted` |
| `border: 1px solid #bababa` | `border border-border` |
| `border-radius: 10px` | `rounded-[10px]` or `rounded-sm` |
| `border-radius: 32px` | `rounded-[32px]` or `rounded-lg` |
| `transition: … 150ms` | `transition duration-[150ms]` |
| `margin-left: 250px` | `ml-[250px]` |
| `box-shadow: 0 3px 6px #00000029` | `shadow-sm` |
| `display: grid; grid-template-columns: 1fr 1fr` | `grid grid-cols-2` |
| `gap: 16px` | `gap-4` |
| Responsive font (mediumFont desktop) | `text-medium` (custom utility from globals) |

### reactstrap → shadcn/ui component map

| reactstrap | shadcn/ui primitive |
|------------|---------------------|
| `<Modal>` | `<Dialog>` from `@baseline/ui` |
| `<ModalHeader>` | `<DialogHeader>` |
| `<ModalBody>` | `<DialogContent>` |
| `<ModalFooter>` | `<DialogFooter>` |
| `<Input>` | `<Input>` from `@baseline/ui` |
| `<FormGroup>` | `<div className="space-y-2">` |
| `<Label>` | `<Label>` from `@baseline/ui` |
| `<FormFeedback>` | `<p className="text-tiny text-destructive">` |
| `<Button>` (reactstrap) | `<Button>` from `@baseline/ui` |

---

## Step 6 — Migrate `apps/web` components

Same approach as admin. No reactstrap usage in web; all replacements are inline class swaps.

| File | SCSS to delete | Approach |
|------|---------------|----------|
| `src/index.tsx` | `index.scss` | Replace with `./index.css` |
| `components/navbar/Navbar.tsx` | `Navbar.module.scss` | Inline Tailwind; keep hamburger toggle logic |
| `components/hero/Hero.tsx` | `Hero.module.scss` | Inline Tailwind; replace genericButton with `<Button>` from `@baseline/ui` |
| `components/about-banner/AboutBanner.tsx` | `AboutBanner.module.scss` | Same as Hero |
| `components/footer/Footer.tsx` | `Footer.module.scss` | Inline Tailwind |
| `components/page-wrapper/PageWrapper.tsx` | `PageWrapper.module.scss` | Inline Tailwind |

### genericButton mixin → Button variant

The `genericButton` mixin (white text on `#3a3838`, inverts on hover) maps to the default `Button` from shadcn with brand colors from the token:

```tsx
<Button className="rounded-[32px] px-[108px]">Label</Button>
```

Or add a custom `"brand"` variant to the Button primitive in `packages/ui/src/primitives/button.tsx`:

```typescript
brand: 'bg-brand text-brand-foreground border-2 border-brand hover:bg-surface hover:text-brand rounded-[32px]',
```

---

## Step 7 — Delete all SCSS files

After all components are migrated and verified:

```bash
# admin
find apps/admin/src -name "*.scss" -delete
rm -rf apps/admin/src/styles

# web
find apps/web/src -name "*.scss" -delete
rm -rf apps/web/src/styles
```

---

## Step 8 — Verify

```bash
# 1. Install
pnpm install

# 2. Type-check packages/ui
cd packages/ui && ../../node_modules/.bin/tsc --noEmit

# 3. Type-check admin
cd apps/admin && ../../node_modules/.bin/tsc --noEmit

# 4. Type-check web
cd apps/web && ../../node_modules/.bin/tsc --noEmit

# 5. Build admin (catches Vite/CSS resolution errors)
cd apps/admin && npx vite build

# 6. Build web
cd apps/web && npx vite build

# 7. Start both and visually verify
pnpm --filter @baseline/admin start
pnpm --filter @baseline/web start
```

**Visual checklist:**
- [ ] Montserrat font loads (network tab shows fonts.googleapis.com)
- [ ] Page background is `#efefef`, cards/inputs are white
- [ ] Sidebar is 250px, collapses on toggle
- [ ] Login page renders Amplify `<Authenticator>` without layout shift
- [ ] Admin list items show name + email + badge
- [ ] Delete modal opens, confirm button disabled until name typed
- [ ] Dashboard 2-column grid at 1200px+ collapses to 1 column below
- [ ] Web navbar collapses to hamburger below 768px
- [ ] Hero CTA button has dark background, inverts on hover
- [ ] No `.scss` imports remain in any `.tsx` file

---

## Critical files

| Action | Path |
|--------|------|
| Create | `packages/ui/package.json` |
| Create | `packages/ui/tsconfig.json` |
| Create | `packages/ui/src/globals.css` |
| Create | `packages/ui/src/lib/utils.ts` |
| Create | `packages/ui/src/index.ts` |
| Create | `packages/ui/components.json` |
| Create (shadcn) | `packages/ui/src/primitives/*.tsx` (16 components) |
| Create | `packages/ui/src/components/loader.tsx` |
| Create | `packages/ui/src/components/sidebar.tsx` |
| Create | `packages/ui/src/components/page-content.tsx` |
| Create | `packages/ui/src/components/confirm-delete-dialog.tsx` |
| Create | `packages/ui/src/components/admin-list-item.tsx` |
| Edit | `apps/admin/vite.config.ts` |
| Edit | `apps/web/vite.config.ts` |
| Create | `apps/admin/src/index.css` |
| Create | `apps/web/src/index.css` |
| Edit | `apps/admin/src/index.tsx` |
| Edit | `apps/web/src/index.tsx` |
| Edit | All component `.tsx` files (see Step 5 + 6 tables) |
| Delete | All `.module.scss` files in `apps/admin/src/` and `apps/web/src/` |
| Delete | `apps/admin/src/index.scss`, `apps/web/src/index.scss` |
| Delete | `apps/admin/src/styles/`, `apps/web/src/styles/` |
