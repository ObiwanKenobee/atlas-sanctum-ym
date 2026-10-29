create table if not exists public.water_service_points (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, region text not null, latitude numeric, longitude numeric, service_type text not null,
  current_status text not null default 'unknown' check (current_status in ('operational','intermittent','offline','unknown')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.water_incidents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  service_point_id uuid not null references public.water_service_points(id) on delete cascade, reported_at timestamptz not null default now(),
  problem text not null, severity text not null check (severity in ('low','medium','high','critical')), evidence text not null,
  source_reference text, confidence text not null default 'medium' check (confidence in ('low','medium','high')), status text not null default 'reported' check (status in ('reported','assessed','approved','assigned','resolved','verified')),
  created_at timestamptz not null default now()
);
create table if not exists public.water_actions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  incident_id uuid not null references public.water_incidents(id) on delete cascade, recommendation text not null, rationale text not null, limitation text not null,
  approved_by uuid references auth.users(id), assigned_to text, status text not null default 'proposed' check (status in ('proposed','approved','assigned','in_progress','completed')), approved_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.water_outcomes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid not null references public.water_actions(id) on delete cascade, verified_at timestamptz not null default now(), restoration_status text not null check (restoration_status in ('not_restored','partially_restored','restored','unknown')), response_time_hours numeric, verification_note text not null, created_at timestamptz not null default now()
);
create index if not exists water_points_user_idx on public.water_service_points(user_id);
create index if not exists water_incidents_user_idx on public.water_incidents(user_id, created_at desc);
create index if not exists water_actions_user_idx on public.water_actions(user_id, created_at desc);
create index if not exists water_outcomes_user_idx on public.water_outcomes(user_id, created_at desc);

do $$ declare t text; begin foreach t in array array['water_service_points','water_incidents','water_actions','water_outcomes'] loop execute format('alter table public.%I enable row level security', t); execute format('grant select, insert, update, delete on public.%I to authenticated', t); execute format('create policy "Users own %1$s" on public.%1$s for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t); end loop; end $$;
