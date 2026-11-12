-- Atlas Sanctum v0.2 — organization and organization-membership foundation.
-- This migration intentionally precedes the workspace role migration, which
-- depends on public.organization_memberships.
--
-- Security model:
-- - organization creation is an authenticated, atomic owner bootstrap;
-- - membership rows are visible to the member and organization administrators;
-- - only owners/admins may add or manage non-owner memberships;
-- - an owner's membership cannot be edited or removed through the Data API;
-- - private helper functions are not exposed through the Supabase Data API.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 64),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_memberships_user_status_idx
  on public.organization_memberships (user_id, status, organization_id);

create index organization_memberships_org_role_status_idx
  on public.organization_memberships (organization_id, role, status);

create or replace function private.is_org_creator(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = target_organization_id
      and o.created_by = (select auth.uid())
  );
$$;

create or replace function private.is_active_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function private.is_active_org_member_for_user(
  target_organization_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_organization_id
      and m.user_id = target_user_id
      and m.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function private.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.status = 'active'
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_org_creator(uuid) from public, anon;
revoke all on function private.is_active_org_member(uuid) from public, anon;
revoke all on function private.is_active_org_member_for_user(uuid, uuid) from public, anon;
revoke all on function private.is_org_admin(uuid) from public, anon;
grant execute on function private.is_org_creator(uuid) to authenticated;
grant execute on function private.is_active_org_member(uuid) to authenticated;
grant execute on function private.is_active_org_member_for_user(uuid, uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

create policy organizations_select_active_members
  on public.organizations
  for select
  to authenticated
  using (private.is_active_org_member(id));

create policy organization_memberships_select_self_or_admin
  on public.organization_memberships
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_org_admin(organization_id)
  );

create policy organization_memberships_insert_owner_bootstrap_or_admin
  on public.organization_memberships
  for insert
  to authenticated
  with check (
    status = 'active'
    and (
      (
        user_id = (select auth.uid())
        and role = 'owner'
        and private.is_org_creator(organization_id)
      )
      or (
        role in ('admin', 'member', 'viewer')
        and private.is_org_admin(organization_id)
      )
    )
  );

create policy organization_memberships_update_non_owner_by_admin
  on public.organization_memberships
  for update
  to authenticated
  using (
    role <> 'owner'
    and private.is_org_admin(organization_id)
  )
  with check (
    role <> 'owner'
    and private.is_org_admin(organization_id)
  );

revoke all on table public.organizations from public, anon;
revoke all on table public.organization_memberships from public, anon;
grant usage on schema public to authenticated;
grant select on table public.organizations to authenticated;
grant select, insert on table public.organization_memberships to authenticated;
grant update (role, status) on table public.organization_memberships to authenticated;

create or replace function public.create_workspace_organization(
  p_name text,
  p_slug text
)
returns table (
  organization_id uuid,
  organization_name text,
  organization_slug text,
  membership_user_id uuid,
  membership_role text,
  membership_status text
)
language plpgsql
security definer
set search_path = ''
as $
declare
  v_user_id uuid;
  v_organization_id uuid;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 2 and 160 then
    raise exception using errcode = '22023', message = 'invalid_organization_name';
  end if;

  if p_slug is null
    or char_length(lower(btrim(p_slug))) not between 3 and 64
    or lower(btrim(p_slug)) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception using errcode = '22023', message = 'invalid_organization_slug';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (btrim(p_name), lower(btrim(p_slug)), v_user_id)
  returning id into v_organization_id;

  insert into public.organization_memberships (
    organization_id, user_id, role, status
  )
  values (v_organization_id, v_user_id, 'owner', 'active');

  return query
  select
    o.id,
    o.name,
    o.slug,
    m.user_id,
    m.role,
    m.status
  from public.organizations o
  join public.organization_memberships m
    on m.organization_id = o.id
  where o.id = v_organization_id
    and m.user_id = v_user_id;
end;
$$;

revoke all on function public.create_workspace_organization(text, text) from public, anon;
grant execute on function public.create_workspace_organization(text, text) to authenticated;

comment on table public.organizations is
  'Institutional tenant boundary for Atlas Sanctum. Organization records are created with an atomic owner membership.';
comment on table public.organization_memberships is
  'Organization-scoped access. Owner memberships cannot be modified or removed through the authenticated Data API.';
comment on function public.create_workspace_organization(text, text) is
  'Atomically creates an organization and its authenticated creator owner membership.';
