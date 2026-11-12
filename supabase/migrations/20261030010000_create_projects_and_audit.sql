-- Atlas Sanctum v0.2 — project, membership and application-append-only audit foundation.
-- Requires: organizations, organization_memberships and canonical workspace_profiles.role.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 3 and 120),
  slug text not null check (slug = lower(slug) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 64),
  purpose text not null check (char_length(btrim(purpose)) between 10 and 2000),
  domain text not null check (domain in ('water_climate', 'agriculture_food', 'programme_accountability', 'cross_cutting')),
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (id, organization_id)
);

create index projects_org_status_created_idx
  on public.projects (organization_id, status, created_at desc);

create table public.project_memberships (
  organization_id uuid not null,
  project_id uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  access_level text not null check (access_level in ('manager', 'contributor', 'viewer')),
  functional_role text not null check (functional_role in ('analyst', 'authorizer', 'implementer', 'verifier', 'steward')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id),
  foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  foreign key (organization_id, user_id)
    references public.organization_memberships(organization_id, user_id) on delete restrict
);

create index project_memberships_user_status_idx
  on public.project_memberships (user_id, status, project_id);

create index project_memberships_org_project_status_idx
  on public.project_memberships (organization_id, project_id, status);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null,
  entity_type text not null check (entity_type in ('project', 'project_membership')),
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict
);

create index audit_events_org_project_created_idx
  on public.audit_events (organization_id, project_id, created_at desc);

create or replace function private.workspace_functional_role(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select wp.role
  from public.workspace_profiles wp
  where wp.user_id = target_user_id;
$$;

create or replace function private.is_project_member(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_memberships pm
    join public.organization_memberships om
      on om.organization_id = pm.organization_id
     and om.user_id = pm.user_id
    join public.organizations o
      on o.id = om.organization_id
    where pm.project_id = target_project_id
      and pm.organization_id = target_organization_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
      and om.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function private.is_project_manager(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_memberships pm
    join public.organization_memberships om
      on om.organization_id = pm.organization_id
     and om.user_id = pm.user_id
    join public.organizations o
      on o.id = om.organization_id
    where pm.project_id = target_project_id
      and pm.organization_id = target_organization_id
      and pm.user_id = (select auth.uid())
      and pm.access_level = 'manager'
      and pm.status = 'active'
      and om.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function private.can_read_project_audit(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_org_admin(target_organization_id)
    or exists (
      select 1
      from public.project_memberships pm
      join public.organization_memberships om
        on om.organization_id = pm.organization_id
       and om.user_id = pm.user_id
      where pm.project_id = target_project_id
        and pm.organization_id = target_organization_id
        and pm.user_id = (select auth.uid())
        and pm.status = 'active'
        and om.status = 'active'
        and (
          pm.access_level = 'manager'
          or pm.functional_role = 'steward'
        )
    );
$$;

revoke all on function private.workspace_functional_role(uuid) from public, anon;
revoke all on function private.is_project_member(uuid, uuid) from public, anon;
revoke all on function private.is_project_manager(uuid, uuid) from public, anon;
revoke all on function private.can_read_project_audit(uuid, uuid) from public, anon;
grant execute on function private.workspace_functional_role(uuid) to authenticated;
grant execute on function private.is_project_member(uuid, uuid) to authenticated;
grant execute on function private.is_project_manager(uuid, uuid) to authenticated;
grant execute on function private.can_read_project_audit(uuid, uuid) to authenticated;

alter table public.projects enable row level security;
alter table public.project_memberships enable row level security;
alter table public.audit_events enable row level security;

create policy projects_select_active_members
  on public.projects
  for select
  to authenticated
  using (private.is_project_member(id, organization_id));

create policy projects_insert_org_admin_creator
  on public.projects
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_org_admin(organization_id)
  );

create policy project_memberships_select_project_members_or_org_admins
  on public.project_memberships
  for select
  to authenticated
  using (
    private.is_project_member(project_id, organization_id)
    or private.is_org_admin(organization_id)
  );

create policy project_memberships_insert_active_org_members
  on public.project_memberships
  for insert
  to authenticated
  with check (
    status = 'active'
    and private.is_active_org_member_for_user(organization_id, user_id)
    and functional_role = private.workspace_functional_role(user_id)
    and (
      (
        private.is_org_admin(organization_id)
        and access_level in ('manager', 'contributor', 'viewer')
      )
      or (
        private.is_project_manager(project_id, organization_id)
        and access_level in ('contributor', 'viewer')
      )
    )
  );

create policy audit_events_select_managers_stewards_or_org_admins
  on public.audit_events
  for select
  to authenticated
  using (private.can_read_project_audit(project_id, organization_id));

-- Audit rows are written only by tightly-scoped trigger functions. Authenticated
-- application roles receive SELECT but no INSERT, UPDATE or DELETE privileges.
create or replace function private.bootstrap_project_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_functional_role text;
begin
  select wp.role
    into v_functional_role
  from public.workspace_profiles wp
  where wp.user_id = new.created_by;

  if v_functional_role is null
    or v_functional_role not in ('analyst', 'authorizer', 'implementer', 'verifier', 'steward')
  then
    raise exception using errcode = '23514', message = 'creator_workspace_profile_required';
  end if;

  insert into public.project_memberships (
    organization_id,
    project_id,
    user_id,
    access_level,
    functional_role,
    status
  )
  values (
    new.organization_id,
    new.id,
    new.created_by,
    'manager',
    v_functional_role,
    'active'
  );

  return new;
end;
$$;

create or replace function private.record_project_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_events (
    organization_id, project_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.organization_id,
    new.id,
    new.created_by,
    'project.created',
    'project',
    new.id,
    jsonb_build_object('slug', new.slug, 'domain', new.domain)
  );

  return new;
end;
$$;

create or replace function private.record_project_membership_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := coalesce((select auth.uid()), new.user_id);

  insert into public.audit_events (
    organization_id, project_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.organization_id,
    new.project_id,
    v_actor_id,
    'project.member_added',
    'project_membership',
    new.user_id,
    jsonb_build_object(
      'user_id', new.user_id,
      'access_level', new.access_level,
      'functional_role', new.functional_role,
      'status', new.status
    )
  );

  return new;
end;
$$;

revoke all on function private.bootstrap_project_creator_membership() from public, anon, authenticated;
revoke all on function private.record_project_created() from public, anon, authenticated;
revoke all on function private.record_project_membership_added() from public, anon, authenticated;

create trigger projects_a_bootstrap_creator_membership
  after insert on public.projects
  for each row execute function private.bootstrap_project_creator_membership();

create trigger projects_z_record_created
  after insert on public.projects
  for each row execute function private.record_project_created();

create trigger project_memberships_record_added
  after insert on public.project_memberships
  for each row execute function private.record_project_membership_added();

revoke all on table public.projects from public, anon;
revoke all on table public.project_memberships from public, anon;
revoke all on table public.audit_events from public, anon;
grant select, insert on table public.projects to authenticated;
grant select, insert on table public.project_memberships to authenticated;
grant select on table public.audit_events to authenticated;

create or replace function public.create_workspace_project(
  p_organization_id uuid,
  p_name text,
  p_slug text,
  p_purpose text,
  p_domain text
)
returns table (
  project_id uuid,
  organization_id uuid,
  project_name text,
  project_slug text,
  project_purpose text,
  project_domain text,
  creator_id uuid,
  membership_user_id uuid,
  membership_project_id uuid,
  membership_access_level text,
  membership_functional_role text,
  membership_status text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_project_id uuid;
  v_functional_role text;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_organization_id is null or not private.is_org_admin(p_organization_id) then
    raise exception using errcode = '42501', message = 'organization_admin_required';
  end if;

  v_functional_role := private.workspace_functional_role(v_user_id);
  if v_functional_role is null
    or v_functional_role not in ('analyst', 'authorizer', 'implementer', 'verifier', 'steward')
  then
    raise exception using errcode = '23514', message = 'workspace_profile_required';
  end if;

  insert into public.projects (
    organization_id, name, slug, purpose, domain, created_by
  )
  values (
    p_organization_id,
    btrim(p_name),
    lower(btrim(p_slug)),
    btrim(p_purpose),
    p_domain,
    v_user_id
  )
  returning id into v_project_id;

  -- The AFTER INSERT trigger creates the creator's manager membership and
  -- both audit events in this same database transaction.
  return query
  select
    p.id,
    p.organization_id,
    p.name,
    p.slug,
    p.purpose,
    p.domain,
    p.created_by,
    pm.user_id,
    pm.project_id,
    pm.access_level,
    pm.functional_role,
    pm.status
  from public.projects p
  join public.project_memberships pm
    on pm.project_id = p.id
   and pm.organization_id = p.organization_id
  where p.id = v_project_id
    and pm.user_id = v_user_id;
end;
$$;

revoke all on function public.create_workspace_project(uuid, text, text, text, text) from public, anon;
grant execute on function public.create_workspace_project(uuid, text, text, text, text) to authenticated;

comment on table public.projects is
  'Organization-scoped institutional project. Creator receives an active project manager membership in the same transaction.';
comment on table public.project_memberships is
  'Project-scoped access level and functional responsibility, constrained to an active organization membership.';
comment on table public.audit_events is
  'Application-role append-only audit history. Authenticated clients can read authorized events but cannot insert, update or delete them.';
comment on function public.create_workspace_project(uuid, text, text, text, text) is
  'Creates an organization-scoped project; a trigger atomically creates creator manager membership and audit events.';
