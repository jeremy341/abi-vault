create table if not exists public.demo_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.demo_state enable row level security;
