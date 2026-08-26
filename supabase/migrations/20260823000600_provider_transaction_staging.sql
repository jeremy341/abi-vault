create table if not exists public.provider_transaction_staging (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  provider text not null,
  external_transaction_id text not null,
  status text not null check (status in ('pending', 'booked', 'cancelled')),
  amount_minor bigint not null,
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  title text not null,
  booked_at date,
  value_at date,
  payload jsonb not null default '{}'::jsonb,
  transaction_id uuid references public.transactions(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (organization_id, provider, external_transaction_id)
);

create index if not exists provider_transaction_staging_status_idx
  on public.provider_transaction_staging (organization_id, status, last_seen_at desc);

alter table public.provider_transaction_staging enable row level security;
revoke all on public.provider_transaction_staging from anon, authenticated;

create policy provider_transaction_staging_finance_select
  on public.provider_transaction_staging for select to authenticated
  using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));
