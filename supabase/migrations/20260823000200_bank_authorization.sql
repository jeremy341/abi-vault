alter table public.bank_connections
  add column if not exists refresh_token_encrypted text,
  add column if not exists token_obtained_at timestamptz,
  add column if not exists access_valid_for_days integer check (access_valid_for_days between 1 and 365);

create table if not exists public.bank_authorization_states (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  provider text not null default 'gocardless_bank_account_data',
  state_hash text not null unique,
  institution_id text,
  redirect_path text not null default '/dashboard/funds',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bank_authorization_states_expiry_idx
  on public.bank_authorization_states (expires_at)
  where used_at is null;

alter table public.bank_authorization_states enable row level security;
revoke all on public.bank_authorization_states from anon, authenticated;

create policy bank_authorization_states_member_select
  on public.bank_authorization_states for select to authenticated
  using (
    organization_id = app_private.current_organization_id()
    and clerk_user_id = app_private.current_clerk_user_id()
  );

comment on table public.bank_authorization_states is
  'Short-lived, single-use OAuth state records. The raw state is never stored.';
