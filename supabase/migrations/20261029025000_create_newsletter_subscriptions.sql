create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consented_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions enable row level security;
revoke all on table public.newsletter_subscriptions from anon, authenticated;
grant insert, select, update on table public.newsletter_subscriptions to service_role;

alter table public.pilot_inquiries
  add column if not exists sector text,
  add column if not exists location text,
  add column if not exists consented_at timestamptz;
