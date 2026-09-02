# Self-hosting Abi Vault

Abi Vault can run locally with Docker and a local Supabase instance. The
production website and its database are not required and must not be used for
local development.

## Local demo

Requirements: Node.js 22+, pnpm, Docker Desktop, and the Supabase CLI.

```text
pnpm install
supabase start
copy .env.example .env.local
```

Set these values in `.env.local` for a local demo:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

Use the local Supabase publishable/anon key and service-role key printed by
`supabase status`. Do not use keys from the production project. Then run:

```text
pnpm dev
```

The local demo uses seeded sample data and a fixed demo administrator. It is
not intended for real financial data.

## Docker application image

Build and run the application image against a separately managed Supabase
instance:

```text
docker build -t abi-vault .
docker run --rm -p 3000:3000 --env-file .env.local abi-vault
```

For a real deployment, provide the self-hosted instance's own URL, publishable
key, server-only secret key, and application encryption key. Keep all secrets
outside the image and outside source control.

## Production isolation

Never point a demo or self-hosted environment at the production database. Use
separate Supabase projects, Clerk instances, storage buckets, and deployment
environment variables. Database migrations should be reviewed and applied to
the intended environment explicitly.
