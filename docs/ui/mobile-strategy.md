# Mobile strategy

This is a desktop/tablet-to-mobile planning document based on the current audit. It does not modify application code or Penpot.

## Principles

- Preserve the same information hierarchy, not the desktop geometry.
- Prefer one-column reading order on narrow screens.
- Keep primary actions reachable with comfortable touch targets.
- Do not hide essential status or data solely because the viewport is narrow.
- Replace dense desktop tables with readable list rows or progressive detail views when necessary.
- Treat cards, dialogs, and sidebar navigation as separate responsive components rather than scaling the whole dashboard image.

## P0 recommendations

### P0-1 — Make mobile navigation complete and accessible

- **Current problem:** The shadcn sidebar switches to a Sheet below its mobile breakpoint, but the overall mobile navigation behavior and focus handling were not validated live.
- **Proposed solution:** Ensure the trigger, Sheet, close behavior, focus return, current route, and touch targets are keyboard and screen-reader accessible. Keep the current mobile pattern unless testing shows it fails.
- **Affected screens:** All dashboard routes.
- **Affected components:** `Sidebar`, shadcn `Sheet`, `SidebarTrigger`, `DashboardHeader`.
- **Implementation effort:** Medium.
- **Expected UX impact:** High for mobile navigation reliability.

### P0-2 — Define narrow-screen content order

- **Current problem:** The dashboard grid receives explicit columns only at `lg`; its narrow-screen ordering is not documented as an intentional product layout.
- **Proposed solution:** Define a deterministic order: page header, Klassenkasse, transaction history, goals, spending summary, then review actions—or another order approved by product/design. Use source order or explicit grid areas.
- **Affected screens:** Dashboard overview.
- **Affected components:** Dashboard page/grid and each dashboard card.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** High; improves scanning and prevents accidental priority changes.

### P0-3 — Make dialogs usable within mobile viewport height

- **Current problem:** Add/edit dialogs use internal scrolling, but focus, error placement, and dense form behavior have not been validated on small viewport heights.
- **Proposed solution:** Keep `dvh`-aware max height, add focus management, ensure action buttons remain reachable, and test keyboard plus touch scrolling with validation errors.
- **Affected screens:** Dashboard card flows.
- **Affected components:** `AddCardModal`, `EditCardModal`, shared dialog/form components.
- **Implementation effort:** Medium.
- **Expected UX impact:** High for completing card actions on mobile.

## P1 recommendations

### P1-1 — Adapt Klassenkasse for touch

- **Current problem:** Desktop arrows are hidden below `lg` and mobile shows passive indicators; touch/swipe behavior and an equivalent accessible control were not verified.
- **Proposed solution:** Use a single-card viewport with touch-friendly controls or a swipe interaction that has a button/keyboard equivalent. Announce the active card and keep the add-card entry discoverable.
- **Affected screens:** Dashboard overview; future funds/accounts.
- **Affected components:** `Klassenkasse`, `AccountCard`.
- **Implementation effort:** Medium.
- **Expected UX impact:** High for card management on touch devices.

### P1-2 — Replace dense tables with responsive lists

- **Current problem:** The future transaction table will not have enough width for all desktop columns on narrow screens.
- **Proposed solution:** Keep a table-like desktop view, then collapse secondary fields into a stacked row/detail view on tablet/mobile. Preserve amount, date, category, status, and receipt access according to approved priority.
- **Affected screens:** Transactions and dashboard history.
- **Affected components:** Future transaction table/list components.
- **Implementation effort:** Large, dependent on the data model.
- **Expected UX impact:** High for readability and task completion.

### P1-3 — Use breakpoint ranges intentionally

- **Current problem:** Current source uses `md`, `lg`, `1600px`, and `2200px` behaviors but lacks a tested mobile/tablet contract.
- **Proposed solution:** Establish a small set of modes: narrow mobile, wide mobile/small tablet, tablet, and desktop. Use CSS Grid/Flex, `minmax()`, `clamp()`, and `dvh` where they solve real constraints; avoid a separate layout for every device resolution.
- **Affected screens:** Shared dashboard shell and all data screens.
- **Affected components:** Shell, sidebar, header, grid cards, future tables/forms.
- **Implementation effort:** Medium.
- **Expected UX impact:** High across device classes.

### P1-4 — Protect horizontal overflow

- **Current problem:** Long card numbers, headings, and future table data can create overflow even though the dashboard main hides horizontal overflow.
- **Proposed solution:** Test long user-provided values, use safe wrapping/ellipsis where appropriate, keep numeric values readable, and avoid relying on `overflow-x: hidden` to conceal content.
- **Affected screens:** Dashboard, card modals, transactions, people, reports.
- **Affected components:** `AccountCard`, form fields, tables, page headers.
- **Implementation effort:** Medium.
- **Expected UX impact:** Medium to high; prevents inaccessible clipped content.

## P2 recommendations

### P2-1 — Reduce non-essential decorative motion on touch

- **Current problem:** Tilt depends on pointer movement and has little value on touch devices.
- **Proposed solution:** Keep tilt for fine-pointer devices, disable or simplify it for touch and reduced-motion users, while preserving sufficient card contrast and state feedback.
- **Affected screens:** Dashboard and card dialogs.
- **Affected components:** `AccountCard`, card CSS.
- **Implementation effort:** Small.
- **Expected UX impact:** Low to medium; improves performance and reduces distraction.

### P2-2 — Make mobile headers concise but informative

- **Current problem:** Mobile hides the desktop title block and currently presents trigger, notifications, and user controls; exact page context on destination screens needs validation.
- **Proposed solution:** Keep the compact header but expose the current page title when it improves orientation, without crowding the controls. Choose one consistent arrangement after live testing.
- **Affected screens:** All dashboard routes.
- **Affected components:** `DashboardHeader`.
- **Implementation effort:** Small.
- **Expected UX impact:** Medium; improves orientation.

### P2-3 — Validate zoom, landscape, and short-height cases

- **Current problem:** The audit could not inspect live browser behavior, and viewport height/zoom can alter the current `dvh` and overflow behavior.
- **Proposed solution:** Test portrait/landscape tablet, browser zoom, short-height windows, keyboard focus, reduced motion, and high contrast before finalizing breakpoints.
- **Affected screens:** All.
- **Affected components:** Shell, dialogs, navigation, cards.
- **Implementation effort:** Small to medium.
- **Expected UX impact:** Medium; catches layout failures not visible at one viewport.

## Assumptions

- Phone layouts are intentionally included here as a planning concern, but no phone-specific implementation is proposed in this phase.
- The product hierarchy and required fields are not invented; where ordering or data priority is mentioned, it requires product/design confirmation.
- Penpot and live browser inspection were unavailable for this planning pass.
