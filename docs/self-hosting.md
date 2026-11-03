# Hosting Abi Vault

There are three ways to run Abi Vault. Pick the one that matches what you want
to do.

| Setup | Needs | Good for |
| --- | --- | --- |
| [Sample-data demo](#sample-data-demo) | Node.js, pnpm | Trying it, taking screenshots, UI work |
| [Docker](#docker) | Docker | Running a built image anywhere |
| [Local Supabase](#local-supabase) | Node.js, pnpm, Docker, Supabase CLI | Changing database code, migrations or server actions |

None of these should ever use a production database, Clerk instance or storage
bucket. Use fake data.

## Sample-data demo

No database, no sign-in. All data comes from `lib/demo/sample-data.ts`.

```bash
pnpm install
cp .env.example .env.local
```

In `.env.local`:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
ABI_VAULT_DEMO_DATA=true
```

```bash
pnpm dev
```

Everything you change is kept in server memory and resets on restart. To keep
changes between restarts (for example on a hosted demo), add a separate
Supabase project just for demo state:

1. Run `supabase/demo/demo_state.sql` in that project.
2. Set `DEMO_SUPABASE_URL` and `DEMO_SUPABASE_SERVICE_ROLE_KEY` in the
   environment.

Without those two values the demo stays in memory. To put the demo online, see
[vercel-demo.md](vercel-demo.md).

## Docker

The `Dockerfile` builds a standalone production image. Compose runs it with the
values in `.env.local`:

```bash
cp .env.example .env.local
docker compose -f docker-compose.yaml up --build -d
```

Open <http://localhost:3000>. Stop it with:

```bash
docker compose -f docker-compose.yaml down
```

To run the sample-data demo in Docker, use the three demo values from above in
`.env.local`. `NEXT_PUBLIC_` values are read when the app is built, so rebuild
(`--build`) after changing them.

To run the image without Compose:

```bash
docker build -t abi-vault .
docker run --rm -p 3000:3000 --env-file .env.local abi-vault
```

For a real deployment, give it its own Supabase URL, publishable key,
server-only secret key and application encryption key. Keep secrets out of the
image and out of source control.

## Local Supabase

Use this when working on server actions, database migrations or RPCs.

Requirements: Node.js 22+, pnpm, Docker Desktop and the
[Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install
supabase start
cp .env.example .env.local
```

Set these in `.env.local`:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

Copy the publishable key and the service-role key that `supabase status`
prints into the matching variables, then:

```bash
pnpm dev
```

The local database starts with seeded records and a fixed local administrator.
It is not meant for real financial data. Reset it any time with
`supabase db reset`.

## Keeping environments apart

Use separate Supabase projects, Clerk instances, storage buckets and deployment
variables for demo, development and production. Review database migrations
before applying them, and apply them only to the environment you mean to change.
