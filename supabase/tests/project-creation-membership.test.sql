-- Atlas Sanctum v0.2.12 — organization/project creation and membership authorization.
--
-- SAFE FOR THE DEDICATED DEVELOPMENT PROJECT ONLY.
-- Three synthetic Auth users and all records are inside one transaction.
-- The final ROLLBACK removes every fixture.

begin;

create temp table atlas_project_membership_test_ids (
  owner_id uuid not null,
  member_id uuid not null,
  other_member_id uuid not null,
  organization_id uuid,
  project_id uuid
) on commit drop;

insert into atlas_project_membership_test_ids (
  owner_id, member_id, other_member_id
) values (
  'a7100000-0000-4000-8000-000000000001',
  'a7200000-0000-4000-8000-000000000002',
  'a7300000-0000-4000-8000-000000000003'
);

grant select, insert, update on table atlas_project_membership_test_ids to authenticated;

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
  select owner_id as user_id, 'atlas-project-owner@example.invalid'::text as email
  from atlas_project_membership_test_ids
  union all
  select member_id, 'atlas-project-member@example.invalid'
  from atlas_project_membership_test_ids
  union all
  select other_member_id, 'atlas-project-other-member@example.invalid'
  from atlas_project_membership_test_ids
) synthetic_users;

-- The authenticated owner creates a persisted functional profile and
-- atomically creates an organization with an owner membership.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a7100000-0000-4000-8000-000000000001',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'a7100000-0000-4000-8000-000000000001',
  'analyst',
  'Synthetic project owner',
  'Creates scoped projects and manages their organization'
);

update atlas_project_membership_test_ids
set organization_id = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Project Membership Synthetic Organization',
    'atlas-project-membership-synthetic'
  )
);

-- The existing project RPC inserts without RETURNING, and database triggers
-- establish the creator's manager membership and project audit record.
update atlas_project_membership_test_ids ids
set project_id = (
  select project_id
  from public.create_workspace_project(
    ids.organization_id,
    'Synthetic Project Membership Test',
    'synthetic-project-membership-test',
    'Synthetic project used to test atomic manager membership and scoped additions.',
    'programme_accountability'
  )
);

-- Users register their own functional roles. These are not submitted by
-- another user's project-membership request.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a7200000-0000-4000-8000-000000000002',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'a7200000-0000-4000-8000-000000000002',
  'implementer',
  'Synthetic project contributor',
  'Records authorized implementation updates'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a7300000-0000-4000-8000-000000000003',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'a7300000-0000-4000-8000-000000000003',
  'verifier',
  'Synthetic project reviewer',
  'Reviews outcomes independently'
);

-- The organization owner adds both users as organization members.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a7100000-0000-4000-8000-000000000001',
  true
);

insert into public.organization_memberships (
  organization_id, user_id, role, status
)
select organization_id, member_id, 'member', 'active'
from atlas_project_membership_test_ids
union all
select organization_id, other_member_id, 'member', 'active'
from atlas_project_membership_test_ids;

-- The owner can assign an active organization member. The functional role
-- must match the target user's persisted workspace profile.
insert into public.project_memberships (
  organization_id, project_id, user_id, access_level, functional_role, status
)
select
  organization_id, project_id, member_id, 'contributor', 'implementer', 'active'
from atlas_project_membership_test_ids;

do $test$
declare
  ids atlas_project_membership_test_ids%rowtype;
begin
  select * into strict ids from atlas_project_membership_test_ids;

  if not exists (
    select 1
    from public.project_memberships
    where project_id = ids.project_id
      and organization_id = ids.organization_id
      and user_id = ids.owner_id
      and access_level = 'manager'
      and functional_role = 'analyst'
      and status = 'active'
  ) then
    raise exception 'FAIL: project creation did not atomically bootstrap the authenticated owner as active manager';
  end if;

  if not exists (
    select 1
    from public.project_memberships
    where project_id = ids.project_id
      and organization_id = ids.organization_id
      and user_id = ids.member_id
      and access_level = 'contributor'
      and functional_role = 'implementer'
      and status = 'active'
  ) then
    raise exception 'FAIL: organization admin could not add an existing active organization member';
  end if;

  if not exists (
    select 1 from public.audit_events
    where project_id = ids.project_id
      and organization_id = ids.organization_id
      and entity_type = 'project'
      and event_type = 'project.created'
  ) then
    raise exception 'FAIL: project creation audit event missing';
  end if;

  if not exists (
    select 1 from public.audit_events
    where project_id = ids.project_id
      and organization_id = ids.organization_id
      and entity_type = 'project_membership'
      and event_type = 'project.member_added'
      and entity_id = ids.member_id
  ) then
    raise exception 'FAIL: project member-added audit event missing';
  end if;
end;
$test$;

-- The ordinary project contributor cannot add a second member. The database
-- policy permits project managers or organization admins, not contributors.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a7200000-0000-4000-8000-000000000002',
  true
);

do $test$
declare
  ids atlas_project_membership_test_ids%rowtype;
  denied boolean := false;
begin
  select * into strict ids from atlas_project_membership_test_ids;

  begin
    insert into public.project_memberships (
      organization_id, project_id, user_id, access_level, functional_role, status
    )
    values (
      ids.organization_id, ids.project_id, ids.other_member_id,
      'viewer', 'verifier', 'active'
    );
  exception
    when insufficient_privilege then denied := true;
  end;

  if not denied then
    raise exception 'FAIL: a project contributor added a member without manager or organization-admin authority';
  end if;

  if exists (
    select 1 from public.project_memberships
    where project_id = ids.project_id
      and user_id = ids.other_member_id
  ) then
    raise exception 'FAIL: unauthorized project membership row exists';
  end if;

  if exists (
    select 1
    from public.list_organization_user_directory(ids.organization_id)
  ) then
    raise exception 'FAIL: non-admin project contributor accessed the organization user directory';
  end if;
end;
$test$;

rollback;
