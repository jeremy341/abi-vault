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
  if p_goal_id is null or length(btrim(coalesce(p_title, ''))) = 0 or p_target_amount_minor <= 0
    or p_deadline is null or length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'INVALID_GOAL' using errcode = '22023';
  end if;
  if coalesce((select sum(allocated_amount_minor) from public.goal_contributions where goal_id = p_goal_id), 0) > p_target_amount_minor then
    raise exception 'GOAL_BELOW_SAVED_AMOUNT' using errcode = '22023';
  end if;
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
  update public.fundraising_goals set status = 'archived', archived_at = now()
  where id = p_goal_id and organization_id = p_organization_id and status <> 'archived';
  if not found then raise exception 'GOAL_NOT_FOUND' using errcode = '23503'; end if;
end;
$$;

revoke execute on function public.update_fundraising_goal(text, uuid, text, text, bigint, date, text) from public, anon;
revoke execute on function public.archive_fundraising_goal(text, uuid, text) from public, anon;
grant execute on function public.update_fundraising_goal(text, uuid, text, text, bigint, date, text) to authenticated;
grant execute on function public.archive_fundraising_goal(text, uuid, text) to authenticated;
