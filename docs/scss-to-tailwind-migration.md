# SCSS → Tailwind CSS + shadcn/ui Shared UI — Detailed Migration Plan

**Source of truth:** `/Users/khiem/Developing/Baseline Fork copy`
**Target project:** `/Users/khiem/Developing/FinalTransportApp`

---

## Current State Diagnosis

Before writing a single line of code, here is exactly where FinalTransportApp stands today.

### What is already done ✅

| What | Evidence |
|---|---|
| `@tailwindcss/vite` installed and wired up | `apps/admin/vite.config.ts` line 4 + 8 |
| `tailwindcss` `4.1.11` in dependencies | `apps/admin/package.json` |
| Entry point imports `index.css` not `index.scss` | `apps/admin/src/index.tsx` line 3: `import './index.css'` |
| `index.css` exists and imports shared globals | `apps/admin/src/index.css`: `@import '@baseline/ui/globals.css'` |
| All 4 page TSX files use Tailwind classes | `Home.tsx`, `Login.tsx`, `NotAdmin.tsx`, `DashboardContent.tsx` — zero SCSS module imports |
| `packages/ui/src/globals.css` exists with OKLch vars | 271 lines, full design token set |
| `packages/ui/src/lib/utils.ts` `cn()` helper exists | identical to Baseline Fork copy |

### What is broken or incomplete ❌

| Issue | File | Detail |
|---|---|---|
| **CRITICAL** — `globals.css` is not exported from the package | `packages/ui/package.json` | `"exports"` block has no `"./globals.css"` entry. `@import '@baseline/ui/globals.css'` in `index.css` will fail at build time. |
| **CRITICAL** — `globals.css` has duplicate/conflicting HSL variables | `packages/ui/src/globals.css` lines 181–231 | An old `@layer base` block re-declares all color tokens in HSL format, partially overriding the OKLch tokens set at lines 10–65. |
| `components.json` references non-existent files | `apps/admin/components.json` | `"tailwind.config.js"` (file doesn't exist), `"src/index.scss"` (not the entry point) |
| 7 orphaned SCSS files still on disk | `apps/admin/src/` | `index.scss`, `styles/fonts.scss`, `styles/_global.scss`, and 4 `*.module.scss` files — nothing imports them, but they add confusion and keep `sass-embedded` as a dependency |
| `sass-embedded` in devDependencies | `apps/admin/package.json` | No longer needed since SCSS files are unused |
| 26 primitives missing vs Baseline Fork copy | `packages/ui/src/primitives/` | See full list in Step 5 |
| 9 npm packages needed for missing primitives | `packages/ui/package.json` | `@base-ui/react`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `@radix-ui/react-accordion`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-collapsible` |

---

## Step 1 — Fix the critical `globals.css` package export

**File:** `FinalTransportApp/packages/ui/package.json`

The `"exports"` block currently is:

```json
"exports": {
  ".": {
    "types": "./src/index.ts",
    "import": "./src/index.ts",
    "default": "./src/index.ts"
  },
  "./package.json": "./package.json"
}
```

Add the `globals.css` export path. The final `"exports"` block must be:

```json
"exports": {
  ".": {
    "types": "./src/index.ts",
    "import": "./src/index.ts",
    "default": "./src/index.ts"
  },
  "./globals.css": "./src/globals.css",
  "./package.json": "./package.json"
}
```

**Why this matters:** `apps/admin/src/index.css` already contains `@import '@baseline/ui/globals.css'`. Without this export, Node/Vite's package resolver cannot find the file and the build will throw a `Cannot find module` error. The Baseline Fork copy already has this entry at `packages/ui/package.json` line 19.

---

## Step 2 — Fix the duplicate CSS variables in `globals.css`

**File:** `FinalTransportApp/packages/ui/src/globals.css`

The file currently has two conflicting variable definitions:

- **Lines 10–65** — correct OKLch color tokens, used by all shadcn/ui components
- **Lines 181–231** — old `@layer base { :root { ... } }` block with HSL-format values that partially override the OKLch tokens above

The Baseline Fork copy's `globals.css` has a clean `@layer base` block that only applies utility classes and link styles (lines 177–194), with no duplicate token declarations.

Remove the old HSL block entirely. The `@layer base` section in FinalTransportApp's `globals.css` (lines 181–231) should be replaced to match Baseline Fork copy exactly:

**Current (lines 177–235 in FinalTransportApp's globals.css) — DELETE this entire block:**

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... 20 more HSL variable declarations ... */
    --radius: 1rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... 12 more HSL dark-mode declarations ... */
    --ring: 212.7 26.8% 83.9%;
  }
}
```

**Replace with (matching Baseline Fork copy lines 177–194):**

```css
@layer base {
  * {
    @apply border-border;
  }
  *:focus-visible {
    @apply outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  :where(a, a:hover, a:focus, a:active, a:visited) {
    color: inherit;
    text-decoration: none;
  }
  :where(.lucide[class*='fill-']) {
    stroke: none;
  }
}
```

**Why this matters:** The HSL values in the old block (e.g. `--background: 0 0% 100%`) are a different format than the OKLch values and will silently overwrite the OKLch values set above, causing all `bg-background`, `text-foreground`, etc. classes to render with the wrong color scale. This is the kind of bug that doesn't cause a build error — it just makes colors wrong at runtime.

---

## Step 3 — Fix `apps/admin/components.json`

**File:** `FinalTransportApp/apps/admin/components.json`

**Current state (broken):**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.scss",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Two fields are broken:
- `"config": "tailwind.config.js"` — this file does not exist. Tailwind v4 has no separate config file; it runs entirely via the Vite plugin.
- `"css": "src/index.scss"` — this file is not the CSS entry point. The actual entry is `src/index.css`.

Two alias fields should be updated so that `npx shadcn add <component>` places utils and primitives in the shared `packages/ui` instead of creating a local copy in `apps/admin/src`:
- `"utils"` should point to `@baseline/ui/lib/utils` (the shared `cn()` helper)
- `"ui"` should point to `@baseline/ui/primitives` (the shared primitives folder)

**Replace the entire file with:**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@baseline/ui/lib/utils",
    "ui": "@baseline/ui/primitives",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## Step 4 — Delete orphaned SCSS files and remove `sass-embedded`

### 4a. Delete the SCSS files

These 7 files are on disk but nothing imports them. The entry point (`index.tsx`) imports `index.css`, and all page components use Tailwind classes directly.

```
FinalTransportApp/apps/admin/src/index.scss
FinalTransportApp/apps/admin/src/styles/fonts.scss
FinalTransportApp/apps/admin/src/styles/_global.scss
FinalTransportApp/apps/admin/src/baseblocks/home/pages/Home.module.scss
FinalTransportApp/apps/admin/src/baseblocks/not-admin/pages/NotAdmin.module.scss
FinalTransportApp/apps/admin/src/baseblocks/login/pages/Login.module.scss
FinalTransportApp/apps/admin/src/baseblocks/dashboard/components/dashboard-content/DashboardContent.module.scss
```

Run from `FinalTransportApp/apps/admin`:

```bash
rm src/index.scss
rm src/styles/fonts.scss
rm src/styles/_global.scss
rm src/baseblocks/home/pages/Home.module.scss
rm src/baseblocks/not-admin/pages/NotAdmin.module.scss
rm src/baseblocks/login/pages/Login.module.scss
rm src/baseblocks/dashboard/components/dashboard-content/DashboardContent.module.scss
rmdir src/styles  # only if the directory is now empty
```

Before deleting, confirm nothing imports them:

```bash
grep -r "\.scss" src/ --include="*.tsx" --include="*.ts" --include="*.css"
# Should return zero results
```

### 4b. Remove `sass-embedded` from `package.json`

**File:** `FinalTransportApp/apps/admin/package.json`

In the `"devDependencies"` block, remove:

```diff
- "sass-embedded": "1.90.0",
```

Then run:

```bash
cd FinalTransportApp
pnpm install
```

### 4c. Update the `pretty` script in `apps/admin/package.json`

The `"pretty"` script currently includes `scss` in the glob:

```json
"pretty": "npx prettier --write 'src/**/*.{ts,tsx,js,json,css,scss,md,yml,yaml,html}' ..."
```

Remove `scss` from both globs:

```json
"pretty": "npx prettier --write 'src/**/*.{ts,tsx,js,json,css,md,yml,yaml,html}' && npx prettier --write 'public/**/*.{ts,tsx,js,json,css,md,yml,yaml,html}' && npx prettier --write '*.{ts,tsx,js,json,css,md,yml,yaml,html}'"
```

---

## Step 5 — Add missing primitives from Baseline Fork copy

### 5a. The gap

Baseline Fork copy has **59 primitives**. FinalTransportApp has **33**. The 26 missing ones are:

| Missing primitive | Radix dependency | Extra npm package |
|---|---|---|
| `accordion.tsx` | `@radix-ui/react-accordion` | — |
| `alert.tsx` | none (pure HTML) | — |
| `aspect-ratio.tsx` | `@radix-ui/react-aspect-ratio` | — |
| `button-group.tsx` | none | — |
| `calendar.tsx` | none | `react-day-picker`, `date-fns` |
| `carousel.tsx` | none | `embla-carousel-react` |
| `combobox.tsx` | uses `popover` + `command` | — |
| `context-menu.tsx` | `@radix-ui/react-context-menu` | — |
| `direction.tsx` | none (utility) | — |
| `empty.tsx` | none (pure HTML) | — |
| `field.tsx` | none (pure HTML) | — |
| `form.tsx` | none (uses react-hook-form) | — |
| `hover-card.tsx` | `@radix-ui/react-hover-card` | — |
| `input-group.tsx` | none (pure HTML) | — |
| `input-otp.tsx` | none | `input-otp` |
| `item.tsx` | none (pure HTML) | — |
| `kbd.tsx` | none (pure HTML) | — |
| `menubar.tsx` | `@radix-ui/react-menubar` | — |
| `native-select.tsx` | none (pure HTML) | — |
| `pagination.tsx` | none (pure HTML) | — |
| `radio-group.tsx` | `@radix-ui/react-radio-group` | — |
| `resizable.tsx` | none | `react-resizable-panels` |
| `slider.tsx` | `@radix-ui/react-slider` | — |
| `spinner.tsx` | none (pure HTML) | — |
| `switch.tsx` | `@radix-ui/react-switch` | — |
| `use-mobile.ts` | none (hook) | — |

### 5b. Install missing npm packages

Run from `FinalTransportApp/packages/ui`:

```bash
pnpm add \
  @radix-ui/react-accordion \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-context-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-menubar \
  @radix-ui/react-radio-group \
  @radix-ui/react-slider \
  @radix-ui/react-switch \
  date-fns \
  embla-carousel-react \
  input-otp \
  react-day-picker \
  react-resizable-panels \
  @base-ui/react
```

> Note: `@radix-ui/react-collapsible`, `@radix-ui/react-popover`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-progress`, and `@radix-ui/react-scroll-area` are already present in FinalTransportApp's `packages/ui/package.json` — those primitives (`collapsible.tsx`, `popover.tsx`, `navigation-menu.tsx`, `progress.tsx`, `scroll-area.tsx`) just haven't been added to `primitives/` yet but can be added via `npx shadcn add` without a new install.

### 5c. Copy the primitive files from Baseline Fork copy

Run from the repo root (or adjust paths as needed):

```bash
# Individual files — copy each missing primitive
BASELINE="/Users/khiem/Developing/Baseline Fork copy/packages/ui/src/primitives"
TARGET="/Users/khiem/Developing/FinalTransportApp/packages/ui/src/primitives"

cp "$BASELINE/accordion.tsx"      "$TARGET/"
cp "$BASELINE/alert.tsx"          "$TARGET/"
cp "$BASELINE/aspect-ratio.tsx"   "$TARGET/"
cp "$BASELINE/button-group.tsx"   "$TARGET/"
cp "$BASELINE/calendar.tsx"       "$TARGET/"
cp "$BASELINE/carousel.tsx"       "$TARGET/"
cp "$BASELINE/combobox.tsx"       "$TARGET/"
cp "$BASELINE/context-menu.tsx"   "$TARGET/"
cp "$BASELINE/direction.tsx"      "$TARGET/"
cp "$BASELINE/empty.tsx"          "$TARGET/"
cp "$BASELINE/field.tsx"          "$TARGET/"
cp "$BASELINE/form.tsx"           "$TARGET/"
cp "$BASELINE/hover-card.tsx"     "$TARGET/"
cp "$BASELINE/input-group.tsx"    "$TARGET/"
cp "$BASELINE/input-otp.tsx"      "$TARGET/"
cp "$BASELINE/item.tsx"           "$TARGET/"
cp "$BASELINE/kbd.tsx"            "$TARGET/"
cp "$BASELINE/menubar.tsx"        "$TARGET/"
cp "$BASELINE/native-select.tsx"  "$TARGET/"
cp "$BASELINE/pagination.tsx"     "$TARGET/"
cp "$BASELINE/radio-group.tsx"    "$TARGET/"
cp "$BASELINE/resizable.tsx"      "$TARGET/"
cp "$BASELINE/slider.tsx"         "$TARGET/"
cp "$BASELINE/spinner.tsx"        "$TARGET/"
cp "$BASELINE/switch.tsx"         "$TARGET/"
cp "$BASELINE/use-mobile.ts"      "$TARGET/"
```

### 5d. Export the new primitives from `packages/ui/src/index.ts`

After copying the files, open `packages/ui/src/index.ts` and add export lines for each new primitive. Match the existing export pattern in the file. For example:

```ts
export * from './primitives/accordion'
export * from './primitives/alert'
export * from './primitives/aspect-ratio'
export * from './primitives/button-group'
export * from './primitives/calendar'
export * from './primitives/carousel'
export * from './primitives/combobox'
export * from './primitives/context-menu'
export * from './primitives/direction'
export * from './primitives/empty'
export * from './primitives/field'
export * from './primitives/form'
export * from './primitives/hover-card'
export * from './primitives/input-group'
export * from './primitives/input-otp'
export * from './primitives/item'
export * from './primitives/kbd'
export * from './primitives/menubar'
export * from './primitives/native-select'
export * from './primitives/pagination'
export * from './primitives/radio-group'
export * from './primitives/resizable'
export * from './primitives/slider'
export * from './primitives/spinner'
export * from './primitives/switch'
export { useIsMobile } from './primitives/use-mobile'
```

> `use-mobile.ts` exports a hook, not components — use the named export form shown above instead of `export *`.

---

## Step 6 — Verify `apps/admin/src/index.css` imports Tailwind correctly

**File:** `FinalTransportApp/apps/admin/src/index.css`

Current content:

```css
@import '@baseline/ui/globals.css';
```

This is correct once Step 1 is done (the `globals.css` export is added to `packages/ui/package.json`). The `globals.css` itself already contains `@import 'tailwindcss'` at line 1, so there is no need to add `@import 'tailwindcss'` to `index.css` — it would be duplicated.

If you want to add any admin-specific global overrides (custom fonts, brand-specific token overrides), do it after the import:

```css
@import '@baseline/ui/globals.css';

/* Admin-specific overrides go here */
@layer base {
  :root {
    /* Override any token from globals.css here if needed */
  }
}
```

---

## Step 7 — Verify the Vite path alias includes the `lib` sub-path

**File:** `FinalTransportApp/apps/admin/vite.config.ts`

Current state (lines 12–15):

```ts
resolve: {
  alias: {
    './runtimeConfig': './runtimeConfig.browser',
    '@': path.resolve(__dirname, './src'),
    '@baseline/ui': path.resolve(__dirname, '../../packages/ui/src'),
  },
},
```

The alias `'@baseline/ui'` resolves everything under `@baseline/ui/*` to `packages/ui/src/*`. This means:
- `@baseline/ui/primitives/button` → `packages/ui/src/primitives/button` ✅
- `@baseline/ui/lib/utils` → `packages/ui/src/lib/utils` ✅
- `@baseline/ui/globals.css` → this is resolved via the package `exports` field (Step 1), NOT the Vite alias

Compare this to Baseline Fork copy's `vite.config.ts` which adds a more specific alias for `lib`:

```ts
alias: {
  '@': path.resolve(__dirname, './src'),
  '@baseline/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
  '@baseline/ui': path.resolve(__dirname, '../../packages/ui/src'),
},
```

The Baseline Fork adds the `@baseline/ui/lib` alias explicitly because Vite resolves aliases from most-specific to least-specific. Without it, `@baseline/ui/lib/utils` works via the broad `@baseline/ui` alias, but the explicit alias guarantees resolution order.

**Recommended:** Add the explicit `@baseline/ui/lib` alias to match Baseline Fork copy:

```ts
resolve: {
  alias: {
    './runtimeConfig': './runtimeConfig.browser',
    '@': path.resolve(__dirname, './src'),
    '@baseline/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
    '@baseline/ui': path.resolve(__dirname, '../../packages/ui/src'),
  },
},
```

---

## Step 8 — Run type-check and build verification

Run these in order:

```bash
cd /Users/khiem/Developing/FinalTransportApp

# 1. Install everything
pnpm install

# 2. Type-check the shared UI package first
pnpm --filter @baseline/ui exec tsc --noEmit

# 3. Type-check admin
pnpm --filter @baseline/admin exec tsc --noEmit

# 4. Build admin (catches Vite/CSS resolution errors that tsc misses)
pnpm --filter @baseline/admin build:deploy

# 5. Start dev server to visually verify
pnpm --filter @baseline/admin start
```

**What to watch for:**

- `Cannot find module '@baseline/ui/globals.css'` → Step 1 wasn't applied correctly
- `Cannot find module '@radix-ui/react-accordion'` (or similar) → Step 5b wasn't run
- Colors look wrong (e.g. primary is blue instead of the OKLch red) → Step 2 wasn't applied; old HSL block is still overriding
- TypeScript errors on newly copied primitives → the file may reference a package not yet installed; add it to `packages/ui/package.json`

---

## Step 9 — SCSS → Tailwind reference table (for future work)

If any new components need to be written that previously would have used SCSS mixins, use this table:

### Typography mixins → Tailwind classes

All mixins from `_global.scss` used Montserrat with responsive font sizing. The mobile breakpoint was `$breakSize: $md` = `768px` (Tailwind's `md:` prefix).

| Mixin call | Desktop | Mobile (`max-width: 768px`) | Tailwind equivalent |
|---|---|---|---|
| `tinyFont()` | `12px / 20px` normal 400 | `8px / 16px` | `text-xs leading-5 md:text-[12px] md:leading-5` |
| `tinyFont(normal, 600)` | `12px / 20px` semibold | `8px / 16px` | `text-xs font-semibold leading-5` |
| `smallFont()` | `16px / 24px` normal 400 | `12px / 20px` | `text-base leading-6 md:text-sm` |
| `smallFont(normal, 600)` | `16px / 24px` semibold | `12px / 20px` | `text-base font-semibold leading-6 md:text-sm` |
| `mediumFont()` | `24px / 32px` normal 400 | `16px / 24px` | `text-2xl leading-8 md:text-base md:leading-6` |
| `largeFont()` | `40px / 49px` normal 400 | `24px / 32px` | `text-[40px] leading-[49px] md:text-2xl md:leading-8` |
| `hugeFont()` | `72px / 88px` normal 400 | `40px / 49px` | `text-[72px] leading-[88px] md:text-[40px] md:leading-[49px]` |

> Note: Tailwind's responsive prefixes are min-width (`md:` = `≥ 768px`). The SCSS breakpoints were max-width (`≤ 768px`). The equivalent Tailwind pattern is: write mobile-first (small size), then `md:` for desktop size.

### `genericButton` mixin → Tailwind classes

The `genericButton` mixin from `_global.scss`:

```scss
@mixin genericButton {
  display: inline-block;
  padding: 12px 108px;
  color: #fff;
  text-decoration: none;
  background: #3a3838;
  border: 2px solid #3a3838;
  border-radius: 32px;
  transition: background-color 150ms ease-in-out, color 150ms ease-in-out;

  &:hover {
    color: #3a3838;
    background: #fff;
  }
}
```

Tailwind equivalent:

```tsx
className="inline-block px-[108px] py-3 text-white no-underline bg-[#3a3838] border-2 border-[#3a3838] rounded-[32px] transition-[background-color,color] duration-150 ease-in-out hover:text-[#3a3838] hover:bg-white"
```

Or, using shadcn/ui's `Button` component with a custom variant, which is the cleaner long-term approach:

```tsx
<Button variant="outline" className="rounded-[32px] px-[108px]">
  Label
</Button>
```

### SCSS breakpoint variables → Tailwind prefixes

| SCSS variable | Value | Tailwind prefix |
|---|---|---|
| `$sm` | `576px` | no direct match — use arbitrary `min-[576px]:` |
| `$md` | `768px` | `md:` |
| `$lg` | `992px` | no direct match — use arbitrary `min-[992px]:` |
| `$xl` | `1200px` | `xl:` (Tailwind xl = 1280px, close enough; or use `min-[1200px]:`) |

### CSS module class patterns → Tailwind

| SCSS pattern | Tailwind equivalent |
|---|---|
| `display: flex; flex-direction: row; flex: 1 1 auto;` | `flex flex-row flex-auto` |
| `min-height: 100vh; overflow: hidden;` | `min-h-screen overflow-hidden` |
| `display: grid; grid-gap: 16px; grid-template-columns: 1fr 1fr;` | `grid gap-4 grid-cols-2` |
| `justify-content: center; align-items: center;` | `justify-center items-center` |
| `margin-bottom: 32px;` | `mb-8` |
| `padding: 32px;` | `p-8` |
| `border: 1px solid #bababa;` | `border border-[#bababa]` or `border border-border` |
| `background: #fff;` | `bg-white` or `bg-background` |
| `color: #000;` | `text-black` or `text-foreground` |
| `text-decoration: none;` | `no-underline` (or handled by `@layer base` link reset in globals) |
| `width: 32px; height: 32px;` | `w-8 h-8` |
| `margin-right: 16px;` | `mr-4` |
| `border-radius: 10px;` | `rounded-[10px]` |
| `content: '+'` on `::before` | Use a `<span>` child element instead |

---

## Step 10 — Optional: sync `globals.css` to add Baseline Fork improvements

The Baseline Fork copy's `globals.css` has two additions not in FinalTransportApp's version:

### Addition 1 — Link and icon reset in `@layer base`

Baseline Fork copy (lines 187–193):

```css
:where(a, a:hover, a:focus, a:active, a:visited) {
  color: inherit;
  text-decoration: none;
}
:where(.lucide[class*='fill-']) {
  stroke: none;
}
```

The link reset prevents Tailwind from rendering links with browser-default blue/underline. The Lucide icon fix prevents filled icons from showing an extra stroke. Both are safe to add to FinalTransportApp's `globals.css` inside its `@layer base` block.

### Addition 2 — `--tracking-normal` and `--spacing` custom properties

Baseline Fork copy has in `:root` (lines 63–64):

```css
--tracking-normal: 0em;
--spacing: 0.27rem;
```

FinalTransportApp's `globals.css` has `--tracking-normal: 0em` at line 63 but not `--spacing`. The `--spacing` value (`0.27rem`) slightly tightens Tailwind's default spacing scale and affects padding/margin utilities. If you want pixel-perfect visual parity with Baseline Fork copy, add it.

---

## Complete checklist

Work through this in order — each step unblocks the next.

- [ ] **Step 1** — Add `"./globals.css": "./src/globals.css"` to `packages/ui/package.json` exports
- [ ] **Step 2** — Remove old HSL `@layer base` block (lines 181–231) from `packages/ui/src/globals.css`, replace with clean version from Baseline Fork copy
- [ ] **Step 3** — Rewrite `apps/admin/components.json`: clear `"config"`, fix `"css"` to `src/index.css`, update `"utils"` and `"ui"` aliases
- [ ] **Step 4a** — Delete 7 orphaned SCSS files
- [ ] **Step 4b** — Remove `sass-embedded` from `apps/admin/package.json` devDependencies
- [ ] **Step 4c** — Remove `scss` from `apps/admin` prettier script globs
- [ ] **Step 5b** — Install 14 missing npm packages into `packages/ui`
- [ ] **Step 5c** — Copy 26 primitive `.tsx` / `.ts` files from Baseline Fork copy
- [ ] **Step 5d** — Add exports for new primitives to `packages/ui/src/index.ts`
- [ ] **Step 6** — Confirm `apps/admin/src/index.css` only has `@import '@baseline/ui/globals.css'`
- [ ] **Step 7** — Add explicit `@baseline/ui/lib` alias to `apps/admin/vite.config.ts`
- [ ] **Step 8** — `pnpm install`, then `tsc --noEmit`, then `build:deploy`, then `start`
