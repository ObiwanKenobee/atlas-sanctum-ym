-- Atlas Sanctum v0.2 — database security and foreign-key index hardening.
-- Follow-up to the initial institutional database foundation.

-- Keep the organization directory limited to active organization administrators
-- and active memberships. The SECURITY DEFINER function is intentionally
-- callable only by authenticated users; all referenced relations are qualified.
create or replace function public.list_organization_user_directory(target_organization_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  organization_role text,
  portfolio text,
  governance text,
  joined_at timestamptz
)
language sql
security definer
set search_path = ''
as $function$
  select
    p.user_id,
    u.email::text,
    p.role,
    m.role::text,
    p.portfolio,
    p.governance,
    m.created_at
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  join auth.users u on u.id = m.user_id
  left join public.workspace_profiles p on p.user_id = m.user_id
  where m.organization_id = target_organization_id
    and m.status = 'active'
    and o.status = 'active'
    and exists (
      select 1
      from public.organization_memberships viewer
      where viewer.organization_id = target_organization_id
        and viewer.user_id = (select auth.uid())
        and viewer.status = 'active'
        and viewer.role in ('owner', 'admin')
    )
  order by m.created_at asc;
$function$;

revoke all on function public.list_organization_user_directory(uuid) from public, anon;
grant execute on function public.list_organization_user_directory(uuid) to authenticated;

-- Cover foreign-key lookup columns flagged by Supabase's performance advisor.
create index if not exists organizations_created_by_idx
  on public.organizations (created_by);

create index if not exists projects_created_by_idx
  on public.projects (created_by);

create index if not exists project_memberships_org_user_idx
  on public.project_memberships (organization_id, user_id);

create index if not exists project_memberships_project_org_idx
  on public.project_memberships (project_id, organization_id);

create index if not exists audit_events_actor_idx
  on public.audit_events (actor_id);

create index if not exists audit_events_project_org_idx
  on public.audit_events (project_id, organization_id);

create index if not exists water_actions_approved_by_idx
  on public.water_actions (approved_by);

create index if not exists water_actions_incident_id_idx
  on public.water_actions (incident_id);

create index if not exists water_incidents_service_point_id_idx
  on public.water_incidents (service_point_id);

create index if not exists water_outcomes_action_id_idx
  on public.water_outcomes (action_id);
