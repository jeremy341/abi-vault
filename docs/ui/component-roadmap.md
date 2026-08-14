# Component roadmap

Planning only. Priorities describe sequencing and risk, not implemented work.

## P0 foundation

### P0-1 — Accessible dialog primitive

- **Current problem:** Add/edit dialogs duplicate custom overlay markup and lack verified focus behavior.
- **Proposed solution:** Introduce one accessible dialog foundation and make add/edit flows consume it.
- **Affected screens:** Dashboard card flows; future create/edit dialogs.
- **Affected components:** `AddCardModal`, `EditCardModal`, new shared dialog wrapper.
- **Implementation effort:** Medium.
- **Expected UX impact:** High.

### P0-2 — Shared page-state components

- **Current problem:** Placeholder routes have no loading, empty, error, permission, or success presentation.
- **Proposed solution:** Define reusable `PageHeader`, `PageState`, `EmptyState`, `ErrorState`, `LoadingState`, and feedback patterns based on existing shadcn primitives.
- **Affected screens:** All dashboard routes.
- **Affected components:** New shared state components, `Card`, `Alert`, `Skeleton`.
- **Implementation effort:** Medium.
- **Expected UX impact:** High.

### P0-3 — Typed navigation configuration

- **Current problem:** Sidebar navigation and header page information are maintained separately.
- **Proposed solution:** Create one typed route model consumed by both components, including nested active matching.
- **Affected screens:** All dashboard routes.
- **Affected components:** `Sidebar`, `DashboardHeader`, new route configuration module.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium.

## P1 core product components

### P1-1 — Shared card form and preview

- **Current problem:** Add/edit card forms duplicate fields, formatters, palette, validation, and preview layout.
- **Proposed solution:** Extract shared card form state/validation and a shared preview section; keep add and delete actions at their parent boundaries.
- **Affected screens:** Dashboard overview and future accounts screen.
- **Affected components:** `AddCardModal`, `EditCardModal`, `AccountCard`, new card form components/utilities.
- **Implementation effort:** Medium.
- **Expected UX impact:** Medium.

### P1-2 — Data table foundation

- **Current problem:** The transaction route has no table or list implementation, although shadcn table primitives are installed.
- **Proposed solution:** Define a responsive transaction list/table pattern with column priority, row action semantics, loading, empty, and error states. Do not add fields beyond approved product data.
- **Affected screens:** Transactions and dashboard transaction history.
- **Affected components:** `Table`, badges, receipt links, future transaction components.
- **Implementation effort:** Large, dependent on data model.
- **Expected UX impact:** High for the primary finance workflow.

### P1-3 — Receipt review/upload components

- **Current problem:** Receipts route is only a heading and has no upload/review surface.
- **Proposed solution:** Build the smallest reusable upload, preview, metadata, review-status, and failure-state components after receipt requirements are confirmed.
- **Affected screens:** Receipts and transaction detail.
- **Affected components:** `Input`, `Alert`, `Card`, new receipt components.
- **Implementation effort:** Large, dependent on storage and approval requirements.
- **Expected UX impact:** High for receipt accountability.

### P1-4 — Goals and progress components

- **Current problem:** Goals route and dashboard goal placeholder contain no interaction or data state.
- **Proposed solution:** Create reusable goal summary, progress, target/date, list, and edit components after goal fields are confirmed.
- **Affected screens:** Overview and goals.
- **Affected components:** `Progress`, `Card`, `Badge`, future goal components.
- **Implementation effort:** Medium to large.
- **Expected UX impact:** Medium to high, depending on product priority.

### P1-5 — Role-aware navigation shell

- **Current problem:** The audit found no visible admin, supervisor, or student role behavior.
- **Proposed solution:** Only after the authorization model is approved, allow navigation visibility and screen actions to be driven by a shared capability model. Avoid assuming which role can perform which action.
- **Affected screens:** All authenticated screens.
- **Affected components:** Sidebar, header, page guards, action buttons.
- **Implementation effort:** Large, dependent on auth/backend decisions.
- **Expected UX impact:** High if multiple user classes are part of the release.

## P2 polish and reuse

### P2-1 — Shared brand/auth shell

- **Current problem:** Auth pages duplicate the Abi Manager logo structure.
- **Proposed solution:** Reuse `AbiLogo` inside a small public/auth shell with context-specific layout props only where needed.
- **Affected screens:** Welcome, sign-in, sign-up, dashboard brand area.
- **Affected components:** `AbiLogo`, auth pages.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium.

### P2-2 — Shared dashboard surface and placeholder component

- **Current problem:** Dashboard placeholders repeat border, radius, background, and shadow styles inline.
- **Proposed solution:** Create a named surface/card component with explicit variants for empty, loading, and content states.
- **Affected screens:** Dashboard and future routes.
- **Affected components:** `Card`, dashboard CSS, new surface component.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium.

### P2-3 — Notification and profile menu primitives

- **Current problem:** Notification control is visual only and the profile area exposes only Clerk's button.
- **Proposed solution:** If product requirements confirm these flows, create accessible menu/popover primitives with loading, empty, and error states. Do not invent notification content.
- **Affected screens:** Dashboard shell.
- **Affected components:** `DashboardHeader`, `DropdownMenu`, Clerk `UserButton` integration.
- **Implementation effort:** Medium.
- **Expected UX impact:** Medium.

## Assumptions

- Data fields, role permissions, and backend architecture are intentionally left unspecified.
- The installed shadcn primitives are available for reuse, but no component is considered complete solely because it exists in `components/ui/`.
