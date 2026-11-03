# UI notes

Where things live:

- Tokens: `app/globals.css`
- Shared list, table and dialog styles: `app/dashboard/ledger.module.css`
- Shell: `components/presentation/ResponsiveDashboardShell.tsx`
- Shared components: `components/ui/`

Still open:

- Sample data uses German category names, and amounts are shown in dollars. The design is meant for euros.
- Table headers do not stick when a table scrolls.
- Dialogs close without an exit animation.
- Sign-in, sign-up and join were not checked with a real Clerk session.
- In development the Next.js badge overlaps the theme toggle in the sidebar. It does not appear in production.
