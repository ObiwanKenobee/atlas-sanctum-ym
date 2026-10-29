create table if not exists public.field_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  region text not null check (char_length(region) between 2 and 120),
  category text not null check (category in ('Water access', 'Food systems', 'Climate resilience', 'Public health', 'Other')),
  observed_on date not null,
  summary text not null check (char_length(summary) between 10 and 3000),
  source_name text check (source_name is null or char_length(source_name) <= 160),
  status text not null default 'submitted' check (status in ('draft', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists field_records_user_created_idx on public.field_records(user_id, created_at desc);
alter table public.field_records enable row level security;
grant select, insert, update, delete on public.field_records to authenticated;

create policy "Users can view their own field records" on public.field_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own field records" on public.field_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own field records" on public.field_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own field records" on public.field_records for delete to authenticated using ((select auth.uid()) = user_id);
