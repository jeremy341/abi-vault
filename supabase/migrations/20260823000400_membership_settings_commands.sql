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

  update public.committee_memberships
  set role = p_role, updated_at = now()
  where organization_id = p_organization_id
    and clerk_user_id = p_clerk_user_id;
end;
$$;

create or replace function public.update_committee_settings(
  p_organization_id text,
  p_school_name text,
  p_graduation_year smallint,
  p_notifications jsonb
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
  if p_graduation_year < 2000 or p_graduation_year > 2200 then
    raise exception 'INVALID_GRADUATION_YEAR' using errcode = '22023';
  end if;
  insert into public.committee_settings (
    organization_id, school_name, graduation_year, notifications, updated_by
  ) values (
    p_organization_id, left(btrim(coalesce(p_school_name, '')), 160), p_graduation_year,
    coalesce(p_notifications, '{}'::jsonb), app_private.current_clerk_user_id()
  )
  on conflict (organization_id) do update set
    school_name = excluded.school_name,
    graduation_year = excluded.graduation_year,
    notifications = excluded.notifications,
    updated_by = excluded.updated_by;
end;
$$;

revoke execute on function public.update_member_role(text, text, public.app_role, text)
  from public, anon;
revoke execute on function public.update_committee_settings(text, text, smallint, jsonb)
  from public, anon;
grant execute on function public.update_member_role(text, text, public.app_role, text) to authenticated;
grant execute on function public.update_committee_settings(text, text, smallint, jsonb) to authenticated;
