# Finebank dashboard inspiration

Source: [Finebank Financial Management Dashboard UI Kits Community](https://www.figma.com/design/bkcTyHdrvvAcOwucBnot19/Finebank---Financial-Management-Dashboard-UI-Kits--Community-?node-id=443-2616&t=M2dcGfmBZdxFi3Iz-1)

## What this reference is

The shared link opens the Finebank cover page. It presents a large financial-management UI kit with multiple screens and a large component library. The visible examples show a dark navy application shell, a compact left sidebar, teal active navigation, white content surfaces, financial summary cards, charts, and dense transaction tables.

## Main design language

- Dark navy sidebar and outer application frame
- Teal used for the selected navigation item and key accents
- White or very light gray content surfaces
- Compact, information-dense layout
- Strong separation between navigation and workspace
- Small status labels, charts, tables, and summary cards
- Rounded cards with restrained shadows
- Repeated financial patterns: balance, accounts, expenses, goals, transactions, and statistics

## What works for Abi Manager

The strongest idea to borrow is the information architecture:

1. A clear persistent navigation area
2. A dashboard overview with the most important numbers first
3. A transaction table below the summary
4. Separate areas for goals, receipts, expenses, and settings
5. A clear active navigation state

This fits Abi Manager because users need to answer three questions quickly:

- How much money is available?
- What recently came in or went out?
- What still needs attention?

## What we should change

Finebank is designed like a commercial banking product. Abi Manager is a shared class-finance workspace, so we should simplify it:

- Replace bank accounts and credit cards with committee funds and periods
- Replace personal spending categories with class expenses and income sources
- Replace card-management screens with receipts and approval status
- Replace generic statistics with transparent totals and an audit-friendly ledger
- Add role-aware actions for admin, supervisor, and student users
- Show the current finance period and committee name prominently
- Use language students understand: “Money in”, “Money out”, “Receipts missing”, and “Goal progress”

## Recommended Abi Manager adaptation

### Navigation

Use a small sidebar with:

- Overview
- Transactions
- Receipts
- Goals
- People / access
- Settings

The sidebar should be dark or near-black, but the main workspace should stay white. Keep one accent color for the active item instead of copying Finebank’s full teal banking palette.

### Overview screen

Top row:

- Available balance
- Income this period
- Spent this period
- Receipts needing review

Middle row:

- Balance or income/expense chart
- Active fundraising goal

Bottom row:

- Recent transactions
- Needs attention list

### Visual direction

Keep the structure and clarity of Finebank, but reduce the density. Abi Manager should feel like a calm committee tool, not a professional bank terminal.

## Avoid copying

- Credit-card visuals
- Banking-specific account terminology
- Too many charts on the first screen
- Tiny labels that require financial expertise
- Heavy dark styling across the entire application

## Decision

Use Finebank primarily for navigation, dashboard hierarchy, table structure, and information density. Use Abi Manager’s own black, white, and gray design tokens, with one carefully chosen accent color for status and actions.
