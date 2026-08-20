# Abi Manager UI — Shared Design Contracts

> Current implementation reference for the shared design decisions already introduced. The Dashboard remains the visual source of truth: calm Geist typography, white cards on a light canvas, thin neutral rules, restrained depth, and small semantic accents.

## Design direction

- **Product tone:** trust-first, calm, minimal finance workspace.
- **Visual source of truth:** Dashboard panels and shell.
- **Composition rule:** shared contracts normalize styling without changing page information architecture, grid composition, or responsive row behavior.
- **Density rule:** preserve the existing Dashboard density at 1920px and 2560px; wide-screen rhythm expands to 2rem only where the existing Dashboard already does so.
- **Motion rule:** short, quiet feedback transitions; dialogs support Escape and click-outside; no new decorative motion is introduced by these contracts.

## Typography contract

The product uses Geist Sans from `next/font` through `--font-geist-sans`.

| Role | Token | Value | Intended use |
|---|---|---:|---|
| Base UI font | `--ui-font` | `var(--font-geist-sans), sans-serif` | Body and controls |
| Section title | `--ui-section-title-size` | `1.5rem` | “Alle Transaktionen”, “Belegübersicht”, and equivalent section headings |
| Table header | `--ui-table-header-size` | `0.75rem` | Data-table column labels |
| Table row | `--ui-table-row-size` | `0.875rem` | Full data-table rows |
| Metadata | `--ui-meta-size` | `0.75rem` | Supporting labels, file metadata, and secondary values |

Typography decisions:

- Section headings retain the Dashboard’s semibold, tight-tracking hierarchy.
- Financial values should use tabular numerals when they are aligned in columns.
- Supporting metadata remains muted and smaller than primary row content.
- Page titles remain governed by the shared Dashboard header styles, not by the data-page section-title token.

## Surface, border, and semantic color contract

### Surfaces and ink

| Token | Light value | Role |
|---|---|---|
| `--ui-canvas` | `#fafafa` | Application canvas |
| `--ui-surface` | `#ffffff` | Cards, controls, menus, and dialogs |
| `--ui-ink` | `#1d1d1f` | Primary text and dark actions |
| `--ui-muted-ink` | `oklch(0.556 0 0)` | Secondary text, metadata, and disabled-adjacent content |
| `--ui-border` | `rgb(0 0 0 / 0.10)` | Standard card/control boundary |
| `--ui-border-subtle` | `rgb(0 0 0 / 0.08)` | Table rules and quiet separators |
| `--ui-border-focus` | `rgb(29 29 31 / 0.85)` | Focus and active control boundary |

Dark mode overrides these roles with the existing dark canvas, dark surface, light ink, and translucent white borders. Components should consume roles rather than inventing new neutral literals.

### Semantic accents

| Token | Purpose |
|---|---|
| `--ui-positive` / `--ui-positive-soft` | Income, success, verified status |
| `--ui-negative` / `--ui-negative-soft` | Expense and negative financial values |
| `--ui-warning` / `--ui-warning-soft` | Review-needed and attention states |
| `--ui-violet` / `--ui-violet-soft` | Category identity and selected/primary category accents |
| `--ui-orange` / `--ui-orange-soft` | Secondary category identity and warm accent states |

Semantic colors are intentionally restrained. Green, red, amber, violet, and orange communicate state or category only; they are not decorative page themes.

## Radius and spacing contract

| Token | Value | Role |
|---|---:|---|
| `--ui-card-radius` | `1rem` | Shared card and panel radius |
| `--ui-control-radius` | `0.7rem` | Dropdowns, buttons, inputs, and compact controls |
| `--ui-control-height` | `2.75rem` | Shared dropdown/control baseline |
| `--ui-page-gap` | `1.5rem` base, `2rem` at `min-width: 2200px` | Vertical page stack rhythm |
| `--ui-card-gap` | `1.5rem` base, `2rem` at `min-width: 2200px` | KPI/summary and sibling-card rhythm |
| `--ui-page-max` | `2100px`, `1880px` from 1600px, `none` from 2200px | Shared content max-width |
| `--ui-page-padding-inline` | `clamp(1rem, 2vw, 3rem)`, then explicit 1600px/2200px values | Shared desktop page inset |
| `--ui-card-shadow` / `--ui-data-shadow` | Existing restrained 1px shadow | Card and data-surface elevation |
| `--ui-modal-shadow` | Existing 1.5rem modal shadow | Dialog elevation |

Spacing rules:

- The Dashboard remains unchanged and establishes the visual rhythm.
- Transactions and Receipts consume the same page/card gap values for their page stack and summary/KPI grids.
- Dashboard, Transactions, and Receipts consume the same page-container variables. At 1600px the content is capped at 1880px with a larger inset; at 2200px the cap is removed and the inset becomes 2rem.
- Existing page-specific table heights, row counts, and wide-screen whitespace behavior remain intentional local behavior until the product-table contract is finalized.
- No new scrolling is introduced by shared spacing tokens.

## Shared component contracts

### Secondary-page placeholder

Source: `components/dashboard/PagePlaceholder.tsx`

- Secondary routes use the shared page-container inset and a neutral card-based empty state.
- Placeholder cards use the Dashboard surface, border, radius, shadow, section-title typography, and muted metadata roles.
- The global Dashboard header remains the single page-title source; placeholder content communicates the page’s current readiness without introducing a second navigation pattern.

### Field dropdown

Source: `components/ui/field-dropdown.tsx`

Props:

- `ariaLabel`: accessible name for the trigger and listbox.
- `label?`: optional visible field label.
- `value`: selected option value.
- `options`: readonly `{ value, label }[]` collection.
- `onChange(value)`: selection callback.
- `className?`: layout hook for the consuming page.
- `placement?`: `bottom` or `top` menu placement.

Behavior and styling:

- Uses a button trigger with `aria-haspopup="listbox"` and `aria-expanded`.
- Uses `role="listbox"` and `role="option"` for the open menu.
- Selected options show a check icon and active neutral ink fill.
- Menus use the shared surface, border, control radius, and menu elevation.
- Open-menu styling is defined by `.ui-dropdown-*` rules in `app/globals.css`.

### Pagination

Source: `components/ui/pagination.tsx`

Props:

- `page`: current one-based page.
- `pageCount`: final page number.
- `onPageChange(page)`: page transition callback.
- `className?`: local layout hook.

Behavior and styling:

- Always exposes previous, current, and next controls.
- Disables previous on page 1 and next on the final page.
- Uses `aria-label`, `aria-current`, and disabled states.
- Uses the shared compact pagination classes `.ui-pagination-*`.
- Page-specific footer placement remains local to preserve existing layouts.

### Dialog

Source: `components/ui/dialog.tsx`

Props:

- `children`: dialog content.
- `onClose()`: close callback.
- `label`: accessible dialog label.
- `overlayClassName`: page-specific overlay styling hook.
- `dialogClassName`: page-specific modal styling hook.

Behavior and styling:

- Renders `role="dialog"` and `aria-modal="true"`.
- Closes on Escape.
- Closes when clicking the overlay outside the dialog surface.
- Leaves modal dimensions and internal layout to the consuming page so existing modal designs are preserved.

### Button

Source: `components/ui/button.tsx`

The shared button primitive now consumes the product contracts for:

- Control radius: `--ui-control-radius`.
- Primary ink/surface contrast: `--ui-ink` and `--ui-surface`.
- Outline border: `--ui-border`.
- Focus boundary: `--ui-border-focus`.
- Quiet neutral hover states.

Existing local page buttons remain in place where changing their markup would alter layout. New shared actions should use the primitive or match these exact contracts.

### Product data surfaces

- Transactions and Receipts mark their table shells with `.ui-data-table` and use the shared table-header, row, border, and data-shadow roles.
- Category, status, and filter-count pills use `.ui-badge`; semantic variants continue to be provided by the consuming page.
- Product-facing selectors use the custom dropdown contract. Native date inputs remain native because they provide the expected calendar affordance.

## Responsive contract

- Target desktop references are 1920×1080 and 2560×1440.
- Tablet/iPad support spans 768–1399px and uses a persistent 5.25rem icon rail, a 6rem page header, 1.25rem page/card rhythm, and touch-safe controls.
- Tablet portrait (768–1099px) converts Transactions and Receipts tables into labeled card rows; tablet landscape (1100–1399px) preserves compact full tables with six records per page.
- Dashboard portrait uses one ordered scrolling flow; dashboard landscape is a scroll-free at-a-glance overview with a compact bank card, five recent transactions, simplified goals, and condensed category/review cards.
- Tablet pages may scroll vertically, but must not introduce document- or main-level horizontal overflow.
- The shared wide-screen token branch begins at `min-width: 2200px`.
- Dashboard, Transactions, and Receipts keep their current page-specific compositions and viewport containment.
- Main shell overflow remains contained; shared contracts must not introduce document-level scrolling.
- Breakpoint-specific row visibility and fixed table heights are not generalized yet because they are part of the existing page composition.

## P2 density and interaction contract

- Dashboard preview tables are a compact presentation role and may show fewer rows at supported height breakpoints.
- Transactions uses `--ui-fixed-table-rows: 10`; Receipts uses `--ui-receipt-table-rows: 9` at the base/1920px layout and adopts the Transactions 10-row contract at `min-width: 2200px`. These are page-specific fixed-result contracts and preserve the established whitespace behavior on shorter result pages.
- Aligned dates and amounts use `.ui-tabular` / `font-variant-numeric: tabular-nums`.
- `.ui-focus-ring` provides the shared neutral keyboard focus treatment for controls that opt in.
- `.ui-motion-safe` provides the reduced-motion opt-in for interactive surfaces. The Dashboard account-card animation intentionally remains outside this hook and is unchanged.
- Modal footers have two named composition variants: split-footer (reset plus actions) and action-only.

## Verification baseline

The current implementation was checked in the in-app browser at 768×1024, 820×1180, 1180×820, 1366×1024, 1920×1080, and 2560×1440:

- All dashboard routes remain free of horizontal overflow at tablet sizes.
- Tablet portrait uses card rows for Transactions and Receipts; tablet landscape retains compact tables with all columns visible.
- Dashboard, Transactions, and Receipts retain their established desktop viewport containment.
- Transactions filter dialog opened with the shared dialog behavior.
- Receipts status dropdown opened with the shared dropdown behavior.
- Lint and `git diff --check` passed after the contract changes.

## Intentional exceptions

- Dashboard preview density and full-table density remain separate by design and are named in the P2 density contract above.
- Page-specific table height/row-count behavior remains local so the established 1920px and 2560px compositions do not change.
- Modal footer composition remains page-specific: reset-plus-actions for Transactions and action-only for Receipts.
- Some legacy local declarations remain in CSS modules, but their rendered surfaces now resolve through the shared tokens at the contract boundary.
- The account-card sweep/tilt animation is intentionally excluded from the P2 pass and must not be changed without a separate request.
