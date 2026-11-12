-- Fix project creation under the project-scoped SELECT policy.
--
-- PostgreSQL applies SELECT-policy checks to rows returned by INSERT ... RETURNING.
-- The creator's project membership is established by an AFTER INSERT trigger,
-- so the INSERT RETURNING path can be rejected before that membership is visible.
-- Insert without RETURNING, then SELECT after the bootstrap trigger has completed.

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
as $function$
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
  );

  -- The AFTER INSERT trigger has now created creator manager membership and
  -- audit events. The project's SELECT RLS policy therefore permits this read.
  select p.id
    into v_project_id
  from public.projects p
  where p.organization_id = p_organization_id
    and p.created_by = v_user_id
    and p.slug = lower(btrim(p_slug));

  if v_project_id is null then
    raise exception using errcode = '42501', message = 'project_creation_not_visible';
  end if;

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
    and pm.user_id = v_user_id
    and pm.access_level = 'manager'
    and pm.status = 'active';
end;
$function$;

revoke all on function public.create_workspace_project(uuid, text, text, text, text) from public, anon;
grant execute on function public.create_workspace_project(uuid, text, text, text, text) to authenticated;

comment on function public.create_workspace_project(uuid, text, text, text, text) is
  'Creates an organization-scoped project; after-insert triggers bootstrap manager membership and audit events before the RLS-scoped confirmation read.';
