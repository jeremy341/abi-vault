# Deploying the demo

The demo runs the full interface on sample data. It needs no database and no
sign-in, so it can be deployed as its own Vercel project.

## Settings

Create a separate Vercel project for the demo. Do not link it to any project
that has production credentials.

Set these environment variables for the demo project:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
ABI_VAULT_DEMO_DATA=true
NEXT_PUBLIC_ABI_VAULT_DEMO_DATA=true
NEXT_PUBLIC_APP_URL=https://<your-demo-domain>
```

With these values the app serves the sample data from `lib/demo/sample-data.ts`
and does not connect to Supabase or Clerk.

## Limits

- The demo is read-only. Changes such as adding a transaction or a receipt are
  not saved.
- Every visitor sees the same sample data and the same fixed user, who has
  administrator access.
- The page header shows a notice that the data is sample data.

## Before sharing the link

1. Open the URL in a private browser window.
2. Check the dashboard, transactions, receipts, cash registers, goals, reports,
   people, periods and settings pages.
3. Confirm the notice about sample data is shown.
4. Add the verified URL to the README.
