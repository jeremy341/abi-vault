# Contributing to Abi Vault

Abi Vault focuses on manual class finance: transactions, receipts, cash
registers, goals, reports, accounting periods, and member accountability.

## Development setup

1. Install Node.js 22+, pnpm, Docker Desktop, and the Supabase CLI.
2. Copy `.env.example` to `.env.local`.
3. Start local Supabase with `supabase start`.
4. Set `ABI_VAULT_LOCAL_MODE=true` for local demo work.
5. Run `pnpm install` and `pnpm dev`.

Use fake data locally. Never connect development to a production Supabase
project or Clerk instance.

## Before opening a pull request

Run `pnpm lint`, `pnpm test:unit`, and `pnpm build`. Include screenshots for
visual changes and explain migration or permission changes. Do not commit
credentials, real receipts, personal data, or production URLs.
