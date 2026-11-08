-- Local demo (Supabase-backed, not the in-memory demo): any demo person can create
-- a class and becomes its administrator. Category names match the bootstrap defaults.

drop function if exists public.create_local_class(text);

create or replace function public.create_local_class(p_name text, p_clerk_user_id text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  new_organization_id text := 'org_local_' || gen_random_uuid()::text;
  current_year smallint := extract(year from current_date)::smallint;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Local class creation requires the server service role.'
      using errcode = '42501';
  end if;

  if p_name is null or length(btrim(p_name)) < 2 or length(btrim(p_name)) > 120 then
    raise exception 'Class name must be between 2 and 120 characters.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles
    where clerk_user_id = p_clerk_user_id and status = 'active'
  ) then
    raise exception 'The demo person does not exist.'
      using errcode = '23503';
  end if;

  insert into public.committees (organization_id, name)
  values (new_organization_id, btrim(p_name));

  insert into public.committee_memberships (
    organization_id, clerk_user_id, role, status
  ) values (
    new_organization_id, p_clerk_user_id, 'admin', 'active'
  );

  insert into public.committee_settings (
    organization_id, graduation_year, currency, timezone
  ) values (
    new_organization_id, current_year, 'USD', 'Europe/Berlin'
  );

  insert into public.accounting_periods (organization_id, year, month)
  select new_organization_id, current_year, month_number
  from generate_series(1, 12) as month_series(month_number);

  insert into public.categories (organization_id, name, kind, display_order)
  values
    (new_organization_id, 'Event', 'expense', 10),
    (new_organization_id, 'Supplies', 'expense', 20),
    (new_organization_id, 'Other', 'expense', 30),
    (new_organization_id, 'Donations', 'income', 40),
    (new_organization_id, 'Sales', 'income', 50);

  return new_organization_id;
end;
$$;

revoke all on function public.create_local_class(text, text) from public, anon, authenticated;
grant execute on function public.create_local_class(text, text) to service_role;
