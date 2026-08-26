create extension if not exists pgcrypto;

create schema if not exists app_private;

do $$
begin
  create type public.app_role as enum ('admin', 'supervisor', 'student');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.account_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum ('active', 'invited', 'removed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.wallet_type as enum ('cash', 'manual_bank', 'bank_connected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.wallet_status as enum ('active', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.period_status as enum ('open', 'locked');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_type as enum ('income', 'expense', 'transfer');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_status as enum ('draft', 'posted', 'soft_deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_origin as enum ('manual', 'bank_sync');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.goal_status as enum ('active', 'completed', 'cancelled', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.goal_visibility as enum ('private', 'students');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.bank_connection_status as enum (
    'pending',
    'active',
    'needs_reauthorization',
    'expired',
    'revoked',
    'failed',
    'disconnected'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ledger_account_type as enum ('wallet', 'income', 'expense');
exception when duplicate_object then null;
end $$;

create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null unique,
  name text not null check (length(btrim(name)) between 1 and 120),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  timezone text not null default 'Europe/Berlin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  clerk_user_id text primary key,
  display_name text not null default '' check (length(display_name) <= 160),
  email text not null default '' check (length(email) <= 320),
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.committee_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete restrict,
  role public.app_role not null default 'student',
  clerk_role text,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, clerk_user_id)
);

create table if not exists public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  year smallint not null check (year between 2000 and 2200),
  month smallint not null check (month between 1 and 12),
  status public.period_status not null default 'open',
  locked_at timestamptz,
  locked_by text references public.profiles(clerk_user_id) on delete set null,
  lock_reason text check (length(lock_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, year, month)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  kind public.transaction_type not null default 'expense',
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, name, kind)
);

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  provider text not null default 'gocardless_bank_account_data',
  provider_connection_id text,
  institution_id text,
  institution_name text,
  status public.bank_connection_status not null default 'pending',
  consent_expires_at timestamptz,
  last_attempted_at timestamptz,
  last_succeeded_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_connection_id)
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  type public.wallet_type not null,
  status public.wallet_status not null default 'active',
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  responsible_clerk_user_id text references public.profiles(clerk_user_id) on delete set null,
  bank_connection_id uuid references public.bank_connections(id) on delete set null,
  idempotency_key text,
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'bank_connected' and bank_connection_id is not null)
    or (type <> 'bank_connected' and bank_connection_id is null)
  ),
  unique (organization_id, idempotency_key)
);

create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  bank_connection_id uuid not null references public.bank_connections(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  provider_account_id text not null,
  institution_account_id text,
  display_name text,
  iban_last4 char(4),
  iban_encrypted text,
  bic text,
  account_holder text,
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  account_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bank_connection_id, provider_account_id),
  unique (wallet_id)
);

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  type public.ledger_account_type not null,
  name text not null check (length(btrim(name)) between 1 and 120),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  wallet_id uuid references public.wallets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wallet_id),
  unique (category_id),
  check (
    (type = 'wallet' and wallet_id is not null and category_id is null)
    or (type in ('income', 'expense') and wallet_id is null and category_id is not null)
  )
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  title text not null check (length(btrim(title)) between 1 and 200),
  description text check (length(description) <= 2000),
  type public.transaction_type not null,
  status public.transaction_status not null default 'draft',
  origin public.transaction_origin not null default 'manual',
  category_id uuid references public.categories(id) on delete restrict,
  from_wallet_id uuid references public.wallets(id) on delete restrict,
  to_wallet_id uuid references public.wallets(id) on delete restrict,
  period_id uuid not null references public.accounting_periods(id) on delete restrict,
  booked_at date,
  value_at date,
  provider text,
  external_transaction_id text,
  provider_payload_hash text,
  idempotency_key text,
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  deleted_by text references public.profiles(clerk_user_id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'income' and to_wallet_id is not null and from_wallet_id is null)
    or (type = 'expense' and from_wallet_id is not null and to_wallet_id is null)
    or (type = 'transfer' and from_wallet_id is not null and to_wallet_id is not null and from_wallet_id <> to_wallet_id)
  ),
  unique (organization_id, idempotency_key)
);

create unique index if not exists transactions_provider_external_id_idx
  on public.transactions (organization_id, provider, external_transaction_id)
  where external_transaction_id is not null;

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  ledger_account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  debit_minor bigint not null default 0 check (debit_minor >= 0),
  credit_minor bigint not null default 0 check (credit_minor >= 0),
  created_at timestamptz not null default now(),
  check ((debit_minor > 0)::integer + (credit_minor > 0)::integer = 1)
);

create table if not exists public.balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  current_amount_minor bigint,
  available_amount_minor bigint,
  booked_amount_minor bigint,
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  provider_reference_date date,
  observed_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  storage_path text not null unique,
  file_name text not null check (length(btrim(file_name)) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size_bytes integer not null check (file_size_bytes between 1 and 5242880),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  uploaded_by text not null references public.profiles(clerk_user_id) on delete restrict,
  reviewed_by text references public.profiles(clerk_user_id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fundraising_goals (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  description text check (length(description) <= 2000),
  target_amount_minor bigint not null check (target_amount_minor > 0),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  deadline date not null,
  status public.goal_status not null default 'active',
  visibility public.goal_visibility not null default 'private',
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  completed_at timestamptz,
  archived_at timestamptz,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  goal_id uuid not null references public.fundraising_goals(id) on delete restrict,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  allocated_amount_minor bigint not null check (allocated_amount_minor > 0),
  idempotency_key text,
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (goal_id, transaction_id),
  unique (organization_id, idempotency_key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id text,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE')),
  old_values jsonb,
  new_values jsonb,
  actor_clerk_user_id text,
  reason text check (length(reason) <= 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  status text not null default 'received' check (status in ('received', 'processed', 'failed', 'ignored')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  error_code text,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id text,
  key text not null,
  request_hash text not null,
  response_status smallint,
  response_body jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (organization_id, key)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  bank_connection_id uuid references public.bank_connections(id) on delete set null,
  status text not null default 'started' check (status in ('started', 'succeeded', 'failed', 'partial')),
  cursor text,
  imported_count integer not null default 0 check (imported_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.committee_settings (
  organization_id text primary key references public.committees(organization_id) on delete cascade,
  school_name text not null default '' check (length(school_name) <= 160),
  graduation_year smallint not null default 2026 check (graduation_year between 2000 and 2200),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  timezone text not null default 'Europe/Berlin',
  notifications jsonb not null default '{"receipts":true,"payments":true,"goals":false}'::jsonb,
  updated_by text references public.profiles(clerk_user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app_private.current_clerk_user_id()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(auth.jwt() ->> 'sub', '');
$$;

create or replace function app_private.current_organization_id()
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    auth.jwt() ->> 'org_id',
    auth.jwt() -> 'o' ->> 'id',
    ''
  );
$$;

create or replace function app_private.is_member(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.committee_memberships membership
    where membership.organization_id = target_organization_id
      and membership.clerk_user_id = app_private.current_clerk_user_id()
      and membership.status = 'active'
  );
$$;

create or replace function app_private.has_role(
  target_organization_id text,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.committee_memberships membership
    where membership.organization_id = target_organization_id
      and membership.clerk_user_id = app_private.current_clerk_user_id()
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.validate_transaction_organization()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not exists (
    select 1 from public.accounting_periods period
    where period.id = new.period_id
      and period.organization_id = new.organization_id
  ) then
    raise exception 'PERIOD_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;

  if new.category_id is not null and not exists (
    select 1 from public.categories category
    where category.id = new.category_id
      and category.organization_id = new.organization_id
  ) then
    raise exception 'CATEGORY_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;

  if new.from_wallet_id is not null and not exists (
    select 1 from public.wallets wallet
    where wallet.id = new.from_wallet_id
      and wallet.organization_id = new.organization_id
  ) then
    raise exception 'FROM_WALLET_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;

  if new.to_wallet_id is not null and not exists (
    select 1 from public.wallets wallet
    where wallet.id = new.to_wallet_id
      and wallet.organization_id = new.organization_id
  ) then
    raise exception 'TO_WALLET_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function app_private.prevent_posted_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if old.status = 'posted' and (
    new.amount_minor <> old.amount_minor
    or new.currency <> old.currency
    or new.type <> old.type
    or new.origin <> old.origin
    or new.category_id is distinct from old.category_id
    or new.from_wallet_id is distinct from old.from_wallet_id
    or new.to_wallet_id is distinct from old.to_wallet_id
    or new.period_id <> old.period_id
    or new.booked_at is distinct from old.booked_at
    or new.value_at is distinct from old.value_at
    or new.external_transaction_id is distinct from old.external_transaction_id
  ) then
    raise exception 'POSTED_TRANSACTION_IMMUTABLE' using errcode = '55000';
  end if;

  if old.status = 'soft_deleted' and new.status <> old.status then
    raise exception 'SOFT_DELETED_TRANSACTION_IMMUTABLE' using errcode = '55000';
  end if;

  if old.status = 'draft' and new.status = 'soft_deleted' then
    new.deleted_at = coalesce(new.deleted_at, now());
  end if;

  if old.status = 'posted' and new.status = 'soft_deleted' then
    new.deleted_at = coalesce(new.deleted_at, now());
  end if;

  return new;
end;
$$;

create or replace function app_private.assert_ledger_balanced()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  debit_total bigint;
  credit_total bigint;
  target_transaction_id uuid;
begin
  target_transaction_id := case when tg_op = 'DELETE' then old.transaction_id else new.transaction_id end;

  select coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0)
  into debit_total, credit_total
  from public.ledger_entries
  where transaction_id = target_transaction_id;

  if debit_total <> credit_total then
    raise exception 'LEDGER_TRANSACTION_UNBALANCED' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function app_private.assert_posted_has_entries()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  entry_count integer;
begin
  if new.status = 'posted' then
    select count(*) into entry_count
    from public.ledger_entries
    where transaction_id = new.id;

    if entry_count < 2 then
      raise exception 'POSTED_TRANSACTION_REQUIRES_LEDGER_ENTRIES' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function app_private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  old_json jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_json jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  row_json jsonb := coalesce(new_json, old_json);
  action_name text;
begin
  action_name := case
    when tg_op = 'INSERT' then 'INSERT'
    when tg_op = 'DELETE' then 'DELETE'
    when tg_table_name = 'transactions'
      and new_json ->> 'status' = 'soft_deleted'
      and old_json ->> 'status' <> 'soft_deleted' then 'SOFT_DELETE'
    else 'UPDATE'
  end;

  insert into public.audit_logs (
    organization_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    actor_clerk_user_id
  ) values (
    row_json ->> 'organization_id',
    tg_table_name,
    coalesce(row_json ->> 'id', ''),
    action_name,
    old_json,
    new_json,
    nullif(current_setting('request.jwt.claim.sub', true), '')
  );

  return coalesce(new, old);
end;
$$;

create or replace function app_private.ensure_category_ledger_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.ledger_accounts (organization_id, type, name, category_id)
  values (
    new.organization_id,
    case when new.kind = 'income' then 'income' else 'expense' end::public.ledger_account_type,
    new.name,
    new.id
  )
  on conflict (category_id) do update set name = excluded.name;
  return new;
end;
$$;

create or replace function app_private.ensure_wallet_ledger_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.ledger_accounts (organization_id, type, name, wallet_id)
  values (new.organization_id, 'wallet', new.name, new.id)
  on conflict (wallet_id) do update set name = excluded.name;
  return new;
end;
$$;

create or replace function public.create_manual_transaction(
  p_organization_id text,
  p_amount_minor bigint,
  p_type public.transaction_type,
  p_title text,
  p_description text,
  p_category_id uuid,
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_period_id uuid,
  p_booked_at date,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  transaction_id uuid;
  source_ledger_account_id uuid;
  destination_ledger_account_id uuid;
  category_ledger_account_id uuid;
  category_kind public.transaction_type;
begin
  if p_organization_id <> app_private.current_organization_id() then
    raise exception 'ORGANIZATION_MISMATCH' using errcode = '42501';
  end if;

  if not app_private.has_role(
    p_organization_id,
    array['admin', 'supervisor']::public.app_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_amount_minor <= 0 then
    raise exception 'AMOUNT_MUST_BE_POSITIVE' using errcode = '22003';
  end if;

  if length(btrim(p_title)) = 0 or length(p_title) > 200 then
    raise exception 'INVALID_TITLE' using errcode = '22023';
  end if;

  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED' using errcode = '22023';
  end if;

  select transaction_item.id
  into transaction_id
  from public.transactions transaction_item
  where transaction_item.organization_id = p_organization_id
    and transaction_item.idempotency_key = p_idempotency_key;

  if transaction_id is not null then
    return transaction_id;
  end if;

  if not exists (
    select 1
    from public.accounting_periods period
    where period.id = p_period_id
      and period.organization_id = p_organization_id
      and period.status = 'open'
  ) then
    raise exception 'PERIOD_NOT_OPEN' using errcode = '55000';
  end if;

  if p_type = 'income' then
    if p_to_wallet_id is null or p_from_wallet_id is not null then
      raise exception 'INVALID_INCOME_ROUTING' using errcode = '22023';
    end if;
  elsif p_type = 'expense' then
    if p_from_wallet_id is null or p_to_wallet_id is not null then
      raise exception 'INVALID_EXPENSE_ROUTING' using errcode = '22023';
    end if;
  elsif p_type = 'transfer' then
    if p_from_wallet_id is null or p_to_wallet_id is null or p_from_wallet_id = p_to_wallet_id then
      raise exception 'INVALID_TRANSFER_ROUTING' using errcode = '22023';
    end if;
  end if;

  if p_category_id is not null then
    select category.kind, ledger_account.id
    into category_kind, category_ledger_account_id
    from public.categories category
    join public.ledger_accounts ledger_account
      on ledger_account.category_id = category.id
    where category.id = p_category_id
      and category.organization_id = p_organization_id
      and category.archived_at is null;

    if category_ledger_account_id is null then
      raise exception 'CATEGORY_NOT_FOUND' using errcode = '23503';
    end if;

    if p_type in ('income', 'expense') and category_kind <> p_type then
      raise exception 'CATEGORY_TYPE_MISMATCH' using errcode = '23514';
    end if;
  elsif p_type in ('income', 'expense') then
    raise exception 'CATEGORY_REQUIRED' using errcode = '23502';
  end if;

  if p_from_wallet_id is not null then
    select ledger_account.id
    into source_ledger_account_id
    from public.wallets wallet
    join public.ledger_accounts ledger_account on ledger_account.wallet_id = wallet.id
    where wallet.id = p_from_wallet_id
      and wallet.organization_id = p_organization_id
      and wallet.status = 'active';
    if source_ledger_account_id is null then
      raise exception 'FROM_WALLET_NOT_FOUND' using errcode = '23503';
    end if;
  end if;

  if p_to_wallet_id is not null then
    select ledger_account.id
    into destination_ledger_account_id
    from public.wallets wallet
    join public.ledger_accounts ledger_account on ledger_account.wallet_id = wallet.id
    where wallet.id = p_to_wallet_id
      and wallet.organization_id = p_organization_id
      and wallet.status = 'active';
    if destination_ledger_account_id is null then
      raise exception 'TO_WALLET_NOT_FOUND' using errcode = '23503';
    end if;
  end if;

  insert into public.transactions (
    organization_id,
    amount_minor,
    currency,
    title,
    description,
    type,
    status,
    origin,
    category_id,
    from_wallet_id,
    to_wallet_id,
    period_id,
    booked_at,
    created_by,
    idempotency_key
  ) values (
    p_organization_id,
    p_amount_minor,
    'EUR',
    btrim(p_title),
    nullif(btrim(p_description), ''),
    p_type,
    'posted',
    'manual',
    p_category_id,
    p_from_wallet_id,
    p_to_wallet_id,
    p_period_id,
    coalesce(p_booked_at, current_date),
    app_private.current_clerk_user_id(),
    p_idempotency_key
  )
  returning id into transaction_id;

  if p_type = 'income' then
    insert into public.ledger_entries (
      organization_id, transaction_id, ledger_account_id, debit_minor
    ) values (
      p_organization_id, transaction_id, destination_ledger_account_id, p_amount_minor
    );
    insert into public.ledger_entries (
      organization_id, transaction_id, ledger_account_id, credit_minor
    ) values (
      p_organization_id, transaction_id, category_ledger_account_id, p_amount_minor
    );
  elsif p_type = 'expense' then
    insert into public.ledger_entries (
      organization_id, transaction_id, ledger_account_id, debit_minor
    ) values (
      p_organization_id, transaction_id, category_ledger_account_id, p_amount_minor
    );
    insert into public.ledger_entries (
      organization_id, transaction_id, ledger_account_id, credit_minor
    ) values (
      p_organization_id, transaction_id, source_ledger_account_id, p_amount_minor
    );
  else
    insert into public.ledger_entries (
      organization_id, transaction_id, ledger_account_id, debit_minor
    ) values (
      p_organization_id, transaction_id, destination_ledger_account_id, p_amount_minor
    );
    insert into public.ledger_entries (
      organization_id, transaction_id, ledger_account_id, credit_minor
    ) values (
      p_organization_id, transaction_id, source_ledger_account_id, p_amount_minor
    );
  end if;

  return transaction_id;
end;
$$;

create or replace function public.create_wallet(
  p_organization_id text,
  p_name text,
  p_type public.wallet_type,
  p_responsible_clerk_user_id text,
  p_bank_connection_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  created_wallet_id uuid;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if length(btrim(p_name)) = 0 or length(p_name) > 120 then
    raise exception 'INVALID_WALLET_NAME' using errcode = '22023';
  end if;

  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED' using errcode = '22023';
  end if;

  select id into created_wallet_id
  from public.wallets
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;
  if created_wallet_id is not null then return created_wallet_id; end if;

  if p_type = 'bank_connected' then
    if p_bank_connection_id is null or not exists (
      select 1 from public.bank_connections connection
      where connection.id = p_bank_connection_id
        and connection.organization_id = p_organization_id
    ) then
      raise exception 'BANK_CONNECTION_NOT_FOUND' using errcode = '23503';
    end if;
  elsif p_bank_connection_id is not null then
    raise exception 'INVALID_BANK_CONNECTION_FOR_WALLET' using errcode = '22023';
  end if;

  insert into public.wallets (
    organization_id,
    name,
    type,
    responsible_clerk_user_id,
    bank_connection_id,
    created_by,
    idempotency_key
  ) values (
    p_organization_id,
    btrim(p_name),
    p_type,
    nullif(p_responsible_clerk_user_id, ''),
    p_bank_connection_id,
    app_private.current_clerk_user_id(),
    p_idempotency_key
  ) returning id into created_wallet_id;

  insert into public.ledger_accounts (organization_id, type, name, wallet_id)
  values (p_organization_id, 'wallet', btrim(p_name), created_wallet_id)
  on conflict (wallet_id) do update set name = excluded.name;

  return created_wallet_id;
end;
$$;

create or replace function public.lock_accounting_period(
  p_organization_id text,
  p_period_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'LOCK_REASON_REQUIRED' using errcode = '22023';
  end if;

  update public.accounting_periods
  set status = 'locked',
      locked_at = now(),
      locked_by = app_private.current_clerk_user_id(),
      lock_reason = btrim(p_reason)
  where id = p_period_id
    and organization_id = p_organization_id
    and status = 'open';

  if not found then
    raise exception 'PERIOD_NOT_OPEN' using errcode = '55000';
  end if;
end;
$$;

create or replace function public.unlock_accounting_period(
  p_organization_id text,
  p_period_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'UNLOCK_REASON_REQUIRED' using errcode = '22023';
  end if;

  update public.accounting_periods
  set status = 'open',
      locked_at = null,
      locked_by = null,
      lock_reason = btrim(p_reason)
  where id = p_period_id
    and organization_id = p_organization_id
    and status = 'locked';

  if not found then
    raise exception 'PERIOD_NOT_LOCKED' using errcode = '55000';
  end if;
end;
$$;

create or replace function public.create_fundraising_goal(
  p_organization_id text,
  p_title text,
  p_description text,
  p_target_amount_minor bigint,
  p_deadline date,
  p_visibility public.goal_visibility,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  goal_id uuid;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_target_amount_minor <= 0 or length(btrim(p_title)) = 0 then
    raise exception 'INVALID_GOAL' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED' using errcode = '22023';
  end if;

  select id into goal_id
  from public.fundraising_goals
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;
  if goal_id is not null then return goal_id; end if;

  insert into public.fundraising_goals (
    organization_id,
    title,
    description,
    target_amount_minor,
    deadline,
    visibility,
    created_by,
    idempotency_key
  ) values (
    p_organization_id,
    btrim(p_title),
    nullif(btrim(p_description), ''),
    p_target_amount_minor,
    p_deadline,
    p_visibility,
    app_private.current_clerk_user_id(),
    p_idempotency_key
  ) returning id into goal_id;

  return goal_id;
end;
$$;

create or replace function public.create_goal_contribution(
  p_organization_id text,
  p_goal_id uuid,
  p_transaction_id uuid,
  p_allocated_amount_minor bigint,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  contribution_id uuid;
  transaction_amount bigint;
  allocated_total bigint;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_allocated_amount_minor <= 0 or p_idempotency_key is null then
    raise exception 'INVALID_CONTRIBUTION' using errcode = '22023';
  end if;

  select id into contribution_id
  from public.goal_contributions
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;
  if contribution_id is not null then return contribution_id; end if;

  if not exists (
    select 1 from public.fundraising_goals goal
    where goal.id = p_goal_id
      and goal.organization_id = p_organization_id
      and goal.status in ('active', 'completed')
  ) then
    raise exception 'GOAL_NOT_AVAILABLE' using errcode = '55000';
  end if;

  select amount_minor into transaction_amount
  from public.transactions transaction_item
  where transaction_item.id = p_transaction_id
    and transaction_item.organization_id = p_organization_id
    and transaction_item.type = 'income'
    and transaction_item.status = 'posted'
    and transaction_item.deleted_at is null;
  if transaction_amount is null then
    raise exception 'INCOME_TRANSACTION_REQUIRED' using errcode = '23514';
  end if;

  select coalesce(sum(allocated_amount_minor), 0)
  into allocated_total
  from public.goal_contributions contribution
  where contribution.organization_id = p_organization_id
    and contribution.transaction_id = p_transaction_id;

  if allocated_total + p_allocated_amount_minor > transaction_amount then
    raise exception 'CONTRIBUTION_EXCEEDS_TRANSACTION' using errcode = '23514';
  end if;

  insert into public.goal_contributions (
    organization_id,
    goal_id,
    transaction_id,
    allocated_amount_minor,
    idempotency_key,
    created_by
  ) values (
    p_organization_id,
    p_goal_id,
    p_transaction_id,
    p_allocated_amount_minor,
    p_idempotency_key,
    app_private.current_clerk_user_id()
  ) returning id into contribution_id;

  return contribution_id;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'committees',
    'profiles',
    'committee_memberships',
    'accounting_periods',
    'categories',
    'bank_connections',
    'wallets',
    'connected_accounts',
    'receipts',
    'fundraising_goals',
    'sync_runs',
    'committee_settings'
  ] loop
    execute format(
      'drop trigger if exists %I on public.%I',
      table_name || '_touch_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I for each row execute function app_private.touch_updated_at()',
      table_name || '_touch_updated_at',
      table_name
    );
  end loop;
end $$;

drop trigger if exists transactions_validate_organization on public.transactions;
create trigger transactions_validate_organization
before insert or update on public.transactions
for each row execute function app_private.validate_transaction_organization();

drop trigger if exists transactions_prevent_posted_mutation on public.transactions;
create trigger transactions_prevent_posted_mutation
before update on public.transactions
for each row execute function app_private.prevent_posted_mutation();

drop trigger if exists ledger_entries_balanced on public.ledger_entries;
create constraint trigger ledger_entries_balanced
after insert or update or delete on public.ledger_entries
deferrable initially deferred
for each row execute function app_private.assert_ledger_balanced();

drop trigger if exists transactions_posted_has_entries on public.transactions;
create constraint trigger transactions_posted_has_entries
after insert or update on public.transactions
deferrable initially deferred
for each row execute function app_private.assert_posted_has_entries();

drop trigger if exists categories_ensure_ledger_account on public.categories;
create trigger categories_ensure_ledger_account
after insert or update of name, kind on public.categories
for each row execute function app_private.ensure_category_ledger_account();

drop trigger if exists wallets_ensure_ledger_account on public.wallets;
create trigger wallets_ensure_ledger_account
after insert or update of name on public.wallets
for each row execute function app_private.ensure_wallet_ledger_account();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'committees',
    'committee_memberships',
    'accounting_periods',
    'categories',
    'bank_connections',
    'wallets',
    'connected_accounts',
    'transactions',
    'receipts',
    'fundraising_goals',
    'goal_contributions'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_audit', table_name);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function app_private.write_audit_log()',
      table_name || '_audit',
      table_name
    );
  end loop;
end $$;

create index if not exists committee_memberships_user_idx
  on public.committee_memberships (clerk_user_id, organization_id, status);
create index if not exists accounting_periods_org_date_idx
  on public.accounting_periods (organization_id, year desc, month desc);
create index if not exists wallets_org_status_idx
  on public.wallets (organization_id, status, type);
create index if not exists transactions_org_booked_idx
  on public.transactions (organization_id, booked_at desc);
create index if not exists transactions_period_idx
  on public.transactions (period_id, status);
create index if not exists transactions_wallet_from_idx
  on public.transactions (from_wallet_id);
create index if not exists transactions_wallet_to_idx
  on public.transactions (to_wallet_id);
create index if not exists ledger_entries_transaction_idx
  on public.ledger_entries (transaction_id);
create index if not exists ledger_entries_account_idx
  on public.ledger_entries (ledger_account_id, created_at);
create index if not exists receipts_transaction_idx
  on public.receipts (transaction_id, created_at desc);
create index if not exists goals_org_status_deadline_idx
  on public.fundraising_goals (organization_id, status, deadline);
create index if not exists goal_contributions_goal_idx
  on public.goal_contributions (goal_id, created_at);
create index if not exists audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);
create index if not exists sync_runs_connection_started_idx
  on public.sync_runs (bank_connection_id, started_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'committees',
    'profiles',
    'committee_memberships',
    'accounting_periods',
    'categories',
    'bank_connections',
    'wallets',
    'connected_accounts',
    'ledger_accounts',
    'transactions',
    'ledger_entries',
    'balance_snapshots',
    'receipts',
    'fundraising_goals',
    'goal_contributions',
    'audit_logs',
    'webhook_logs',
    'idempotency_keys',
    'sync_runs',
    'committee_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

grant usage on schema app_private to authenticated, service_role;
grant execute on function app_private.current_clerk_user_id() to authenticated, service_role;
grant execute on function app_private.current_organization_id() to authenticated, service_role;
grant execute on function app_private.is_member(text) to authenticated, service_role;
grant execute on function app_private.has_role(text, public.app_role[]) to authenticated, service_role;

grant select on public.committees to authenticated;
grant select on public.profiles to authenticated;
grant select on public.committee_memberships to authenticated;
grant select on public.accounting_periods to authenticated;
grant select on public.categories to authenticated;
grant select on public.bank_connections to authenticated;
grant select on public.wallets to authenticated;
grant select on public.connected_accounts to authenticated;
grant select on public.ledger_accounts to authenticated;
grant select on public.ledger_entries to authenticated;
grant select on public.balance_snapshots to authenticated;
grant select on public.transactions to authenticated;
grant select on public.receipts to authenticated;
grant select on public.fundraising_goals to authenticated;
grant select on public.goal_contributions to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.committee_settings to authenticated;

revoke insert, update, delete on public.transactions from authenticated;
grant execute on function public.create_manual_transaction(
  text,
  bigint,
  public.transaction_type,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  date,
  text
) to authenticated;
grant execute on function public.create_wallet(text, text, public.wallet_type, text, uuid, text) to authenticated;
grant execute on function public.lock_accounting_period(text, uuid, text) to authenticated;
grant execute on function public.unlock_accounting_period(text, uuid, text) to authenticated;
grant execute on function public.create_fundraising_goal(text, text, text, bigint, date, public.goal_visibility, text) to authenticated;
grant execute on function public.create_goal_contribution(text, uuid, uuid, bigint, text) to authenticated;

grant insert, update, delete on public.committee_memberships to authenticated;
grant insert, update on public.accounting_periods to authenticated;
grant insert, update on public.categories to authenticated;
grant insert, update on public.bank_connections to authenticated;
grant insert, update on public.wallets to authenticated;
grant insert, update on public.transactions to authenticated;
grant insert, update, delete on public.receipts to authenticated;
grant insert, update on public.fundraising_goals to authenticated;
grant insert, update on public.goal_contributions to authenticated;

revoke insert, update, delete on public.accounting_periods from authenticated;
revoke insert on public.wallets from authenticated;
revoke insert on public.fundraising_goals from authenticated;
revoke insert on public.goal_contributions from authenticated;

create policy committees_member_select on public.committees
for select to authenticated using (app_private.is_member(organization_id));

create policy profiles_self_or_admin_select on public.profiles
for select to authenticated
using (
  clerk_user_id = app_private.current_clerk_user_id()
  or exists (
    select 1
    from public.committee_memberships membership
    where membership.clerk_user_id = profiles.clerk_user_id
      and app_private.has_role(membership.organization_id, array['admin']::public.app_role[])
  )
);

create policy memberships_member_select on public.committee_memberships
for select to authenticated
using (
  clerk_user_id = app_private.current_clerk_user_id()
  or app_private.has_role(organization_id, array['admin']::public.app_role[])
);

create policy memberships_admin_insert on public.committee_memberships
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy memberships_admin_update on public.committee_memberships
for update to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy memberships_admin_delete on public.committee_memberships
for delete to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy periods_member_select on public.accounting_periods
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy periods_admin_insert on public.accounting_periods
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy periods_admin_update on public.accounting_periods
for update to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy categories_member_select on public.categories
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy categories_finance_insert on public.categories
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy categories_finance_update on public.categories
for update to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy bank_connections_member_select on public.bank_connections
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy bank_connections_admin_supervisor_insert on public.bank_connections
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy bank_connections_admin_supervisor_update on public.bank_connections
for update to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy wallets_member_select on public.wallets
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy wallets_finance_insert on public.wallets
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy wallets_finance_update on public.wallets
for update to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy connected_accounts_member_select on public.connected_accounts
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy ledger_accounts_member_select on public.ledger_accounts
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy ledger_entries_member_select on public.ledger_entries
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy balances_member_select on public.balance_snapshots
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy transactions_member_select on public.transactions
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy transactions_finance_insert on public.transactions
for insert to authenticated
with check (
  app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[])
  and exists (
    select 1 from public.accounting_periods period
    where period.id = transactions.period_id
      and period.organization_id = transactions.organization_id
      and period.status = 'open'
  )
);

create policy transactions_finance_update on public.transactions
for update to authenticated
using (
  app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[])
  and exists (
    select 1 from public.accounting_periods period
    where period.id = transactions.period_id
      and period.status = 'open'
  )
)
with check (
  app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[])
);

create policy receipts_member_select on public.receipts
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy receipts_finance_insert on public.receipts
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy receipts_finance_update on public.receipts
for update to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy goals_member_select on public.fundraising_goals
for select to authenticated
using (
  app_private.is_member(organization_id)
  and (
    visibility = 'students'
    or app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[])
  )
);

create policy goals_finance_insert on public.fundraising_goals
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy goals_finance_update on public.fundraising_goals
for update to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy contributions_member_select on public.goal_contributions
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy contributions_finance_insert on public.goal_contributions
for insert to authenticated
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy contributions_finance_update on public.goal_contributions
for update to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

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
  and transaction_item.deleted_at is null;

revoke all on public.transparency_transactions from anon, authenticated;
grant select on public.transparency_transactions to authenticated;

create policy audit_logs_admin_supervisor_select on public.audit_logs
for select to authenticated
using (
  organization_id is not null
  and app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[])
);

create policy settings_admin_select on public.committee_settings
for select to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy settings_admin_update on public.committee_settings
for update to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]))
with check (app_private.has_role(organization_id, array['admin']::public.app_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy receipts_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'receipts'
  and app_private.is_member(split_part(name, '/', 1))
);

create policy receipts_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'receipts'
  and app_private.has_role(split_part(name, '/', 1), array['admin', 'supervisor']::public.app_role[])
);

create policy receipts_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'receipts'
  and app_private.has_role(split_part(name, '/', 1), array['admin', 'supervisor']::public.app_role[])
)
with check (
  bucket_id = 'receipts'
  and app_private.has_role(split_part(name, '/', 1), array['admin', 'supervisor']::public.app_role[])
);

create policy receipts_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'receipts'
  and app_private.has_role(split_part(name, '/', 1), array['admin', 'supervisor']::public.app_role[])
);
