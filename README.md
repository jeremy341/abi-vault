# Abi Vault

Abi Vault is a shared finance workspace for school committees and small teams.
It manages manual income and expense transactions, receipts, cash registers,
goals, reports, accounting periods, and member accountability.

This checkout is the official application source. The public demo is maintained
on the `open-source-demo` branch. The official app uses Clerk and Supabase; the
demo runs in local mode without Clerk and uses a separate Supabase project.
Never mix their credentials, databases, storage buckets, or deployments.

## Features

- Manual income and expense transactions
- Receipt uploads, previews, and review states
- Cash registers and cash counts
- Fundraising and savings goals
- Reports and CSV exports
- Member roles and invitation links
- Admin-only accounting periods
- Responsive desktop, tablet, and phone layouts

Direct bank connections and Open Banking are intentionally deferred.

## Architecture

Abi Vault is a Next.js modular monolith. Next.js, React, and TypeScript provide
the application and server actions. Clerk provides identity, organizations,
invitations, and production authentication. Supabase provides PostgreSQL, Row
Level Security, private receipt storage, and application data.

The official deployment uses Clerk plus Supabase. The demo uses
`ABI_VAULT_LOCAL_MODE=true`, a separate Supabase project, seeded sample data,
and a fixed demo administrator. It does not require Clerk at runtime.

## Requirements

- Node.js 22 or newer
- pnpm
- Docker Desktop
- Supabase CLI for local database development
- A Clerk instance for the official authenticated deployment

Install dependencies:

```bash
pnpm install
```

## Official hosted deployment

Use this path for the real application. Never use demo keys here.

1. Create an official Supabase project.
2. Create a Clerk application and configure organization support.
3. Configure Clerk as Supabase’s third-party auth provider using the Clerk
   issuer domain.
4. Create the private `receipts` storage bucket required by the migrations.
5. Copy `.env.example` to `.env.local` and fill it with official values.

```bash
cp .env.example .env.local
```

The important official values are:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_ISSUER_DOMAIN=...
NEXT_PUBLIC_SUPABASE_URL=https://<official-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_ENCRYPTION_KEY=<64-hex-characters>
ABI_VAULT_LOCAL_MODE=false
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=false
NEXT_PUBLIC_APP_URL=https://<official-domain>
```

Link and migrate only the intended official Supabase project:

```bash
supabase login
supabase link --project-ref <official-project-ref>
supabase db push
```

For local development with the official auth flow:

```bash
pnpm dev
```

For Vercel, import the repository into the official Vercel project, configure
the official Production environment variables, use `pnpm build`, and verify
sign-in, organizations, invitations, receipts, and server actions.

## Official Docker hosting

The Docker image runs the Next.js application. Supabase remains the data layer
and must be a separately selected hosted or self-hosted installation.

With official values in `.env.local`:

```bash
docker compose -f docker-compose.yaml up --build -d
```

Open <http://localhost:3000>. Stop the container with:

```bash
docker compose -f docker-compose.yaml down
```

For a local Supabase database instead:

```bash
supabase start
supabase db reset
pnpm dev
```

Never put production secrets in the image or source control.

## Public demo

The demo is available at <https://abi-vault-demo.vercel.app>.

It is isolated from the official application:

- It uses the `open-source-demo` branch.
- It uses a separate Supabase project and storage bucket.
- It contains seeded sample data only.
- It runs without Clerk in local/demo mode.
- It must not receive official Clerk or Supabase credentials.

### Run the demo locally

```bash
git clone https://github.com/jeremy341/abi-vault.git
cd abi-vault
git switch open-source-demo
pnpm install
supabase start
supabase db reset
cp .env.example .env.local
```

Use the keys printed by `supabase status`:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
APP_ENCRYPTION_KEY=<64-hex-characters>
```

Then run `pnpm dev` and open <http://localhost:3000>. The demo is not suitable
for real financial data.

### Host the demo with Docker

The demo Docker image runs the app against the Supabase URL in `.env.local`:

```bash
git switch open-source-demo
copy .env.example .env.local
docker compose -f docker-compose.yaml up --build -d
```

For a completely local demo database, run `supabase start` and
`supabase db reset` first, then use the local Supabase keys in `.env.local`.

### Host the demo on Vercel

1. Create a separate Vercel project, such as `abi-vault-demo`.
2. Connect it to the `open-source-demo` branch.
3. Create a separate Supabase project and apply the manual-finance migrations.
4. Set these demo-only Production variables:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://<demo-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<demo-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<demo-service-role-key>
SUPABASE_JWT_SECRET=<demo-jwt-secret>
APP_ENCRYPTION_KEY=<demo-only-64-hex-character-key>
NEXT_PUBLIC_APP_URL=https://<demo-domain>
```

5. Deploy and verify the root page and every dashboard route before sharing it.

## Verification

```bash
pnpm lint
pnpm test:unit
pnpm build
```

Before release, verify the root page, dashboard, transactions, receipts,
goals, cash registers, reports, people, settings, and periods. Also verify
receipt preview/review, Docker startup, English/USD demo copy, and strict
production/demo credential isolation.

## Stardance and Dockerize checklist

Stardance accepts technical projects that are open source. The Dockerize
mission additionally lists these requirements: a public repository, Hackatime
tracking, a frontend, backend, data storage, a `Dockerfile`, a
`docker-compose.yaml`, and Docker run instructions in the README.

The project owner must still verify eligibility, age requirements, Hackatime
tracking, the project’s authorship and AI-assistance limit, the live demo URL,
the public license, and the current submission form or Slack requirements.

## Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report
security issues according to [SECURITY.md](SECURITY.md). Abi Vault is available
under the [MIT License](LICENSE).
