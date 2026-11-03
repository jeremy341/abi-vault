# Design

Abi Vault looks like a pixel notebook: handwriting-style pixel headings, dotted
rules, soft salmon accents and a pale haze behind a paper-white sheet. The
numbers still do the work, so figures are set in a plain, readable sans font.

The style follows [ripple](https://github.com/0xQuerencia/ripple), inspired by
[Jame Gam](https://jamegam.hackclub.com/). See [CREDITS.md](../../CREDITS.md).

All tokens live in `app/globals.css`.

## Colour

- Paper `#fbfbfb`, surface `#ffffff`, sunk `#f3f3f3`
- Ink `#2f2b29`, muted `#5a5552`
- Accent salmon `#db9591`, with `#a8524d` for text on white and `#f0cdca` for
  soft fills
- Lines `#d9d4d8` and `#c4bdc2`
- Sticker colours for navigation and tiles: tan, yellow, green, blue, purple, pink
- Buttons `#5b5755`
- Danger `#b3261e`, used for errors and destructive actions

Money is shown with a plus or minus sign, not only with colour.

## Type

- **Augie Pixel** for page titles, section headings, stat labels, table headers
  and buttons. Never for body text or numbers.
- **Host Grotesk** for everything else. Figures use weight 600 and tabular
  numerals so columns line up.
- No negative letter spacing.

## Shape and depth

- Controls have 3px corners and dialogs 6px. Cards and tiles may have slightly
  uneven corners to feel hand-drawn.
- Buttons are dark with a salmon offset shadow. Secondary buttons are dashed.
- Sections are separated by dotted salmon rules.
- Shadows only on dialogs, menus and popovers.

## Layout

- Sidebar 14rem, top bar 3.5rem, page content capped at 88rem.
- Pages are built to fit the screen without scrolling inside the page. Tables
  work out how many rows fit and paginate (`useFitPageSize`).
- On 2560px-wide screens the layout is drawn at 175% zoom so it matches what a
  1920px screen shows.
- Wide pages (Reports, People) use two columns from 1100px.

## Dialogs

Every dialog uses `components/dashboard/dialog.module.css`: a header with a
heading and close button, a body, and a footer with the actions. On phones they
become bottom sheets with the footer pinned to the bottom, and the primary
action first.

## Totals

A total sits under a double rule, and the figure lines up with its label.

## Motion

120 to 180ms, opacity and small movement only. Turned off when the user prefers
reduced motion.

## Phones

A bottom bar with four pages and a More sheet. Touch targets are at least 44px.
