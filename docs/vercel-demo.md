# Separate Vercel demo deployment

The public demo must be a separate Vercel project. Do not reuse the linked
production project or copy its environment variables.

## Create the demo project

Import the repository into a new Vercel project named something like
`abi-vault-demo`. Use the preparation branch for the first deployment, then
select the public default branch after the repository review is complete.

Create a separate Supabase project for the demo. Apply the migrations and seed
data there only. The production Supabase project must never be used for this
deployment.

## Demo environment variables

Configure these variables in the Vercel **Preview** and/or **Production**
environment for the demo project, using demo values only:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://<demo-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<demo-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<demo-server-only-secret-key>
SUPABASE_JWT_SECRET=<demo-project-jwt-secret>
NEXT_PUBLIC_APP_URL=https://<demo-domain>
APP_ENCRYPTION_KEY=<demo-only-64-hex-character-key>
```

Local/demo mode bypasses Clerk and uses a fixed demo administrator. Do not add
production Clerk variables or production Supabase keys to this project.

## Before sharing the URL

1. Confirm the Vercel project name and Supabase project are the demo projects.
2. Confirm the browser network requests use the demo Supabase hostname.
3. Confirm the demo contains only seeded sample data.
4. Open the URL in a private browser window.
5. Test dashboard, transactions, receipts, goals, reports, people, and periods.
6. Add the verified URL to the README.

If any environment value is uncertain, stop and verify it in the provider
dashboard. Never troubleshoot a demo by temporarily adding production keys.
