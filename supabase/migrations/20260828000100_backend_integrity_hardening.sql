-- Backend integrity hardening.
-- Keep all finance mutations behind validated RPCs and make derived reports use
-- only effective records from the active cash runtime.

grant select on public.cash_counts to authenticated;

revoke insert, update, delete on public.transactions from authenticated;
revoke insert, update, delete on public.receipts from authenticated;
revoke insert, update, delete on public.wallets from authenticated;
revoke insert, update, delete on public.fundraising_goals from authenticated;
revoke insert, update, delete on public.goal_contributions from authenticated;
revoke insert, update, delete on public.committee_memberships from authenticated;
revoke insert, update, delete, select on public.bank_connections from authenticated;
revoke insert, update, delete, select on public.connected_accounts from authenticated;
revoke insert, update, delete, select on public.balance_snapshots from authenticated;

drop policy if exists receipts_storage_delete on storage.objects;
create policy receipts_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'receipts'
  and app_private.has_role(split_part(name, '/', 1), array['admin']::public.app_role[])
);

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
    join public.profiles profile on profile.clerk_user_id = membership.clerk_user_id
    where membership.organization_id = target_organization_id
      and membership.clerk_user_id = app_private.current_clerk_user_id()
      and membership.status = 'active'
      and profile.status = 'active'
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
    join public.profiles profile on profile.clerk_user_id = membership.clerk_user_id
    where membership.organization_id = target_organization_id
      and membership.clerk_user_id = app_private.current_clerk_user_id()
      and membership.status = 'active'
      and profile.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

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
  and app_private.is_member(app_private.current_organization_id())
  and transaction_item.status = 'posted'
  and transaction_item.deleted_at is null
  and transaction_item.superseded_at is null
  and (transaction_item.correction_role is null or transaction_item.correction_role <> 'reversal')
  and (from_wallet.status = 'active' or to_wallet.status = 'active');

revoke all on public.transparency_transactions from anon, authenticated;
grant select on public.transparency_transactions to authenticated;

create or replace view public.transparency_goal_progress
with (security_invoker = false)
as
select
  goal.id,
  goal.organization_id,
  goal.title,
  goal.target_amount_minor,
  goal.deadline,
  goal.status,
  goal.visibility,
  coalesce(sum(contribution.allocated_amount_minor), 0)::bigint as saved_amount_minor
from public.fundraising_goals goal
left join public.goal_contributions contribution on contribution.goal_id = goal.id
where goal.organization_id = app_private.current_organization_id()
  and app_private.is_member(app_private.current_organization_id())
  and goal.visibility = 'students'
  and goal.status <> 'archived'
group by goal.id;

revoke all on public.transparency_goal_progress from anon, authenticated;
grant select on public.transparency_goal_progress to authenticated;

create or replace function app_private.validate_receipt_organization()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.transaction_id is not null and not exists (
    select 1
    from public.transactions transaction_item
    where transaction_item.id = new.transaction_id
      and transaction_item.organization_id = new.organization_id
  ) then
    raise exception 'RECEIPT_TRANSACTION_ORGANIZATION_MISMATCH' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists receipts_validate_organization on public.receipts;
create trigger receipts_validate_organization
before insert or update of organization_id, transaction_id on public.receipts
for each row execute function app_private.validate_receipt_organization();

create or replace function app_private.validate_goal_contribution()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  transaction_amount bigint;
  allocated_total bigint;
begin
  if not exists (
    select 1
    from public.fundraising_goals goal
    where goal.id = new.goal_id
      and goal.organization_id = new.organization_id
      and goal.status in ('active', 'completed')
  ) then
    raise exception 'GOAL_NOT_AVAILABLE' using errcode = '55000';
  end if;

  select transaction_item.amount_minor
  into transaction_amount
  from public.transactions transaction_item
  where transaction_item.id = new.transaction_id
    and transaction_item.organization_id = new.organization_id
    and transaction_item.type = 'income'
    and transaction_item.status = 'posted'
    and transaction_item.deleted_at is null
    and transaction_item.superseded_at is null
    and (transaction_item.correction_role is null or transaction_item.correction_role <> 'reversal');
  if transaction_amount is null then
    raise exception 'INCOME_TRANSACTION_REQUIRED' using errcode = '23514';
  end if;

  select coalesce(sum(contribution.allocated_amount_minor), 0)
  into allocated_total
  from public.goal_contributions contribution
  where contribution.organization_id = new.organization_id
    and contribution.transaction_id = new.transaction_id
    and (tg_op = 'INSERT' or contribution.id <> new.id);

  if allocated_total + new.allocated_amount_minor > transaction_amount then
    raise exception 'CONTRIBUTION_EXCEEDS_TRANSACTION' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists goal_contributions_validate on public.goal_contributions;
create trigger goal_contributions_validate
before insert or update of organization_id, goal_id, transaction_id, allocated_amount_minor
on public.goal_contributions
for each row execute function app_private.validate_goal_contribution();

drop trigger if exists cash_counts_audit on public.cash_counts;
create trigger cash_counts_audit
after insert or update or delete on public.cash_counts
for each row execute function app_private.write_audit_log();

drop trigger if exists transaction_corrections_audit on public.transaction_corrections;
create trigger transaction_corrections_audit
after insert or update or delete on public.transaction_corrections
for each row execute function app_private.write_audit_log();

drop trigger if exists transaction_archive_operations_audit on public.transaction_archive_operations;
create trigger transaction_archive_operations_audit
after insert or update or delete on public.transaction_archive_operations
for each row execute function app_private.write_audit_log();

drop trigger if exists receipt_archive_operations_audit on public.receipt_archive_operations;
create trigger receipt_archive_operations_audit
after insert or update or delete on public.receipt_archive_operations
for each row execute function app_private.write_audit_log();

create or replace function app_private.assert_receipt_transaction(
  p_organization_id text,
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  transaction_status public.transaction_status;
  period_status public.period_status;
begin
  if p_transaction_id is null then return; end if;

  select transaction_item.status, period.status
  into transaction_status, period_status
  from public.transactions transaction_item
  join public.accounting_periods period on period.id = transaction_item.period_id
  where transaction_item.id = p_transaction_id
    and transaction_item.organization_id = p_organization_id;

  if transaction_status is null then
    raise exception 'TRANSACTION_NOT_FOUND' using errcode = '23503';
  end if;
  if transaction_status = 'soft_deleted' or period_status = 'locked' then
    raise exception 'PERIOD_LOCKED' using errcode = '55000';
  end if;
end;
$$;

create or replace function public.create_receipt_metadata(
  p_organization_id text,
  p_receipt_id uuid,
  p_transaction_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size_bytes integer
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_receipt_id is null
    or p_storage_path is null
    or left(p_storage_path, length(p_organization_id) + 1) <> p_organization_id || '/'
    or left(
      p_storage_path,
      length(p_organization_id || '/' || coalesce(p_transaction_id::text, 'unassigned') || '/')
    ) <> p_organization_id || '/' || coalesce(p_transaction_id::text, 'unassigned') || '/'
    or length(btrim(coalesce(p_file_name, ''))) not between 1 and 255
    or p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')
    or p_file_size_bytes not between 1 and 5242880 then
    raise exception 'INVALID_RECEIPT_DATA' using errcode = '22023';
  end if;

  perform app_private.assert_receipt_transaction(p_organization_id, p_transaction_id);
  if not exists (
    select 1
    from storage.objects object_item
    where object_item.bucket_id = 'receipts'
      and object_item.name = p_storage_path
  ) then
    raise exception 'RECEIPT_FILE_NOT_FOUND' using errcode = '23503';
  end if;
  perform set_config('app.audit_reason', 'Receipt uploaded', true);
  insert into public.receipts (
    id, organization_id, transaction_id, storage_path, file_name,
    mime_type, file_size_bytes, uploaded_by
  ) values (
    p_receipt_id, p_organization_id, p_transaction_id, p_storage_path,
    btrim(p_file_name), p_mime_type, p_file_size_bytes,
    app_private.current_clerk_user_id()
  );
  return p_receipt_id;
end;
$$;

create or replace function public.review_receipt(
  p_organization_id text,
  p_receipt_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'rejected', 'pending') then
    raise exception 'INVALID_RECEIPT_STATUS' using errcode = '22023';
  end if;

  perform set_config('app.audit_reason', 'Receipt review updated', true);
  update public.receipts
  set review_status = p_status,
      reviewed_by = app_private.current_clerk_user_id(),
      reviewed_at = now()
  where id = p_receipt_id
    and organization_id = p_organization_id
    and archived_at is null;
  if not found then raise exception 'RECEIPT_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

create or replace function public.update_receipt_metadata(
  p_organization_id text,
  p_receipt_id uuid,
  p_file_name text,
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  uploader text;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_file_name, ''))) not between 1 and 255 then
    raise exception 'INVALID_RECEIPT_DATA' using errcode = '22023';
  end if;

  select uploaded_by into uploader
  from public.receipts
  where id = p_receipt_id
    and organization_id = p_organization_id
    and archived_at is null;
  if uploader is null then raise exception 'RECEIPT_NOT_FOUND' using errcode = '23503'; end if;
  if uploader <> app_private.current_clerk_user_id()
    and not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  perform app_private.assert_receipt_transaction(p_organization_id, p_transaction_id);
  perform set_config('app.audit_reason', 'Receipt data updated', true);
  update public.receipts
  set file_name = btrim(p_file_name),
      transaction_id = p_transaction_id
  where id = p_receipt_id
    and organization_id = p_organization_id
    and archived_at is null;
end;
$$;

create or replace function public.create_cash_wallet(
  p_organization_id text,
  p_name text,
  p_responsible_clerk_user_id text,
  p_idempotency_key text,
  p_card_number_visual text,
  p_card_holder_visual text,
  p_card_expiry_visual text,
  p_card_color_visual text
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  wallet_id uuid;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120
    or length(coalesce(p_card_number_visual, '')) > 19
    or length(coalesce(p_card_holder_visual, '')) > 80
    or length(coalesce(p_card_expiry_visual, '')) > 5
    or (p_card_color_visual is not null and p_card_color_visual !~ '^#[0-9a-fA-F]{6}$') then
    raise exception 'INVALID_WALLET_DATA' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED' using errcode = '22023';
  end if;

  select id into wallet_id
  from public.wallets
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;
  if wallet_id is not null then return wallet_id; end if;

  perform set_config('app.audit_reason', 'Cash register created', true);
  select public.create_wallet(
    p_organization_id,
    p_name,
    'cash'::public.wallet_type,
    p_responsible_clerk_user_id,
    null,
    p_idempotency_key
  ) into wallet_id;

  update public.wallets
  set card_number_visual = nullif(btrim(p_card_number_visual), ''),
      card_holder_visual = nullif(btrim(p_card_holder_visual), ''),
      card_expiry_visual = nullif(btrim(p_card_expiry_visual), ''),
      card_color_visual = nullif(btrim(p_card_color_visual), '')
  where id = wallet_id
    and organization_id = p_organization_id
    and type = 'cash'
    and status = 'active';
  return wallet_id;
end;
$$;

create or replace function public.update_cash_wallet(
  p_organization_id text,
  p_wallet_id uuid,
  p_name text,
  p_reason text,
  p_card_number_visual text,
  p_card_holder_visual text,
  p_card_expiry_visual text,
  p_card_color_visual text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 120
    or length(btrim(coalesce(p_reason, ''))) = 0
    or length(coalesce(p_card_number_visual, '')) > 19
    or length(coalesce(p_card_holder_visual, '')) > 80
    or length(coalesce(p_card_expiry_visual, '')) > 5
    or (p_card_color_visual is not null and p_card_color_visual !~ '^#[0-9a-fA-F]{6}$') then
    raise exception 'INVALID_WALLET_DATA' using errcode = '22023';
  end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.wallets
  set name = btrim(p_name),
      card_number_visual = nullif(btrim(p_card_number_visual), ''),
      card_holder_visual = nullif(btrim(p_card_holder_visual), ''),
      card_expiry_visual = nullif(btrim(p_card_expiry_visual), ''),
      card_color_visual = nullif(btrim(p_card_color_visual), '')
  where id = p_wallet_id
    and organization_id = p_organization_id
    and type = 'cash'
    and status = 'active';
  if not found then raise exception 'WALLET_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

create or replace function public.archive_cash_wallet(
  p_organization_id text,
  p_wallet_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'ARCHIVE_REASON_REQUIRED' using errcode = '22023';
  end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.wallets
  set status = 'archived'
  where id = p_wallet_id
    and organization_id = p_organization_id
    and type = 'cash'
    and status = 'active';
  if not found then raise exception 'WALLET_NOT_FOUND' using errcode = '23503'; end if;
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
  if p_allocated_amount_minor <= 0 or p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
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
    and transaction_item.deleted_at is null
    and transaction_item.superseded_at is null
    and (transaction_item.correction_role is null or transaction_item.correction_role <> 'reversal')
  for update;
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

  perform set_config('app.audit_reason', 'Zielbeitrag created', true);
  insert into public.goal_contributions (
    organization_id, goal_id, transaction_id, allocated_amount_minor,
    idempotency_key, created_by
  ) values (
    p_organization_id, p_goal_id, p_transaction_id, p_allocated_amount_minor,
    p_idempotency_key, app_private.current_clerk_user_id()
  ) returning id into contribution_id;
  return contribution_id;
end;
$$;

create or replace function public.update_fundraising_goal(
  p_organization_id text,
  p_goal_id uuid,
  p_title text,
  p_description text,
  p_target_amount_minor bigint,
  p_deadline date,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_goal_id is null or length(btrim(coalesce(p_title, ''))) = 0
    or length(p_title) > 160 or p_target_amount_minor <= 0
    or p_deadline is null or length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'INVALID_GOAL' using errcode = '22023';
  end if;
  if coalesce((select sum(allocated_amount_minor) from public.goal_contributions where goal_id = p_goal_id), 0) > p_target_amount_minor then
    raise exception 'GOAL_BELOW_SAVED_AMOUNT' using errcode = '22023';
  end if;
  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.fundraising_goals
  set title = btrim(p_title),
      description = nullif(btrim(p_description), ''),
      target_amount_minor = p_target_amount_minor,
      deadline = p_deadline
  where id = p_goal_id and organization_id = p_organization_id and status = 'active';
  if not found then raise exception 'GOAL_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

create or replace function public.archive_fundraising_goal(
  p_organization_id text,
  p_goal_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin', 'supervisor']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then raise exception 'ARCHIVE_REASON_REQUIRED' using errcode = '22023'; end if;
  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.fundraising_goals
  set status = 'archived', archived_at = now()
  where id = p_goal_id and organization_id = p_organization_id and status <> 'archived';
  if not found then raise exception 'GOAL_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

create or replace function public.update_member_role(
  p_organization_id text,
  p_clerk_user_id text,
  p_role public.app_role,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  current_role public.app_role;
  active_admins integer;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'ROLE_CHANGE_REASON_REQUIRED' using errcode = '22023';
  end if;

  select role into current_role
  from public.committee_memberships
  where organization_id = p_organization_id
    and clerk_user_id = p_clerk_user_id
    and status = 'active';
  if current_role is null then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = '23503'; end if;

  if current_role = 'admin' and p_role <> 'admin' then
    select count(*) into active_admins
    from public.committee_memberships
    where organization_id = p_organization_id and status = 'active' and role = 'admin';
    if active_admins <= 1 then raise exception 'LAST_ADMIN_REQUIRED' using errcode = '55000'; end if;
  end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.committee_memberships
  set role = p_role,
      clerk_role = case p_role
        when 'admin' then 'org:admin'
        when 'supervisor' then 'org:member'
        else null
      end,
      updated_at = now()
  where organization_id = p_organization_id
    and clerk_user_id = p_clerk_user_id;
end;
$$;

create or replace function public.remove_member(
  p_organization_id text,
  p_clerk_user_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_catalog
as $$
declare
  target_role public.app_role;
  target_status public.membership_status;
  active_admins integer;
begin
  if p_organization_id <> app_private.current_organization_id()
    or not app_private.has_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_clerk_user_id is null or length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'MEMBER_REMOVAL_REASON_REQUIRED' using errcode = '22023';
  end if;

  select role, status
  into target_role, target_status
  from public.committee_memberships
  where organization_id = p_organization_id
    and clerk_user_id = p_clerk_user_id;
  if target_role is null then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = '23503'; end if;
  if target_status = 'removed' then return; end if;

  if target_role = 'admin' then
    select count(*) into active_admins
    from public.committee_memberships
    where organization_id = p_organization_id
      and status = 'active'
      and role = 'admin';
    if active_admins <= 1 then raise exception 'LAST_ADMIN_REQUIRED' using errcode = '55000'; end if;
  end if;

  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.committee_memberships
  set status = 'removed', updated_at = now()
  where organization_id = p_organization_id
    and clerk_user_id = p_clerk_user_id;
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
  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.accounting_periods
  set status = 'locked', locked_at = now(), locked_by = app_private.current_clerk_user_id(), lock_reason = btrim(p_reason)
  where id = p_period_id and organization_id = p_organization_id and status = 'open';
  if not found then raise exception 'PERIOD_NOT_OPEN' using errcode = '55000'; end if;
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
  perform set_config('app.audit_reason', btrim(p_reason), true);
  update public.accounting_periods
  set status = 'open', locked_at = null, locked_by = null, lock_reason = btrim(p_reason)
  where id = p_period_id and organization_id = p_organization_id and status = 'locked';
  if not found then raise exception 'PERIOD_NOT_LOCKED' using errcode = '55000'; end if;
end;
$$;

grant execute on function public.create_receipt_metadata(text, uuid, uuid, text, text, text, integer) to authenticated;
grant execute on function public.review_receipt(text, uuid, text) to authenticated;
grant execute on function public.update_receipt_metadata(text, uuid, text, uuid) to authenticated;
grant execute on function public.create_cash_wallet(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.update_cash_wallet(text, uuid, text, text, text, text, text, text) to authenticated;
grant execute on function public.archive_cash_wallet(text, uuid, text) to authenticated;
grant execute on function public.remove_member(text, text, text) to authenticated;

-- Recompute cash counts from the same effective transaction set used by
-- balances and reports. Archived originals and reversal rows must not inflate
-- the book balance used for reconciliation.
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
  if not exists (
    select 1 from public.wallets
    where id = p_wallet_id
      and organization_id = p_organization_id
      and type = 'cash'
      and status = 'active'
  ) then
    raise exception 'CASH_WALLET_NOT_FOUND' using errcode = '23503';
  end if;

  select coalesce(sum(entry.debit_minor - entry.credit_minor), 0)::bigint
  into book_amount
  from public.ledger_entries entry
  join public.ledger_accounts account on account.id = entry.ledger_account_id
  join public.transactions transaction_item on transaction_item.id = entry.transaction_id
  where account.wallet_id = p_wallet_id
    and entry.organization_id = p_organization_id
    and transaction_item.organization_id = p_organization_id
    and transaction_item.status = 'posted'
    and transaction_item.deleted_at is null
    and transaction_item.superseded_at is null
    and (transaction_item.correction_role is null or transaction_item.correction_role <> 'reversal');

  perform set_config('app.audit_reason', coalesce(nullif(btrim(p_note), ''), 'Cash count erfasst'), true);
  insert into public.cash_counts (
    organization_id, wallet_id, counted_amount_minor, book_amount_minor,
    difference_minor, counted_by, note
  ) values (
    p_organization_id, p_wallet_id, p_counted_amount_minor, book_amount,
    p_counted_amount_minor - book_amount, app_private.current_clerk_user_id(),
    nullif(btrim(p_note), '')
  ) returning id into count_id;
  return count_id;
end;
$$;

grant execute on function public.record_cash_count(text, uuid, bigint, text) to authenticated;

alter table public.cash_counts
  add column if not exists counted_by_name text check (counted_by_name is null or length(btrim(counted_by_name)) <= 160),
  add column if not exists idempotency_key text;

create unique index if not exists cash_counts_idempotency_idx
  on public.cash_counts (organization_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.record_cash_count_v2(
  p_organization_id text,
  p_wallet_id uuid,
  p_counted_amount_minor bigint,
  p_counted_by_name text,
  p_note text,
  p_idempotency_key text
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
  if p_counted_amount_minor < 0
    or length(btrim(coalesce(p_counted_by_name, ''))) > 160
    or p_idempotency_key is null
    or length(btrim(p_idempotency_key)) < 16 then
    raise exception 'INVALID_COUNT' using errcode = '22023';
  end if;
  select id into count_id
  from public.cash_counts
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;
  if count_id is not null then return count_id; end if;
  if not exists (
    select 1 from public.wallets
    where id = p_wallet_id
      and organization_id = p_organization_id
      and type = 'cash'
      and status = 'active'
  ) then
    raise exception 'CASH_WALLET_NOT_FOUND' using errcode = '23503';
  end if;

  select coalesce(sum(entry.debit_minor - entry.credit_minor), 0)::bigint
  into book_amount
  from public.ledger_entries entry
  join public.ledger_accounts account on account.id = entry.ledger_account_id
  join public.transactions transaction_item on transaction_item.id = entry.transaction_id
  where account.wallet_id = p_wallet_id
    and entry.organization_id = p_organization_id
    and transaction_item.organization_id = p_organization_id
    and transaction_item.status = 'posted'
    and transaction_item.deleted_at is null
    and transaction_item.superseded_at is null
    and (transaction_item.correction_role is null or transaction_item.correction_role <> 'reversal');

  perform set_config('app.audit_reason', coalesce(nullif(btrim(p_note), ''), 'Cash count erfasst'), true);
  insert into public.cash_counts (
    organization_id, wallet_id, counted_amount_minor, book_amount_minor,
    difference_minor, counted_by, counted_by_name, note, idempotency_key
  ) values (
    p_organization_id, p_wallet_id, p_counted_amount_minor, book_amount,
    p_counted_amount_minor - book_amount, app_private.current_clerk_user_id(),
    nullif(btrim(p_counted_by_name), ''), nullif(btrim(p_note), ''),
    p_idempotency_key
  ) returning id into count_id;
  return count_id;
end;
$$;

grant execute on function public.record_cash_count_v2(text, uuid, bigint, text, text, text) to authenticated;
