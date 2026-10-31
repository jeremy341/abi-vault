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

Money is USD-only integer minor units (`bigint`). Transactions are posted through database RPCs that create balanced ledger entries atomically. Manual and bank-imported transactions are distinguished by `origin`. Imported provider IDs are unique per organization/provider and imports are idempotent.

The current cash-only runtime accepts income and expense transactions. Transfer transactions are rejected by a database trigger. Cash counts store the book amount, counted amount, and difference without changing the ledger.

Accounting periods can be locked by administrators. Posted records and their ledger entries cannot be mutated through normal application grants when a period is locked.

The active runtime supports multiple cash registers per committee. Manual transactions, balances, cash counts, reports, and ledger entries resolve to the selected active cash register. Historical bank-wallet rows remain in the schema for compatibility but are archived and cannot be created or activated.
Each cash register stores its own non-negative opening balance in minor units.

## Follow one manual transaction

To understand the main write path, start at the **Add transaction** form in
[`app/dashboard/transactions/page.tsx`](../app/dashboard/transactions/page.tsx).
The form sends its values to
[`createManualTransactionFromUi`](../features/finance/actions/manual-ui.ts),
which validates the input with
[`manualUiTransactionSchema`](../features/finance/schemas/manual-ui.ts),
checks the user's permission, and looks up the active cash register, matching
category, and open Berlin accounting period.

The action calls `public.create_manual_transaction` with the amount as integer
minor units. The database function checks the organization, role, and period,
then writes the posted transaction and its balanced ledger entries in one
database transaction. Its definition is in
[`supabase/migrations/20260823000100_initial_schema.sql`](../supabase/migrations/20260823000100_initial_schema.sql).

After the save, the page refreshes its cached query. Detailed rows come from
[`transaction-queries.ts`](../features/finance/actions/transaction-queries.ts);
dashboard and report totals come from
[`snapshot-queries.ts`](../features/finance/actions/snapshot-queries.ts) and
the read-only SQL function in
[`20261029000100_finance_read_snapshot.sql`](../supabase/migrations/20261029000100_finance_read_snapshot.sql).
The snapshot returns minor-unit amounts as text so JavaScript does not round
large database integers.

## Open Banking (postponed)

Open Banking/PSD2 integration is excluded from the current implementation scope. The schema keeps the connection, consent, snapshot, and provider-import boundaries needed for a later German/EU provider, but bank authorization, callbacks, provider imports, bank synchronization, and bank-wallet activation are disabled at runtime. Manual cash transactions remain fully supported.

## Receipts and audit

Receipts are stored in the private `receipts` bucket, limited to PDF/JPG/PNG and 5 MB. Access uses organization-scoped RLS and short-lived signed URLs. Important financial and administrative mutations are recorded by database audit triggers.

## Verification

The local workflow uses reproducible Supabase migrations and seed data. TypeScript, ESLint, unit tests, provider import smoke tests, and RLS-focused database tests are part of the verification workflow. The UI pages retain their existing visual structure; backend data is loaded through server actions without redesigning the shell.
