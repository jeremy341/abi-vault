# Abi Manager dashboard plan

## Design direction

Use the Cloudcash reference for its spacious layout, visible goals, progress bars, and approachable transaction list. Use Finebank for the persistent sidebar, active navigation state, page hierarchy, and admin-oriented structure.

Abi Manager should feel like a calm shared class-finance workspace: light main content, near-black navigation, simple rounded surfaces, clear totals, and one restrained accent color.

## Dashboard shell

The authenticated area should use this structure:

```text
DashboardShell
├── Sidebar
│   ├── Abi Manager logo
│   ├── Overview
│   ├── Transactions
│   ├── Receipts
│   ├── Goals
│   ├── People / access
│   └── Settings
└── Main content
    ├── Header: page title, finance period, profile menu
    ├── Summary cards
    ├── Goal progress
    ├── Recent transactions
    └── Needs attention
```

## First dashboard version

Build only these elements first:

1. Persistent left sidebar with active Overview state
2. Header with “Overview” and the current class or finance period
3. Available balance
4. Money in this period
5. Money out this period
6. Receipts needing review
7. One active goal with amount, target date, and progress
8. Recent transactions table
9. Needs-attention list

Use realistic static example data before adding a database.

## Complete navigation plan

### Overview

The overview should answer the most important questions immediately:

- How much money do we have?
- How much came in and went out this period?
- What is physical cash on hand?
- Which receipts or approvals need attention?
- How are our goals progressing?

Recommended overview sections:

1. Header with class name, active finance period, notifications, and account menu
2. Balance summary: total available, bank balance, and physical cash
3. Money in and money out for the selected period
4. Active goals with progress, target date, and amount remaining
5. Recent transaction history
6. Outcome statistics by category
7. Needs-attention panel for missing receipts and pending approvals

### Transactions

The transaction page is the main ledger. Each transaction should show:

- Amount and whether it is income or expense
- Description or merchant
- Category
- Date
- Payment method: bank, cash, or other
- Person responsible
- Receipt status
- Approval status

Useful actions are `Add income`, `Add expense`, `Add cash movement`, and `Export`.

### Receipts

Receipts deserve their own page rather than being hidden inside transactions. It should include:

- Upload receipt
- Receipt preview or filename
- Linked transaction
- Uploaded by
- Upload date
- Review status: missing, pending, approved, or rejected
- Reviewer and review date

This is especially important for supervisor and admin workflows.

### Goals

Goals can represent fundraising or planned spending. Each goal should include:

- Name
- Target amount
- Current amount
- Target date
- Owner or responsible group
- Progress bar
- Status: active, completed, paused, or overdue

Examples are Abi trip, graduation event, decorations, or emergency reserve.

### Funds and accounts

Use this instead of copying a personal banking “Cards” page. It can contain:

- Bank account balance
- Physical cash on hand
- Separate cash boxes or envelopes
- Restricted funds
- Last counted date
- Person responsible for a cash count

The dashboard can show the summary, while this page handles reconciliation and detailed balances.

### Reports

Reports should come after the core workflow works. It can contain:

- Income and expense totals by period
- Spending by category
- Goal progress over time
- Missing receipt count
- CSV or PDF export

### People and access

This page is for admins and supervisors:

- List of users
- Role: admin, supervisor, or student
- Active or invited status
- Permission summary
- Invite or deactivate a user

### Settings

- Class or committee name
- Active finance period
- Categories
- Currency
- Receipt requirements
- Notification preferences

## Top-right account area

Keep the top-right area simple:

- Current finance period selector
- Notification indicator for pending reviews
- Clerk `UserButton` for profile and sign out

Do not put important finance data in the profile menu. The balance and class context belong in the main interface.

## Role-based visibility

- Admin: sees every page and all management actions
- Supervisor: sees transactions, receipts, goals, reports, and review actions
- Student: sees overview, transactions, receipts, goals, and read-only reports

The UI should hide actions a user cannot perform, but the server must also enforce permissions.

## MVP versus later

### MVP

- Overview
- Transactions
- Receipts
- Goals
- Funds and accounts summary
- Clerk login and the three roles
- Basic approval status

### Later

- Reports and exports
- Reconciliation tools
- Notifications
- Audit log
- Charts over time
- Multiple classes or finance periods

## Navigation and routes

```text
/dashboard                 Overview
/dashboard/transactions    Income and expenses
/dashboard/receipts        Uploaded receipts and review status
/dashboard/goals           Fundraising and spending goals
/dashboard/people          Users and permissions
/dashboard/settings        Class and account settings
```

## Role-aware features

### Admin

- Manage users and roles
- Add, edit, and delete financial entries
- Upload and approve receipts
- Create and manage goals
- Configure the finance period

### Supervisor

- Review and approve receipts
- Review transactions and reports
- Add transactions if permitted
- Monitor goal progress

### Student

- View balance and transactions
- View receipts and spending categories
- View goals and progress
- Submit a receipt or expense for review if enabled

## Sidebar implementation idea

Create a reusable `DashboardShell` component. Store navigation items in an array containing a label, route, and icon. Render the array with `map()`. Use `usePathname()` to compare each item’s route with the current URL and add the active styles to the matching link.

Keep the sidebar as layout/navigation only. Page-specific content belongs in each route under `app/dashboard/`.

## Features for later

- Search and filter transactions
- Receipt file uploads
- Approval history and audit log
- CSV export
- Charts by category and time period
- Notifications for missing receipts
- Organization or class-year support
- Role-based permissions backed by Clerk Organizations

## What to avoid

- Credit-card visuals from personal banking apps
- Too many charts on the overview page
- Rainbow-colored cards
- Tiny labels and finance jargon
- Adding a database before the static workflow is clear
