# Abi Manager Dashboard — Technical and Product Specification

**Version:** 5.0.0  
**Status:** Proposed MVP architecture  
**Audience:** Students, supervisors, administrators, developers, and operators

## 1. Product vision

Abi Manager is a transparent, privacy-conscious finance platform for school graduation committees. It replaces scattered spreadsheets, chat messages, and physical cash-box records with one reliable source of truth.

The product has two equally important goals:

1. Help the people responsible for the Abi finances record money correctly and efficiently.
2. Let affected students understand how committee money is collected and spent without exposing private receipts or personal information.

The system is a committee-finance tool. It is not a bank, a public payment processor, or a full replacement for professional accounting software.

### 1.1 MVP outcomes

The MVP must allow a committee to:

- Track bank and cash wallets
- Record income, expenses, and internal transfers
- Upload and privately store receipts
- Assign financial responsibilities using three clear roles
- Show students a safe, read-only transparency view
- Maintain an append-only audit history
- Lock completed accounting periods
- Create fundraising goals with target amounts and deadlines
- Attribute income to goals and show progress
- Import external TCG sales idempotently
- Work in poor-connectivity conditions without falsely reporting unsaved financial changes
- Export committee data and support a documented GDPR process

### 1.2 Explicit non-goals for the MVP

- PSD2, Open Banking, or direct bank-account synchronization
- Cryptocurrency payments
- Automatic tax filing
- DATEV export
- Public marketplace functionality
- Parent or customer accounts
- OCR-based receipt extraction
- Anonymous public internet access to committee finances

## 2. Users, roles, and access model

The product has exactly three application roles. Authentication answers “who is this person?” Authorization answers “what may this person do?”

### 2.1 Role definitions

| Role | Typical people | Primary purpose |
|---|---|---|
| `admin` | Abi finance lead, elected committee owner, designated teacher | Configure the committee, manage access, correct mistakes through controlled workflows, and oversee all financial data |
| `supervisor` | Treasurer, finance team, receipt/upload team, trusted committee members | Record transactions, upload receipts, manage assigned goals, and review operational finances |
| `student` | Ordinary students affected by the Abi budget | Read the transparency view, goals, totals, and approved spending information |

The role names must be used consistently in the database, application code, API documentation, and UI. Do not use the generic word “user” when a specific role is intended.

### 2.2 Permission matrix

| Capability | Admin | Supervisor | Student |
|---|---:|---:|---:|
| View transparency dashboard | Yes | Yes | Yes |
| View operational transaction list | Yes | Yes | No |
| View raw receipt files | Yes | Yes, where authorized | No by default |
| Create income/expense/transfer | Yes | Yes | No |
| Upload or replace receipts | Yes | Yes | No |
| Edit an open-period transaction | Yes | Yes | No |
| Soft-delete an open-period transaction | Yes | Yes, with audit record | No |
| Lock an accounting period | Yes | Optional, if delegated | No |
| Unlock a period | Yes, with reason and audit trail | No | No |
| Create and manage fundraising goals | Yes | Yes | No |
| Assign a transaction to a goal | Yes | Yes | No |
| Manage wallets and categories | Yes | Optional, if delegated | No |
| Manage roles and committee membership | Yes | No | No |
| View audit history | Yes | Read-only, operationally relevant entries | No |
| Export committee data | Yes | Optional, if delegated | No |

Permissions should be represented as server-side policy checks, not only as hidden UI buttons. A hidden button is not authorization.

### 2.3 Student transparency rules

Students should be able to understand where money goes while sensitive data stays private. The student view may show:

- Total income, expenses, and current balance
- Wallet totals when the committee chooses to publish them
- Spending by category
- Approved transaction date, title, category, amount, and wallet direction
- Fundraising goal progress and deadlines
- Whether a reporting period is open or locked

The student view must not show by default:

- Raw receipt images or PDFs
- Uploader identity
- Clerk IDs, email addresses, or private notes
- Bank account numbers, payment references, addresses, signatures, or personal data
- Webhook payloads or audit-log details
- Unapproved, rejected, or internal administrative records

The transparency view should use a dedicated read model or server-side projection so that sensitive operational columns are not accidentally returned to students.

## 3. Authentication decision

### 3.1 Recommendation: Clerk for the MVP

Use Clerk as the identity provider and Supabase as the application database. Clerk is the better MVP choice because this project needs secure sign-in, password recovery, sessions, optional MFA, user lifecycle webhooks, and a low-maintenance path for a mixed student/supervisor population.

The application should use Clerk for identity only. Application roles, committee membership, permissions, and financial authorization remain controlled by the application database.

Clerk’s official Next.js patterns cover server-side `auth()`, client-side hooks, protected routes, API status codes, Server Action protection, and user-scoped caching. Follow the SDK-version-specific guidance when implementation begins: [Clerk Next.js patterns](https://www.skills.sh/clerk/skills/clerk-nextjs-patterns).

### 3.2 Clerk integration rules

- Verify Clerk sessions server-side for every protected read and write.
- Use `auth()` on the server and `useAuth()` only in client components where needed.
- Use Clerk middleware for route protection, but never treat middleware as the only authorization layer.
- Use a verified Svix webhook for `user.created`, `user.updated`, and `user.deleted`.
- Store the stable Clerk user ID as `TEXT` in `profiles`.
- Keep application role data in Supabase; do not rely solely on client-editable metadata.
- Use Supabase JWT claims/RLS only after the Clerk-to-Supabase trust configuration is tested locally and in a staging project.
- Keep the Supabase service-role key server-only.
- Return `401` for unauthenticated requests and `403` for authenticated users without permission.

### 3.3 Why not build custom login first?

A custom login system would make the project responsible for password hashing, reset tokens, email verification, session rotation, CSRF protection, brute-force protection, MFA, account recovery, suspicious-login handling, and security maintenance. None of those features directly improve the committee-finance product.

Custom authentication becomes reasonable later only if a documented requirement demands it, such as a mandatory school identity provider, strict self-hosting, vendor restrictions, or a verified data-residency/compliance constraint. If that happens, evaluate Auth.js or a managed school identity provider before writing authentication from scratch.

Before production, review Clerk’s current pricing, Data Processing Agreement, subprocessors, regional behavior, and school privacy requirements. The specification must not claim GDPR compliance merely because Clerk or Supabase is used.

## 4. Technology decisions

| Area | Decision |
|---|---|
| Web framework | Next.js, App Router |
| Language | TypeScript, strict mode |
| UI | TailwindCSS and Shadcn/UI with a neo-brutalist theme |
| Database | Supabase PostgreSQL |
| File storage | Supabase Storage |
| Authentication | Clerk, verified server-side |
| Server state | TanStack Query |
| Client UI state | Zustand only where server state is insufficient |
| Forms and validation | React Hook Form and Zod |
| Offline support | Workbox / `next-pwa`, subject to compatibility testing |
| Monitoring | Sentry, with personal data scrubbing |
| Package manager | pnpm |
| Local infrastructure | Docker Desktop and Supabase CLI |

Use React Server Components by default. Add `"use client"` only for browser interaction, local state, or APIs that require it.

### 4.1 Local setup

Requirements: the Node.js version pinned by the repository, pnpm, Docker Desktop, and the Supabase CLI.

```bash
pnpm install
supabase start
pnpm dev
```

Pin exact runtime and dependency versions. Do not add a package when the existing stack already provides the required functionality.

### 4.2 Environment variables

Never commit `.env.local` or secret values.

```env
# Public browser values
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Server-only values
SUPABASE_SERVICE_ROLE_KEY=ey...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
WEBHOOK_API_KEY=<server-only-webhook-token>
```

## 5. Repository and coding conventions

### 5.1 Feature structure

New product features should be isolated:

```text
features/
├── transactions/
├── receipts/
├── goals/
├── transparency/
└── users/
```

Each feature may contain:

```text
feature-name/
├── actions/
├── components/
├── hooks/
├── schemas/
├── types/
└── queries/
```

Shared UI belongs in `components/ui`. Database changes belong in versioned Supabase migrations.

### 5.2 Required practices

- Use strict TypeScript; do not use `any`.
- Validate every external input with Zod.
- Keep financial calculations in integer cents or database `DECIMAL`; never use JavaScript floating-point arithmetic for money.
- Use server-side pagination for transaction lists.
- Keep service-role access in server-only modules.
- Add tests for financial rules, authorization, goal calculations, webhook idempotency, and locked periods.
- Search existing code before adding files or dependencies.

### 5.3 Git workflow

- `main`: production
- `develop`: integration
- `feature/*`: new features
- `fix/*`: bug fixes

Use Conventional Commits, for example `feat: add fundraising goals` or `fix: reject locked-period edits`.

## 6. Financial domain model

All amounts are positive USD values stored as `DECIMAL(10,2)`. Currency is currently USD only and must be enforced by a database constraint.

### 6.1 Transaction routing

| Transaction type | Required wallet | Forbidden wallet |
|---|---|---|
| `income` | `to_wallet_id` | `from_wallet_id` |
| `expense` | `from_wallet_id` | `to_wallet_id` |
| `transfer` | Both wallet IDs | Neither |

Transfers must not use the same wallet for both sides. Balances are derived from posted transactions; clients must not write balance totals directly.

Every transaction belongs to an accounting period. A transaction may be created or edited only while its period is `open`. This restriction applies to every role, including administrators.

Corrections to locked periods use a new compensating transaction or a separately audited unlock procedure. A normal update must never silently mutate a locked financial record.

Transactions use soft deletion by default. Physical deletion is not part of normal user functionality because financial history must remain auditable.

### 6.2 Transaction lifecycle

The MVP should use the following states:

```text
draft → posted → soft_deleted
```

Only `posted` transactions affect balances or goal progress. If the product later needs approvals, extend this to:

```text
draft → pending → approved/rejected → posted → locked
```

Do not add an approval workflow until the committee’s real operating process is understood.

## 7. Fundraising goals

### 7.1 Purpose

A goal lets an authorized person define an amount the committee wants to raise by a particular date. Examples:

- “Raise $2,000 for the graduation venue by 2027-04-01”
- “Collect $800 for decorations by 2027-05-15”

Goals are visible to students when marked public, allowing them to see the target, deadline, and progress without exposing private financial records.

### 7.2 Goal fields

Each goal should include:

```text
id
title
description
target_amount
currency
deadline
status
visibility
created_by
created_at
updated_at
completed_at
archived_at
```

Allowed values:

- `status`: `active`, `completed`, `cancelled`, `archived`
- `visibility`: `private`, `students`

Only `admin` and `supervisor` roles may create or manage goals. Students may read goals with `visibility = 'students'`.

### 7.3 Goal contributions

Do not store a manually editable `current_amount`. Progress must be derived from auditable income allocations.

Use a `goal_contributions` table with:

```text
id
goal_id
transaction_id
allocated_amount
created_by
created_at
```

Rules:

- A contribution must reference an income transaction.
- The transaction must be `posted` and not soft-deleted.
- `allocated_amount` must be greater than zero.
- The sum of allocations for a transaction cannot exceed its amount.
- A contribution cannot be added to a cancelled or archived goal.
- Goal progress is `SUM(allocated_amount)`.
- Progress must not exceed the target in the public display; retain the actual overfunded amount internally.
- Changes to contributions create audit entries.

This model permits one income transaction to be split across multiple goals without losing accounting integrity.

### 7.4 Goal display

The public goal card should show:

- Goal title
- Short description
- Target amount
- Public progress amount or percentage
- Deadline and days remaining
- Status such as “active”, “completed”, or “deadline passed”

The API must not expose private descriptions, contributor identities, receipt files, or transaction-level details through the student goal endpoint.

## 8. Data model

The primary tables are:

- `profiles`: Clerk ID, name, email, role, and account state
- `committee_memberships`: optional future table for multi-committee support
- `wallets`: bank or cash accounts
- `categories`: transaction categories and display order
- `accounting_periods`: unique year/month records with `open` or `locked` state
- `transactions`: financial records and optional external IDs
- `fundraising_goals`: target and deadline definitions
- `goal_contributions`: auditable allocations from income to goals
- `audit_logs`: append-only history of sensitive changes
- `webhook_logs`: received payload metadata, status, attempts, and errors

Clerk user IDs are stored as `TEXT`, not UUID. Database-generated entity IDs use UUIDs.

### 8.1 Required database constraints

The database must enforce:

- Positive amounts
- `currency = 'USD'`
- Valid transaction types and wallet routing
- Different wallets for transfers
- Valid role values: `admin`, `supervisor`, `student`
- Valid accounting-period months from 1 through 12
- Unique year/month accounting periods
- Unique non-null external transaction IDs
- Positive goal targets
- Goal deadlines that include a valid date
- Valid goal statuses and visibility values
- Goal contribution amounts greater than zero
- Foreign-key relationships with appropriate delete behavior

Recommended transaction fields:

```text
id, created_at, updated_at, deleted_at,
amount, currency, title, description, type,
category_id, from_wallet_id, to_wallet_id, period_id,
receipt_url, external_id, created_by, deleted_by
```

### 8.2 Indexes

At minimum, index:

- Transaction creation time
- Accounting period
- Wallet references
- External ID
- Goal deadline and status
- Goal contribution goal and transaction references

Add indexes based on measured query patterns rather than indexing every column.

## 9. Audit logging

Inserts, updates, soft deletes, role changes, period locks/unlocks, goal changes, and contribution changes must create audit entries containing:

- Table and record identifiers
- Action type
- Previous and new values where applicable
- Acting Clerk user ID
- Server timestamp
- Optional reason for sensitive actions

Audit logs must be append-only. Application roles must not update or delete them. The audit trigger should be installed on every sensitive table, not only `transactions`.

If multiple table ID types are audited, use a consistent text representation for `record_id` or separate typed audit tables. Do not make a generic audit table claim `UUID` if it will later audit records with non-UUID IDs.

## 10. Authentication and authorization implementation

Clerk is the identity provider. Supabase is the application data store. The verified Clerk user ID is the key used to find the corresponding `profiles` row.

### 10.1 Role assignment

- New accounts default to `student` or remain pending until an admin assigns a role.
- Only an admin may promote a student to supervisor or admin.
- The last active admin cannot remove their own admin access without another active admin.
- Role changes require an audit entry.
- A deleted or suspended Clerk account cannot access committee data.

### 10.2 Supabase RLS rules

All application tables must have Row Level Security enabled. Policies must be defined for every table and operation; enabling RLS without policies is not sufficient documentation.

At a high level:

- Students can select only the transparency projection and public goals.
- Supervisors can read operational finances and write open-period transactions and receipts.
- Admins can manage configuration and users, but locked-period protections still apply.
- No role can update or delete audit logs.
- No role can write arbitrary webhook logs from the browser.
- Storage policies must enforce receipt paths and committee membership.

Authorization checks must be enforced in the UI, server actions/API routes, and database boundary. The UI is not a security boundary.

## 11. Receipt storage and workflow

Receipts are stored in the private `receipts` bucket at:

```text
receipts/{clerk_user_id}/{transaction_id}/{receipt_id}.{extension}
```

Rules:

- Maximum size: 5 MB per file
- Allowed types: JPEG, PNG, and PDF
- Validate MIME type, extension, and file size server-side
- Enforce the owner/committee path in the Storage policy
- Do not expose the bucket publicly; use short-lived signed URLs
- Compress and optionally grayscale images client-side before upload
- Never make receipt URLs part of the student transparency response
- Keep receipt metadata separate from public transaction metadata

Receipt workflow:

1. Supervisor creates or selects an open-period transaction.
2. The client validates the file for user feedback.
3. The server revalidates authorization and file properties.
4. The file is uploaded to private storage.
5. A receipt metadata record is linked to the transaction.
6. The action is written to the audit log.
7. Replacing or removing a receipt preserves an audit record.

## 12. Transparency architecture

Do not expose the full `transactions` table to students and rely on frontend filtering. Build a dedicated server-side transparency query or database view.

The transparency projection may include:

```text
transaction_id
public_date
public_title
category_name
public_type
amount
wallet_label
```

It must exclude private descriptions, uploader identity, receipt paths, webhook identifiers, internal notes, and audit metadata.

The dashboard should present:

- Current balance and wallet totals, if enabled by the committee
- Income and spending totals for the selected period
- Category breakdowns
- A paginated list of approved public transactions
- Active and completed public goals
- A clear explanation of what the numbers include and the date of last update

Public totals must be calculated from posted, non-deleted transactions only. The UI should distinguish “current data” from data delayed by offline synchronization.

## 13. Offline behavior

Offline mode may cache permitted data for display and queue writes locally. Each queued write must include a client-generated idempotency key.

Synchronization must:

- Revalidate authentication and authorization
- Recheck that the accounting period is still open
- Recheck goal and contribution constraints
- Reject or surface conflicts instead of silently overwriting records
- Retry transient failures with bounded backoff
- Show whether a write is queued, synchronized, rejected, or conflicted
- Avoid caching private receipts or operational data for students

Financial writes must never be treated as successfully committed until the server confirms them.

## 14. API and webhooks

API responses use a consistent shape:

```json
{
  "success": true,
  "data": { "id": "..." },
  "timestamp": "2026-07-13T20:00:00Z"
}
```

Errors use stable machine-readable codes:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Amount is required"
  },
  "timestamp": "2026-07-13T20:00:00Z"
}
```

Return `401` for missing/invalid authentication and `403` for an authenticated user without permission.

### 14.1 Clerk user-sync webhook

`POST /api/webhooks/clerk`

- Verify the Svix signature using `CLERK_WEBHOOK_SECRET`.
- Handle `user.created`, `user.updated`, and `user.deleted`.
- Upsert or anonymize the matching `profiles` row.
- Make processing idempotent.
- Record success and failure metadata in `webhook_logs`.
- Do not allow a webhook payload to set an arbitrary admin role.

### 14.2 TCG sync webhook

`POST /api/v1/tcg-sync`

- Require `Authorization: Bearer <WEBHOOK_API_KEY>`.
- Validate the payload with Zod.
- Require a stable external event or transaction ID.
- Insert the transaction exactly once using external-ID uniqueness and idempotency handling.
- Route imported sales to the configured bank wallet.
- Attribute income to a goal only through validated goal-contribution logic.
- Log retries and failures without storing unnecessary sensitive payload data.
- Apply rate limiting and replay protection.

## 15. Security, privacy, and GDPR

Required production HTTP headers include CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS.

Collect only the identity data required for committee operation. Provide an authenticated export workflow and document retention periods. When a Clerk user is deleted, preserve financial records while anonymizing personal references where legally appropriate.

Because immutable auditability and deletion rights can conflict, the retention and anonymization policy must be reviewed before production deployment. Complete a data-flow and threat-model review before inviting real students.

Privacy requirements:

- Students must not see private receipts by default.
- Logs must scrub tokens, secrets, full webhook payloads, and unnecessary personal data.
- Sentry must be configured to avoid capturing receipt contents or authentication tokens.
- Exports must be authorized, logged, and delivered securely.
- Test and demo data must not contain real student information.

Operational targets:

- RPO: 24 hours
- RTO: 4 hours
- Daily backups with periodic restore tests

## 16. UI and design system

The visual direction is “neo-brutalist monochrome”:

- Black, white, and zinc as the base palette
- `Inter` for UI text
- `Geist Mono` for financial digits
- Square corners by default
- 1 px black borders
- No decorative drop shadows
- No red/green-only meaning; pair status with text, icons, or patterns

The interface must provide separate navigation areas for:

- Transparency dashboard
- Operational finance dashboard
- Transactions
- Receipts
- Fundraising goals
- Accounting periods
- Members and roles, admin only
- Audit history, admin and authorized supervisors

Students should land on the transparency dashboard. Supervisors should land on outstanding operational tasks, such as missing receipts or unsynchronized entries.

## 17. Non-functional requirements

- Lighthouse performance score above 90 where practical
- Lighthouse accessibility score above 95 where practical
- Initial load below 2 seconds on standard 4G where practical
- Dashboard queries below 500 ms at normal data volume
- Smooth server-paginated operation with 10,000+ transactions
- Mobile support from 320 px width
- Interactive targets at least 44 px
- Keyboard navigation, visible focus states, and appropriate ARIA semantics
- Time and date display localized for the committee’s configured locale and timezone

## 18. Testing strategy

### 18.1 Unit tests

Test:

- Transaction routing rules
- Exact currency arithmetic
- Goal progress and overfunding behavior
- Role and permission helpers
- Public/private field projection
- Deadline and status calculations

### 18.2 Integration tests

Test against a local Supabase instance:

- RLS policies for all three roles
- Locked-period write rejection
- Soft deletion and audit entries
- Receipt path restrictions
- Goal-contribution constraints
- Clerk webhook idempotency
- TCG webhook idempotency

### 18.3 End-to-end tests

Cover at least:

1. Admin creates a committee and assigns a supervisor.
2. Supervisor records income, uploads a receipt, and assigns part of it to a goal.
3. Student sees the public transaction and goal progress but cannot access the receipt.
4. Admin locks a period and all edits are rejected.
5. A duplicate webhook does not create a duplicate transaction.

## 19. Definition of Done

A feature is complete only when applicable items are satisfied:

- TypeScript passes with zero errors
- Zod validation covers external and form input
- Authorization is tested at the server/database boundary
- Financial calculations preserve exact decimal values
- Locked-period behavior is tested for every role
- Student responses contain no private operational fields
- Mobile layout works from 320 px
- Keyboard and accessibility checks pass
- Database migrations are included
- Webhook operations are idempotent and logged
- Relevant unit, integration, and end-to-end tests pass
- Documentation and environment-variable requirements are updated

## 20. Delivery phases

### Phase 0 — Foundations

- Pin runtime and dependencies
- Configure Next.js, Supabase, and Clerk in local development
- Create migrations and seed data
- Establish role and RLS test fixtures

### Phase 1 — Financial operations

- Profiles and role assignment
- Wallets and categories
- Transactions and receipts
- Accounting periods and locks
- Audit history

### Phase 2 — Transparency

- Student dashboard
- Public transaction projection
- Category and period summaries
- Privacy review of every student-facing response

### Phase 3 — Goals and integrations

- Fundraising goals
- Goal contributions
- TCG webhook ingestion
- Offline queue and synchronization states

### Phase 4 — Hardening

- Accessibility and mobile testing
- Security review and threat model
- Backup restore test
- Monitoring and incident runbook
- Pilot with test data before real student data

## 21. Future roadmap

Potential post-MVP features:

1. Approval workflow: `pending → approved → rejected → locked`
2. DATEV-compatible export
3. OCR-assisted receipt data extraction
4. More granular committee permissions
5. Advanced reconciliation and reporting
6. Multiple committee workspaces
7. Optional school SSO integration

Roadmap items are not part of the MVP acceptance criteria.
