# Deploying the demo to Vercel

The demo runs the whole interface on sample data. It needs no database and no
sign-in, so it is safe to share publicly.

## Settings

Use a separate Vercel project for the demo, or an existing project only if you
can scope the variables below to the `open-source-demo` Preview branch and its
Preview environment holds no production credentials. Never set these for
Production or for every Preview branch.

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
ABI_VAULT_DEMO_DATA=true
NEXT_PUBLIC_APP_URL=https://<your-demo-domain>
```

Deployments of the `open-source-demo` branch also pick the sample data
automatically when Vercel's system variables are available.

## How visitors see it

- Everyone sees the same sample data and the same fixed user, who has
  administrator access.
- Two sample classes are available in the header. Visitors can also create and
  rename classes; the class list and names are stored in that browser's signed,
  HTTP-only cookie. Class IDs only select demo sample state and do not provide
  privacy or access control.
- Changes work (adding a transaction, counting a cash register, creating a
  goal), but by default they live in server memory. They reset when the server
  restarts, and on Vercel they may not be shared between requests.

To enable class creation and renaming on Vercel, set a stable server-only
`DEMO_CLASS_SIGNING_SECRET` value (for example, `openssl rand -hex 32`) in the
same Preview environment. Keep it private. Without it, only the built-in
classes can be selected, and attempts to manage classes show a configuration
error. Locally, a temporary process key is used when no secret is configured;
restarting the server resets custom class lists.

## Keeping changes (optional)

To make demo changes stick for everyone:

1. Create a Supabase project used only for the demo.
2. Run `supabase/demo/demo_state.sql` in it.
3. Set these in the same Vercel environment:

```text
DEMO_SUPABASE_URL=https://<your-demo-project>.supabase.co
DEMO_SUPABASE_SERVICE_ROLE_KEY=<service role key of that demo project>
```

Use the demo project's own key, never one from a real project. Because every
visitor shares the same state, consider resetting it now and then by deleting
the rows in the `demo_state` table.

## Before sharing the link

1. Open the URL in a private browser window.
2. Click through the overview, transactions, receipts, goals, cash registers,
   reports, people, settings and periods pages.
3. Try one change, such as adding a transaction, and check it appears.
4. Add the verified URL to the README.
