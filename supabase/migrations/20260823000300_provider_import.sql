create or replace function public.import_provider_transaction(
  p_organization_id text,
  p_wallet_id uuid,
  p_provider text,
  p_external_transaction_id text,
  p_amount_minor bigint,
  p_title text,
  p_booked_at date,
  p_value_at date,
  p_payload_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  transaction_id uuid;
  period_id uuid;
  category_id uuid;
  wallet_ledger_account_id uuid;
  category_ledger_account_id uuid;
  selected_category_id uuid;
  normalized_title text := nullif(btrim(p_title), '');
  transaction_type public.transaction_type;
  amount_minor bigint := abs(p_amount_minor);
begin
  if p_organization_id is null or p_provider is null or p_external_transaction_id is null
    or p_booked_at is null or amount_minor <= 0 or normalized_title is null then
    raise exception 'INVALID_PROVIDER_TRANSACTION' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.committees
    where organization_id = p_organization_id
  ) then
    raise exception 'ORGANIZATION_NOT_FOUND' using errcode = '23503';
  end if;

  select id into transaction_id
  from public.transactions
  where organization_id = p_organization_id
    and provider = p_provider
    and external_transaction_id = p_external_transaction_id;
  if transaction_id is not null then return transaction_id; end if;

  select id into period_id
  from public.accounting_periods
  where organization_id = p_organization_id
    and year = extract(year from p_booked_at)::smallint
    and month = extract(month from p_booked_at)::smallint;
  if period_id is null then raise exception 'ACCOUNTING_PERIOD_NOT_FOUND' using errcode = '23503'; end if;
  if exists (select 1 from public.accounting_periods where id = period_id and status = 'locked') then
    raise exception 'ACCOUNTING_PERIOD_LOCKED' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.wallets where id = p_wallet_id and organization_id = p_organization_id and status = 'active'
  ) then
    raise exception 'WALLET_NOT_FOUND' using errcode = '23503';
  end if;

  transaction_type := case when p_amount_minor > 0 then 'income'::public.transaction_type else 'expense'::public.transaction_type end;
  select id into category_id
  from public.categories
  where organization_id = p_organization_id
    and kind = transaction_type
    and archived_at is null
  order by display_order, created_at
  limit 1;
  if category_id is null then raise exception 'CATEGORY_NOT_FOUND' using errcode = '23503'; end if;

  select id into wallet_ledger_account_id from public.ledger_accounts where wallet_id = p_wallet_id;
  selected_category_id := category_id;
  select id into category_ledger_account_id
  from public.ledger_accounts
  where public.ledger_accounts.category_id = selected_category_id;
  if wallet_ledger_account_id is null or category_ledger_account_id is null then
    raise exception 'LEDGER_ACCOUNT_NOT_FOUND' using errcode = '23503';
  end if;

  insert into public.transactions (
    organization_id, amount_minor, title, type, status, origin, category_id,
    from_wallet_id, to_wallet_id, period_id, booked_at, value_at, provider,
    external_transaction_id, provider_payload_hash, created_by
  ) values (
    p_organization_id, amount_minor, normalized_title, transaction_type, 'posted', 'bank_sync', category_id,
    case when transaction_type = 'expense' then p_wallet_id end,
    case when transaction_type = 'income' then p_wallet_id end,
    period_id, p_booked_at, p_value_at, p_provider, p_external_transaction_id,
    p_payload_hash,
    coalesce(
      nullif(app_private.current_clerk_user_id(), ''),
      (select clerk_user_id from public.committee_memberships
       where organization_id = p_organization_id and status = 'active' and role = 'admin'
       order by created_at limit 1)
    )
  ) returning id into transaction_id;

  if transaction_type = 'income' then
    insert into public.ledger_entries (organization_id, transaction_id, ledger_account_id, debit_minor)
    values (p_organization_id, transaction_id, wallet_ledger_account_id, amount_minor);
    insert into public.ledger_entries (organization_id, transaction_id, ledger_account_id, credit_minor)
    values (p_organization_id, transaction_id, category_ledger_account_id, amount_minor);
  else
    insert into public.ledger_entries (organization_id, transaction_id, ledger_account_id, debit_minor)
    values (p_organization_id, transaction_id, category_ledger_account_id, amount_minor);
    insert into public.ledger_entries (organization_id, transaction_id, ledger_account_id, credit_minor)
    values (p_organization_id, transaction_id, wallet_ledger_account_id, amount_minor);
  end if;

  return transaction_id;
end;
$$;

revoke execute on function public.import_provider_transaction(text, uuid, text, text, bigint, text, date, date, text)
  from public, anon, authenticated;
