# Contributing to Abi Vault

Thanks for helping improve Abi Vault. The project is focused on manual class
finance: transactions, receipts, cash registers, goals, reports, periods, and
member accountability.

## Development setup

1. Install Node.js 22+, pnpm, Docker Desktop, and the Supabase CLI.
2. Copy `.env.example` to `.env.local`.
3. Start local Supabase with `supabase start`.
4. Set `ABI_VAULT_LOCAL_MODE=true` for the local demo.
5. Run `pnpm install` and `pnpm dev`.

Please use fake data locally. Never connect local development to a production
Supabase project or production Clerk instance.

## Before opening a pull request

Run `pnpm lint`, `pnpm test:unit`, and `pnpm build`. Include screenshots for
visual changes and explain any migration or permission changes.

Do not add credentials, real receipts, personal data, or production URLs to
the repository.
