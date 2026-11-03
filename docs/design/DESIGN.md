# Design

Abi Vault should look like a plain accounting ledger: black text on white, thin rules, and the numbers doing the work.

## Colours

Ink on paper. Red is only used for errors and destructive actions. Money is shown with a plus or minus sign, not with colour.

Light: paper #fcfcfc, surface #ffffff, sunk #f3f3f3, ink #141414, muted #5a5a5a, subtle #6e6e6e, rule #e2e2e2, control #8c8c8c, danger #b3261e.

Dark: paper #121212, surface #181818, sunk #1c1c1c, ink #ededed, muted #a8a8a8, subtle #8f8f8f, rule #2a2a2a, control #6f6f6f, danger #ff8a80.

## Type

Host Grotesk everywhere. Amounts use tabular figures so columns line up. No negative letter spacing and no uppercase labels.

## Shape and depth

Two radii only: 3px for controls, 6px for dialogs and menus. Everything else is square. No shadows except on menus, popovers and dialogs. No gradients, pills or blur.

## Layout

Sidebar 14rem, top bar 3.5rem. Page content is capped at 88rem and centred. From 1500px wide, pages with a main list and supporting sections use two columns.

On wide screens the base font size grows from 16px at 1500px to 20px at 2560px, so every rem-based size scales with it.

## Totals

A total sits under a double rule, and the figure lines up with its label.

## Motion

120 to 180ms, opacity and small movement only. Turned off when the user prefers reduced motion.

## Phones

A bottom bar with four pages and a More sheet. Touch targets are at least 44px.
