create table if not exists public.pilot_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  role text,
  scope text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.pilot_inquiries enable row level security;

revoke all on table public.pilot_inquiries from anon, authenticated;
grant insert on table public.pilot_inquiries to service_role;
