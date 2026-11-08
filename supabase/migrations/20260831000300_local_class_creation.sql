create or replace function public.create_local_class(p_name text)
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

  insert into public.profiles (clerk_user_id, display_name, email, status)
  values ('user_local_admin', 'Demo User', 'admin@example.test', 'active')
  on conflict (clerk_user_id) do nothing;

  insert into public.committees (organization_id, name)
  values (new_organization_id, btrim(p_name));

  insert into public.committee_memberships (
    organization_id, clerk_user_id, role, status
  ) values (
    new_organization_id, 'user_local_admin', 'admin', 'active'
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
    (new_organization_id, 'Veranstaltung', 'expense', 10),
    (new_organization_id, 'Material', 'expense', 20),
    (new_organization_id, 'Sonstiges', 'expense', 30),
    (new_organization_id, 'Spenden', 'income', 40),
    (new_organization_id, 'Sales', 'income', 50);

  return new_organization_id;
end;
$$;

revoke all on function public.create_local_class(text) from public, anon, authenticated;
grant execute on function public.create_local_class(text) to service_role;
