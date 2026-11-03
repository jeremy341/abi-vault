set search_path = extensions, public, app_private;
begin;

select plan(22);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_admin","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select ok(
  has_function_privilege('authenticated', 'public.get_finance_read_snapshot()', 'execute'),
  'authenticated users can call the snapshot RPC'
);

select ok(
  not has_function_privilege('anon', 'public.get_finance_read_snapshot()', 'execute'),
  'anonymous users cannot call the snapshot RPC'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.get_finance_read_snapshot()'::regprocedure),
  false,
  'snapshot RPC uses invoker security'
);

select is(
  (select provolatile::text from pg_proc where oid = 'public.get_finance_read_snapshot()'::regprocedure),
  's',
  'snapshot RPC is stable within a statement'
);

select is(
  public.get_finance_read_snapshot() -> 'monthlyFlow' -> 0 ->> 'monthKey',
  to_char(date_trunc('month', statement_timestamp() at time zone 'Europe/Berlin') - interval '5 months', 'YYYY-MM'),
  'report window starts five months before the current Berlin month'
);

select is(
  public.get_finance_read_snapshot() -> 'monthlyFlow' -> 5 ->> 'monthKey',
  to_char(date_trunc('month', statement_timestamp() at time zone 'Europe/Berlin'), 'YYYY-MM'),
  'report window includes the current Berlin month'
);

create temporary table finance_snapshot_before as
select public.get_finance_read_snapshot() as snapshot;

create temporary table finance_snapshot_test_ids (
  correction_target_id uuid,
  category_id uuid,
  wallet_id uuid,
  replacement_id uuid
);

select lives_ok(
  $test$
  do $body$
  declare
    wallet_id uuid;
    category_id uuid;
    period_id uuid;
    item_number integer;
    created_id uuid;
    correction_target_id uuid;
  begin
    select id into wallet_id
    from public.wallets
    where organization_id = 'org_local_demo'
      and type = 'cash'
      and status = 'active'
    limit 1;

    select id into category_id
    from public.categories
    where organization_id = 'org_local_demo'
      and name = 'Spenden'
      and kind = 'income'
      and archived_at is null
    limit 1;

    select id into period_id
    from public.accounting_periods
    where organization_id = 'org_local_demo'
      and year = 2026
      and month = 6
      and status = 'open';

    if wallet_id is null or category_id is null or period_id is null then
      raise exception 'Local manual-finance fixture is incomplete';
    end if;

    for item_number in 1..1001 loop
      created_id := public.create_manual_transaction(
        'org_local_demo',
        1,
        'income',
        'Snapshot test income',
        null,
        category_id,
        null,
        wallet_id,
        period_id,
        '2026-06-15',
        format('finance-snapshot-small-%s', item_number)
      );

      if item_number = 1 then
        correction_target_id := created_id;
      end if;
    end loop;

    perform public.create_manual_transaction(
      'org_local_demo',
      9007199254740993,
      'income',
      'Snapshot test large amount',
      null,
      category_id,
      null,
      wallet_id,
      period_id,
      '2026-06-15',
      'finance-snapshot-large'
    );

    insert into finance_snapshot_test_ids (
      correction_target_id,
      category_id,
      wallet_id
    ) values (correction_target_id, category_id, wallet_id);
  end
  $body$;
  $test$,
  'manual test transactions are accepted by the local RPC'
);

select is(
  (public.get_finance_read_snapshot() ->> 'incomeMinor')::numeric -
    (select (snapshot ->> 'incomeMinor')::numeric from finance_snapshot_before),
  9007199254741994::numeric,
  'snapshot includes more than 1,000 rows and preserves bigint minor units'
);

select is(
  (public.get_finance_read_snapshot() ->> 'liquidMinor')::numeric -
    (select (snapshot ->> 'liquidMinor')::numeric from finance_snapshot_before),
  9007199254741994::numeric,
  'snapshot balance includes every inserted income amount'
);

select is(
  (public.get_finance_read_snapshot() ->> 'transactionCount')::bigint -
    (select (snapshot ->> 'transactionCount')::bigint from finance_snapshot_before),
  1002::bigint,
  'snapshot counts every inserted transaction'
);

select lives_ok(
  $test$
  do $body$
  declare
    replacement_transaction_id uuid;
  begin
    select public.correct_manual_transaction(
      'org_local_demo',
      test_ids.correction_target_id,
      200,
      'income',
      'Snapshot test corrected income',
      null,
      test_ids.category_id,
      null,
      test_ids.wallet_id,
      'Snapshot correction test',
      'finance-snapshot-correction'
    ) into replacement_transaction_id
    from finance_snapshot_test_ids test_ids;

    update finance_snapshot_test_ids
    set replacement_id = replacement_transaction_id;
  end
  $body$;
  $test$,
  'snapshot correction succeeds'
);

select is(
  (public.get_finance_read_snapshot() ->> 'incomeMinor')::numeric -
    (select (snapshot ->> 'incomeMinor')::numeric from finance_snapshot_before),
  9007199254742193::numeric,
  'snapshot excludes the superseded income and includes its replacement'
);

select is(
  (public.get_finance_read_snapshot() ->> 'expenseMinor')::numeric -
    (select (snapshot ->> 'expenseMinor')::numeric from finance_snapshot_before),
  0::numeric,
  'snapshot excludes the correction reversal from expenses'
);

select is(
  (public.get_finance_read_snapshot() ->> 'liquidMinor')::numeric -
    (select (snapshot ->> 'liquidMinor')::numeric from finance_snapshot_before),
  9007199254742193::numeric,
  'wallet balance includes the corrected amount exactly'
);

select is(
  (public.get_finance_read_snapshot() ->> 'transactionCount')::bigint -
    (select (snapshot ->> 'transactionCount')::bigint from finance_snapshot_before),
  1002::bigint,
  'snapshot counts replacement rows but excludes reversals and superseded rows'
);

select lives_ok(
  $test$
  select public.archive_transaction(
    'org_local_demo',
    (select replacement_id from finance_snapshot_test_ids),
    'Snapshot test archive',
    'finance-snapshot-archive'
  )
  $test$,
  'snapshot test replacement can be archived'
);

select is(
  (public.get_finance_read_snapshot() ->> 'incomeMinor')::numeric -
    (select (snapshot ->> 'incomeMinor')::numeric from finance_snapshot_before),
  9007199254741993::numeric,
  'snapshot excludes the archived replacement'
);

select is(
  (public.get_finance_read_snapshot() ->> 'liquidMinor')::numeric -
    (select (snapshot ->> 'liquidMinor')::numeric from finance_snapshot_before),
  9007199254741993::numeric,
  'wallet balance excludes the archived replacement'
);

select is(
  (public.get_finance_read_snapshot() ->> 'transactionCount')::bigint -
    (select (snapshot ->> 'transactionCount')::bigint from finance_snapshot_before),
  1001::bigint,
  'snapshot no longer counts the archived replacement'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"user_local_student","org_id":"org_local_demo","role":"authenticated"}',
  true
);

select is(
  (public.get_finance_read_snapshot() ->> 'walletCount')::integer,
  0,
  'student role cannot see finance wallet aggregates through the RPC'
);

select is(
  public.get_finance_read_snapshot() ->> 'incomeMinor',
  '0',
  'student role cannot see finance totals through the RPC'
);

select is(
  (public.get_finance_read_snapshot() ->> 'transactionCount')::bigint,
  0::bigint,
  'student role cannot see finance transaction counts through the RPC'
);

select * from finish();
rollback;
