# Abi Manager UI — Current Design Audit

> Snapshot of the UI as implemented in the repository on 2026-08-14. This is an inventory, not a proposed design system. It records the existing visual behavior so the next pass can normalize it deliberately.

## Executive summary

Abi Manager currently uses a quiet, monochrome finance-dashboard language:

- Geist Sans is the primary typeface, with Geist Mono available for numeric/code-like text.
- White surfaces sit on a very light gray canvas with near-black ink and thin gray rules.
- The dashboard uses soft rounded cards, restrained shadows, occasional backdrop blur, and a small set of semantic accents: green for positive/income, red for negative/expense, amber for review, violet for selected/category identity.
- The global shell is a fixed viewport frame with a persistent sidebar, shared page header, and scroll-contained main area.
- The main dashboard is intentionally dense at desktop sizes, with special layout branches at 1280px, 1600px, 2200px, and short viewport heights.
- Transactions and Receipts are custom CSS-module surfaces rather than shared table/card primitives. They are visually related but not token-identical.
- Most interactions use short opacity, color, transform, or shadow transitions. Reduced-motion overrides exist for the global links, card tilt, and modal animation.

### Current design direction

Reading this as: a trust-first internal finance dashboard for student committee administrators, with a calm minimalist language, leaning toward high-contrast monochrome surfaces plus small semantic status accents.

### Design dials inferred from the current implementation

| Dial             | Current reading | Evidence                                                                               |
| ---------------- | --------------: | -------------------------------------------------------------------------------------- |
| Design variance  |            4/10 | Repeated card/grid structures, mostly symmetrical columns, restrained decoration       |
| Motion intensity |            3/10 | Short hover transitions, modal pop/fade, account-card tilt and light sweep             |
| Visual density   |            5/10 | Dense financial rows and dashboards, balanced by generous card padding and white space |

## Source map

| Area                                                           | Source                                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Global tokens, body, canvas, theme, selection, motion defaults | `app/globals.css`                                                                                                              |
| Global dashboard shell/grid breakpoints                        | `app/dashboard/dashboard.module.css`                                                                                           |
| Shared dashboard header                                        | `components/dashboard-header.tsx`                                                                                              |
| Shared sidebar/navigation                                      | `components/sidebar.tsx`, `components/ui/sidebar.tsx`                                                                          |
| Dashboard page composition                                     | `app/dashboard/page.tsx`                                                                                                       |
| Dashboard panels and responsive density                        | `components/dashboard/DashboardPanels.tsx`                                                                                     |
| Class account/card interaction                                 | `components/dashboard/Klassenkasse.tsx`, `components/dashboard/AccountCard.tsx`, `components/dashboard/AccountCard.module.css` |
| Transactions page behavior                                     | `app/dashboard/transactions/page.tsx`                                                                                          |
| Transactions page visual rules                                 | `app/dashboard/transactions/transactions.module.css`                                                                           |
| Receipts page behavior                                         | `app/dashboard/receipts/page.tsx`                                                                                              |
| Receipts page visual rules                                     | `app/dashboard/receipts/receipts.module.css`                                                                                   |
| Shared primitive defaults                                      | `components/ui/card.tsx`, `button.tsx`, `input.tsx`, `dropdown-menu.tsx`, `progress.tsx`, `table.tsx`, `separator.tsx`         |
| Public/auth surfaces                                           | `app/welcome-page.tsx`, `app/sign-in/**`, `app/sign-up/**`                                                                     |

## Foundations

### Typography

#### Font families

- `next/font/google` loads `Geist` into `--font-geist-sans`.
- `Geist_Mono` loads into `--font-geist-mono`.
- `body` explicitly uses `var(--font-geist-sans), sans-serif`.
- The Tailwind theme exposes `--font-mono: var(--font-geist-mono)`.
- The theme currently assigns `--font-sans: var(--font-sans)` and `--font-heading: var(--font-sans)`, which is self-referential and should be resolved when the real system is created.
- Clerk forms explicitly use `var(--font-geist-sans)`.

#### Weight and hierarchy patterns

- Page titles: generally `font-semibold`, tight tracking, large sans display.
- Card titles: `font-semibold`, usually `text-xl` and `lg:text-2xl` in dashboard panels.
- Data names and labels: `font-medium` or `font-semibold`.
- Buttons: generally `font-semibold` at `0.85rem–0.875rem`.
- Supporting metadata: `text-muted-foreground` or hardcoded gray, usually `0.75rem–0.875rem`.
- Financial amounts use `tabular-nums` in the class account and transaction amount displays.

#### Observed sizes

| Role                      | Current implementation                                                |
| ------------------------- | --------------------------------------------------------------------- |
| Shared desktop page title | `text-4xl`, reduced to `1.875rem` at desktop short-height media query |
| Shared page description   | `text-base`, reduced to `0.875rem` at short height                    |
| Dashboard card title      | `text-xl`, `lg:text-2xl`, `1.65rem` at 2200px for Klassenkasse        |
| Transactions KPI label    | `0.875rem`                                                            |
| Transactions KPI amount   | `clamp(1.5rem, 1.8vw, 2rem)`                                          |
| Transactions list heading | `1.5rem`                                                              |
| Receipts list heading     | `1.3rem`                                                              |
| Dashboard table metadata  | `text-xs` headers, `text-sm` rows at larger widths                    |
| Transactions table header | `0.75rem`                                                             |
| Transactions table row    | `0.85rem`                                                             |
| Receipts table header     | `0.72rem`                                                             |
| Receipts table row        | `0.82rem`                                                             |
| Dashboard sidebar labels  | `15px` at the custom button layer                                     |

### Color system currently in use

#### Global light tokens

| Token                  | Value                       | Usage                                                   |
| ---------------------- | --------------------------- | ------------------------------------------------------- |
| `--canvas`             | `#fafafa`                   | Outer application canvas                                |
| `--surface`            | `#ffffff`                   | White surface fallback                                  |
| `--ink`                | `#1d1d1f`                   | Main text, dark controls, selection foreground contrast |
| `--muted`              | `oklch(0.97 0 0)`           | Soft neutral                                            |
| `--line`               | `#e6e6e6`                   | Named border token                                      |
| `--soft`               | `#f1f1f1`                   | Soft surface token                                      |
| `--background`         | `oklch(1 0 0)`              | shadcn background                                       |
| `--foreground`         | `oklch(0.145 0 0)`          | shadcn foreground                                       |
| `--card`               | `oklch(1 0 0)`              | Card surface                                            |
| `--muted-foreground`   | `oklch(0.556 0 0)`          | Secondary text                                          |
| `--border` / `--input` | `oklch(0.922 0 0)`          | Primitive border/input defaults                         |
| `--primary`            | `oklch(0.205 0 0)`          | Primary black control                                   |
| `--destructive`        | `oklch(0.577 0.245 27.325)` | Generic destructive token                               |

#### Global dark tokens

- Canvas `#111113`, surface `#1b1b1f`, ink `#f5f5f5`, line `#4a4a54`, soft `#25252a`.
- Dark card/background/popover tokens are based on near-black oklch values.
- Borders shift to translucent white, commonly `rgb(255 255 255 / 0.10–0.20)`.
- Primary controls invert to light gray/white backgrounds with dark text.

#### Semantic and page-local colors

| Meaning          | Current colors                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Positive/income  | `#16a34a`, `#159447`, `#15803d`, Tailwind `green-500/600/700`, `#eaf8ef`, `#edfaf0`, `#eaf8ee` |
| Negative/expense | `#ef4444`, `#ef3038`, Tailwind `red-500`, `#fff0f1`                                            |
| Review/warning   | `#e98b00`, `#d97706`, Tailwind `amber-400/500`, `#fff5e5`, `#fff7ea`, `#ffe3b5`                |
| Violet identity  | `#7048e8`, `#f1edff`, Tailwind `violet-50/600`                                                 |
| Orange identity  | `#e98b00`, `#fff5e8`, Tailwind `orange-50/500`                                                 |
| Neutral tags     | `#f3f4f6`, `#52525b`                                                                           |

Important: the semantic palette is currently implemented through a mixture of CSS variables, Tailwind colors, hardcoded hex values, and translucent black/white values. This is a major future normalization target.

### Shape, border, and depth

#### Radius ladder observed

- Global base radius: `0.625rem`.
- Primitive card: `rounded-xl` by default, with `--card-spacing: --spacing(4)`.
- Dashboard panels: `rounded-2xl`.
- Dashboard nested goal cards: `rounded-xl`.
- Transactions cards and modal: `1.25rem` (`rounded-2xl`-like but explicitly larger in CSS).
- Receipts cards/modal: `1rem`.
- Controls: usually `.65rem–.75rem` / `rounded-lg` or `rounded-xl`.
- Status/category pills and icon bubbles: fully round (`999px`).
- Account card: `20px`.

#### Borders

- Most surfaces use `1px` borders.
- Light borders range from `rgb(0 0 0 / .065)` to `.12`.
- Dashboard card primitives use a subtle ring from the shared Card primitive, then page-level cards add borders/shadows.
- Dark mode converts rules to translucent white.

#### Shadows

- Shell: `shadow-sm`.
- Dashboard panels: `0 12px 28px rgb(0 0 0 / .07)` plus `backdrop-blur(3px)` and semi-opaque white backgrounds.
- Transactions/Receipts cards: `0 1px 2px rgb(0 0 0 / .035)`.
- Modals: approximately `0 1.5rem 3rem rgb(0 0 0 / .18–.20)`.
- Account card: `0 14px 24px -5px rgb(0 0 0 / .30)`; hover increases to `0 18px 28px -7px rgb(0 0 0 / .38)`.
- Dropdowns: `0 .8rem 1.5rem` with `.12–.14` black opacity.

### Spacing rhythm

The code uses Tailwind spacing alongside CSS rem literals. The most repeated intervals are:

- `0.25rem` for small text/meta gaps.
- `0.35–0.4rem` for labels and control internals.
- `0.55–0.75rem` for icon/text and field spacing.
- `0.8–1rem` for control gaps and page filters.
- `1.25–1.5rem` for card/page section gaps and horizontal padding.
- `1.75–2rem` at the 2200px desktop branch.

Common layout values:

| Surface                                     | Base spacing                         | Large desktop                          |
| ------------------------------------------- | ------------------------------------ | -------------------------------------- |
| Dashboard page horizontal padding           | `clamp(1rem, 2vw, 3rem)`             | `2rem` at 2200px                       |
| Dashboard grid gap                          | `clamp(1rem, 1.5vw, 1.5rem)`         | `2rem` at 2200px                       |
| Transactions page gap                       | `1.25rem`                            | `1.75rem` at 2200px                    |
| Transactions card/filter horizontal padding | `1.5rem`                             | `2rem` at 2200px                       |
| Receipts page gap                           | `1.5rem`                             | `1.75rem` at 2200px                    |
| Receipts horizontal padding                 | `1.5rem`                             | `2rem` / `2.5rem` depending on surface |
| Dashboard panel header                      | `px-5 pt-5`, larger `sm/lg` variants | `px-7/8`, `pt-6/7`                     |

## Global shell

### Viewport and frame

- `.shell` is `height: 100dvh`, `overflow: hidden`, with a responsive gutter (`clamp(.5rem, .85vw, 1rem)`).
- `.frame` fills the viewport minus shell gutters, has `max-width: 2400px`, and is rounded with a subtle border and `shadow-sm`.
- The main content uses `overflow-x: hidden`, `overflow-y: auto`, and `overscroll-behavior: contain`.
- The shell intentionally prevents body-level scrolling; individual main areas can scroll.

### Sidebar

- White in light mode, dark sidebar token in dark mode.
- Rounded left shell edge (`rounded-l-3xl`).
- Width is 13rem by default, 14rem at 1280px, 16rem at 1600px, and 19rem at 2200px.
- Header uses the AbiLogo with `px-6 py-7`, expanded to `2rem 2rem 1.75rem` at 2200px.
- Navigation has 8 items: Overview, Transactions, Receipts, Goals, Cash registers, Reports, People, Settings.
- Desktop menu buttons are 3.5rem high by default and 3.75rem at 2200px, with `rounded-xl`, 15px text, 20px icons, and muted black text.
- Active state: very light black background (`black/[0.045]`) and main ink.
- Hover: slight `translate-x(.125rem)`, light background, ink text.
- Pressed state: `scale(.99)`.
- Footer contains the light/dark toggle with rounded-xl padding, muted text, and subtle hover surface.

### Header

- Shared across dashboard pages and driven by the pathname map.
- Mobile: minimum height `3.5rem`, bottom divider, compact horizontal padding, sidebar trigger.
- Desktop: minimum height `7rem`, top padding `1.75rem`, bottom padding `1rem`, no bottom divider.
- Page title is left aligned; current titles include Financial overview, Transactions, Receipts, Goals, Cash registers, Reports, People, Settings.
- Description sits below with a small top gap and muted text.
- Right actions: Abi 2026 cohort button, notifications button, Clerk user button.
- Cohort button: `3.5rem` high, rounded-xl, white/card background, subtle border and shadow, hover softens background.
- Bell button: rounded-lg, icon-only, subtle hover fill.
- Avatar is 2rem mobile / 2.75rem desktop.

## Dashboard

### Composition

Two columns at desktop:

- Left: Klassenkasse above Transaktionsverlauf.
- Right: Goals above Expenses by category above Review needed.

At widths below 1280px, columns collapse into ordered content sections. The desktop grid uses a 1.03fr/0.97fr split normally and 1.05fr/0.95fr at 2200px.

### Shared dashboard panel treatment

- Panels are full-width cards with `rounded-2xl`, white at 85% opacity, `backdrop-blur-[3px]`, and a soft large shadow.
- Header titles are `text-xl` by default and `lg:text-2xl`.
- Header/content spacing is deliberately adjusted at 1280–2199px and 2200px.

### Klassenkasse

- Card carousel supports previous/next buttons, touch swipe, add-card flow, edit flow, and delete flow.
- Account card uses a 340:196 aspect ratio, expanding to max 440px at 2200px.
- Card is black by default, image-backed, 20px radius, deep shadow, animated light sweep, hover tilt based on pointer position, and a slight lift/scale.
- Card text is white unless a light custom card color is active.
- Account number uses wide letter spacing and tabular numerals.
- The balance panel is separated by a thin vertical divider on desktop.
- Reconciliation banner is pale green with a green circular check, green bold title, and green detail text.
- At 2200px the card, balance text, banner, icon, and spacing all increase.

### Transaktionsverlauf

- Dashboard uses a custom grid rather than the Transactions page table.
- Visible rows are resolution-dependent through conditional classes:
  - 1280–2199px hides the last three placeholder rows.
  - 2200px shows more rows.
- Header columns: transaction, category, date, amount, receipt icon.
- Rows use muted dividing lines, small icon bubbles, medium-weight names, muted metadata, and green/red amounts.
- The “All transactions anzeigen” link uses a small right translation on hover and a special vertical translation at 1280–2199px.

### Goals

- Three goal cards in a three-column inner grid.
- Each nested card uses `rounded-xl`, thin border, `p-4` base spacing, and larger target amount typography.
- Progress bars are black/white with a light neutral track, 2px-ish thickness, rounded ends.
- The “Add goal” action is text-first and dims on hover.
- Adding a fourth goal creates an overflowable minimum-width inner grid rather than changing the outer layout.

### Expenses by category

- Rows are icon bubble / category label / progress meter and detail / right-aligned percentage.
- Base rows have `min-h-12`, 2px-ish bars, muted details, and 3rem-ish icon columns.
- At 1280–2199px rows shrink to `min-h-10` and tighter vertical spacing.
- At 2200px rows become `min-h-20`, 40px icon bubbles, 3px bars, larger labels/details, and wider columns.
- Veranstaltung is monochrome black, Material green, Sonstiges amber.

### Review needed

- Review links are horizontal bordered rows with icon, flexible text, and arrow.
- Warning uses amber; informational and file items are neutral.
- The third “1 Receipt without a category” row is hidden below 2200px and shown at 2200px.
- Bottom action is black/white depending on theme, rounded-lg, and grows from 40px to 48px at 2200px.

## Transactions page

### Layout

- Vertical page stack: three KPI cards, then a full list card.
- Base max width is 2100px; at 1600px it becomes 1880px; at 2200px it becomes unrestricted.
- KPI grid is always three columns above mobile breakpoints.
- At 1280px and short viewport heights, page gaps, KPI heights, header heights, filter padding, and pagination height are compressed.

### KPI cards

- Three independent cards: Einnahmen, Ausgaben, Netto.
- Grid columns: icon, content, trend.
- Base minimum height 8.25rem; 9.25rem at 2200px; 6.8rem in short desktop viewport branch.
- Icon bubbles are 3rem, reducing to 2.6rem at short heights.
- Income uses pale green + green amount; expense pale red + red amount; net pale violet + dark amount.
- Trend uses TrendingUp and semantic green/red.

### All Transactions card

- List card is a vertical flex surface with overflow hidden, 1.25rem radius, thin border, white/card background, and tiny shadow.
- Header min-height 5.25rem, shrinking to 4rem at short height.
- Header includes “All transactions”, a dynamic `{activeFiltersCount} Filters` badge, and “Add transaction”.
- Filters bar contains search, category dropdown, type dropdown, date range trigger, and filter button.
- Search and controls are 3rem high, thin bordered, rounded `.75rem`, white surface, and muted placeholder text.
- The filter modal supports category/type multi-selection, amount range, receipt status, review status, account selection, reset/cancel/apply, Escape close, and click-outside close.
- Date selection is a separate modal with `Von` and `Bis` fields.
- Transaction details and add-transaction flows are also modal surfaces.

### Transaction table

- Five columns: Transaktion, Kategorie, Datum, Betrag, Beleg.
- Table container has 1px border, `.8rem` radius, hidden overflow, and horizontal margins.
- Header is 2.5rem minimum height, `0.75rem`, lightly tinted background.
- Rows are grid buttons with muted dividers, `0.85rem` text, icon bubbles, pill category tags, receipt filenames, and green/red amounts.
- Base page size is 10; current pagination is compact previous/current/next.
- Current pagination controls are right aligned, 1.85rem squares with no visible border, muted chevrons, and a soft active background.
- Empty state is centered with search icon, message, and reset action.

### Dropdowns and modal behavior

- Custom dropdowns render a positioned menu below or above the trigger.
- Menus have a thin border, white surface, `.75rem` radius, `.8rem–1.5rem` shadow, and small internal gap.
- Options use compact padding and dark active/hover fill with white text.
- Modal overlay is fixed, blurred, translucent black, centered, and animated with fade/pop.
- Filters modal width is up to 43rem and intentionally does not scroll; standard modal width is up to 32rem.
- Modal headers and footers use thin dividers; body uses compact grid spacing.

## Receipts page

### Layout

- Vertical page stack: three summary cards, then a fixed-height receipt list card.
- Base list card height is `740px`; at 2200px it is `954px`.
- Summary cards are 7rem minimum height, 8rem at 2200px.
- The page uses a 1.5rem base gap, 1.75rem at 2200px.

### Summary cards

- All receipts, Review needed, Unassigned.
- Flex layout with a neutral 3rem icon bubble and text stack.
- Warning card uses amber icon/bubble treatment; others remain neutral.
- Card radius is 1rem, not the 1.25rem used by Transactions.

### Receipt list

- Heading: “Receipt overview”. Add action: “Add receipt”.
- Filters bar: filename/transaction search, status dropdown, period dropdown.
- Table columns: Beleg, Assigned transaction, Datum, Betrag, Status, overflow action.
- Rows use file icon/name/type-size stack, transaction/kind stack, date, amount, semantic status pill, and three-dot action.
- Page size is 9 receipts at the base/1920px layout and 10 receipts at `min-width: 2200px`, matching the wide Transactions density. Pagination is compact previous/current/next.
- Status colors: green Reviewed, amber Review needed, gray Unassigned.

### Add-receipt modal

- Centered white modal with 1rem radius, blurred dark overlay, soft shadow.
- Header contains title, description, and close button.
- Upload area is a 14rem dashed dropzone with upload icon, title, helper text, and black file button.
- Form fields are stacked with compact labels, 2.75rem inputs, and rounded `.7rem` borders.
- Footer uses right-aligned cancel and primary actions.
- Supports PDF/JPG/JPEG/PNG input and a transaction assignment dropdown.

## Interaction rules

### Hover, focus, active, disabled

- Primary dark buttons: opacity reduces to ~82% on hover; active state moves down 1px.
- Filters buttons follow the same opacity treatment.
- Inputs/selects/controls darken their border on hover and use a 2px ink outline on focus.
- Sidebar links slightly translate right on hover and compress on active.
- Dashboard action links translate right by roughly 2px on hover.
- Review links and detail rows use a soft black/white background on hover.
- Dropdown options use dark active/hover backgrounds and white text.
- Pagination disables arrows with reduced opacity and a not-allowed cursor.
- Account cards tilt with pointer position, lift 2px, scale 1.01, and deepen shadow on hover.
- Modal overlay uses fade-in; modal uses a small upward pop/scale-in.

### Motion reduction

`prefers-reduced-motion: reduce` disables or removes:

- Global action/brand link transitions and transforms.
- Account-card animation and transitions.
- Modal overlay/modal animations.
- Transactions primary/filter/control transitions.

## Responsive rules

| Breakpoint                  | Current behavior                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `<600px`                    | Filters modal columns stack; segmented controls use slightly larger text                                                                        |
| `<760px`                    | Page padding becomes 1rem, KPI cards stack, list headers stack, filters stack, tables gain horizontal scrolling                                |
| `<900px`                    | Receipt summaries stack; receipt filters stack; tables use a wide min-width                                                                    |
| `<1150px`                   | Transaction KPI trend moves below content; filter grid becomes two columns                                                                     |
| `768–1099px`                | iPad portrait uses an icon rail, compact header, ordered dashboard flow, touch-sized controls, and card-style Transaction/Receipt rows         |
| `1100–1399px`               | iPad landscape uses a scroll-free compact dashboard and six-row paginated Transaction/Receipt tables                                           |
| `<1280px`                   | Outside the explicit tablet landscape branch, Dashboard columns collapse into one ordered flow                                                 |
| `1280–2199px`               | Dashboard and transaction layouts use compact row/panel spacing; dashboard history hides trailing rows                                         |
| `>=1600px`                  | Page max-width/padding expands for wide desktop                                                                                                |
| `>=2200px`                  | Dashboard sidebar, panels, labels, rows, spacing, and visible content enlarge; receipts and transactions use wider columns and taller surfaces |
| `1280px + max-height 850px` | Shared header, page gaps, card heights, filters, and pagination compress to prevent viewport overflow                                          |

## Accessibility and semantics observed

- Interactive rows and controls generally use buttons or links rather than clickable non-semantic containers.
- Dialogs use `role="dialog"` and `aria-modal="true"`; close buttons have labels; Escape closes Transactions overlays.
- Dropdown triggers expose `aria-haspopup`, `aria-expanded`, and listbox/option roles.
- Pagination current buttons expose `aria-current="page"`; arrows have labels.
- Decorative icons are generally paired with visible text; some card imagery is marked `aria-hidden`.
- Inputs include visually hidden labels where the visible UI is placeholder-driven.
- Focus-visible outlines exist across page controls, rows, inputs, modal buttons, and sidebar primitives.
- The root document currently declares `lang="en"` even though the product UI is predominantly German.

## Current implementation risks to resolve later

1. Consolidate typography sizes for page/list/card headings.
2. Replace hardcoded semantic colors with a single token layer.
3. Align Transactions and Receipts card radius, shadows, padding, and control heights.
4. Resolve the self-referential `--font-sans` theme mapping.
5. Decide whether the 2200px branch should scale type, density, or only available content height.
6. Create one shared table/pagination contract instead of two page-local implementations.
7. Resolve the distinction between `--canvas`, `--background`, `--surface`, and `--card`.
8. Align German copy and accessibility metadata, including `html lang`.
9. Replace native/select and custom dropdown styling with one documented behavior.
10. Revisit fixed-height Receipts behavior and viewport overflow at 1920px.

## Appendix: exact recurring values

### Repeated sizes

`0.25rem`, `0.35rem`, `0.4rem`, `0.45rem`, `0.5rem`, `0.55rem`, `0.6rem`, `0.65rem`, `0.7rem`, `0.75rem`, `0.8rem`, `0.85rem`, `0.9rem`, `1rem`, `1.05rem`, `1.1rem`, `1.15rem`, `1.25rem`, `1.5rem`, `1.75rem`, `2rem`.

### Repeated radii

`.4rem`, `.45rem`, `.5rem`, `.55rem`, `.6rem`, `.65rem`, `.7rem`, `.75rem`, `.8rem`, `1rem`, `1.25rem`, `1.5rem`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `999px` pills/circles.

### Repeated control heights

`2rem`, `2.35rem`, `2.5rem`, `2.6rem`, `2.75rem`, `3rem`, `3.5rem`, `4rem`, `4.25rem`, `4.5rem`, `5rem`, `5.25rem`, `7rem`, `8.25rem`, `9.25rem`.
