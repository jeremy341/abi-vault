# Current UI inventory

Audit date: 2026-08-09

## Scope and evidence

This inventory is based on the current Next.js App Router source. `AGENTS.md` and `docs/` do not exist in the repository. A Penpot MCP server and browser-control tool were not exposed in this session, so Penpot contents and live browser rendering are not verified. Items marked **unverified** should be checked when those connections are available.

## Existing screens

| Screen | Route | Current state |
| --- | --- | --- |
| Welcome | `/` | Public welcome screen with logo, headline, description, and Clerk-aware Login/SignUp or Dashboard links. |
| Sign in | `/sign-in` | Clerk `SignIn` component with custom appearance styling. Catch-all route supports Clerk subroutes. |
| Sign up | `/sign-up` | Clerk `SignUp` component with custom appearance styling. Catch-all route supports Clerk subroutes. |
| Dashboard overview | `/dashboard` | Auth-protected dashboard shell with `Klassenkasse`, responsive card controls, and blank placeholders. |
| Transactions | `/dashboard/transactions` | Auth-protected placeholder heading area. No transaction data or actions. |
| Receipts | `/dashboard/receipts` | Auth-protected placeholder heading area. No upload or review UI. |
| Goals | `/dashboard/goals` | Auth-protected placeholder heading area. No goal data or actions. |
| Funds and accounts | `/dashboard/funds` | Auth-protected placeholder heading area. |
| Reports | `/dashboard/reports` | Auth-protected placeholder heading area. |
| People | `/dashboard/people` | Auth-protected placeholder heading area. |
| Settings | `/dashboard/settings` | Auth-protected placeholder heading area. |

## Shared visual system

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, and Lucide icons.
- Global tokens live in `app/globals.css`, including canvas, surface, ink, line, muted, shadcn semantic colors, radius, and sidebar colors.
- Light and dark token overrides are defined under `.dark`; the current theme toggle applies `.dark` to the document root and stores `abi-theme` in local storage.
- The visual direction is restrained black/white financial utility UI with rounded containers, thin borders, green status accents, and restrained motion.
- The dashboard shell is implemented with shadcn sidebar primitives and a rounded frame; the overview uses a responsive two-column CSS grid above the desktop breakpoint.

## Current state summary

The product has a recognizable shell and a developed Klassenkasse prototype, but most product screens are still structural placeholders. The current UI is therefore suitable for navigation and visual prototyping, not yet for real finance workflows.
