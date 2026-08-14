# Current navigation

## Primary navigation

The authenticated dashboard sidebar defines these links:

| Label | Route | Active-state method |
| --- | --- | --- |
| Übersicht | `/dashboard` | Exact `usePathname()` match |
| Transaktionen | `/dashboard/transactions` | Exact match |
| Belege | `/dashboard/receipts` | Exact match |
| Ziele | `/dashboard/goals` | Exact match |
| Kasse & Konten | `/dashboard/funds` | Exact match |
| Berichte | `/dashboard/reports` | Exact match |
| Personen | `/dashboard/people` | Exact match |
| Einstellungen | `/dashboard/settings` | Exact match |

The sidebar uses `SidebarMenuButton` with a rendered Next `Link`. Desktop uses the shadcn sidebar; mobile uses the sidebar component's sheet/off-canvas behavior and the header `SidebarTrigger`.

## Public navigation

- The welcome page links to `/sign-in` and `/sign-up` for signed-out users.
- The welcome page links to `/dashboard` for signed-in users.
- The sign-in and sign-up pages provide a brand link back to `/`.
- Clerk controls internal authentication steps and subroutes under the catch-all segments.

## Global dashboard navigation

`DashboardHeader` derives a title and description from a pathname-to-metadata map. Desktop shows the title and description; mobile hides that title block and shows the sidebar trigger, notifications button, and Clerk user button.

## Navigation observations

- Active navigation is exact-match only. A future nested route such as `/dashboard/transactions/123` would not automatically mark Transaktionen active.
- The navigation list and header metadata are maintained in separate structures, creating a future drift risk.
- The notification control is currently visual only; no notification page, menu, or action flow is present.
- The cohort selector is currently a button without an implemented selection flow.
- Sidebar collapsed/expanded state is persisted by the shadcn sidebar cookie; theme state is persisted separately in local storage.
