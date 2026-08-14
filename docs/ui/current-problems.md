# Current UI problems

## Evidence limitations

This is a source audit. `AGENTS.md` and `docs/` were absent. The connected Penpot MCP server was not available to the task, and the browser-control runtime/tool was not callable, so Penpot and live-render findings are marked unverified rather than guessed.

## Functional problems

- Most authenticated routes are placeholders and do not expose their intended finance workflows.
- Klassenkasse cards exist only in React state and reset after refresh; there is no persistence or class/user association.
- The cohort selector, notification button, and several placeholder cards have no implemented action.
- No visible role-based behavior for admin, supervisor, or student users is implemented in the inspected frontend.
- Card deletion and editing are local UI operations only.

## Accessibility issues

- The document declares `lang="en"`, while the visible product UI is predominantly German. The language should match the product language or be handled per content.
- No skip link was found for bypassing repeated dashboard navigation.
- Custom add/edit dialogs use `role="dialog"`, but no explicit focus trap, focus restoration, Escape-key handling, or initial-focus behavior was found.
- The color-selection controls expose labels and pressed state, but the selected ring and color-only distinction should be verified for contrast and non-color identification.
- Several muted text styles and low-opacity borders should be checked against WCAG contrast requirements in both themes.
- Card position indicators are plain spans and do not announce the current position or provide an equivalent keyboard control; arrows are hidden on small screens where indicators are shown.
- The recurring card shine and hover tilt have reduced-motion handling in the card CSS, but the broader application should be checked for consistent motion reduction.
- Live validation errors in the modals are visually rendered, but there is no explicit `aria-live` region or `aria-invalid`/`aria-describedby` wiring visible in the form fields.
- The dashboard notification button has an accessible label, but it has no behavior or status announcement.

## Visual and content inconsistencies

- The welcome/authentication copy is English while the dashboard navigation and headings are German.
- Auth pages duplicate a logo implementation that may drift from `AbiLogo`.
- The dashboard contains large blank placeholder areas that visually imply content but do not explain their state.
- Light/dark styling is not fully consistent: Clerk appearance is configured with white backgrounds, while the rest of the app has dark tokens.
- Placeholder border, surface, and shadow styling is duplicated in dashboard CSS rather than expressed through a shared component/token.
- The dashboard has multiple responsive overrides, including a `2200px` mode, but no single documented layout contract explains why each mode changes.

## Duplicated or maintainability risks

- Add and edit card modals duplicate most form, formatting, color, and validation logic.
- Sidebar route data and header page metadata are separate sources of truth.
- Repeated page sections use similar static `p-8`/heading markup across destination routes.
- `AccountCard` contains separate add and bank rendering paths with repeated sizing concerns.

## Missing states

- No route-level `loading.tsx`, `error.tsx`, or `not-found.tsx` files were found in `app/`.
- No explicit empty state for transactions, receipts, goals, accounts, people, or reports exists.
- No API failure, permission-denied, upload failure, or save-conflict state exists.
- No skeleton is shown while dashboard data would eventually load.

## Unverified items

- Actual Penpot component/page inventory.
- Browser rendering at desktop, tablet, mobile, zoom, high-contrast, and reduced-motion settings.
- Runtime Clerk behavior and authenticated redirects.
