alter table public.wallets
  add column if not exists opening_balance_minor bigint not null default 0 check (opening_balance_minor >= 0);
