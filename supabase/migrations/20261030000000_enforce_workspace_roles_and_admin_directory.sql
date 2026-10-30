update public.workspace_profiles set role = 'authorizer' where role = 'Program lead';

alter table public.workspace_profiles drop constraint if exists workspace_profiles_role_check;
alter table public.workspace_profiles add constraint workspace_profiles_role_check check (role in ('analyst','authorizer','implementer','verifier','steward'));

create or replace function public.list_organization_user_directory(target_organization_id uuid)
returns table (user_id uuid, email text, role text, organization_role text, portfolio text, governance text, joined_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select p.user_id, u.email::text, p.role, m.role::text, p.portfolio, p.governance, m.created_at
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id
  left join public.workspace_profiles p on p.user_id = m.user_id
  where m.organization_id = target_organization_id
    and exists (select 1 from public.organization_memberships viewer where viewer.organization_id = target_organization_id and viewer.user_id = (select auth.uid()) and viewer.role in ('owner','admin'))
  order by m.created_at asc;
$$;

revoke all on function public.list_organization_user_directory(uuid) from public;
grant execute on function public.list_organization_user_directory(uuid) to authenticated;
