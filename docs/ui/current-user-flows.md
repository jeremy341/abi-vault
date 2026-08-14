# Current user flows

## Public entry flow

1. User opens `/`.
2. Clerk `Show` selects the signed-out or signed-in action set.
3. Signed-out user can choose Login (`/sign-in`) or SignUp (`/sign-up`).
4. Signed-in user can choose Dashboard (`/dashboard`).

## Authentication flow

1. User opens `/sign-in` or `/sign-up`.
2. The Clerk component handles form fields, provider choices, verification, and authentication state.
3. Successful authentication is expected to return the user to the application; exact Clerk redirect behavior is configuration-dependent and was not verified in a live browser.
4. `/dashboard` checks Clerk server auth and redirects unauthenticated requests to `/sign-in`.

## Dashboard navigation flow

1. An authenticated user enters the dashboard shell.
2. The user selects a sidebar link or, on mobile, opens the sidebar through the header trigger.
3. The App Router renders the selected route inside the shared dashboard layout.
4. The header title and description change from the current pathname.

## Klassenkasse prototype flow

1. The initial in-memory card list contains a default bank card and an add-card entry.
2. Arrow buttons change `cardIndex` and loop through the list.
3. Selecting the add-card entry opens `AddCardModal`.
4. The modal previews dynamic account name, card number, holder, expiry, and selected color.
5. Valid submission inserts a new card before the add-card entry.
6. Selecting a bank card opens `EditCardModal`.
7. The edit modal can save changes or delete the selected card.
8. State is not persisted, so cards return to the initial list after refresh.

## Current incomplete flows

- Sidebar destination pages stop at static headings.
- No transaction creation, receipt upload, approval, goal creation, reporting, people-management, or settings flows exist in the inspected source.
- No loading, error, empty-data, or success feedback flows were found for those future screens.

## Assumptions

- The intended user model is Clerk-authenticated class finance users, but no role-aware flow is implemented in the inspected frontend.
- The exact post-auth redirect and Clerk provider configuration are not inferred beyond the visible route code.
