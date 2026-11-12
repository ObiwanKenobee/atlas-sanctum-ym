-- Atlas Sanctum v0.2 — two-tenant database isolation smoke test.
--
-- SAFE FOR THE DEDICATED DEVELOPMENT PROJECT ONLY.
-- Creates two synthetic auth users inside a transaction and rolls everything
-- back. Do not run against production. No passwords or external identities are
-- created. Tests run under the authenticated database role with auth.uid()
-- populated as PostgREST would populate it.
--
-- Run with the Supabase SQL runner as a privileged database role:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tenant-isolation.test.sql
--
-- The test intentionally checks application-visible RLS, not merely policy
-- catalog presence or service-role behavior.

begin;

create temp table atlas_tenant_test_ids (
  user_a uuid not null,
  user_b uuid not null,
  organization_a uuid,
  organization_b uuid,
  project_a uuid,
  project_b uuid
) on commit drop;

insert into atlas_tenant_test_ids (user_a, user_b)
values (
  'a1000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002'
);

grant select, insert, update on table atlas_tenant_test_ids to authenticated;

-- Synthetic Auth records exist only for the lifetime of this transaction.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_super_admin, is_sso_user, is_anonymous
)
select
  user_id,
  'authenticated',
  'authenticated',
  email,
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"atlas_test":true}'::jsonb,
  now(),
  now(),
  false,
  false,
  false
from (
  select user_a as user_id, 'atlas-tenant-a-test@example.invalid'::text as email
  from atlas_tenant_test_ids
  union all
  select user_b, 'atlas-tenant-b-test@example.invalid'
  from atlas_tenant_test_ids
) synthetic_users;

-- Institution A establishes its own workspace profile and organization.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a1000000-0000-4000-8000-000000000001',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'a1000000-0000-4000-8000-000000000001',
  'analyst',
  'Synthetic tenant A',
  'I contribute evidence and recommendations'
);

update atlas_tenant_test_ids
set organization_a = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Synthetic Institution A',
    'atlas-synthetic-tenant-a-v028'
  )
);

update atlas_tenant_test_ids ids
set project_a = (
  select project_id
  from public.create_workspace_project(
    ids.organization_a,
    'Synthetic Tenant A Project',
    'synthetic-tenant-a-project',
    'Synthetic project used to validate institution-level isolation.',
    'water_climate'
  )
);

reset role;

-- Institution B establishes its own workspace profile and organization.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b2000000-0000-4000-8000-000000000002',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'b2000000-0000-4000-8000-000000000002',
  'implementer',
  'Synthetic tenant B',
  'I contribute evidence and recommendations'
);

update atlas_tenant_test_ids
set organization_b = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Synthetic Institution B',
    'atlas-synthetic-tenant-b-v028'
  )
);

update atlas_tenant_test_ids ids
set project_b = (
  select project_id
  from public.create_workspace_project(
    ids.organization_b,
    'Synthetic Tenant B Project',
    'synthetic-tenant-b-project',
    'Synthetic project used to validate institution-level isolation.',
    'agriculture_food'
  )
);

-- As Institution B, verify only B's bootstrap and audit records here.
do $test$
declare
  ids atlas_tenant_test_ids%rowtype;
begin
  select * into strict ids from atlas_tenant_test_ids;

  if not exists (
    select 1 from public.project_memberships
    where organization_id = ids.organization_b
      and project_id = ids.project_b
      and user_id = ids.user_b
      and access_level = 'manager'
      and functional_role = 'implementer'
      and status = 'active'
  ) then
    raise exception 'FAIL: tenant B creator manager membership was not bootstrapped';
  end if;

  if (select count(*) from public.audit_events where project_id = ids.project_b) <> 2 then
    raise exception 'FAIL: tenant B expected project/member audit events';
  end if;
end;
$test$;

-- Switch to Institution A. B's organization, project, memberships, audit and
-- directory results must all be invisible even with known UUIDs.
select set_config(
  'request.jwt.claim.sub',
  'a1000000-0000-4000-8000-000000000001',
  true
);

do $test$
declare
  ids atlas_tenant_test_ids%rowtype;
begin
  select * into strict ids from atlas_tenant_test_ids;

  if (select count(*) from public.organizations) <> 1 then
    raise exception 'FAIL: tenant A must see exactly one organization';
  end if;
  if exists (select 1 from public.organizations where id = ids.organization_b) then
    raise exception 'FAIL: tenant A can read tenant B organization';
  end if;
  if (select count(*) from public.projects) <> 1 then
    raise exception 'FAIL: tenant A must see exactly one project';
  end if;
  if not exists (
    select 1 from public.project_memberships
    where organization_id = ids.organization_a
      and project_id = ids.project_a
      and user_id = ids.user_a
      and access_level = 'manager'
      and functional_role = 'analyst'
      and status = 'active'
  ) then
    raise exception 'FAIL: tenant A creator manager membership was not bootstrapped';
  end if;
  if (select count(*) from public.audit_events where project_id = ids.project_a) <> 2 then
    raise exception 'FAIL: tenant A expected project/member audit events';
  end if;
  if exists (select 1 from public.projects where id = ids.project_b) then
    raise exception 'FAIL: tenant A can read tenant B project by UUID';
  end if;
  if exists (
    select 1 from public.project_memberships
    where project_id = ids.project_b
  ) then
    raise exception 'FAIL: tenant A can read tenant B project membership';
  end if;
  if exists (
    select 1 from public.audit_events
    where project_id = ids.project_b
  ) then
    raise exception 'FAIL: tenant A can read tenant B audit events';
  end if;
  if exists (
    select 1 from public.organization_memberships
    where organization_id = ids.organization_b
  ) then
    raise exception 'FAIL: tenant A can read tenant B organization memberships';
  end if;
  if exists (
    select 1 from public.list_organization_user_directory(ids.organization_b)
  ) then
    raise exception 'FAIL: tenant A can read tenant B organization directory';
  end if;
end;
$test$;

-- Institution A cannot create a project in Institution B.
do $test$
declare
  ids atlas_tenant_test_ids%rowtype;
  denied boolean := false;
begin
  select * into strict ids from atlas_tenant_test_ids;
  begin
    perform public.create_workspace_project(
      ids.organization_b,
      'Cross Tenant Attempt A',
      'cross-tenant-attempt-a',
      'This attempt must be rejected because the actor is not an org admin.',
      'water_climate'
    );
  exception
    when insufficient_privilege then denied := true;
  end;
  if not denied then
    raise exception 'FAIL: tenant A created project in tenant B';
  end if;
end;
$test$;

-- Switch to Institution B and prove the reverse direction is equally isolated.
select set_config(
  'request.jwt.claim.sub',
  'b2000000-0000-4000-8000-000000000002',
  true
);

do $test$
declare
  ids atlas_tenant_test_ids%rowtype;
begin
  select * into strict ids from atlas_tenant_test_ids;

  if (select count(*) from public.organizations) <> 1 then
    raise exception 'FAIL: tenant B must see exactly one organization';
  end if;
  if exists (select 1 from public.organizations where id = ids.organization_a) then
    raise exception 'FAIL: tenant B can read tenant A organization';
  end if;
  if (select count(*) from public.projects) <> 1 then
    raise exception 'FAIL: tenant B must see exactly one project';
  end if;
  if exists (select 1 from public.projects where id = ids.project_a) then
    raise exception 'FAIL: tenant B can read tenant A project by UUID';
  end if;
  if exists (
    select 1 from public.project_memberships
    where project_id = ids.project_a
  ) then
    raise exception 'FAIL: tenant B can read tenant A project membership';
  end if;
  if exists (
    select 1 from public.audit_events
    where project_id = ids.project_a
  ) then
    raise exception 'FAIL: tenant B can read tenant A audit events';
  end if;
  if exists (
    select 1 from public.organization_memberships
    where organization_id = ids.organization_a
  ) then
    raise exception 'FAIL: tenant B can read tenant A organization memberships';
  end if;
  if exists (
    select 1 from public.list_organization_user_directory(ids.organization_a)
  ) then
    raise exception 'FAIL: tenant B can read tenant A organization directory';
  end if;
end;
$test$;

-- Verify the database-level tenant-consistency foreign keys independently of
-- RLS: mismatched project/organization pairs must fail even for a privileged
-- database operator.
reset role;

do $test$
declare
  ids atlas_tenant_test_ids%rowtype;
  denied boolean := false;
begin
  select * into strict ids from atlas_tenant_test_ids;
  begin
    insert into public.project_memberships (
      organization_id, project_id, user_id, access_level, functional_role, status
    )
    values (
      ids.organization_b, ids.project_a, ids.user_b,
      'viewer', 'implementer', 'active'
    );
  exception
    when foreign_key_violation then denied := true;
  end;
  if not denied then
    raise exception 'FAIL: database accepted mismatched project/organization membership';
  end if;
end;
$test$;

-- Ensure append-only audit and trusted identity privileges remain enforced.
do $test$
begin
  if has_table_privilege('authenticated', 'public.audit_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.audit_events', 'UPDATE')
    or has_table_privilege('authenticated', 'public.audit_events', 'DELETE')
  then
    raise exception 'FAIL: authenticated clients have direct audit write privileges';
  end if;
  if has_table_privilege('authenticated', 'public.organizations', 'INSERT') then
    raise exception 'FAIL: authenticated clients can bypass organization bootstrap RPC';
  end if;
  if has_column_privilege('authenticated', 'public.workspace_profiles', 'role', 'UPDATE') then
    raise exception 'FAIL: authenticated clients can self-change functional role';
  end if;
end;
$test$;

-- All synthetic auth and application rows are removed, including audit events.
rollback;
