# Abi Vault backend

## Runtime boundaries

Clerk owns identity, sessions, organizations, invitations, and organization membership events. Supabase owns the application data, financial ledger, private receipt storage, RLS, and synchronization metadata. Server Actions are used for authenticated mutations; Route Handlers are used for Clerk webhooks, GoCardless callbacks, and the protected scheduled bank-sync endpoint.

For local/hosted Supabase, enable Clerk as a third-party auth provider with the Clerk issuer domain before using Data API/RLS calls. The server client forwards the current Clerk access token through `accessToken`; no deprecated shared Supabase JWT secret is used.

Every application row carries `organization_id`. The request organization is derived from the Clerk token (`org_id` / `o.id`) inside `app_private.current_organization_id()`; client-supplied organization IDs are accepted only after that equality check.

## Roles

The application role is stored per committee membership and is independent from Clerk's provider role:

- `admin`: complete committee administration, settings, members, periods, finance, and exports.
- `supervisor`: finance operations, receipts, goals, reports, and review workflows.
- `student`: public goal progress and the restricted transaction transparency view.

Role checks exist in server actions and database functions. RLS remains the final data boundary.

## Financial model

Money is EUR-only integer minor units (`bigint`). Transactions are posted through database RPCs that create balanced ledger entries atomically. Manual and bank-imported transactions are distinguished by `origin`. Imported provider IDs are unique per organization/provider and imports are idempotent.

Transfers are posted as one transfer transaction with two wallet sides and two balanced ledger entries. Cash counts are persisted separately with the derived book amount, counted amount, and difference; the count itself does not mutate the ledger.

Accounting periods can be locked by administrators. Posted records and their ledger entries cannot be mutated through normal application grants when a period is locked. Transfers use two wallet sides and linked ledger entries.

The active runtime uses one canonical `Barkasse` per committee. Manual transactions, balances, cash counts, reports, and ledger entries resolve to this cash wallet. Historical bank-wallet rows remain in the schema for compatibility but are archived and cannot be created or activated.
Manual wallets may carry an explicit non-negative opening balance; the cash-only migration consolidates existing opening balances into the canonical `Barkasse` rather than silently discarding them.

## Open Banking (postponed)

Open Banking/PSD2 integration is intentionally excluded from the current implementation scope. The schema keeps the connection, consent, snapshot, and provider-import boundaries needed for a later German/EU provider, but bank authorization, callbacks, provider imports, bank synchronization, and bank-wallet activation are disabled at runtime. Manual cash transactions remain fully supported.

## Receipts and audit

Receipts are stored in the private `receipts` bucket, limited to PDF/JPG/PNG and 5 MB. Access uses organization-scoped RLS and short-lived signed URLs. Important financial and administrative mutations are recorded by database audit triggers.

## Verification

The local workflow uses reproducible Supabase migrations and seed data. TypeScript, ESLint, unit tests, provider import smoke tests, and RLS-focused database tests are part of the verification workflow. The UI pages retain their existing visual structure; backend data is loaded through server actions without redesigning the shell.
