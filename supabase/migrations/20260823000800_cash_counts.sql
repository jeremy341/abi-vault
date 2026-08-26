create table if not exists public.cash_counts (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  counted_amount_minor bigint not null check (counted_amount_minor >= 0),
  book_amount_minor bigint not null,
  difference_minor bigint not null,
  counted_by text not null references public.profiles(clerk_user_id) on delete restrict,
  note text check (length(note) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists cash_counts_wallet_created_idx on public.cash_counts (organization_id, wallet_id, created_at desc);
alter table public.cash_counts enable row level security;
revoke all on public.cash_counts from anon, authenticated;
create policy cash_counts_finance_select on public.cash_counts for select to authenticated
  using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create or replace function public.record_cash_count(
  p_organization_id text,
  p_wallet_id uuid,
  p_counted_amount_minor bigint,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  count_id uuid;
  book_amount bigint;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_counted_amount_minor < 0 then raise exception 'INVALID_COUNT' using errcode = '22023'; end if;
  if not exists (select 1 from public.wallets where id = p_wallet_id and organization_id = p_organization_id and type = 'cash' and status = 'active') then
    raise exception 'CASH_WALLET_NOT_FOUND' using errcode = '23503';
  end if;
  select coalesce(sum(entry.debit_minor - entry.credit_minor), 0)::bigint into book_amount
  from public.ledger_entries entry
  join public.ledger_accounts account on account.id = entry.ledger_account_id
  where account.wallet_id = p_wallet_id and entry.organization_id = p_organization_id;
  insert into public.cash_counts (organization_id, wallet_id, counted_amount_minor, book_amount_minor, difference_minor, counted_by, note)
  values (p_organization_id, p_wallet_id, p_counted_amount_minor, book_amount, p_counted_amount_minor - book_amount, app_private.current_clerk_user_id(), nullif(btrim(p_note), ''))
  returning id into count_id;
  return count_id;
end;
$$;

revoke execute on function public.record_cash_count(text, uuid, bigint, text) from public, anon;
grant execute on function public.record_cash_count(text, uuid, bigint, text) to authenticated;
