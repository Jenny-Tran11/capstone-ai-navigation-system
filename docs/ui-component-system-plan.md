# Plan: UI Component System — Modals, Entity, DataTable, Forms

## Context

`packages/ui` already has 56 shadcn/ui primitives and 10 composite components. The next layer is a set of higher-level, opinionated building blocks that teams use repeatedly across admin screens: data tables with sorting/filtering/pagination (TanStack Table), schema-driven forms (Zod + React Hook Form), a consistent modal system, and CRUD entity views.

This plan decides what to **adopt from existing packages** vs **design custom**, defines the folder structure inside `packages/ui/src/`, and specifies the component API for each category.

> **Note on FinalTransportApp:** No such folder was found in this monorepo at time of writing. If reference components exist in another project, review them before implementation and cross-check patterns against Section 4 below.

---

## 1. Research: What's Available

### Data tables

| Option | Type | Verdict |
|---|---|---|
| [ui.shadcn.com/docs/components/data-table](https://ui.shadcn.com/docs/components/data-table) | Official guide (copy-paste) | **Use as base pattern** |
| [tablecn (sadmann7)](https://github.com/sadmann7/tablecn) | GitHub template | Good reference for server-side patterns |
| [@b87/tanstack-tw-table](https://www.npmjs.com/package/@b87/tanstack-tw-table) | npm package | Viable if we want a dependency, but adds lock-in |
| [tanstack-shadcn-table](https://www.npmjs.com/package/tanstack-shadcn-table) | npm package | Less maintained |

**Recommendation:** Follow the official shadcn data table pattern (TanStack Table v8 + shadcn `Table` primitive) and build our own `DataTable` component. External npm packages add a dependency we don't control. The official pattern is well-documented and we can layer in our own filtering/toolbar conventions.

### Forms

| Option | Type | Verdict |
|---|---|---|
| [AutoForm (vantezzen)](https://github.com/vantezzen/autoform) | npm + registry | **Adopt** — actively maintained, shadcn-native |
| [shadcn-zod-formkit](https://www.npmjs.com/package/shadcn-zod-formkit) | npm | Good feature coverage, less known |
| [form-builder-react-shadcn](https://www.npmjs.com/package/form-builder-react-shadcn) | npm | Less maintained |
| Official shadcn form pattern | Guide | Base layer we already have |

**Recommendation:** Use **AutoForm** for automatic schema-driven forms (add-admin type flows, settings, quick CRUD forms). Write manual `FieldGroup`-style compositions for complex multi-step or conditional forms. Both paths share the same shadcn `Form`/`Input`/`Label` primitives we already have.

### Modals

No external packages are needed here. shadcn `Dialog` and `AlertDialog` primitives are sufficient. The need is a design system — typed modal roles (destructive, form, info, confirmation) with consistent sizing and behavior contracts.

**Recommendation:** Design a `Modal` wrapper layer in-house on top of existing `Dialog` and `AlertDialog` primitives.

### Entity / CRUD views

| Option | Type | Verdict |
|---|---|---|
| [shadcn-admin-kit (Marmelab)](https://github.com/marmelab/shadcn-admin-kit) | npm | Opinionated (requires `ra-core`), heavy coupling |
| [shadcn-admin (satnaing)](https://github.com/satnaing/shadcn-admin) | Template | Good reference only |

**Recommendation:** Design in-house. Entity patterns are highly app-specific. Use `AdminListItem` (already built), `DataTable`, `ConfirmDeleteDialog` (already built) as the building blocks and compose them into `EntityList`, `EntityDetail`, `EntityForm` patterns.

---

## 2. Folder Structure

```
packages/ui/src/
├── components/                  ← composite components (current + new)
│   │
│   ├── [existing]
│   │   ├── admin-list-item.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── confirm-delete-dialog.tsx
│   │   ├── loader.tsx
│   │   ├── nav-main.tsx
│   │   ├── nav-secondary.tsx
│   │   ├── nav-user.tsx
│   │   ├── page-content.tsx
│   │   ├── section-cards.tsx
│   │   └── site-header.tsx
│   │
│   ├── modals/                  ← typed modal system
│   │   ├── modal.tsx            ← base Modal (sized Dialog wrapper)
│   │   ├── confirm-modal.tsx    ← AlertDialog-based confirmation
│   │   ├── form-modal.tsx       ← Dialog with form + submit/cancel footer
│   │   └── index.ts
│   │
│   ├── data-table/              ← TanStack Table + shadcn Table
│   │   ├── data-table.tsx       ← main DataTable component
│   │   ├── data-table-toolbar.tsx    ← search + filter bar
│   │   ├── data-table-pagination.tsx ← page controls
│   │   ├── data-table-column-header.tsx  ← sortable column header
│   │   ├── data-table-faceted-filter.tsx ← multi-select column filter
│   │   ├── data-table-view-options.tsx   ← column visibility toggle
│   │   └── index.ts
│   │
│   ├── form/                    ← form compositions
│   │   ├── auto-form.tsx        ← AutoForm wrapper (Zod schema → form)
│   │   ├── field-group.tsx      ← label + input + error layout unit
│   │   ├── form-section.tsx     ← titled section within a form Card
│   │   ├── submit-row.tsx       ← submit + cancel button row
│   │   └── index.ts
│   │
│   └── entity/                  ← CRUD view compositions
│       ├── entity-list.tsx      ← DataTable + toolbar + header + actions
│       ├── entity-detail.tsx    ← read-only detail card layout
│       ├── entity-form.tsx      ← create/edit form page layout
│       ├── entity-empty.tsx     ← empty state with CTA
│       └── index.ts
```

---

## 3. Component Specifications

### 3a. Modals (`components/modals/`)

#### `modal.tsx` — Base wrapper

Wraps `Dialog` to standardise sizing and close behaviour.

```tsx
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: ModalSize;         // default: 'md'
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

Size → max-width map:
- `sm` → `max-w-sm`
- `md` → `max-w-lg` (shadcn default)
- `lg` → `max-w-2xl`
- `xl` → `max-w-4xl`
- `full` → `max-w-[95vw]`

#### `confirm-modal.tsx` — Destructive / confirmation

Wraps `AlertDialog`. Used for all irreversible actions.

```tsx
export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;       // default: 'Confirm'
  cancelLabel?: string;        // default: 'Cancel'
  variant?: 'destructive' | 'default';
  onConfirm: () => Promise<void> | void;
  requireTyped?: string;       // if set, shows text input confirmation
}
```

When `requireTyped` is set, disables confirm button until user types the exact string (same pattern as `ConfirmDeleteDialog`).

#### `form-modal.tsx` — Form inside a dialog

```tsx
export interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: ModalSize;
  title: string;
  description?: string;
  onSubmit: () => Promise<void> | void;
  isPending?: boolean;
  submitLabel?: string;       // default: 'Save'
  cancelLabel?: string;       // default: 'Cancel'
  children: React.ReactNode;
}
```

Renders `DialogContent` > `DialogHeader` > `children` > `DialogFooter` (cancel + submit). Submit button shows spinner when `isPending`. Prevents dialog close while `isPending`.

---

### 3b. DataTable (`components/data-table/`)

#### `data-table.tsx` — Core component

```tsx
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // toolbar
  searchColumn?: string;           // column id to search on
  filters?: DataTableFilter[];     // faceted filter configs
  showViewOptions?: boolean;       // column visibility toggle
  // state
  loading?: boolean;
  // server-side
  pageCount?: number;              // total page count for server pagination
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  // empty state
  emptyMessage?: string;
}
```

**Internal state:**
- Client-mode: manages `sorting`, `columnFilters`, `pagination`, `columnVisibility`, `rowSelection` internally
- Server-mode (when `pageCount` is set): state is controlled via `on*Change` callbacks

**Column definition pattern:**

```tsx
export const columns: ColumnDef<Admin>[] = [
  {
    id: 'select',
    header: ({ table }) => <DataTableCheckbox table={table} />,
    cell: ({ row }) => <DataTableCheckbox row={row} />,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <AdminRowActions row={row} />,
  },
];
```

#### `data-table-toolbar.tsx`

```tsx
export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumn?: string;
  filters?: DataTableFilter[];
  showViewOptions?: boolean;
  actions?: React.ReactNode;   // right-side slot (e.g. "Invite" button)
}
```

Layout: flex row with search input (left), filter dropdowns, column visibility (right), plus `actions` slot.

#### `data-table-filter.ts` types

```ts
export interface DataTableFilter {
  column: string;
  title: string;
  options: { label: string; value: string; icon?: React.ComponentType }[];
}
```

#### Dependencies to install

```bash
pnpm add @tanstack/react-table
```

---

### 3c. Forms (`components/form/`)

#### `auto-form.tsx` — Schema-driven

Install AutoForm:

```bash
pnpm add @autoform/react @autoform/zod
npx shadcn add https://raw.githubusercontent.com/vantezzen/autoform/main/packages/shadcn/registry/autoform.json
```

`auto-form.tsx` is a thin wrapper that configures AutoForm with our shadcn field components and applies our layout conventions (spacing, labels, error messages).

```tsx
import { AutoForm } from '@autoform/react';
import { ZodProvider } from '@autoform/zod';

export interface AutoFormWrapperProps<TSchema extends z.ZodObject<any>> {
  schema: TSchema;
  onSubmit: (values: z.infer<TSchema>) => Promise<void> | void;
  submitLabel?: string;
  defaultValues?: Partial<z.infer<TSchema>>;
  className?: string;
}
```

#### `field-group.tsx` — Manual form unit

Used when building custom forms (not schema-driven). Wraps a `FormField` with consistent label/error layout.

```tsx
export interface FieldGroupProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

Renders: `FormItem` > `FormLabel` > `FormControl` (children) > `FormDescription?` > `FormMessage`.

#### `form-section.tsx` — Titled section

Groups related fields inside a Card with a separator.

```tsx
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}
```

Renders: `Card` > `CardHeader(title, description)` > `CardContent(children)`.

#### `submit-row.tsx` — Footer action row

```tsx
export interface SubmitRowProps {
  isPending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  destructive?: boolean;
}
```

---

### 3d. Entity (`components/entity/`)

#### `entity-list.tsx` — Full CRUD list view

Composes `DataTable` + header + toolbar + optional empty state. The outer shell used for admin list pages.

```tsx
export interface EntityListProps<TData, TValue> {
  title: string;
  description?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  createAction?: React.ReactNode;  // e.g. <Button>Invite</Button>
  searchColumn?: string;
  filters?: DataTableFilter[];
  emptyMessage?: string;
}
```

#### `entity-detail.tsx` — Read-only detail card

```tsx
export interface EntityField {
  label: string;
  value: React.ReactNode;
  mono?: boolean;    // monospace value (IDs, etc.)
  span?: number;     // grid column span (1 or 2)
}

export interface EntityDetailProps {
  title: string;
  description?: string;
  fields: EntityField[];
  actions?: React.ReactNode;
}
```

Renders a 2-column grid of label/value pairs inside a `Card`.

#### `entity-form.tsx` — Create/edit page shell

```tsx
export interface EntityFormProps {
  title: string;
  description?: string;
  isPending?: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  children: React.ReactNode;
}
```

#### `entity-empty.tsx` — Empty state

```tsx
export interface EntityEmptyProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

---

## 4. Implementation Phases

### Phase 1 — Data table (highest ROI, used on every list page)

1. Install `@tanstack/react-table`
2. Create `components/data-table/` — all 6 files
3. Export from `index.ts`
4. Replace `AdminList`'s inline table with `EntityList`/`DataTable`
5. Verify: sorting, column visibility, pagination work

### Phase 2 — Modal system

1. Create `components/modals/` — 3 files (`modal.tsx`, `confirm-modal.tsx`, `form-modal.tsx`)
2. Export from `index.ts`
3. Replace `ConfirmDelete` in admin and `AddAdmin` modal with the new typed wrappers
4. Verify: sizing variants, keyboard dismiss, pending state lock

### Phase 3 — Form system

1. Install AutoForm: `pnpm add @autoform/react @autoform/zod`
2. Copy AutoForm shadcn registry files into `components/form/`
3. Create `auto-form.tsx`, `field-group.tsx`, `form-section.tsx`, `submit-row.tsx`
4. Export from `index.ts`
5. Rewrite `AddAdmin` form using `AutoForm` + Zod schema
6. Rewrite `UserSettings` email section using `FieldGroup`

### Phase 4 — Entity views

1. Create `components/entity/` — 4 files
2. Export from `index.ts`
3. Refactor `AdminList` page to use `EntityList`
4. Verify: empty state, loading state, column visibility, delete confirmation all wire up

---

## 5. Export Strategy

Add to `packages/ui/src/index.ts`:

```ts
// modals
export * from './components/modals';

// data-table
export * from './components/data-table';
export type { ColumnDef, ColumnFiltersState, SortingState, PaginationState } from '@tanstack/react-table';

// form
export * from './components/form';

// entity
export * from './components/entity';
```

Re-exporting TanStack Table types means consumers never need to import from `@tanstack/react-table` directly — they get everything from `@baseline/ui`.

---

## 6. Critical Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@tanstack/react-table` | ^8.x | DataTable engine |
| `@autoform/react` | latest | Schema-driven forms |
| `@autoform/zod` | latest | Zod provider for AutoForm |
| `zod` | ^3.x | Schema validation (likely already installed) |
| `react-hook-form` | ^7.x | Already installed in admin |

---

## 7. What to Skip (Not Worth Building)

| Item | Reason |
|---|---|
| Server-side table (full) | Not needed until data volumes require it; easy to add `pageCount`/`on*Change` props to DataTable later |
| Drag-and-drop columns | No current requirement |
| Inline cell editing | Complex; use form modals instead |
| CSV export built-in | Handle at page level with a custom button using TanStack's `table.getCoreRowModel().rows` |
| Multi-step wizard | Build as a page component, not a primitive |
| shadcn-admin-kit / ra-core | Too opinionated; requires full framework adoption |

---

## 8. Reference Resources

- **TanStack Table docs:** [tanstack.com/table/latest](https://tanstack.com/table/latest)
- **shadcn official data table pattern:** [ui.shadcn.com/docs/components/data-table](https://ui.shadcn.com/docs/components/data-table)
- **tablecn (server-side patterns):** [github.com/sadmann7/tablecn](https://github.com/sadmann7/tablecn)
- **AutoForm:** [github.com/vantezzen/autoform](https://github.com/vantezzen/autoform)
- **shadcn/ui registries explorer:** [registry.directory](https://registry.directory/)
- **shadcn/ui blocks:** [ui.shadcn.com/blocks](https://ui.shadcn.com/blocks)
