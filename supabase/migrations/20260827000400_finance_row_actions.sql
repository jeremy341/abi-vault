-- Recoverable finance row actions. Posted transactions stay immutable: edits are
-- represented by an atomic reversal and replacement pair.

alter table public.transactions
  add column if not exists correction_role text,
  add column if not exists correction_of_transaction_id uuid,
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by_transaction_id uuid;

alter table public.receipts
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists archive_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_correction_role_check'
  ) then
    alter table public.transactions
      add constraint transactions_correction_role_check
      check (correction_role is null or correction_role in ('reversal', 'replacement'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_correction_of_fk'
  ) then
    alter table public.transactions
      add constraint transactions_correction_of_fk
      foreign key (correction_of_transaction_id)
      references public.transactions(id)
      on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_superseded_by_fk'
  ) then
    alter table public.transactions
      add constraint transactions_superseded_by_fk
      foreign key (superseded_by_transaction_id)
      references public.transactions(id)
      on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'receipts_archive_reason_check'
  ) then
    alter table public.receipts
      add constraint receipts_archive_reason_check
      check (archive_reason is null or length(archive_reason) <= 1000);
  end if;
end $$;

create table if not exists public.transaction_corrections (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  original_transaction_id uuid not null references public.transactions(id) on delete restrict,
  reversal_transaction_id uuid not null references public.transactions(id) on delete restrict,
  replacement_transaction_id uuid not null references public.transactions(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (original_transaction_id)
);

create table if not exists public.transaction_archive_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  archived_by text not null references public.profiles(clerk_user_id) on delete restrict,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (transaction_id)
);

create table if not exists public.receipt_archive_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  receipt_id uuid not null references public.receipts(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  archived_by text not null references public.profiles(clerk_user_id) on delete restrict,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (receipt_id)
);

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
    organization_id, table_name, record_id, action, old_values, new_values,
    actor_clerk_user_id, reason
  ) values (
    row_json ->> 'organization_id',
    tg_table_name,
    coalesce(row_json ->> 'id', ''),
    action_name,
    old_json,
    new_json,
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('app.audit_reason', true), '')
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.correct_manual_transaction(
  p_organization_id text,
  p_transaction_id uuid,
  p_amount_minor bigint,
  p_type public.transaction_type,
  p_title text,
  p_description text,
  p_category_id uuid,
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  original public.transactions%rowtype;
  replacement_id uuid;
  reversal_id uuid;
  existing_replacement uuid;
  reversal_type public.transaction_type;
  reversal_from uuid;
  reversal_to uuid;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'CORRECTION_REASON_REQUIRED' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED' using errcode = '22023';
  end if;

  select replacement_transaction_id
  into existing_replacement
  from public.transaction_corrections
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;
  if existing_replacement is not null then return existing_replacement; end if;

  select * into original
  from public.transactions
  where id = p_transaction_id
    and organization_id = p_organization_id
  for update;
  if not found then raise exception 'TRANSACTION_NOT_FOUND' using errcode = '23503'; end if;
  if original.status <> 'posted' or original.deleted_at is not null
    or original.correction_role is not null or original.superseded_at is not null then
    raise exception 'TRANSACTION_NOT_EDITABLE' using errcode = '55000';
  end if;
  if original.created_by <> app_private.current_clerk_user_id()
    and not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.accounting_periods period
    where period.id = original.period_id
      and period.organization_id = p_organization_id
      and period.status = 'open'
  ) then
    raise exception 'PERIOD_NOT_OPEN' using errcode = '55000';
  end if;

  if p_amount_minor <= 0 or length(btrim(coalesce(p_title, ''))) = 0 or length(p_title) > 200 then
    raise exception 'INVALID_TRANSACTION_DATA' using errcode = '22023';
  end if;
  if p_type not in ('income', 'expense') then
    raise exception 'INVALID_CORRECTION_TYPE' using errcode = '22023';
  end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);

  reversal_type := case original.type when 'income' then 'expense' when 'expense' then 'income' else 'transfer' end;
  reversal_from := case when original.type = 'income' then original.to_wallet_id when original.type = 'expense' then null else original.to_wallet_id end;
  reversal_to := case when original.type = 'income' then null when original.type = 'expense' then original.from_wallet_id else original.from_wallet_id end;

  insert into public.transactions (
    organization_id, amount_minor, currency, title, description, type, status,
    origin, category_id, from_wallet_id, to_wallet_id, period_id, booked_at,
    correction_role, correction_of_transaction_id, created_by, idempotency_key
  ) values (
    p_organization_id, original.amount_minor, original.currency,
    'Storno: ' || original.title, 'Automatische Gegenbuchung für Korrektur',
    reversal_type, 'posted', 'manual', original.category_id, reversal_from,
    reversal_to, original.period_id, original.booked_at, 'reversal', original.id,
    app_private.current_clerk_user_id(), left(p_idempotency_key, 110) || ':reversal'
  ) returning id into reversal_id;

  insert into public.ledger_entries (
    organization_id, transaction_id, ledger_account_id, debit_minor, credit_minor
  )
  select organization_id, reversal_id, ledger_account_id, credit_minor, debit_minor
  from public.ledger_entries
  where transaction_id = original.id;

  select public.create_manual_transaction(
    p_organization_id,
    p_amount_minor,
    p_type,
    p_title,
    p_description,
    p_category_id,
    p_from_wallet_id,
    p_to_wallet_id,
    original.period_id,
    original.booked_at,
    left(p_idempotency_key, 110) || ':replacement'
  ) into replacement_id;

  update public.transactions
  set correction_role = 'replacement',
      correction_of_transaction_id = original.id
  where id = replacement_id;

  update public.transactions
  set status = 'soft_deleted',
      deleted_by = app_private.current_clerk_user_id(),
      deleted_at = now(),
      superseded_at = now(),
      superseded_by_transaction_id = replacement_id
  where id = original.id;

  insert into public.transaction_corrections (
    organization_id, original_transaction_id, reversal_transaction_id,
    replacement_transaction_id, reason, created_by, idempotency_key
  ) values (
    p_organization_id, original.id, reversal_id, replacement_id,
    btrim(p_reason), app_private.current_clerk_user_id(), p_idempotency_key
  );
  return replacement_id;
end;
$$;

create or replace function public.archive_transaction(
  p_organization_id text,
  p_transaction_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  inserted_operation integer;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 or p_idempotency_key is null then
    raise exception 'ARCHIVE_REASON_REQUIRED' using errcode = '22023';
  end if;

  insert into public.transaction_archive_operations (
    organization_id, transaction_id, reason, archived_by, idempotency_key
  ) values (
    p_organization_id, p_transaction_id, btrim(p_reason),
    app_private.current_clerk_user_id(), p_idempotency_key
  ) on conflict (organization_id, idempotency_key) do nothing;
  get diagnostics inserted_operation = row_count;
  if inserted_operation = 0 then return; end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.transactions
  set status = 'soft_deleted',
      deleted_by = app_private.current_clerk_user_id(),
      deleted_at = now()
  where id = p_transaction_id
    and organization_id = p_organization_id
    and status = 'posted'
    and deleted_at is null;
  if not found then raise exception 'TRANSACTION_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

create or replace function public.archive_receipt(
  p_organization_id text,
  p_receipt_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  inserted_operation integer;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 or p_idempotency_key is null then
    raise exception 'ARCHIVE_REASON_REQUIRED' using errcode = '22023';
  end if;

  insert into public.receipt_archive_operations (
    organization_id, receipt_id, reason, archived_by, idempotency_key
  ) values (
    p_organization_id, p_receipt_id, btrim(p_reason),
    app_private.current_clerk_user_id(), p_idempotency_key
  ) on conflict (organization_id, idempotency_key) do nothing;
  get diagnostics inserted_operation = row_count;
  if inserted_operation = 0 then return; end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.receipts
  set archived_at = now(),
      archived_by = app_private.current_clerk_user_id(),
      archive_reason = btrim(p_reason)
  where id = p_receipt_id
    and organization_id = p_organization_id
    and archived_at is null;
  if not found then raise exception 'RECEIPT_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

create index if not exists transactions_correction_effective_idx
  on public.transactions (organization_id, status, deleted_at, superseded_at, correction_role);
create index if not exists receipts_archive_idx
  on public.receipts (organization_id, archived_at, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'transaction_corrections',
    'transaction_archive_operations',
    'receipt_archive_operations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

grant select on public.transaction_corrections to authenticated;
grant select on public.transaction_archive_operations to authenticated;
grant select on public.receipt_archive_operations to authenticated;
grant execute on function public.correct_manual_transaction(text, uuid, bigint, public.transaction_type, text, text, uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.archive_transaction(text, uuid, text, text) to authenticated;
grant execute on function public.archive_receipt(text, uuid, text, text) to authenticated;

create policy transaction_corrections_member_select on public.transaction_corrections
for select to authenticated
using (app_private.has_role(organization_id, array['admin', 'supervisor']::public.app_role[]));

create policy transaction_archive_operations_admin_select on public.transaction_archive_operations
for select to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]));

create policy receipt_archive_operations_admin_select on public.receipt_archive_operations
for select to authenticated
using (app_private.has_role(organization_id, array['admin']::public.app_role[]));
