# Current responsive behavior

## Layout modes found in source

| Range | Current behavior |
| --- | --- |
| Below `md` | Sidebar is represented by a Sheet. Dashboard header shows the trigger, notifications icon, and Clerk user button. Dashboard overview grid is not assigned the desktop two-column template and therefore follows normal block flow. |
| `md` to below `lg` | Desktop sidebar is visible and the header receives desktop spacing, but the overview grid remains without the explicit large-screen column template. |
| `lg` and above | Dashboard overview uses two columns. The left column contains Klassenkasse plus one placeholder; the right column contains three placeholders. Vertical space is distributed with grid rows. |
| `min-width: 1600px` | Sidebar width increases to `16rem`; page max width is reduced to `1880px` with larger horizontal padding. |
| `min-width: 2200px` | Sidebar width becomes `19rem`, frame max width is removed, page becomes full-width, gaps increase, sidebar controls scale up, and the card max width becomes `440px`. |
| `lg` with max height `850px` | Header and grid gaps/padding are reduced to limit vertical overflow. |

## Component-specific behavior

- `AccountCard` maintains a `340/196` aspect ratio and switches to a `440px` max width at `2200px`.
- Card text uses responsive Tailwind sizes, with additional `min-[2200px]` sizes.
- Desktop arrow buttons are hidden below `lg`; mobile uses position indicators instead.
- Add/edit modals use a viewport-aware maximum height of `calc(100dvh - 2rem)` and internal scrolling.
- Welcome and authentication screens use `100dvh`-based minimum heights but allow vertical scrolling on auth pages.
- The shell uses `100dvh` and `overflow: hidden`; the dashboard main area uses vertical auto-scroll.

## Likely scrolling sources

- The dashboard shell itself is viewport-height constrained, but `SidebarInset` and the page/grid content can still create an internal scroll area.
- The placeholder rows use `min-height: 15rem`; combined with header, page padding, gaps, and card content, the grid can exceed short desktop viewports.
- `overflow-y: auto` on the dashboard main deliberately permits scrolling rather than guaranteeing a fit.
- The sidebar content itself is scrollable through shadcn's `overflow-auto`.
- Auth pages explicitly use `overflow-y-auto` to accommodate Clerk content.

## Observed design intent versus implementation

The source aims for a 1920×1080 desktop baseline and a separate large-desktop mode, but the current rules are still mostly width breakpoints. Height, browser zoom, OS display scaling, and content growth can change the result. A live browser screenshot comparison was not possible because browser control was unavailable in this session.

## Tablet status

Tablet behavior is only partially specified by the existing `md`/`lg` classes. There is no dedicated tablet composition in the source: the sidebar switches to a Sheet below `md`, while the main dashboard content remains mostly generic block flow until `lg`.

## Assumptions

- “Mobile” in the source means the `useIsMobile` breakpoint used by shadcn, not a measured product breakpoint documented elsewhere.
- No tablet-specific visual reference was available in the repository.
