# Responsive Presentation Architecture

Abi Vault uses one application state and three independent presentation layers.

## Presentation modes

| Mode    | Selection                                                                   | Navigation                                           | Content strategy                                                         |
| ------- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Desktop | 1400px and wider, plus laptop-height 1280-1399px windows                    | Independent grouped sidebar and contextual topbar    | Purpose-built dense desktop workspaces with desktop-only composition      |
| Tablet  | 768-1279px, plus 1280-1399px windows at least 800px tall                    | Tablet navigation rail and compact contextual topbar | Tablet dashboard and finance workspaces; focused adaptations elsewhere   |
| Phone   | Up to 767px, plus compact landscape windows up to 950px wide and 600px tall | Compact topbar, bottom navigation, and a More sheet  | Independent mobile page structures and full-screen or bottom-sheet tasks |

The authoritative selector is `hooks/use-presentation-mode.ts`. Avoid adding independent breakpoint checks to page components.

## Shared logic

Pages keep their existing data, state, calculations, validation, and event handlers. Presentation components receive values and callbacks instead of duplicating business logic.

- `ResponsiveDashboardShell` owns three separate navigation and topbar trees.
- `AdaptiveDashboardPage` owns independent desktop, tablet, and phone dashboard compositions.
- `AdaptiveFundsView` owns independent desktop, tablet, and phone Kasse & Konten compositions while receiving the same state and callbacks.
- The remaining page files keep their desktop and tablet structures while rendering dedicated phone views from the same state.

## Desktop isolation

The desktop branch in `ResponsiveDashboardShell` is a standalone application shell. It does not render the tablet rail, phone navigation, or the legacy shared sidebar tree.

Desktop-specific presentation files:

- `components/presentation/ResponsiveDashboardShell.tsx`
- `components/presentation/AdaptiveDashboardPage.tsx`
- `app/dashboard/dashboard-desktop.module.css`
- `components/presentation/AdaptiveFundsView.tsx`
- `app/dashboard/funds/funds-adaptive.module.css`

Dashboard and Kasse & Konten receive purpose-built desktop compositions. Reports, Transactions, Receipts, Goals, People, and Settings retain their established page structures and receive only shell, density, overflow, and interaction corrections.

Rules:

1. Keep desktop layout classes out of tablet and phone presentation branches.
2. Share data, hooks, calculations, and callbacks; do not share page composition when that compromises desktop UX.
3. Add device-specific presentation styles in `*-desktop.module.css`, `*-adaptive.module.css`, or `*-phone.module.css`.
4. Keep desktop shell controls functional and keyboard accessible; popovers close on Escape and outside interaction.
5. Test desktop at 1366x768, 1440x900, 1536x864, 1920x1080, and 2560x1440 after presentation changes.
6. Keep the desktop content region a column flex container. Desktop page roots use `flex: 1 1 0%` to consume the remaining workspace height; changing the parent back to block layout recreates large unused areas on tall screens.

## Tablet principles

- Keep a persistent 88px navigation rail and contextual topbar.
- Use supporting-pane or split-view layouts for dashboard and finance work.
- Preserve compact tables at 1024px landscape instead of expanding every row into a card.
- Use 44px controls for navigation, pagination, and primary actions.
- Allow vertical scrolling at 1024px or portrait when it improves readability.

## Phone principles

- Keep 5 primary destinations in the bottom bar. Secondary destinations and theme control live in the More sheet.
- Use list rows for transactions, receipts, people, and settings rather than desktop tables.
- Use progressive disclosure for filters, details, and complex forms.
- Present focused tasks as bottom sheets or near-full-screen flows.
- Respect safe-area insets and reserve content space for the bottom navigation.
- Keep every interactive target at least 24px, with 44px as the normal target.

## Accessibility contracts

- Every shell exposes a skip link to `#dashboard-content`.
- Dialogs trap focus, close with Escape, restore focus, and contain scrolling.
- Icon-only controls have accessible names.
- Form controls use wrapping or explicit labels.
- Touch gestures always have button alternatives.
- Reduced-motion and reduced-transparency preferences are respected.

## Required browser verification

Tablet landscape:

- 1024x768
- 1180x820
- 1194x834
- 1366x1024

Tablet portrait:

- 820x1180

Phones:

- 360x800
- 390x844
- 430x932

Desktop regression:

- 1366x768
- 1440x900
- 1536x864
- 1920x1080
- 2560x1440

For every route, confirm no document-level horizontal overflow, named controls, logical headings, and usable touch targets. Open page tabs, dropdowns, and dialogs rather than verifying only the initial screen.
