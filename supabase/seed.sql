insert into public.committees (organization_id, name)
values ('org_local_demo', 'Abi 2026')
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
  ('org_local_demo', 'Verkäufe', 'income', 50)
on conflict (organization_id, name, kind) do nothing;

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
