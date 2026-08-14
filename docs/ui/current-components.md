# Current component inventory

## Reusable application components

| Component | Location | Responsibility | Notes |
| --- | --- | --- | --- |
| `AbiLogo` | `components/AbiLogo.tsx` | Linked Abi Manager brand mark and label. | Reused by the dashboard sidebar; authentication pages duplicate similar markup instead of using this component. |
| `Sidebar` | `components/sidebar.tsx` | Navigation links, active route styling, brand, and theme toggle. | Navigation data is local to this component. Uses Lucide icons and shadcn sidebar primitives. |
| `DashboardHeader` | `components/dashboard-header.tsx` | Route-aware title/description, mobile trigger, cohort button, notifications button, and Clerk `UserButton`. | Route metadata is duplicated conceptually with sidebar navigation. |
| `ThemeToggle` | `components/ThemeToggle.tsx` | Toggles `.dark` and persists the preference in local storage. | No server-side or pre-hydration theme initialization is present. |
| `Klassenkasse` | `components/dashboard/Klassenkasse.tsx` | Card carousel, balance/status area, add-card modal, edit-card modal, and delete flow. | State is frontend-only and resets on refresh. |
| `AccountCard` | `components/dashboard/AccountCard.tsx` | Renders SVG background plus dynamic TSX card text; supports bank and add-card variants. | Pointer tilt and card color tint are client-side effects. |
| `AddCardModal` | `components/dashboard/AddCardModal.tsx` | Card preview, color selection, validation, and card creation form. | Custom dialog markup uses `role="dialog"`; no explicit focus management was found. |
| `EditCardModal` | `components/dashboard/EditCardModal.tsx` | Card preview, editing, validation, and deletion. | Shares substantial logic and markup with `AddCardModal`. |

## shadcn/ui primitives currently present

`components/ui/` contains `alert`, `badge`, `button`, `card`, `dropdown-menu`, `input`, `progress`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, and `tooltip`. The dashboard currently visibly uses `card`, `sidebar`, `button`, `input`, and `sheet` directly or through higher-level components. The remaining primitives appear prepared for future screens rather than active in the current page source.

## Component duplication and consistency findings

- `AddCardModal` and `EditCardModal` duplicate the color palette, card-number formatter, expiry formatter, field wrapper, validation rules, and most layout markup.
- Sign-in and sign-up duplicate the Abi Manager logo markup instead of reusing `AbiLogo`.
- Sidebar navigation labels and header `pageInformation` both encode route names separately.
- Placeholder cards are implemented inline in `app/dashboard/page.tsx` rather than through a named placeholder/skeleton component.
- The card SVG background and dynamic TSX overlay are correctly separated: SVG supplies the visual base, while state-driven text and color are rendered in React.

## Missing reusable primitives

The current source has no visible shared dialog/focus-management wrapper, form schema/validation utility, notification item, page-state component, or data table abstraction for the future finance screens. These are observations, not recommendations already implemented.
