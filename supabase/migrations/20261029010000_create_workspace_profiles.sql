create table if not exists public.workspace_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  portfolio text not null,
  governance text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_profiles enable row level security;

grant select, insert, update on public.workspace_profiles to authenticated;

create policy "Users can view their own workspace profile"
  on public.workspace_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own workspace profile"
  on public.workspace_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own workspace profile"
  on public.workspace_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
