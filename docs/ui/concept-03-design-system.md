# Abi Manager UI - Concept 03 Design System

> Visual contract for the original product UI. This document changes visual language only. Routes, layout topology, backend behavior, permissions, and stored finance data remain unchanged.

## Design read

Abi Manager is a trust-first class-finance workspace for frequent operational use. The interface should feel calm, precise, and authored for shared student finances: forest-ink navigation, a single lime action accent, quiet neutral surfaces, and functional semantic colors.

The direction is a preserve-redesign: keep the existing shell, content order, routes, and interactions while replacing token drift and generic dashboard styling with a consistent concept-03 system.

## Foundations

- Body type: Manrope from `next/font`; Geist Mono remains available for code-like or tabular content.
- Canvas: `#f8f9f5`.
- Surface: `#ffffff`.
- Main ink: `#242824` for text, icons, rules, and intentional forest-dark surfaces only.
- Sidebar/shell dark: `#242923`.
- Primary action: `#d4ef89` with `#26311f` text.
- No black primary controls. `--ui-ink` is not a primary-action fill.
- No decorative gradients, glass blur, card tilt, or glossy sweeps on ordinary product surfaces.

## Semantic roles

| Role | Light value | Use |
|---|---|---|
| Primary action | `#d4ef89` | Main create/save/open action |
| Primary action ink | `#26311f` | Text/icons on primary action |
| Main ink | `#242824` | Text, icons, dark shell marks |
| Muted ink | `#68745e` | Secondary labels and metadata |
| Income | `#c6e997` / `#47825c` | Income bars, positive state |
| Expense | `#4b5b3e` | Expense bars and spending data |
| Review | `#a18d5f` | Attention and pending review |
| Negative | `#b45849` | Negative amounts and destructive state |
| Goal | `#9883b3` | Existing savings-goal identity only |
| Surface muted | `#eef2e7` | Quiet tracks, selected neutral surfaces |
| Control muted | `#f2f5ea` | Hover and secondary control fill |

## Shape scale

| Token | Value | Use |
|---|---:|---|
| `--ui-shell-radius` | `10px` | App frame and shell corners |
| `--ui-card-radius` | `10px` | Cards, panels, primary dialogs |
| `--ui-control-radius` | `7px` | Buttons, fields, dropdowns |
| `--ui-icon-radius` | `6px` | Square icon buttons |
| `--ui-chip-radius` | `4px` | Status/category chips |
| `--ui-pill-radius` | `999px` | Avatars, status dots, progress tracks only |

Mixed radii are allowed only when this semantic rule explains them. Product cards and controls must not use 20px, 1.25rem, or generic `rounded-xl`/`rounded-2xl` defaults.

## Responsive contract

- `1920x1080`: full desktop shell, two-column dashboard, complete visual hierarchy.
- `1280x800`: compact desktop shell with the same action and data roles.
- `1024x1366` and `768x1024`: dark compact tablet rail, touch-safe controls, ordered dashboard flow.
- `375x812`: phone top bar, three quick actions, ordered content, bottom navigation.
- All breakpoints use the same copy, action color, semantic data colors, and shape scale.
- No page-level horizontal overflow.

## Copy contract

- English is the canonical live-demo language.
- Use plain functional labels: `Quick actions`, `Latest transactions`, `Savings goals`, `Needs attention`, `Cash registers`.
- Do not mix German fragments into English strings.
- Do not invent product claims, totals, or new workflows.
- Empty states always explain what is empty and link to the existing relevant route.

## Motion contract

- Primary lens: Emil Kowalski restraint for frequent finance operations.
- Secondary lens: Jakub Krehel production polish for dialogs and state transitions.
- Optional Jhey-style experimentation is limited to an existing empty/loading state and must not add a product feature.
- Use short, interruptible transform/opacity transitions, generally 140-180ms.
- No card tilt, light sweeps, pulsing status dots, hover-scale on repeated cards, or infinite motion except loading feedback.
- Every animation has a `prefers-reduced-motion` static fallback.

## Review gates

- All primary actions render lime with dark ink.
- No dashboard data bar uses `--ui-ink`.
- Radius scan finds only documented exceptions.
- Desktop/tablet/mobile copy is identical in meaning and language.
- Existing features and routes remain available.
- `pnpm test:unit`, `pnpm build`, `pnpm lint`, keyboard review, reduced-motion review, and browser checks pass or have explicitly recorded pre-existing exceptions.
