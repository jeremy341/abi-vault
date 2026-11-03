# ADR: Consistent finance snapshots

**Status:** Accepted  
**Date:** 2026-10-29  
**Scope:** Manual-finance reads on the open-source demo branch

## Context

The current fix reads large collections in ordered 500-row range requests so results are not silently truncated at the 1,000-row API cap. Each range is a separate HTTP/database request. If transactions are inserted, soft-deleted, or corrected between requests, offset positions can shift and a balance or report can include a duplicate or omit a row.

PostgreSQL READ COMMITTED gives each command its own snapshot; reading different pages as different commands therefore does not guarantee one view of the ledger. See the official [PostgreSQL transaction isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html). Supabase supports calling SQL database functions through RPC and recommends invoker security by default; see [Supabase database functions](https://supabase.com/docs/guides/database/functions).

## Goals

- Make wallet balances, dashboard/report KPIs, monthly flows, and category totals reflect one consistent database statement.
- Keep amounts in exact minor units and return them to JavaScript as text.
- Keep history pages bounded and ordered, with a cursor that does not shift when newer rows are inserted.
- Preserve Clerk JWT authorization and Supabase RLS.

## Non-goals

- Open Banking or any deferred banking integration.
- Event sourcing, a second database, service-role access, or a new cache.
- Replacing the manual transaction write RPCs.
- Changing the visible product behavior or page design.

## Options considered

| Option | Summary | Tradeoff |
|---|---|---|
| A. Keep offset pagination | Continue reading ordered ranges of the current tables. | Lowest code cost; a concurrent write can still shift pages and affect totals. |
| B. Use keyset cursors | Page history by server-created time plus unique ID, after confirming clients cannot backdate creation time and a captured cutoff. | Avoids offset shifts from newer inserts; mutable soft-delete state still needs careful as-of rules. |
| C. Aggregate totals in SQL | Add a read-only, invoker-secured RPC that calculates wallet/report totals in one SQL statement; use keyset cursors for detailed history. | Strongest fit for financial totals and lower transfer volume; needs a migration and database-level verification. |

## Proposed decision

Choose Option C for financial aggregates and balances. Use Option B for transaction and receipt history pages if/when their API contract becomes paginated. Keep the current all-rows helper as a temporary path for collections without a summary use case.

The RPC is additive and read-only, uses SECURITY INVOKER, derives the organization from the existing authenticated organization context, and relies on current RLS policies. Minor-unit values are returned as text. It calculates only fields required by dashboard/report callers and does not return transaction history as one JSON payload.

## Migration and validation

1. Confirm the SQL function can read the intended rows under the existing Clerk JWT, local Supabase JWT, and RLS policies.
2. Add the function in a new manual-finance migration and grant execute only to authenticated application users.
3. Switch report and balance callers to the aggregate while retaining the student/demo fallback paths.
4. Verify exact totals and amounts above JavaScript's safe integer limit across more than 1,000 transactions.
5. Run concurrent snapshot reads while inserting, correcting, and soft-deleting transactions; verify each result's accounting identities.
6. Verify migration syntax, function grants, and runtime behavior against local Supabase before using the function in a hosted deployment.

Rollback is application-level: switch callers back to the existing read path and leave the additive function unused. Do not apply the migration to any hosted environment without separate deployment authorization.

## Approval and rollout status

The project owner approved the design, additive migration, and local database verification on 2026-10-29. The migration and application integration are present in the working tree. The migration was applied to local Supabase and recorded in local migration history. The targeted pgTAP file passes 22 assertions for exact totals, bigint values, corrections, archival, permissions/RLS, and Berlin month boundaries. A multi-session local stress check passed 100 statement-level snapshots while another session inserted, corrected, and archived transactions; every snapshot's accounting identities held, and all uniquely tagged test records were removed. The migration has not been applied to any hosted environment.

