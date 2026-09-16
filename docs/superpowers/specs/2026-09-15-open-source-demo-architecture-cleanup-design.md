# Open-source demo architecture cleanup

## Status

Approved direction: staged, behavior-preserving cleanup on `open-source-demo`.

## Goal

Reduce the codebase's structural and anti-slop debt without changing the
rendered UI or product behavior. The dashboard must keep its current routes,
markup semantics, CSS, copy, colors, spacing, responsive breakpoints, backend
queries, and user-visible interactions.

## Explicit non-goals

- No visual redesign or CSS changes.
- No new product features.
- No route, URL, database-schema, permission, or backend-behavior changes.
- No work in the deferred GoCardless/Open Banking area.
- No suppression of anti-slop diagnostics with `eslint-disable`, unsafe casts,
  or weakened rule severity.

## Architecture decisions

### 1. Canonical finance projections

Keep Supabase access in `features/finance/actions`. Extract the shared
transaction, wallet, balance, category, and review calculations currently
duplicated across dashboard and report queries into a typed finance projection
module. Existing action functions remain the public server-action entry
points; they delegate to the projection helpers and preserve their current
result shapes until the action-contract migration is complete.

### 2. One server-action result contract

Use `ActionResult<T>` as the canonical application result contract. Introduce
typed internal command functions where a server action currently accepts
`unknown`; keep runtime schema parsing at the server boundary, then pass the
schema-derived type into the typed implementation. Preserve existing error
codes and user-facing messages through adapters where needed.

### 3. Shared responsive view models

Extract dashboard and cash-register data mapping, empty-state definitions, and
action models from the desktop/tablet/phone components. Keep each existing
layout composition intact and make each responsive component consume the same
typed view model. This is a file-ownership refactor, not a markup refactor.

### 4. Legacy surface removal

Remove only legacy components proven to have no live consumers, including
unused dashboard shells, static dashboard fixtures, and placeholder surfaces.
Before removal, verify repository-wide references and preserve any shared
token or data mapping that is still consumed by the current dashboard.

### 5. Anti-slop enforcement

Vendor the bundled anti-slop Oxlint plugin under `tools/oxlint/anti-slop`, pin
compatible `oxlint` and `@oxlint/plugins` versions using pnpm, and register the
generic rules at error severity. Add narrowly scoped ignores for agent tooling
and the vendored plugin. Record source provenance in `UPSTREAM.md`. Do not
enable the optional Effect plugin because this repository does not declare a
direct Effect dependency.

Initial diagnostics will be classified into:

1. genuine maintainability/type-boundary issues to fix;
2. intentional boundary patterns requiring a named owner type or parser;
3. false positives to document, never silently suppress.

### 6. UI protection gate

Any UI refactor must pass a no-render-diff review. The implementation must not
change CSS modules, tokens, JSX structure, visible copy, route composition,
ARIA names, or interaction handlers unless required solely to preserve an
existing import contract. Browser checks will compare the current dashboard,
transactions, receipts, funds, reports, goals, people, settings, and periods
surfaces in light and dark modes.

## Execution order

1. Add this design record and verify its scope.
2. Add characterization tests for finance projections and action-result
   normalization before moving implementation.
3. Extract canonical finance projection helpers and migrate dashboard/report
   queries without changing output values.
4. Normalize server-action contracts behind typed adapters.
5. Split responsive data/view-model ownership while preserving markup and CSS.
6. Remove unused legacy surfaces and static fixtures after reference checks.
7. Install and configure anti-slop enforcement, then remediate owned-source
   diagnostics.
8. Run typecheck, lint, anti-slop lint, unit tests, build, and browser checks.

## Verification requirements

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- repository unit tests
- configured Oxlint/anti-slop command
- `pnpm build`
- `git diff --check`
- clean working tree before handoff
- browser verification of every active dashboard route in light/dark mode

## Commit convention

Use short, natural, behavior-oriented subjects:

- `Document architecture cleanup plan`
- `Add characterization coverage for finance projections`
- `Centralize finance projections`
- `Unify finance action results`
- `Split dashboard view models from layouts`
- `Remove unused dashboard surfaces`
- `Add anti-slop lint enforcement`
- `Verify architecture cleanup`

Each commit must remain independently understandable and should contain only
one coherent refactor or verification concern.
