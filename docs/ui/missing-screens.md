# Missing screens and unfinished screen areas

This list records gaps visible in the current source. It does not assert that every item is part of the final product; the product requirements should decide scope.

## Existing route shells that need real screens

| Route | Current content | Missing screen areas |
| --- | --- | --- |
| `/dashboard/transactions` | Static route section | Transaction list, filters/search, transaction detail, create/edit flow, amount/category/date validation, receipt relation, approval status, empty/error states. |
| `/dashboard/receipts` | Static route section | Upload/drop zone, receipt preview, metadata form, review queue, approval/rejection state, upload and processing errors. |
| `/dashboard/goals` | Static route section | Goal list, create/edit goal, target amount/date, progress, contribution history, completed/overdue state. |
| `/dashboard/funds` | Static route section | Bank/cash account list, account detail, reconciliation, connection state, cash count flow, empty/error states. |
| `/dashboard/reports` | Static route section | Report filters, category/outcome summaries, time range, export/print state, no-data state. |
| `/dashboard/people` | Static route section | Member list, role display, invite/add flow, role editing, access restrictions, pending/removed states. |
| `/dashboard/settings` | Static route section | Profile/workspace settings, class settings, theme/preferences, role/access settings, save/error feedback. |

## Dashboard overview gaps

- The transaction-history area is currently an empty placeholder.
- The right column contains three empty placeholders for goals, spending by category, and review items.
- The top-level cohort selector and notification control are not functional.
- There is no visible account/profile menu beyond Clerk's `UserButton`.
- There is no dashboard data loading or error presentation.

## Cross-cutting missing states

- Route-level loading, error, and not-found screens.
- Empty states with a clear next action for every data-driven area.
- Permission-denied states for future role-based access.
- Network/API failure states and retry actions.
- Form save success and conflict states.
- Unsaved-changes confirmation for editing flows.
- Keyboard and focus behavior for modal open/close and dynamic card changes.

## Assumptions

- The product’s earlier planning mentions three user classes, but the current code audit found no implemented role-specific screens or guards; these should not be treated as existing.
- No extra screens are proposed as implemented features. The entries above describe the visible gaps implied by existing routes, labels, and components.
