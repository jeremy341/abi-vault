# Deploying the demo

The demo runs the full interface on sample data. It needs no database and no
sign-in. It can use an existing Vercel project if the demo branch has isolated
Preview settings, or a separate project if Preview settings share credentials
that should not be available to the demo.

## Settings

Use the existing project only when you can scope these variables to the
`open-source-demo` Preview branch and confirm its Preview environment does not
expose production credentials. Otherwise, create a separate Vercel project for
the demo. Do not set these values for Production or for every Preview branch.

Set these environment variables for the demo branch's Preview environment:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
ABI_VAULT_DEMO_DATA=true
NEXT_PUBLIC_APP_URL=https://<your-demo-domain>
```

With these values the app serves the sample data from `lib/demo/sample-data.ts`
and does not connect to Supabase or Clerk.
Vercel deployments from the `open-source-demo` branch also select sample data
automatically when Vercel system environment variables are available.

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
