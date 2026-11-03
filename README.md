# Abi Vault

Abi Vault is an open-source finance workspace for school committees and small
teams. It helps people manage manual transactions, receipts, cash registers,
goals, reports, accounting periods, and member accountability in one place.

## Try it

The sample-data demo runs the full interface without a database or sign-in. It
is read-only. To run it locally, copy `.env.example` to `.env.local` and set:

```text
ABI_VAULT_LOCAL_MODE=true
NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE=true
ABI_VAULT_DEMO_DATA=true
```

Then run `pnpm install` and `pnpm dev`. For a public deployment, follow
[docs/vercel-demo.md](docs/vercel-demo.md).

## Features

- Manual income and expense transactions
- Receipt uploads and review states
- Cash register and cash counts
- Fundraising goals and progress tracking
- Reports and exports
- Member roles and invite links
- Admin-only accounting periods
- Responsive desktop, tablet, and phone layouts

## Run with local Supabase

Use this path when changing database-backed actions, migrations, or RPCs. Follow
[docs/self-hosting.md](docs/self-hosting.md) for the local database setup. It is
separate from the no-database sample-data demo above. Never copy production
credentials into `.env.local`.

## Code map

- `app/dashboard/` contains the page routes and their page-level state.
- `features/finance/actions/` contains finance reads and mutations;
  `features/*/schemas/` contains input validation.
- `lib/finance/` contains money calculations, projections, and date keys.
- `components/ui/` contains shared controls; route-specific controls stay near
  their page.
- `supabase/migrations/` defines the database schema and server functions.
- Start with [docs/backend-architecture.md](docs/backend-architecture.md) for
  data flow and [docs/self-hosting.md](docs/self-hosting.md) for local database
  work.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. For
security issues, follow [SECURITY.md](SECURITY.md).

## Docker Compose

The Dockerfile builds the Next.js application as a standalone production image.
Compose runs that app against the Supabase URL configured in `.env.local`:

```bash
cp .env.example .env.local
docker compose -f docker-compose.yaml up --build -d
```

Open <http://localhost:3000>. To stop it:

```bash
docker compose -f docker-compose.yaml down
```

For an entirely local database, run `supabase start` and `supabase db reset`
first, then use the local keys printed by `supabase status`. Never use production credentials in the demo.

## Scope

Abi Vault currently focuses on manual class finance. Direct bank connections
and Open Banking are deferred.

## License

Abi Vault is available under the [MIT License](LICENSE).
