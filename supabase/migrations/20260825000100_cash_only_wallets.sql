-- Cash-only runtime policy.
-- Bank tables and historical rows remain available for a future reactivation,
-- but only one active cash wallet is allowed to participate in the application.

create temporary table cash_only_opening_balances on commit drop as
select organization_id, coalesce(sum(opening_balance_minor), 0) as opening_balance_minor
from public.wallets
group by organization_id;

with ranked_cash_wallets as (
  select
    id,
    row_number() over (partition by organization_id order by created_at, id) as position
  from public.wallets
  where type = 'cash'
    and status = 'active'
)
update public.wallets wallet
set status = 'archived'
from ranked_cash_wallets ranked
where wallet.id = ranked.id
  and ranked.position > 1;

update public.wallets
set status = 'archived'
where type <> 'cash'
  and status = 'active';

with canonical_cash as (
  select distinct on (organization_id)
    id,
    organization_id
  from public.wallets
  where type = 'cash'
    and status = 'active'
  order by organization_id, created_at, id
)
update public.wallets wallet
set
  name = 'Barkasse',
  opening_balance_minor = balances.opening_balance_minor
from canonical_cash canonical
join cash_only_opening_balances balances on balances.organization_id = canonical.organization_id
where wallet.id = canonical.id;

insert into public.wallets (
  organization_id,
  name,
  type,
  status,
  opening_balance_minor,
  responsible_clerk_user_id,
  created_by,
  idempotency_key
)
select
  committee.organization_id,
  'Barkasse',
  'cash',
  'active',
  coalesce(balances.opening_balance_minor, 0),
  admin_member.clerk_user_id,
  admin_member.clerk_user_id,
  'cash-only-default'
from public.committees committee
join lateral (
  select membership.clerk_user_id
  from public.committee_memberships membership
  where membership.organization_id = committee.organization_id
    and membership.status = 'active'
  order by (membership.role = 'admin') desc, membership.created_at
  limit 1
) admin_member on true
left join cash_only_opening_balances balances on balances.organization_id = committee.organization_id
where not exists (
  select 1
  from public.wallets wallet
  where wallet.organization_id = committee.organization_id
    and wallet.type = 'cash'
    and wallet.status = 'active'
)
on conflict (organization_id, idempotency_key) do nothing;

create unique index if not exists wallets_one_active_cash_per_org_idx
  on public.wallets (organization_id)
  where type = 'cash' and status = 'active';

create or replace function app_private.enforce_cash_only_wallets()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.status = 'active' and new.type <> 'cash' then
    raise exception 'BANK_WALLETS_DISABLED' using errcode = '22023';
  end if;

  if new.status = 'active' and new.type = 'cash' then
    new.name := 'Barkasse';
  end if;

  return new;
end;
$$;

drop trigger if exists wallets_cash_only_runtime on public.wallets;
create trigger wallets_cash_only_runtime
before insert or update of type, status, name on public.wallets
for each row execute function app_private.enforce_cash_only_wallets();

create or replace function app_private.enforce_cash_only_transactions()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  from_type public.wallet_type;
  to_type public.wallet_type;
begin
  if new.origin = 'bank_sync' then
    raise exception 'BANK_IMPORTS_DISABLED' using errcode = '22023';
  end if;

  if new.type = 'transfer' then
    raise exception 'TRANSFERS_DISABLED' using errcode = '22023';
  end if;

  if new.from_wallet_id is not null then
    select type into from_type from public.wallets where id = new.from_wallet_id;
    if from_type is distinct from 'cash' then
      raise exception 'CASH_WALLET_REQUIRED' using errcode = '22023';
    end if;
  end if;

  if new.to_wallet_id is not null then
    select type into to_type from public.wallets where id = new.to_wallet_id;
    if to_type is distinct from 'cash' then
      raise exception 'CASH_WALLET_REQUIRED' using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_cash_only_runtime on public.transactions;
create trigger transactions_cash_only_runtime
before insert or update of origin, type, from_wallet_id, to_wallet_id on public.transactions
for each row execute function app_private.enforce_cash_only_transactions();

create or replace view public.transparency_transactions
with (security_invoker = false)
as
select
  transaction_item.id as transaction_id,
  transaction_item.booked_at as public_date,
  transaction_item.title as public_title,
  category.name as category_name,
  transaction_item.type as public_type,
  transaction_item.amount_minor,
  transaction_item.currency,
  coalesce(to_wallet.name, from_wallet.name) as wallet_label
from public.transactions transaction_item
left join public.categories category on category.id = transaction_item.category_id
left join public.wallets from_wallet on from_wallet.id = transaction_item.from_wallet_id
left join public.wallets to_wallet on to_wallet.id = transaction_item.to_wallet_id
where transaction_item.organization_id = app_private.current_organization_id()
  and transaction_item.status = 'posted'
  and transaction_item.deleted_at is null
  and (from_wallet.type = 'cash' or to_wallet.type = 'cash');

revoke all on public.transparency_transactions from anon, authenticated;
grant select on public.transparency_transactions to authenticated;

revoke execute on function public.create_wallet(text, text, public.wallet_type, text, uuid, text)
  from public, anon, authenticated;

comment on table public.bank_connections is
  'Dormant compatibility boundary. Open Banking is postponed and runtime bank connections are disabled.';

comment on table public.connected_accounts is
  'Dormant compatibility boundary. Only the canonical Barkasse is active in the current runtime.';
