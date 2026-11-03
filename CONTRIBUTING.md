# Contributing to Abi Vault

Thanks for helping improve Abi Vault. The project is focused on manual class
finance: transactions, receipts, cash registers, goals, reports, periods, and
member accountability.

## Development setup

For a quick read-only preview, follow the sample-data steps in the README. This
path needs no database or Clerk account.

When changing database-backed code, use the local Supabase setup in
[docs/self-hosting.md](docs/self-hosting.md). It explains how to start Supabase,
which local keys to copy, and how to run the app. Do not connect development to
a production project.

Please use fake data locally. Never connect local development to a production
Supabase project or production Clerk instance.

## Before opening a pull request

Run `pnpm lint`, `pnpm test:unit`, and `pnpm build`. Include screenshots for
visual changes and explain any migration or permission changes.

Do not add credentials, real receipts, personal data, or production URLs to
the repository.
