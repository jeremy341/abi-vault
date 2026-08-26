set search_path = extensions, public, app_private;
begin;

select plan(26);

select has_table('public', 'committees', 'committees table exists');
select has_table('public', 'transactions', 'transactions table exists');
select has_table('public', 'ledger_entries', 'ledger entries table exists');
select has_table('public', 'audit_logs', 'audit logs table exists');

set local role postgres;

insert into public.committees (organization_id, name)
values ('org_other_test', 'Other Committee');

insert into public.wallets (
  organization_id,
  name,
  type,
  created_by
)
values ('org_other_test', 'Other Cash', 'cash', 'user_local_admin');

insert into public.fundraising_goals (
  organization_id,
  title,
  target_amount_minor,
  deadline,
  visibility,
  created_by
)
values
  ('org_local_demo', 'Private test goal', 10000, '2027-01-01', 'private', 'user_local_admin'),
  ('org_local_demo', 'Public test goal', 10000, '2027-01-01', 'students', 'user_local_admin');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_student","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select results_eq(
  $$ select count(*)::integer from public.wallets where organization_id = 'org_local_demo' $$,
  $$ values (0) $$,
  'student cannot read operational wallets directly'
);

select results_eq(
  $$ select count(*)::integer from public.wallets where organization_id = 'org_other_test' $$,
  $$ values (0) $$,
  'student cannot read another committee wallet'
);

select results_eq(
  $$ select count(*)::integer from public.fundraising_goals where visibility = 'private' $$,
  $$ values (0) $$,
  'student cannot read private goals'
);

select results_eq(
  $$ select count(*)::integer from public.fundraising_goals where visibility = 'students' $$,
  $$ values (1) $$,
  'student can read public goals'
);

select results_eq(
  $$ select count(*)::integer from public.transparency_transactions $$,
  $$ values (0) $$,
  'student transparency view is available without exposing operational rows'
);

select throws_ok(
  $$
    select public.import_provider_transaction(
      'org_local_demo',
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
      'gocardless_bank_account_data', 'student-provider-test', 100, 'Forbidden', '2026-05-15', '2026-05-15', 'hash'
    )
  $$,
  '42501',
  null,
  'students cannot invoke provider import functions'
);

select throws_ok(
  $$
    insert into public.categories (organization_id, name, kind)
    values ('org_local_demo', 'Student forbidden category', 'expense')
  $$,
  '42501',
  null,
  'student cannot create categories'
);

select throws_ok(
  $$
    insert into public.wallets (organization_id, name, type, created_by)
    values ('org_local_demo', 'Student forbidden wallet', 'cash', 'user_local_student')
  $$,
  '42501',
  null,
  'student cannot create wallets'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_supervisor","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select results_eq(
  $$ select count(*)::integer from public.wallets where organization_id = 'org_local_demo' $$,
  $$ values (1) $$,
  'supervisor can read operational wallets in the active committee'
);

select throws_ok(
  $$
    insert into public.wallets (organization_id, name, type, created_by)
    values ('org_local_demo', 'Bankkonto disabled test', 'manual_bank', 'user_local_supervisor')
  $$,
  '42501',
  null,
  'bank wallets cannot be created in the cash-only runtime'
);

select lives_ok(
  $$
    insert into public.categories (organization_id, name, kind)
    values ('org_local_demo', 'Supervisor test category', 'expense')
  $$,
  'supervisor can create a category'
);

select lives_ok(
  $$
    select public.create_manual_transaction(
      'org_local_demo',
      18550,
      'income',
      'Test income',
      'Foundation test',
      (select id from public.categories where organization_id = 'org_local_demo' and name = 'Spenden'),
      null,
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
      (select id from public.accounting_periods where organization_id = 'org_local_demo' and year = 2026 and month = 6),
      '2026-06-15',
      'foundation-transaction-1'
    )
  $$,
  'supervisor can post a balanced manual income transaction'
);

select results_eq(
  $$ select count(*)::integer from public.transactions where organization_id = 'org_local_demo' and status = 'posted' $$,
  $$ values (1) $$,
  'posted transaction is persisted'
);

select results_eq(
  $$ select count(*)::integer from public.ledger_entries where transaction_id = (select id from public.transactions where idempotency_key = 'foundation-transaction-1') $$,
  $$ values (2) $$,
  'posted transaction creates two balanced ledger entries'
);

select is(
  public.create_manual_transaction(
    'org_local_demo',
    18550,
    'income',
    'Test income',
    'Foundation test',
    (select id from public.categories where organization_id = 'org_local_demo' and name = 'Spenden'),
    null,
    (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
    (select id from public.accounting_periods where organization_id = 'org_local_demo' and year = 2026 and month = 6),
    '2026-06-15',
    'foundation-transaction-1'
  )::text,
  (select id::text from public.transactions where idempotency_key = 'foundation-transaction-1'),
  'repeating the same idempotency key returns the original transaction'
);

select throws_ok(
  $$
    select public.create_manual_transaction(
      'org_local_demo',
      5000,
      'transfer',
      'Foundation transfer',
      'Transfer integrity test',
      null,
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Klassenkonto'),
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
      (select id from public.accounting_periods where organization_id = 'org_local_demo' and year = 2026 and month = 5),
      '2026-05-15',
      'foundation-transfer-1'
    )
  $$,
  '22023',
  null,
  'transfers are disabled in the cash-only runtime'
);

select lives_ok(
  $$
    select public.record_cash_count(
      'org_local_demo',
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
      0,
      'Foundation cash count'
    )
  $$,
  'supervisor can record a cash count'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_student","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.create_manual_transaction(
      'org_local_demo',
      100,
      'income',
      'Student forbidden transaction',
      null,
      (select id from public.categories where organization_id = 'org_local_demo' and name = 'Spenden'),
      null,
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
      (select id from public.accounting_periods where organization_id = 'org_local_demo' and year = 2026 and month = 6),
      '2026-06-15',
      'student-forbidden-transaction'
    )
  $$,
  '42501',
  null,
  'student cannot use the transaction write function'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_admin","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.lock_accounting_period(
      'org_local_demo',
      (select id from public.accounting_periods where organization_id = 'org_local_demo' and year = 2026 and month = 6),
      'Foundation lock test'
    )
  $$,
  'admin can lock an open accounting period with a reason'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_supervisor","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.create_manual_transaction(
      'org_local_demo',
      100,
      'income',
      'Locked period transaction',
      null,
      (select id from public.categories where organization_id = 'org_local_demo' and name = 'Spenden'),
      null,
      (select id from public.wallets where organization_id = 'org_local_demo' and name = 'Barkasse'),
      (select id from public.accounting_periods where organization_id = 'org_local_demo' and year = 2026 and month = 6),
      '2026-06-15',
      'locked-period-transaction'
    )
  $$,
  '55000',
  null,
  'locked periods reject new transactions'
);

select throws_ok(
  $$
    insert into public.audit_logs (organization_id, table_name, record_id, action)
    values ('org_local_demo', 'transactions', 'manual', 'INSERT')
  $$,
  '42501',
  null,
  'application roles cannot write audit logs directly'
);

select results_eq(
  $$ select count(*)::integer from public.committee_memberships where organization_id = 'org_local_demo' $$,
  $$ values (1) $$,
  'supervisor sees only their own committee membership'
);

select * from finish();
rollback;
