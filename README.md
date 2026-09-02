# Abi Vault

Abi Vault is an open-source finance workspace for school committees and small
teams. It helps people manage manual transactions, receipts, cash registers,
goals, reports, accounting periods, and member accountability in one place.

## Try it

Try the [hosted demo](https://abi-vault-demo.vercel.app). It uses
sample data only and is completely separate from production.

## Features

- Manual income and expense transactions
- Receipt uploads and review states
- Multiple cash registers and cash counts
- Fundraising goals and progress tracking
- Reports and exports
- Member roles and invite links
- Admin-only accounting periods
- Responsive desktop, tablet, and phone layouts

## Run locally

See [docs/self-hosting.md](docs/self-hosting.md) for the local demo, Supabase,
and Docker setup. For a separate Vercel deployment, see
[docs/vercel-demo.md](docs/vercel-demo.md). The shortest local path is:

```text
pnpm install
supabase start
copy .env.example .env.local
pnpm dev
```

Use fake data only. Never copy production credentials into `.env.local`.

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
first, then use the local keys printed by `supabase status`. Never use official
production credentials in the demo.

## Scope

Abi Vault currently focuses on manual class finance. Direct bank connections
and Open Banking are intentionally deferred.

## License

Abi Vault is available under the [MIT License](LICENSE).
