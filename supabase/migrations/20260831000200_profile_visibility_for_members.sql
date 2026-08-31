-- Operational finance views display the member responsible for a record.
-- Keep this limited to active members of the current organization.
drop policy if exists profiles_member_select on public.profiles;
create policy profiles_member_select on public.profiles
for select to authenticated
using (
  exists (
    select 1
    from public.committee_memberships membership
    where membership.organization_id = app_private.current_organization_id()
      and membership.clerk_user_id = profiles.clerk_user_id
      and membership.status = 'active'
      and app_private.is_member(membership.organization_id)
  )
);
