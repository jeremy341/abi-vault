# Design-system recommendations

Planning only. No tokens or application code were changed.

## Foundation recommendations

### P0 — Define semantic content language and color semantics

- **Current problem:** German dashboard copy and English authentication copy coexist; color usage is partly semantic and partly inline.
- **Proposed solution:** Choose the release language and document semantic roles such as `surface`, `surface-muted`, `text-primary`, `text-secondary`, `border-subtle`, `status-success`, `status-warning`, `status-danger`, and `action-primary`. Map both light and dark themes to those roles.
- **Affected screens:** All screens, especially auth and dashboard.
- **Affected components:** `app/globals.css`, Clerk appearance configuration, all shared primitives.
- **Implementation effort:** Medium.
- **Expected UX impact:** High for clarity, contrast, and theme consistency.

### P0 — Define accessible interaction states

- **Current problem:** Focus, error, pressed, selected, disabled, and loading states are not documented as a shared system.
- **Proposed solution:** Specify visible `:focus-visible`, hover, active, disabled, invalid, selected, and loading styles with contrast targets. Require icon buttons to have accessible names and controls not to rely on color alone.
- **Affected screens:** All interactive screens.
- **Affected components:** Buttons, links, inputs, sidebar items, card carousel, dialogs.
- **Implementation effort:** Medium.
- **Expected UX impact:** High for accessibility and confidence.

### P1 — Establish spacing and radius scales

- **Current problem:** Tailwind values, inline arbitrary values, and responsive overrides are used without a documented rhythm.
- **Proposed solution:** Define a compact spacing rhythm and a small radius set for shell, card, field, and control surfaces. Use `clamp()` only for intentional viewport adaptation, not as a substitute for hierarchy.
- **Affected screens:** Dashboard shell, overview, auth, future pages.
- **Affected components:** `dashboard.module.css`, shadcn components, cards, modals.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** Medium; improves density and consistency across resolutions.

### P1 — Define layout modes, not resolution-specific copies

- **Current problem:** The current CSS has desktop and `2200px` overrides, but the relationship between content width, grid columns, and viewport height is not a documented system.
- **Proposed solution:** Document four practical modes: tablet, compact desktop/small laptop, baseline desktop, and large desktop. Keep the 1920×1080 composition as the visual baseline while allowing larger max widths and spacing only where content benefits.
- **Affected screens:** Dashboard first, later shared page shells.
- **Affected components:** Shell, sidebar, header, dashboard grid, card components.
- **Implementation effort:** Medium.
- **Expected UX impact:** High on large and small desktop screens.

### P1 — Make data states part of the design system

- **Current problem:** Blank placeholders do not communicate loading, no data, failure, or permission states.
- **Proposed solution:** Create state patterns for loading/skeleton, empty, error/retry, permission denied, and saved/unsaved feedback. Each pattern should have semantic text and an appropriate action.
- **Affected screens:** Every data-driven route.
- **Affected components:** Shared page-state, alert, skeleton, card, table, and form components.
- **Implementation effort:** Medium.
- **Expected UX impact:** High once real data workflows are introduced.

### P1 — Define typography hierarchy and language rules

- **Current problem:** The current system uses Geist but does not document roles, scale, or German copy rules; public and authenticated copy are inconsistent.
- **Proposed solution:** Keep the existing font unless a product decision changes it, but define display, page title, section title, body, metadata, and helper-text roles. Document capitalization, number/date, and currency formatting conventions.
- **Affected screens:** All.
- **Affected components:** Global CSS, headers, cards, forms, tables.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium; improves scanning and trust in finance data.

### P2 — Formalize motion tokens

- **Current problem:** Card tilt, shine, hover lift, and sidebar transitions use local durations and easing values.
- **Proposed solution:** Define a restrained motion scale with purpose-based durations and a global reduced-motion override. Keep shine/tilt as card-specific enhancements, never as required information.
- **Affected screens:** Welcome, dashboard, card dialogs, sidebar.
- **Affected components:** Global CSS, `AccountCard.module.css`, shadcn sidebar.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** Medium; makes motion feel deliberate and safer.

### P2 — Document icon and illustration rules

- **Current problem:** Lucide is configured, but icon sizing, stroke weight, decorative status icons, and alt/hidden behavior are not documented.
- **Proposed solution:** Define icon sizes by context, use `aria-hidden` for decorative icons, and use visible text plus icon for status meaning. Keep the current Lucide library unless requirements change.
- **Affected screens:** Sidebar, header, dashboard cards, future tables and alerts.
- **Affected components:** Lucide usages and shared controls.
- **Implementation effort:** Small.
- **Expected UX impact:** Low to medium; improves consistency and semantics.

## Assumptions

- This plan does not select a new font, brand color, or business-specific data model.
- The visual reference in the repository remains inspirational, not a requirement to copy exactly.
- Penpot design tokens/components could not be inspected and therefore are not treated as an existing source of truth.
