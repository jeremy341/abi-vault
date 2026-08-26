alter table public.organization_invite_links
  alter column role set default 'supervisor';

update public.committee_memberships
set role = 'supervisor', updated_at = now()
where role = 'student'
  and status = 'active';
