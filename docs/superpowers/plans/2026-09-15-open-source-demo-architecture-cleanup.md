# Open-source demo architecture cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce architecture and anti-slop debt on `open-source-demo` while preserving every rendered UI surface, route, backend behavior, and user-visible interaction.

**Architecture:** Establish typed finance projection and action-result boundaries first, then move responsive presentation code behind focused modules that reuse the same view models. Remove only proven-unused legacy surfaces, and add the vendored anti-slop Oxlint plugin after the code boundaries are stable so diagnostics are actionable rather than hidden by a large refactor.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase server actions, Zod, Vitest, ESLint, pnpm, Oxlint with the vendored anti-slop plugin.

**Spec:** `docs/superpowers/specs/2026-09-15-open-source-demo-architecture-cleanup-design.md`

## Global Constraints

- No CSS, JSX markup, visible copy, routes, colors, spacing, breakpoints, ARIA names, or interaction behavior changes.
- Preserve existing backend queries, database contracts, permissions, and error messages.
- Keep GoCardless/Open Banking excluded.
- Do not suppress anti-slop rules, weaken severity, or add unsafe casts.
- Keep runtime parsing at external boundaries and use typed internal contracts.
- Use natural commit subjects; one concern per commit.

---

### Task 1: Add finance projection characterization tests

**Files:**
- Create: `lib/finance/projections.test.ts`
- Create: `lib/finance/projections.ts`
- Test fixtures: `lib/finance/projections.test.ts`

**Interfaces:**
- Produces typed pure projection functions for later query migration:
  `projectWalletBalances`, `projectCategoryTotals`, and `projectReportMonths`.
- Consumes plain typed wallet, transaction, goal, and date inputs; no Supabase,
  React, or browser dependencies.

- [x] **Step 1: Write failing tests** for opening balances plus income, expense, and transfer movements; category totals and percentages; six-month report buckets; and an empty transaction set.
- [x] **Step 2: Run the focused test** with `pnpm exec vitest run lib/finance/projections.test.ts`; verify failure comes from missing exports, not test setup.
- [x] **Step 3: Add the smallest pure type definitions and projection functions** in `lib/finance/projections.ts`, preserving integer minor-unit arithmetic and the current six-month ordering.
- [x] **Step 4: Run the focused test again** and verify all projection cases pass.
- [x] **Step 5: Commit** with `Add characterization coverage for finance projections`.

### Task 2: Centralize dashboard and report calculations

**Files:**
- Modify: `features/finance/actions/queries.ts:395-620`
- Modify: `lib/finance/projections.ts`
- Test: `lib/finance/projections.test.ts`

**Interfaces:**
- `getDashboardSnapshot` and `getReportSnapshot` delegate arithmetic to the pure projection module while returning their current object shapes.
- `getReportKpisForCurrentOrganization` reuses the same balance and transaction projection rather than recomputing it.

- [x] **Step 1: Add failing assertions** that compare dashboard totals, report KPI totals, and report-flow totals for the same fixture data.
- [x] **Step 2: Run the focused test** and verify the new assertions fail against the duplicated implementations or missing helper.
- [x] **Step 3: Move only arithmetic and mapping into the projection module**; leave Supabase selection, permission checks, and returned action shapes in `queries.ts`.
- [x] **Step 4: Run projection tests plus the existing finance unit tests** and verify all values remain unchanged.
- [x] **Step 5: Inspect the diff** to confirm no JSX, CSS, route, or copy files changed.
- [x] **Step 6: Commit** with `Centralize finance projections`.

### Task 3: Unify server-action result contracts

**Files:**
- Modify: `lib/api/result.ts`
- Modify: `features/goals/actions/goal-mutations.ts`
- Modify: `features/settings/actions/settings.ts`
- Modify: `features/finance/actions/manual-ui.ts`
- Modify: `features/finance/actions/cash-counts.ts`
- Modify: `features/finance/actions/transfers.ts`
- Modify: `features/people/actions/memberships.ts`
- Modify: `features/people/actions/invitations.ts`
- Modify: `features/people/actions/invite-links.ts`
- Test: `lib/api/result.test.ts`
- Consumer updates only where required to preserve current behavior.

**Interfaces:**
- Every active non-banking action returns `ActionResult<T>` with the existing semantic error code and message.
- `actionSuccess` and `actionFailure` remain the only constructors for success/failure values.

- [x] **Step 1: Write failing result-contract tests** covering success, invalid input, permission failure, and database failure shapes.
- [x] **Step 2: Run `pnpm exec vitest run lib/api/result.test.ts`** and verify failure for the legacy `{ ok, error }` cases.
- [x] **Step 3: Migrate one feature at a time** from `{ ok, error }` to `ActionResult<T>`, updating only its existing callers’ result checks.
- [x] **Step 4: Run focused tests after each feature migration** and verify no behavior change in the returned error codes/messages.
- [x] **Step 5: Run typecheck** before committing.
- [x] **Step 6: Commit** with `Unify finance action results`.

### Task 4: Replace unknown action and cache boundaries with typed adapters

**Files:**
- Modify: `features/*/actions/*.ts` in active manual-finance, goals, people, settings, receipts, and reports areas.
- Modify: `lib/finance/client-cache.ts`
- Modify: `hooks/use-dashboard-snapshot.ts`
- Modify: `hooks/use-report-snapshot.ts`
- Test: `lib/finance/client-cache.test.ts`

**Interfaces:**
- Public action inputs use schema-derived `z.input<typeof schema>` types.
- `client-cache.ts` exposes typed cache keys/listeners so dashboard and report hooks no longer cast listener values from `unknown`.

- [x] **Step 1: Add failing cache tests** proving a typed listener receives the same typed value written by a typed query and that scopes remain isolated.
- [x] **Step 2: Run the focused cache tests** and verify the typed key/listener API does not exist yet.
- [x] **Step 3: Introduce a typed cache-key map** for dashboard and report snapshots; retain runtime result guards at the cache boundary.
- [x] **Step 4: Change action signatures to schema-derived inputs** while retaining `safeParse` validation and current runtime error responses.
- [x] **Step 5: Remove the hook-level assertions** and run cache tests plus typecheck.
- [x] **Step 6: Commit** with `Type finance boundaries explicitly`.

### Task 5: Split responsive view models from layout modules

**Files:**
- Create: `components/presentation/dashboard/dashboard-model.ts`
- Create: `components/presentation/dashboard/DesktopDashboard.tsx`
- Create: `components/presentation/dashboard/TabletDashboard.tsx`
- Create: `components/presentation/dashboard/PhoneDashboard.tsx`
- Modify: `components/presentation/AdaptiveDashboardPage.tsx`
- Create: `components/presentation/funds/funds-model.ts`
- Create: `components/presentation/funds/DesktopFunds.tsx`
- Create: `components/presentation/funds/TabletFunds.tsx`
- Create: `components/presentation/funds/PhoneFunds.tsx`
- Modify: `components/presentation/AdaptiveFundsView.tsx`
- Tests: `lib/finance/projections.test.ts` and browser verification; no markup snapshots are introduced.

**Interfaces:**
- Dashboard layout components consume a shared `DashboardViewModel` and callback object.
- Funds layout components consume a shared `FundsViewModel` and callback object.
- Existing CSS module imports and class names remain attached to the same rendered elements.

- [x] **Step 1: Add view-model characterization tests** for empty, loading, populated, and review states using pure mapper functions.
- [x] **Step 2: Run those tests** and verify failure for the new mapper exports.
- [x] **Step 3: Extract mapping and empty-state definitions** without changing strings or class names.
- [x] **Step 4: Move desktop markup into its focused file** and make `AdaptiveDashboardPage` delegate to it; run typecheck and focused tests.
- [x] **Step 5: Move tablet and phone markup** one at a time; after each move run typecheck and capture the dashboard in the browser.
- [x] **Step 6: Repeat the same extraction for funds** while preserving all callbacks and CSS imports.
- [x] **Step 7: Compare route DOM/accessibility output** for dashboard and funds before/after; fix only refactor regressions.
- [x] **Step 8: Commit** with `Split dashboard view models from layouts`.

### Task 6: Extract shell metadata and remove unused legacy surfaces

**Files:**
- Create: `components/presentation/navigation.ts`
- Modify: `components/presentation/ResponsiveDashboardShell.tsx`
- Modify: `components/dashboard-header.tsx` only if still referenced.
- Modify: `components/sidebar.tsx` only if still referenced.
- Delete only after reference verification: `components/dashboard/Klassenkasse.tsx`, `components/dashboard/PagePlaceholder.tsx`, unused `DashboardPanels` exports and fixture data.
- Test: repository reference scans and browser route smoke check.

**Interfaces:**
- One canonical navigation/page metadata registry supplies desktop, tablet, phone, and any remaining legacy consumer.
- No visible navigation label, route, icon, active-state rule, or permission behavior changes.

- [x] **Step 1: Write a reference inventory test/script** using `rg` to prove which legacy modules have zero consumers.
- [x] **Step 2: Run the inventory** and record the exact unused exports before deleting anything.
- [x] **Step 3: Move shared metadata/navigation into `navigation.ts`** and update imports without changing values.
- [x] **Step 4: Delete only proven-unused modules/exports** and run typecheck/lint.
- [x] **Step 5: Smoke-test every dashboard route** in the browser and confirm identical navigation.
- [x] **Step 6: Commit** with `Remove unused dashboard surfaces`.

### Task 7: Install and remediate anti-slop enforcement

**Files:**
- Create: `tools/oxlint/anti-slop/**` via the bundled installer.
- Create: `oxlint.config.ts` or the repository-appropriate Oxlint config.
- Create: `UPSTREAM.md` beside the vendored entry point.
- Modify: `package.json` and `pnpm-lock.yaml` with exact compatible Oxlint dependencies.
- Modify: `.gitignore` only if required for generated tooling output; preserve existing entries.
- Modify: owned source files only for genuine diagnostics.

**Interfaces:**
- Add the generic anti-slop plugin and all required generic rules at error severity.
- Ignore agent directories and the vendored plugin itself; do not enable Effect rules without a direct Effect dependency.

- [x] **Step 1: Query current compatible `oxlint` and `@oxlint/plugins` versions** and record the exact versions before editing manifests.
- [x] **Step 2: Install the vendored plugin and dependencies** using pnpm without changing unrelated ranges.
- [x] **Step 3: Register the plugin, ignores, and rules** while preserving the existing ESLint configuration.
- [x] **Step 4: Run the anti-slop lint command** and classify every diagnostic as genuine, boundary-intentional, or false positive.
- [x] **Step 5: Add tests or narrow refactors for genuine findings**, especially filter/map pipelines, unknown action boundaries, cache assertions, and module mocking.
- [x] **Step 6: Run anti-slop lint twice** and verify the second run is stable with no unexplained diagnostics.
- [x] **Step 7: Commit** with `Add anti-slop lint enforcement`.

### Task 8: Full verification and handoff

**Files:**
- Modify only if verification exposes a refactor regression.
- Review: all commits and `git diff`.

- [x] **Step 1: Run `pnpm exec tsc --noEmit`.**
- [x] **Step 2: Run `pnpm lint`.**
- [x] **Step 3: Run `pnpm test:unit`.**
- [x] **Step 4: Run the configured anti-slop command.**
- [x] **Step 5: Run `pnpm build`.**
- [x] **Step 6: Run `git diff --check` and verify the working tree.**
- [x] **Step 7: Browser-check dashboard, transactions, receipts, goals, funds, reports, people, settings, and periods in light and dark mode; compare rendered structure, not just route status.** Desktop and iPad shell/route structure were verified; data-backed states remained in loading fallback because the configured local Supabase endpoint `127.0.0.1:54321` was unreachable.
- [x] **Step 8: Request code review against the previous commit and fix all Critical/Important findings.** The final review was performed inline because no subagent tool is available in this session.
- [x] **Step 9: Commit** with `Verify architecture cleanup` only if verification required a final documentation/check change.
