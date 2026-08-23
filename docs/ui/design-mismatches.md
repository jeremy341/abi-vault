# Abi Manager UI — Remaining Design Mismatches

> Updated 2026-08-16 after the P0/P3 cleanup. The Account card animation remains intentionally unchanged by request.

## Priority key

- **P0** — shared behavior or accessibility contract
- **P2** — local inconsistency or maintainability issue
- **P3** — polish or future documentation issue

## Remaining intentional exception

| Priority | Surface                | Current state                                                              | Suggested future decision                              |
| -------- | ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| P2       | Account card animation | The account-card sweep/tilt remains the strongest animation in the product | Keep only if it remains an intentional identity anchor |

## Resolved P0 contracts

- Shared pagination, dropdown, button, and dialog primitives are implemented and used by the Transactions and Receipts pages.
- Dialogs expose accessible labels, modal semantics, Escape handling, and click-outside dismissal.
- Dropdowns expose listbox semantics, selected-state feedback, and keyboard-friendly button triggers.

## Resolved P3 polish

- Root document language now matches the German product copy with `lang="de"`.
- Secondary pages use the shared `PagePlaceholder` composition and the same page-container, card, typography, border, and shadow language as the Dashboard.

## Resolved P1 foundations

- Page-container contract is shared by Dashboard, Transactions, and Receipts through `--ui-page-max`, `--ui-page-padding-inline`, `--ui-page-padding-bottom`, and explicit 1600px/2200px behavior.
- Dashboard and data pages share page/card rhythm tokens while preserving Dashboard’s existing height-specific behavior.
- Dashboard semantic accents now consume shared positive, negative, warning, violet, and orange roles; its soft shadow/backdrop treatment is unchanged.
- Surface, border, card-radius, control-radius, data-shadow, and modal-shadow tokens are available and applied to the data-page surfaces.
- Typography roles cover page/section hierarchy, table headers, rows, and metadata across Transactions and Receipts.
- Product tables use the shared data-table contract and shared row/header roles.
- Category, status, and filter-count pills use the shared badge contract.
- Transactions and Receipts use shared pagination, dropdown, and dialog behavior; product-facing selectors remain custom rather than native browser menus.
- Receipt assignment copy is consistently German: `Transaktion auswählen`.
- The Transactions badge explicitly reports `aktive Filter` and counts active criteria, not selected values inside one criterion.

## Resolved P2 contracts

- Dashboard preview and full-table density are named separately: preview rows remain intentionally compact, while Transactions uses `--ui-fixed-table-rows` and Receipts uses `--ui-receipt-table-rows`.
- Dates and financial amounts on Dashboard previews, Transactions, and Receipts use tabular numerals.
- Dashboard compact-height spacing uses the named `--ui-compact-gap` token.
- Shared focus and reduced-motion hooks are available through `.ui-focus-ring` and `.ui-motion-safe`; the account-card animation was not modified or opted into either hook.
- Fixed-result and fluid-result table behavior is now explicit in the shared contract: Transactions reserves ten rows, Receipts reserves nine rows at base/1920px and ten rows at `min-width: 2200px`, while each page keeps its existing container behavior.
- Modal footer composition is documented as two intentional variants: split footer for Transactions and action-only footer for Receipts.

## Verification baseline

- Browser-checked at 1920×1080 and 2560×1440 for `/dashboard`, `/dashboard/transactions`, and `/dashboard/receipts`.
- No document-level scrolling was present at either supported desktop size.
- Dashboard panel shadows/backdrops were visually preserved.
- `npm run lint` and `git diff --check` pass after the contract pass.

## Source of truth

The active shared contract is documented in [`shared-design-contracts.md`](./shared-design-contracts.md). Existing Dashboard visuals remain the reference for future normalization work.
