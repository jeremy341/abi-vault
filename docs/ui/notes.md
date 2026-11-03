# UI notes

Where things live:

- Tokens and global styles: `app/globals.css`
- Shared list, table, stat and button styles: `app/dashboard/ledger.module.css`
- Shared dialog styles: `components/dashboard/dialog.module.css`
- Shell (sidebar, top bar, phone bar): `components/presentation/`
- Shared controls: `components/ui/`

Screenshots for the README are taken at 1920×1080 and live in
`docs/screenshots/`. Retake them after visual changes (see CONTRIBUTING).

Known gaps:

- Reports still scrolls about 90px on a 1280×720 window.
- Table headers do not stick when a table scrolls.
- Dialogs close without an exit animation.
- Sign-in, sign-up and join were not checked with a real Clerk session.
- In development the Next.js badge sits over the theme toggle in the sidebar.
  It does not appear in production.
