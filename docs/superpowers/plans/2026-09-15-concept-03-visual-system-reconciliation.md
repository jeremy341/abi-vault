# Concept 03 Visual System Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Each task ends with an independent verification gate and a focused commit.

**Goal:** Make the original Abi Vault UI consistently express the concept-03 visual system across desktop, tablet, mobile, and secondary dashboard surfaces without changing information architecture, routes, backend behavior, database data, or adding new product features.

**Architecture:** Preserve the existing `ResponsiveDashboardShell`, `AdaptiveDashboardPage`, page-local CSS modules, route structure, and backend contracts. Establish one semantic token layer, route every primary action and data visualization through that layer, then normalize copy, radius, spacing, empty states, responsive states, motion, and accessibility in place. Keep page-specific CSS only for layout and genuinely local variants.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, CSS Modules, shadcn/Base UI primitives, Lucide icons already present in the repository, Vitest, Vercel preview/production deployment.

**Spec:** This plan is grounded in `docs/ui/current-design-audit.md`, `docs/ui/shared-design-contracts.md`, the live production review at `https://abi-vault-demo.vercel.app/dashboard`, and the concept-03 source palette extracted during the preceding audit.

## Global Constraints

- Work only on `open-source-demo`; do not change `main` or the production database.
- Preserve existing URLs, navigation topology, form field names, backend calls, permissions, Clerk behavior, and Supabase behavior.
- Do not add new product features. Empty states may gain clearer copy and links to existing routes, but no new workflow or data model.
- Preserve the current desktop/tablet/mobile layout topology. Changes may adjust spacing, color, hierarchy, radius, component styling, copy, and state presentation.
- Treat `--ui-ink` as text/icon/border ink only. It must not be used as a primary CTA fill or a categorical data-bar fill.
- Primary action is concept-03 lime: `#d4ef89` with dark ink `#26311f`.
- Use semantic data colors: income `#c6e997`, expense `#4b5b3e`, review `#a18d5f`, negative `#b45849`, goal/violet `#9883b3` only where an existing goal identity requires it.
- Use the shape scale consistently: shell/card `10px`, controls `7px`, compact chips `4px`, icon buttons `6px`, full pills only for status/avatars/progress tracks.
- Default visible product language is English because the live desktop product and document language are English. Remove accidental mixed German/English strings without changing product meaning. If product ownership requires German instead, change the copy dictionary before implementation, not component structure.
- Do not introduce gradients, glass effects, decorative motion, dashboard bento rearrangements, or a new design system.
- Do not inspect, enable, modify, or extend deferred GoCardless/Open Banking work.

## Skill Usage Map

| Phase | Required skill | How it is used |
|---|---|---|
| Plan execution | `superpowers:executing-plans` or `superpowers:subagent-driven-development` | Execute one task at a time with review checkpoints and focused commits. |
| Design-system diagnosis | `impeccable` | Run audit/critique before changes, then colorize/layout/clarify/adapt/harden passes, ending with polish. |
| Anti-slop direction | `design-taste-frontend` | Use the preserve-redesign rules, shape/color consistency lock, copy self-audit, and AI-tell preflight. It is a lens here, not permission to apply landing-page patterns to the dashboard. |
| Frontend design | `frontend-design` | Keep a named product-specific stance: calm editorial finance workspace with forest-ink navigation and a single lime action accent. Define one memorable anchor without changing the grid. |
| Motion | `design-motion-principles` / Emil Kowalski lens | Audit existing motion first. Emil is primary for frequent finance actions, Jakub secondary for production polish, Jhey only for restrained empty-state personality if it is useful. |
| Color | `color-system` | Define semantic scales and roles, then remove page-local black/gray substitutions. |
| Responsive behavior | `mobile-responsiveness` | Verify the same hierarchy at 1920, 1280, 1024/768, and 375px without horizontal overflow. |
| Accessibility | `accessibility` and `web-design-guidelines` | Validate WCAG contrast, focus, labels, semantic controls, touch targets, loading/error announcements, dark mode, and locale metadata. |
| Review gates | `frontend-design-review` and `critique` | Run the three quality pillars, anti-slop table, Nielsen scores, copy audit, and before/after browser review. |
| Verification | `superpowers:verification-before-completion` and `superpowers:requesting-code-review` | Verify build/tests/lint/detector/browser before any claim of completion or deployment. |

## File Map

### Shared foundations

- Modify `app/globals.css`: semantic color roles, shape tokens, surface/shadow roles, theme parity, focus and motion contracts.
- Modify `app/layout.tsx`: preserve Manrope and verify `lang`, color scheme, and metadata behavior.
- Modify `components/ui/button.tsx`: keep the shared primary/outline/secondary variants as the canonical action implementation.
- Modify `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/progress.tsx`, `components/ui/sheet.tsx`: align primitives to the shape and focus contracts without changing APIs.

### Dashboard shell and overview

- Modify `components/presentation/ResponsiveDashboardShell.tsx`: shared copy dictionary, consistent page labels, active states, and shell semantics.
- Modify `components/presentation/AdaptiveDashboardPage.tsx`: dashboard copy, existing empty states, semantic data colors, and action class usage.
- Modify `components/presentation/presentation.module.css`: shell, desktop/sidebar, tablet rail, phone navigation, controls, and responsive shape/rhythm.
- Modify `app/dashboard/dashboard-adaptive.module.css`: tablet/phone actions, progress tracks, panel density, and primary action roles.
- Modify `app/dashboard/dashboard-desktop.module.css`: desktop action roles, progress tracks, account panel, and review actions.
- Modify `app/dashboard/dashboard.module.css`: legacy dashboard shell/card states and remaining radius/color exceptions.
- Modify `components/dashboard/DashboardPanels.tsx`, `components/dashboard/AccountCard.tsx`, `components/dashboard/AccountCard.module.css`, `components/dashboard/Klassenkasse.tsx`: card state, panel hierarchy, and existing action styling.

### Secondary dashboard surfaces

- Modify page-local CSS and only the directly associated JSX where needed:
  - `app/dashboard/funds/funds.module.css` and `funds-adaptive.module.css`
  - `app/dashboard/goals/goals.module.css` and `goals-phone.module.css`
  - `app/dashboard/people/people.module.css` and `people-phone.module.css`
  - `app/dashboard/periods/periods.module.css`
  - `app/dashboard/receipts/receipts.module.css` and `receipts-phone.module.css`
  - `app/dashboard/transactions/transactions.module.css` and `transactions-phone.module.css`
  - `app/dashboard/reports/reports.module.css` and `reports-phone.module.css`
  - `app/dashboard/settings/settings.module.css` and `settings-phone.module.css`
- Modify `app/dashboard/*/page.tsx` only for visible copy, empty/error-state composition, and semantic class hooks; do not change data fetching or mutations.
- Modify `components/clerk-appearance.ts`, `components/dashboard-header.tsx`, `components/ThemeToggle.tsx`, and `components/sidebar.tsx` to consume the same foundation.

### Documentation and QA

- Create `docs/ui/concept-03-design-system.md`: final token map, shape scale, action/data roles, copy policy, responsive matrix, and documented exceptions.
- Update `docs/ui/shared-design-contracts.md` to reflect the actual concept-03 system rather than the stale black-primary/Geist description.
- Update `docs/ui/current-design-audit.md` after implementation with the new source map and remaining intentional exceptions.
- Add or update focused tests only where behavior is asserted; do not add snapshot tests for CSS pixels.

---

### Task 1: Freeze the visual contract and baseline evidence

**Files:**
- Create: `docs/ui/concept-03-design-system.md`
- Read: `app/globals.css`, `components/ui/button.tsx`, `components/presentation/ResponsiveDashboardShell.tsx`, `components/presentation/AdaptiveDashboardPage.tsx`
- Read: `docs/ui/current-design-audit.md`, `docs/ui/shared-design-contracts.md`

**Interfaces:**
- Produces the token names, semantic roles, radius scale, breakpoint matrix, and copy policy consumed by every later task.

- [ ] **Step 1: Record the current baseline**

  Capture the deployed dashboard at 1920x1080, 1280x800, 1024x1366, 768x1024, and 375x812 in the local browser. Record the current source commit, route, theme, and whether data is loading or populated.

- [ ] **Step 2: Write the design-system contract**

  Document these exact roles:

  ```css
  --ui-primary: #d4ef89;
  --ui-primary-ink: #26311f;
  --ui-ink: #242824; /* text/icons/borders only */
  --ui-data-income: #c6e997;
  --ui-data-expense: #4b5b3e;
  --ui-warning: #a18d5f;
  --ui-negative: #b45849;
  --ui-goal: #9883b3;
  --ui-shell-radius: 10px;
  --ui-card-radius: 10px;
  --ui-control-radius: 7px;
  --ui-chip-radius: 4px;
  --ui-icon-radius: 6px;
  ```

- [ ] **Step 3: Define the non-negotiable exceptions**

  Document that full pills remain only for avatars, status dots, progress tracks, and explicitly status-shaped badges. Document that `--ui-ink` may remain on the forest sidebar and logo mark, but not on primary action fills or data bars.

- [ ] **Step 4: Verify the contract against the user request**

  Confirm that the plan changes visual styling only, keeps the original layout and feature set, and leaves backend/database behavior untouched.

- [ ] **Step 5: Commit the contract**

  ```bash
  git add docs/ui/concept-03-design-system.md
  git commit -m "docs: define concept 03 visual contract"
  ```

### Task 2: Consolidate semantic tokens and theme parity

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/clerk-appearance.ts`
- Modify: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/progress.tsx`
- Test: `lib/finance/*.test.ts` only if token-related rendering logic is introduced; otherwise no new unit test file

**Interfaces:**
- Consumes: the roles from `docs/ui/concept-03-design-system.md`.
- Produces: one canonical token layer consumed by page CSS modules and primitives.

- [ ] **Step 1: Add semantic action/data tokens without removing existing aliases**

  Keep compatibility aliases, but make the semantic roles explicit. Add dark-mode equivalents for every new role. Do not convert unrelated backend or deferred banking code.

- [ ] **Step 2: Define the shape scale once**

  Set the card/control/chip/icon/shell tokens to the contract values. Do not leave `--radius` as the only source of truth for product surfaces.

- [ ] **Step 3: Normalize the shared Button primitive**

  Keep `default` as lime primary, `outline` as white/neutral, `secondary` as muted surface, `ghost` as transparent neutral, and `destructive` as coral. Ensure every variant has explicit hover, active, disabled, dark, and focus states.

- [ ] **Step 4: Normalize primitive radii and focus**

  Apply the control radius to inputs, dropdowns, buttons, menus, and compact controls. Keep badge/pill behavior only where the component semantics justify it.

- [ ] **Step 5: Run the token drift scan**

  ```bash
  rg -n --glob '*.css' --glob '*.tsx' -- "background:\s*var\(--ui-ink\)|bg-ink|bg-\[var\(--ui-ink\)\]" app components
  ```

  Expected: only intentional logo/sidebar/ink marks remain. No primary action or data-progress declaration may remain in the result.

- [ ] **Step 6: Commit**

  ```bash
  git add app/globals.css app/layout.tsx components/clerk-appearance.ts components/ui
  git commit -m "refactor: centralize concept 03 design tokens"
  ```

### Task 3: Replace black page actions with the canonical primary action

**Files:**
- Modify: `app/dashboard/dashboard-adaptive.module.css`
- Modify: `app/dashboard/dashboard-desktop.module.css`
- Modify: `app/dashboard/funds/funds.module.css`, `funds-adaptive.module.css`
- Modify: `app/dashboard/goals/goals.module.css`, `goals-phone.module.css`
- Modify: `app/dashboard/people/people.module.css`, `people-phone.module.css`
- Modify: `app/dashboard/periods/periods.module.css`
- Modify: `app/dashboard/receipts/receipts.module.css`, `receipts-phone.module.css`
- Modify: `app/dashboard/transactions/transactions.module.css`, `transactions-phone.module.css`
- Modify: `app/dashboard/reports/reports.module.css`, `reports-phone.module.css`
- Modify: `app/dashboard/settings/settings.module.css`, `settings-phone.module.css`
- Modify: `components/dashboard/AccountCardModal.module.css`, `components/dashboard/Klassenkasse.tsx`

**Interfaces:**
- Consumes: `--ui-primary`, `--ui-primary-ink`, `--ui-control-radius`, and shared focus/active contracts.
- Produces: every existing primary action renders lime with dark text at all breakpoints while preserving its tag, route, handler, and dimensions.

- [ ] **Step 1: Replace primary action declarations**

  For every class named `primaryButton`, `primaryAction`, `tabletAction:first-child`, `phoneQuickAction:first-child`, `accountActions a:first-child`, `confirmButton`, `.saveButton`, `.uploadButton`, and equivalent existing primary-action selectors, replace dark ink fill with the primary role and replace white text with primary ink.

- [ ] **Step 2: Preserve secondary actions**

  Keep receipt, cancel, filter, and outline actions on white or muted surfaces with visible borders. Do not turn every button lime.

- [ ] **Step 3: Normalize control geometry**

  Set primary/secondary actions to the 7px control radius, 38px desktop minimum height, and 44px mobile minimum hit target where the current layout allows it. Keep labels on one line.

- [ ] **Step 4: Add action-state checks**

  Verify hover brightness, active translateY(1px), disabled opacity, focus ring, and dark-mode contrast. Do not use opacity-only hover if it makes the lime action look disabled.

- [ ] **Step 5: Browser verify before moving on**

  Check the Transaction, Receipt, Goal, Cash register, Reports, Settings, and People actions at 1920, 1024, 768, and 375px. Confirm that the CTA background is lime and the text remains dark.

- [ ] **Step 6: Commit**

  ```bash
  git add app/dashboard components/dashboard
  git commit -m "fix: align dashboard actions with concept 03 primary"
  ```

### Task 4: Normalize the radius and surface hierarchy

**Files:**
- Modify: `components/presentation/presentation.module.css`
- Modify: `app/dashboard/dashboard.module.css`, `dashboard-adaptive.module.css`, `dashboard-desktop.module.css`
- Modify: every secondary dashboard CSS module listed in the File Map
- Modify: `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/popover.tsx`, `components/ui/sidebar.tsx`

**Interfaces:**
- Consumes: the shape scale from Task 2.
- Produces: a predictable visual grammar: 10px cards, 7px controls, 6px icon buttons, 4px compact chips, full pills only for semantic status/avatars/tracks.

- [ ] **Step 1: Remove legacy large product-surface radii**

  Replace product card/modal/shell values of `1rem`, `1.25rem`, `1.5rem`, `20px`, `rounded-xl`, and `rounded-2xl` with the semantic card/shell tokens. Keep bottom-sheet top corners as the only intentional mobile sheet exception.

- [ ] **Step 2: Keep true pills semantic**

  Preserve `999px` only for avatars, status indicators, progress tracks, and status badges. Convert action buttons and cards out of full-pill geometry.

- [ ] **Step 3: Remove duplicate rings/shadows**

  Ensure each surface uses either a border or restrained tinted shadow, not both heavy ring and heavy shadow. Remove any residual glass/backdrop treatment from ordinary product surfaces.

- [ ] **Step 4: Verify optical rhythm**

  Compare panel padding and control gaps across desktop, tablet, and phone. Do not change grid columns or ordering. The only accepted visual change is tighter, more intentional geometry.

- [ ] **Step 5: Commit**

  ```bash
  git add app/dashboard components/presentation components/ui
  git commit -m "style: normalize concept 03 shape hierarchy"
  ```

### Task 5: Separate functional data colors from text ink

**Files:**
- Modify: `components/dashboard/DashboardPanels.tsx`
- Modify: `components/presentation/AdaptiveDashboardPage.tsx`
- Modify: `app/dashboard/dashboard-adaptive.module.css`, `dashboard-desktop.module.css`, `dashboard.module.css`
- Modify: `app/dashboard/reports/page.tsx`, `reports.module.css`, `reports-phone.module.css`
- Modify: any receipts/transactions/goals progress or category CSS that still uses `var(--ui-ink)` as a fill

**Interfaces:**
- Consumes: semantic data roles from Task 2.
- Produces: black no longer communicates expense, progress, category, or review state.

- [ ] **Step 1: Map each data visual to a semantic role**

  Income uses the pale lime income token, expenses use forest, review uses amber, negative amounts use coral, goal progress uses violet or the existing goal role, and neutral progress uses the muted surface.

- [ ] **Step 2: Preserve meaning across themes**

  Add dark-mode values that maintain the same semantic distinction without relying only on hue.

- [ ] **Step 3: Validate labels and bars together**

  Ensure every chart/progress bar has visible text or an accessible label, so color is not the only signal.

- [ ] **Step 4: Commit**

  ```bash
  git add components/dashboard components/presentation app/dashboard
  git commit -m "fix: apply semantic concept 03 data colors"
  ```

### Task 6: Repair hierarchy, empty states, loading states, and copy

**Files:**
- Modify: `components/presentation/AdaptiveDashboardPage.tsx`
- Modify: `components/presentation/ResponsiveDashboardShell.tsx`
- Modify: `components/dashboard/DashboardPanels.tsx`
- Modify: `app/dashboard/goals/page.tsx`, `funds/page.tsx`, `people/page.tsx`, `periods/page.tsx`, `receipts/page.tsx`, `reports/page.tsx`, `settings/page.tsx`, `transactions/page.tsx`
- Modify: `app/layout.tsx` for the final `lang` value if it is not already consistent with the selected copy language

**Interfaces:**
- Consumes: the copy policy and semantic roles from Tasks 1-2.
- Produces: one consistent language, clear empty/error/loading states, and one primary financial hierarchy without changing data behavior.

- [ ] **Step 1: Create one copy dictionary for responsive dashboard shells**

  Centralize labels for page titles, action names, review states, cash-register states, quick actions, latest transactions, goals, and empty states. Use the same values on desktop, tablet, and phone.

- [ ] **Step 2: Remove broken mixed-language strings**

  Replace strings such as `Activee Reviewen`, `Cash registersstatus`, `Cash registerskarte`, `Schnellaktionen`, and `Zuletzt` with plain English equivalents. Keep financial meaning unchanged.

- [ ] **Step 3: Give empty panels a next step**

  When goals or review lists are empty, show a compact explanation and use the existing route link. Do not invent new actions, forms, or data.

- [ ] **Step 4: Reduce duplicate balance emphasis**

  Keep the KPI summary and cash-register card, but reduce repeated supporting amounts and make the main balance the strongest value on the page.

- [ ] **Step 5: Make loading states content-shaped**

  Preserve loading semantics and `aria-busy`, but replace blank panel interiors where practical with layout-shaped skeleton rows. Keep loading copy ending in `…` and avoid decorative infinite motion.

- [ ] **Step 6: Add focused copy tests**

  Add a small unit test for the copy dictionary that asserts the desktop/tablet/phone labels are identical and that banned mixed-language strings do not appear in the exported copy map.

- [ ] **Step 7: Commit**

  ```bash
  git add components/presentation components/dashboard app/dashboard app/layout.tsx
  git commit -m "refine: unify dashboard copy and empty states"
  ```

### Task 7: Harmonize responsive shells without changing layout topology

**Files:**
- Modify: `components/presentation/ResponsiveDashboardShell.tsx`
- Modify: `components/presentation/presentation.module.css`
- Modify: `components/presentation/AdaptiveDashboardPage.tsx`
- Modify: `app/dashboard/dashboard-adaptive.module.css`, `dashboard-desktop.module.css`
- Test manually in the browser at 1920x1080, 1280x800, 1024x1366, 768x1024, and 375x812

**Interfaces:**
- Consumes: canonical copy, action, radius, and data tokens.
- Produces: the same visual language across five viewport classes with preserved information order and no horizontal overflow.

- [ ] **Step 1: Keep desktop and tablet shell identity aligned**

  Keep forest navigation, lime active state, white workspace, and the same action semantics in both desktop and compact tablet rails.

- [ ] **Step 2: Keep mobile action hierarchy aligned**

  The first quick action remains the single lime primary. Receipt and Goal remain secondary. Bottom navigation active state remains lime with compact 7px geometry.

- [ ] **Step 3: Normalize touch and focus targets**

  Keep primary interactive targets at least 44px on phone/tablet. Verify icon-only buttons retain labels and visible focus rings.

- [ ] **Step 4: Check long labels and narrow widths**

  Use `min-width: 0`, truncation, and controlled wrapping where needed. Do not solve overflow by clipping useful content or adding document-level horizontal scroll.

- [ ] **Step 5: Commit**

  ```bash
  git add components/presentation app/dashboard
  git commit -m "fix: align responsive dashboard visual hierarchy"
  ```

### Task 8: Audit and tune motion with the Kowalski lens

**Files:**
- Read/modify only where findings require it: `components/dashboard/AccountCard.module.css`, `components/ui/loading-state.module.css`, `components/ui/sheet.tsx`, page modal CSS modules, `components/presentation/presentation.module.css`
- Test: reduced-motion browser state and keyboard-driven interactions

**Interfaces:**
- Consumes: existing motion behavior and the Emil/Jakub weighting for a frequent finance dashboard.
- Produces: fast, purposeful, interruptible motion with no decorative motion spam.

- [ ] **Step 1: Run motion reconnaissance**

  Use the `design-motion-principles` audit workflow to inventory `transition`, `@keyframes`, conditional mounts, modal/sheet state changes, loading swaps, and reduced-motion rules. Do not add motion during reconnaissance.

- [ ] **Step 2: Apply Emil’s frequency rule**

  Keep frequent transaction/filter/navigation actions at 140–180ms or instant. Keep active press feedback at 1px or `scale(.98)`. Do not animate keyboard-triggered actions.

- [ ] **Step 3: Remove AI-slop motion patterns**

  Do not reintroduce card tilt, light sweeps, hover-scale on every panel, staggered table rows, pulsing status dots, or infinite shimmer outside loading placeholders.

- [ ] **Step 4: Keep state transitions functional**

  Modal/sheet enter/exit transitions may use opacity and transform only, with origin-aware positioning and subtler exits. Loading-to-content transitions must not delay access to financial information.

- [ ] **Step 5: Verify `prefers-reduced-motion`**

  Confirm every remaining animation has a static equivalent and that reduced-motion does not remove essential state feedback.

- [ ] **Step 6: Commit only if changes are required**

  ```bash
  git add components app/dashboard
  git commit -m "polish: tune dashboard motion for frequent use"
  ```

### Task 9: Accessibility, dark-mode, and Web Interface Guidelines gate

**Files:**
- Modify only affected files from Tasks 2-8.
- Review: `app/layout.tsx`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/sheet.tsx`, all modal CSS modules, and the responsive shell files.

**Interfaces:**
- Consumes: final tokens, copy, action variants, and responsive states.
- Produces: WCAG-oriented, keyboard-safe, screen-reader-readable visual states.

- [ ] **Step 1: Verify button and text contrast**

  Check primary ink on lime, white on forest sidebar, muted text on canvas, semantic data colors on their tracks, and dark-mode equivalents. Do not rely on color alone for review/positive/negative states.

- [ ] **Step 2: Verify semantics and focus**

  Test skip link, landmarks, headings, icon-only buttons, dialog Escape/outside-close, listbox states, and visible `:focus-visible` rings with keyboard navigation.

- [ ] **Step 3: Verify loading/error announcements**

  Ensure the existing loading/error patterns remain discoverable to assistive technology and that errors include a useful next step.

- [ ] **Step 4: Verify theme parity**

  Open the dashboard and one secondary route in light and dark mode. Native selects, borders, primary buttons, semantic bars, and dialogs must retain hierarchy.

- [ ] **Step 5: Run the Web Interface Guidelines scan**

  Review changed files for semantic controls, labels, focus states, reduced motion, touch behavior, `Intl` formatting, loading ellipses, and no `transition: all`.

- [ ] **Step 6: Commit**

  ```bash
  git add app components
  git commit -m "harden: verify accessibility and theme parity"
  ```

### Task 10: Documentation and design-system cleanup

**Files:**
- Modify: `docs/ui/concept-03-design-system.md`
- Modify: `docs/ui/shared-design-contracts.md`
- Modify: `docs/ui/current-design-audit.md`
- Modify: `docs/vercel-demo.md` only if deployment verification details changed

- [ ] **Step 1: Record the final source of truth**

  Update the docs to describe Manrope, the forest/lime palette, the semantic data roles, the shape scale, the copy-language decision, the responsive matrix, and the intentional exceptions.

- [ ] **Step 2: Remove stale claims**

  Remove references to black primary controls, Geist as the current body font, 1rem/0.7rem shared radii, and account-card tilt/sweep if those no longer match the implementation.

- [ ] **Step 3: Record verification evidence**

  Include the browser viewports, light/dark checks, build/test/lint outcome, and any explicitly accepted pre-existing warnings.

- [ ] **Step 4: Commit**

  ```bash
  git add docs/ui docs/vercel-demo.md
  git commit -m "docs: record final concept 03 UI contract"
  ```

### Task 11: Final verification, review, and demo deployment

**Files:**
- No product files should change during this task unless verification finds a regression.
- Review: all files changed by Tasks 2-10.

**Interfaces:**
- Consumes: the complete implementation and documented design contract.
- Produces: verified commit, Vercel preview, promoted demo, and final review evidence.

- [ ] **Step 1: Run mechanical checks**

  ```bash
  git diff --check
  pnpm test:unit
  pnpm build
  pnpm lint
  node C:\Users\jerem\.codex\skills\impeccable\scripts\detect.mjs --json components/presentation/AdaptiveDashboardPage.tsx components/presentation/ResponsiveDashboardShell.tsx
  ```

  Expected: unit tests and build pass; lint output is either clean or explicitly separated into pre-existing issues; detector output is reviewed rather than blindly treated as a pass.

- [ ] **Step 2: Run the frontend-design-review gate**

  Score Frictionless, Quality Craft, and Trustworthy pillars. Require no P0/P1 visual-system regressions, no black primary CTA, no unexplained radius exception, and no broken copy state.

- [ ] **Step 3: Run the critique gate**

  Capture before/after at 1920x1080, 1280x800, 1024x1366, 768x1024, and 375x812. Re-run Anti-Slop, Craft, Hierarchy, Clarity, Signature, and responsive checks. Confirm the dashboard still feels authored for class finance rather than a generic SaaS dashboard.

- [ ] **Step 4: Verify all existing core routes**

  In the browser, visit Overview, Transactions, Receipts, Goals, Cash register, Reports, People, Settings, and Periods. Verify each route retains its existing data, controls, dialogs, and navigation while using the same action/color/shape system.

- [ ] **Step 5: Push the branch**

  ```bash
  git status --short --branch
  git push origin open-source-demo
  ```

- [ ] **Step 6: Promote the verified Vercel preview**

  Use the logged-in Vercel dashboard to confirm the preview source commit, wait for `Ready`, promote it to production, and verify the public alias `https://abi-vault-demo.vercel.app/dashboard` after promotion.

- [ ] **Step 7: Apply the verification-before-completion rule**

  Do not claim completion until the public production page visibly shows lime primary actions, compact concept-03 radii, consistent copy, and the same hierarchy at desktop, tablet, and phone widths.

## Self-Review Checklist

- [ ] Every black primary action found in the audit has a named token replacement task.
- [ ] Every radius family that caused drift has a normalization task.
- [ ] Dashboard, secondary routes, and responsive shells are all included.
- [ ] Copy inconsistencies and empty/loading states have a concrete task.
- [ ] Motion has a separate Emil/Kowalski audit rather than being changed opportunistically.
- [ ] Accessibility and dark-mode verification are explicit.
- [ ] No task changes backend, routes, database schema, or product features.
- [ ] No step uses unresolved placeholders or an undefined function/type.
- [ ] Verification and deployment are last, after all visual tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-15-concept-03-visual-system-reconciliation.md`.

Recommended execution path: use `superpowers:executing-plans` inline with review checkpoints after Tasks 3, 6, 7, and 11. A subagent-driven run is also valid if fresh review is preferred, but all agents must preserve the global constraints above.
