# Abi Manager UI improvement plan

Phase 2 planning based on the current UI audit. This document is planning only; it does not change application code or Penpot.

## Priorities

### P0 critical

#### P0-1 — Make authentication and dashboard language consistent

- **Current problem:** Public/authentication UI is English while the dashboard is predominantly German; the document language is also `en`.
- **Proposed solution:** Choose the product language for this release, align visible copy, Clerk appearance text where configurable, and the document language. If German is chosen, use German consistently.
- **Affected screens:** Welcome, sign-in, sign-up, all dashboard routes.
- **Affected components:** `app/layout.tsx`, `app/welcome-page.tsx`, auth pages, `DashboardHeader`, `Sidebar`.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** High; improves comprehension and perceived product quality.

#### P0-2 — Add accessible dialog behavior

- **Current problem:** Add/edit card dialogs declare dialog semantics but have no explicit focus trap, focus restoration, Escape handling, or first-focus behavior in the inspected source.
- **Proposed solution:** Use a tested dialog primitive or implement the complete accessible dialog pattern, including labelled title, described errors, focus management, Escape close, and restore focus to the trigger.
- **Affected screens:** Dashboard overview and any future modal workflows.
- **Affected components:** `AddCardModal`, `EditCardModal`, shared UI dialog primitive if introduced.
- **Implementation effort:** Medium.
- **Expected UX impact:** High for keyboard and assistive-technology users; reduces accidental loss of context.

#### P0-3 — Define real page states before filling routes

- **Current problem:** Most authenticated routes are static placeholders and have no loading, empty, error, permission, or save-feedback states.
- **Proposed solution:** Establish a shared page-state model and add route-level loading/error/not-found handling before implementing data-heavy screens.
- **Affected screens:** All dashboard destination routes and overview.
- **Affected components:** App Router route files, shared page-state/skeleton/alert components.
- **Implementation effort:** Medium.
- **Expected UX impact:** High; prevents blank or ambiguous screens during normal use and failures.

#### P0-4 — Decide the persistence boundary for card data

- **Current problem:** Klassenkasse cards reset after refresh and are not associated with an authenticated user or class.
- **Proposed solution:** Confirm the data owner and persistence model before expanding card functionality. Only then replace local React state with the approved server/database boundary.
- **Affected screens:** Dashboard overview, future funds/accounts screens.
- **Affected components:** `Klassenkasse`, card modals, server actions/API/data layer.
- **Implementation effort:** Large, dependent on backend decisions.
- **Expected UX impact:** High; turns the current prototype into dependable product behavior.

### P1 important

#### P1-1 — Consolidate navigation metadata

- **Current problem:** Sidebar links and header page metadata are separate sources of truth.
- **Proposed solution:** Create one typed route configuration containing label, path, icon, title, description, and active-match behavior.
- **Affected screens:** All dashboard routes.
- **Affected components:** `Sidebar`, `DashboardHeader`, route configuration module.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium; prevents inconsistent labels and simplifies future nested routes.

#### P1-2 — Unify add/edit card form logic

- **Current problem:** The two card modals duplicate color data, formatters, validation, fields, and layout.
- **Proposed solution:** Extract shared card form model, validation, field definitions, and preview section while keeping add/delete actions distinct.
- **Affected screens:** Dashboard overview card flows.
- **Affected components:** `AddCardModal`, `EditCardModal`, `AccountCard`, shared card-form utilities.
- **Implementation effort:** Medium.
- **Expected UX impact:** Medium; produces more consistent and reliable editing.

#### P1-3 — Replace ambiguous blank placeholders

- **Current problem:** Empty white cards look like missing content rather than intentional loading or empty states.
- **Proposed solution:** Use named placeholder components with an explicit state label and, where appropriate, a skeleton or next action. Do not imply business content that is not implemented.
- **Affected screens:** Dashboard overview and all unfinished destination routes.
- **Affected components:** `app/dashboard/page.tsx`, shared page-state components.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** Medium to high; users understand what is available and what is pending.

#### P1-4 — Establish responsive layout contracts

- **Current problem:** Current responsive behavior relies on several width overrides, including `2200px`, without a single documented layout contract; tablet behavior is mostly incidental.
- **Proposed solution:** Define a small set of layout modes based on available width and height, with explicit grid, sidebar, card, and overflow rules. Validate at baseline desktop, large desktop, smaller laptop, and tablet sizes.
- **Affected screens:** Dashboard shell and overview first; later all dashboard pages.
- **Affected components:** `dashboard.module.css`, `Sidebar`, `DashboardHeader`, dashboard cards.
- **Implementation effort:** Medium.
- **Expected UX impact:** High on non-baseline screens; reduces excessive whitespace and unexpected scrolling.

#### P1-5 — Add keyboard-equivalent card navigation

- **Current problem:** Small screens show passive card-position spans while desktop arrows are hidden below `lg`.
- **Proposed solution:** Use a labelled carousel pattern with keyboard-operable previous/next controls or an equivalent tab/list pattern, and announce the active card.
- **Affected screens:** Dashboard overview and future card lists.
- **Affected components:** `Klassenkasse`, `AccountCard`.
- **Implementation effort:** Medium.
- **Expected UX impact:** Medium to high for keyboard and screen-reader users.

### P2 polish

#### P2-1 — Standardize visual tokens and surfaces

- **Current problem:** Placeholder borders, shadows, radii, muted opacity, and surfaces are partly repeated inline and can drift between light/dark modes.
- **Proposed solution:** Name the dashboard surface, border, shadow, spacing, and status tokens in the existing CSS-variable system, then consume them consistently.
- **Affected screens:** All.
- **Affected components:** `app/globals.css`, dashboard CSS, shadcn primitives, cards/modals.
- **Implementation effort:** Medium.
- **Expected UX impact:** Medium; improves visual coherence and future theme work.

#### P2-2 — Broaden reduced-motion coverage

- **Current problem:** Card motion has reduced-motion handling, but the application-wide motion policy is not consistently defined.
- **Proposed solution:** Add one global reduced-motion contract and ensure card tilt, shine, hover transforms, sidebar transitions, and modal transitions respect it.
- **Affected screens:** Welcome, auth, dashboard, dialogs.
- **Affected components:** Global CSS, `AccountCard`, sidebar, action links, dialogs.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** Medium for motion-sensitive users; low visual cost.

#### P2-3 — Align branding implementation

- **Current problem:** Auth pages duplicate the Abi Manager logo markup instead of using the reusable logo component.
- **Proposed solution:** Use one brand component with explicit context variants only when placement genuinely differs.
- **Affected screens:** Welcome, sign-in, sign-up, dashboard.
- **Affected components:** `AbiLogo`, auth page wrappers, `Sidebar`.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium; reduces brand drift.

## Assumptions

- No role-specific permissions, data model, or final business workflow is invented here. The audit only records visible gaps.
- The current visual direction—restrained black/white utility UI with green status accents—remains the design direction unless a product decision changes it.
- Penpot and live browser validation remain pending because those connections were unavailable during the audit.
