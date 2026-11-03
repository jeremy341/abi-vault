# Contributing to Abi Vault

Thanks for helping improve Abi Vault. The project is focused on manual class
finance: transactions, receipts, cash registers, goals, reports, periods, and
member accountability.

## Development setup

For a quick preview, follow the sample-data steps in the [README](README.md).
This path needs no database or Clerk account.

When changing database-backed code, use the local Supabase setup in
[docs/self-hosting.md](docs/self-hosting.md#local-supabase). It explains how to
start Supabase, which local keys to copy, and how to run the app.

Please use fake data locally. Never connect local development to a production
Supabase project or production Clerk instance.

## Before opening a pull request

Run `pnpm lint`, `pnpm test:unit`, and `pnpm build`. Explain any migration or
permission changes.

For visual changes, check the page at 1920px, 1280px and a 390px phone width,
and include screenshots. The README screenshots in `docs/screenshots/` are
taken at 1920×1080; retake them if a page changes noticeably. Follow
[docs/design/DESIGN.md](docs/design/DESIGN.md) and use the shared dialog styles
for new dialogs.

If you add a font, image or library, add it to [CREDITS.md](CREDITS.md).

Do not add credentials, real receipts, personal data, or production URLs to
the repository.
