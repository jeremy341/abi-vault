insert into public.committees (organization_id, name)
values ('org_local_demo', 'Class of 2026')
on conflict (organization_id) do nothing;

insert into public.committee_settings (organization_id, school_name, graduation_year, notifications)
values ('org_local_demo', 'Example School Berlin', 2026, '{"receipts": true, "payments": true, "goals": false}'::jsonb)
on conflict (organization_id) do nothing;

insert into public.profiles (clerk_user_id, display_name, email)
values
  ('user_local_admin', 'Local Admin', 'admin@example.test'),
  ('user_local_supervisor', 'Local Supervisor', 'supervisor@example.test'),
  ('user_local_student', 'Local Student', 'student@example.test')
on conflict (clerk_user_id) do nothing;

insert into public.committee_memberships (organization_id, clerk_user_id, role)
values
  ('org_local_demo', 'user_local_admin', 'admin'),
  ('org_local_demo', 'user_local_supervisor', 'supervisor'),
  ('org_local_demo', 'user_local_student', 'student')
on conflict (organization_id, clerk_user_id) do update set role = excluded.role;

insert into public.accounting_periods (organization_id, year, month)
values
  ('org_local_demo', 2026, 1),
  ('org_local_demo', 2026, 2),
  ('org_local_demo', 2026, 3),
  ('org_local_demo', 2026, 4),
  ('org_local_demo', 2026, 5),
  ('org_local_demo', 2026, 6)
on conflict (organization_id, year, month) do nothing;

insert into public.categories (organization_id, name, kind, display_order)
values
  ('org_local_demo', 'Veranstaltung', 'expense', 10),
  ('org_local_demo', 'Material', 'expense', 20),
  ('org_local_demo', 'Sonstiges', 'expense', 30),
  ('org_local_demo', 'Spenden', 'income', 40),
  ('org_local_demo', 'Sales', 'income', 50)
on conflict (organization_id, name, kind) do nothing;

insert into public.accounting_periods (organization_id, year, month)
values ('org_local_demo', 2026, 8)
on conflict (organization_id, year, month) do nothing;

insert into public.wallets (organization_id, name, type, created_by, idempotency_key)
values ('org_local_demo', 'Klassenkasse', 'cash', 'user_local_admin', 'seed-local-cash')
on conflict (organization_id, idempotency_key) do nothing;

insert into public.ledger_accounts (organization_id, type, name, wallet_id)
select wallet.organization_id, 'wallet', wallet.name, wallet.id
from public.wallets wallet
where wallet.organization_id = 'org_local_demo'
on conflict (wallet_id) do nothing;

insert into public.ledger_accounts (organization_id, type, name, category_id)
select
  category.organization_id,
  case when category.kind = 'income' then 'income' else 'expense' end::public.ledger_account_type,
  category.name,
  category.id
from public.categories category
where category.organization_id = 'org_local_demo'
on conflict (category_id) do nothing;

insert into public.transactions (
  organization_id, amount_minor, currency, title, description, type, status,
  origin, category_id, from_wallet_id, period_id, booked_at, created_by,
  idempotency_key
)
select
  'org_local_demo', 32000, 'EUR', 'Druck Abizeitung', 'Lokaler Beispieldatensatz',
  'expense', 'posted', 'manual', category.id, wallet.id, period.id,
  '2026-08-15', 'user_local_admin', 'seed-local-transaction'
from public.categories category
join public.wallets wallet
  on wallet.organization_id = 'org_local_demo' and wallet.name = 'Klassenkasse'
join public.accounting_periods period
  on period.organization_id = 'org_local_demo' and period.year = 2026 and period.month = 8
where category.organization_id = 'org_local_demo'
  and category.name = 'Materials'
  and category.kind = 'expense'
on conflict (organization_id, idempotency_key) do nothing;

insert into public.ledger_entries (organization_id, transaction_id, ledger_account_id, debit_minor)
select transaction_item.organization_id, transaction_item.id, ledger_account.id, transaction_item.amount_minor
from public.transactions transaction_item
join public.ledger_accounts ledger_account on ledger_account.category_id = transaction_item.category_id
where transaction_item.idempotency_key = 'seed-local-transaction'
on conflict do nothing;

insert into public.ledger_entries (organization_id, transaction_id, ledger_account_id, credit_minor)
select transaction_item.organization_id, transaction_item.id, ledger_account.id, transaction_item.amount_minor
from public.transactions transaction_item
join public.ledger_accounts ledger_account on ledger_account.wallet_id = transaction_item.from_wallet_id
where transaction_item.idempotency_key = 'seed-local-transaction'
on conflict do nothing;
