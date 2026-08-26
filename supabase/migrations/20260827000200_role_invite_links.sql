create table if not exists public.organization_invite_links (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.committees(organization_id) on delete cascade,
  token_hash text not null unique,
  role public.app_role not null default 'student',
  created_by text not null references public.profiles(clerk_user_id) on delete restrict,
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (uses <= max_uses)
);

create index if not exists organization_invite_links_org_idx
  on public.organization_invite_links (organization_id, created_at desc);

alter table public.organization_invite_links enable row level security;
revoke all on table public.organization_invite_links from anon, authenticated;
