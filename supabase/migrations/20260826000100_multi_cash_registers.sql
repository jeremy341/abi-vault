-- Allow multiple active cash registers. Card fields remain presentation-only.

drop index if exists public.wallets_one_active_cash_per_org_idx;

alter table public.wallets
  add column if not exists card_number_visual text,
  add column if not exists card_holder_visual text,
  add column if not exists card_expiry_visual text,
  add column if not exists card_color_visual text;

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
  return new;
end;
$$;

drop trigger if exists wallets_cash_only_runtime on public.wallets;
create trigger wallets_cash_only_runtime
before insert or update of type, status, name on public.wallets
for each row execute function app_private.enforce_cash_only_wallets();

grant execute on function public.create_wallet(text, text, public.wallet_type, text, uuid, text)
  to authenticated;
