-- Atlas Sanctum v0.2 — close inherited Supabase default grants.
-- Supabase projects may have broad default privileges for authenticated.
-- Revoke explicitly before granting the exact operations required by RLS.

revoke all privileges on table public.organizations
  from public, anon, authenticated;
revoke all privileges on table public.organization_memberships
  from public, anon, authenticated;
revoke all privileges on table public.projects
  from public, anon, authenticated;
revoke all privileges on table public.project_memberships
  from public, anon, authenticated;
revoke all privileges on table public.audit_events
  from public, anon, authenticated;
revoke all privileges on table public.workspace_profiles
  from public, anon, authenticated;

grant select on table public.organizations to authenticated;
grant select, insert on table public.organization_memberships to authenticated;
grant update (role, status) on table public.organization_memberships to authenticated;

grant select, insert on table public.projects to authenticated;
grant select, insert on table public.project_memberships to authenticated;
grant select on table public.audit_events to authenticated;

grant select, insert on table public.workspace_profiles to authenticated;
grant update (portfolio, governance) on table public.workspace_profiles to authenticated;

-- Functional roles describe a person's responsibility, not an independent
-- permission grant. Audit access is restricted to project managers and
-- organization administrators; a self-selected "steward" label is not enough.
create or replace function private.can_read_project_audit(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
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
        and pm.access_level = 'manager'
    );
$function$;

revoke all on function private.can_read_project_audit(uuid, uuid) from public, anon;
grant execute on function private.can_read_project_audit(uuid, uuid) to authenticated;
