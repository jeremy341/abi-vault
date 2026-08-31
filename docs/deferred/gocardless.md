# GoCardless / Open Banking: deferred

GoCardless and direct bank-account synchronization are retained as dormant
integration code, but they are outside the current Abi Manager product scope.

Agents should not audit, extend, enable, or refactor this area unless the user
explicitly reopens the banking project:

- `features/banking/`
- `lib/banking/`
- `app/api/banking/`
- provider-import migrations and bank connection schema

The current product is manual cash/account finance plus receipts. Keep the
deferred code intact so the later integration boundary remains available.
