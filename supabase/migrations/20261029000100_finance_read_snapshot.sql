create or replace function public.get_finance_read_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
with
context as (
  select app_private.current_organization_id() as organization_id
),
active_wallets as (
  select
    wallet.id,
    wallet.name,
    wallet.type,
    wallet.responsible_clerk_user_id,
    wallet.opening_balance_minor,
    wallet.card_number_visual,
    wallet.card_holder_visual,
    wallet.card_expiry_visual,
    wallet.card_color_visual
  from public.wallets wallet
  cross join context
  where wallet.organization_id = context.organization_id
    and wallet.type = 'cash'
    and wallet.status = 'active'
),
eligible_transactions as (
  select
    transaction_item.id,
    transaction_item.amount_minor,
    transaction_item.type,
    transaction_item.category_id,
    transaction_item.from_wallet_id,
    transaction_item.to_wallet_id,
    transaction_item.booked_at
  from public.transactions transaction_item
  cross join context
  where transaction_item.organization_id = context.organization_id
    and transaction_item.status = 'posted'
    and transaction_item.deleted_at is null
    and transaction_item.superseded_at is null
    and transaction_item.correction_role is distinct from 'reversal'
    and (
      exists (select 1 from active_wallets wallet where wallet.id = transaction_item.from_wallet_id)
      or exists (select 1 from active_wallets wallet where wallet.id = transaction_item.to_wallet_id)
    )
),
flow_totals as (
  select
    coalesce(sum(amount_minor) filter (where type = 'income'), 0) as income_minor,
    coalesce(sum(amount_minor) filter (where type = 'expense'), 0) as expense_minor,
    count(*) as transaction_count
  from eligible_transactions
),
wallet_balances as (
  select
    wallet.id,
    wallet.name,
    wallet.type,
    wallet.responsible_clerk_user_id,
    wallet.opening_balance_minor,
    wallet.card_number_visual,
    wallet.card_holder_visual,
    wallet.card_expiry_visual,
    wallet.card_color_visual,
    wallet.opening_balance_minor::numeric + coalesce(sum(
      case
        when transaction_item.type = 'income' and transaction_item.to_wallet_id = wallet.id
          then transaction_item.amount_minor::numeric
        when transaction_item.type = 'expense' and transaction_item.from_wallet_id = wallet.id
          then -transaction_item.amount_minor::numeric
        when transaction_item.type = 'transfer' and transaction_item.from_wallet_id = wallet.id
          then -transaction_item.amount_minor::numeric
        when transaction_item.type = 'transfer' and transaction_item.to_wallet_id = wallet.id
          then transaction_item.amount_minor::numeric
        else 0
      end
    ), 0) as balance_minor
  from active_wallets wallet
  left join eligible_transactions transaction_item
    on transaction_item.from_wallet_id = wallet.id
    or transaction_item.to_wallet_id = wallet.id
  group by
    wallet.id,
    wallet.name,
    wallet.type,
    wallet.responsible_clerk_user_id,
    wallet.opening_balance_minor,
    wallet.card_number_visual,
    wallet.card_holder_visual,
    wallet.card_expiry_visual,
    wallet.card_color_visual
),
latest_cash_counts as (
  select distinct on (cash_count.wallet_id)
    cash_count.wallet_id,
    cash_count.counted_amount_minor,
    cash_count.difference_minor,
    cash_count.counted_by_name,
    cash_count.created_at
  from public.cash_counts cash_count
  cross join context
  join active_wallets wallet on wallet.id = cash_count.wallet_id
  where cash_count.organization_id = context.organization_id
  order by cash_count.wallet_id, cash_count.created_at desc, cash_count.id desc
),
wallet_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', wallet.id,
    'name', wallet.name,
    'type', wallet.type,
    'responsibleClerkUserId', wallet.responsible_clerk_user_id,
    'openingBalanceMinor', wallet.opening_balance_minor::text,
    'balanceMinor', wallet.balance_minor::text,
    'cardNumberVisual', wallet.card_number_visual,
    'cardHolderVisual', wallet.card_holder_visual,
    'cardExpiryVisual', wallet.card_expiry_visual,
    'cardColorVisual', wallet.card_color_visual,
    'lastCountedAmountMinor', cash_count.counted_amount_minor::text,
    'lastCountDifferenceMinor', cash_count.difference_minor::text,
    'lastCountedByName', cash_count.counted_by_name,
    'lastCountAt', cash_count.created_at
  ) order by wallet.id), '[]'::jsonb) as items
  from wallet_balances wallet
  left join latest_cash_counts cash_count on cash_count.wallet_id = wallet.id
),
category_totals as (
  select coalesce(category.name, 'Sonstiges') as name, sum(transaction_item.amount_minor) as amount_minor
  from eligible_transactions transaction_item
  left join public.categories category on category.id = transaction_item.category_id
  where transaction_item.type = 'expense'
  group by category.name
),
category_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', category.name,
    'amountMinor', category.amount_minor::text,
    'progress', case
      when totals.expense_minor = 0 then 0
      else round(category.amount_minor * 100 / totals.expense_minor)::integer
    end
  ) order by category.name), '[]'::jsonb) as items
  from category_totals category
  cross join flow_totals totals
),
month_window as (
  select month_start::date as month_start
  from generate_series(
    date_trunc('month', statement_timestamp() at time zone 'Europe/Berlin') - interval '5 months',
    date_trunc('month', statement_timestamp() at time zone 'Europe/Berlin'),
    interval '1 month'
  ) as months(month_start)
),
monthly_flow as (
  select
    month_window.month_start,
    coalesce(sum(transaction_item.amount_minor) filter (where transaction_item.type = 'income'), 0) as income_minor,
    coalesce(sum(transaction_item.amount_minor) filter (where transaction_item.type = 'expense'), 0) as expense_minor
  from month_window
  left join eligible_transactions transaction_item
    on transaction_item.booked_at >= month_window.month_start
    and transaction_item.booked_at < (month_window.month_start + interval '1 month')::date
  group by month_window.month_start
),
opening_totals as (
  select coalesce(sum(opening_balance_minor), 0) as opening_balance_minor
  from active_wallets
),
balance_before_window as (
  select
    opening_totals.opening_balance_minor
      + coalesce(sum(case
        when transaction_item.type = 'income' then transaction_item.amount_minor
        when transaction_item.type = 'expense' then -transaction_item.amount_minor
        else 0
      end), 0) as balance_minor
  from opening_totals
  cross join (select min(month_start) as first_month from month_window) window_start
  left join eligible_transactions transaction_item
    on transaction_item.booked_at is null
    or transaction_item.booked_at < window_start.first_month
  group by opening_totals.opening_balance_minor
),
monthly_balances as (
  select
    monthly_flow.*,
    balance_before_window.balance_minor
      + sum(monthly_flow.income_minor - monthly_flow.expense_minor)
        over (order by monthly_flow.month_start rows between unbounded preceding and current row)
      as balance_minor
  from monthly_flow
  cross join balance_before_window
),
monthly_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'monthKey', to_char(month_start, 'YYYY-MM'),
    'year', extract(year from month_start)::integer,
    'incomeMinor', income_minor::text,
    'expensesMinor', expense_minor::text,
    'balanceMinor', balance_minor::text
  ) order by month_start), '[]'::jsonb) as items
  from monthly_balances
),
receipt_totals as (
  select
    count(*) filter (where receipt.review_status = 'pending') as pending_count,
    count(*) filter (where receipt.review_status = 'approved') as reviewed_count,
    count(*) filter (where receipt.transaction_id is null) as unassigned_count
  from public.receipts receipt
  cross join context
  where receipt.organization_id = context.organization_id
    and receipt.archived_at is null
),
reconciliation as (
  select case
    when count(*) > 0 and count(*) = (select count(*) from active_wallets)
      then round(
        count(*) filter (where cash_count.difference_minor = 0)::numeric * 100 / count(*)
      )::integer
    else null
  end as percent
  from latest_cash_counts cash_count
),
analysis_balance as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'monthKey', to_char(month_start, 'YYYY-MM'),
    'balanceMinor', balance_minor::text
  ) order by month_start), '[]'::jsonb) as items
  from monthly_balances
)
select jsonb_build_object(
  'asOf', statement_timestamp(),
  'transactionCount', flow_totals.transaction_count,
  'incomeMinor', flow_totals.income_minor::text,
  'expenseMinor', flow_totals.expense_minor::text,
  'netMinor', (flow_totals.income_minor - flow_totals.expense_minor)::text,
  'liquidMinor', coalesce((select sum(balance_minor) from wallet_balances), 0)::text,
  'walletCount', (select count(*) from active_wallets),
  'wallets', wallet_json.items,
  'categories', category_json.items,
  'monthlyFlow', monthly_json.items,
  'analysisBalance', analysis_balance.items,
  'pendingReceiptCount', receipt_totals.pending_count,
  'reviewedReceiptCount', receipt_totals.reviewed_count,
  'unassignedReceiptCount', receipt_totals.unassigned_count,
  'reconciliationPercent', reconciliation.percent
)
from flow_totals
cross join wallet_json
cross join category_json
cross join monthly_json
cross join analysis_balance
cross join receipt_totals
cross join reconciliation;
$$;

revoke all on function public.get_finance_read_snapshot() from public, anon;
grant execute on function public.get_finance_read_snapshot() to authenticated;
