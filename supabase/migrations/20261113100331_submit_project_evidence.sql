create or replace function public.submit_project_evidence(
  p_project_id uuid,
  p_place_id uuid,
  p_evidence_type text,
  p_title text,
  p_description text,
  p_source_type text,
  p_source_name text,
  p_source_reference text,
  p_source_url text,
  p_collected_at timestamptz,
  p_collection_method text,
  p_limitations text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_organization_id uuid;
  v_evidence_item_id uuid;
  v_evidence_version_id uuid;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'authenticated_evidence_submitter_required';
  end if;

  select p.organization_id
    into v_organization_id
  from public.projects p
  where p.id = p_project_id
    and p.status = 'active';

  if not found then
    raise exception using errcode = '42501', message = 'active_project_membership_required';
  end if;

  if p_place_id is null or not exists (
    select 1
    from public.project_places pp
    where pp.id = p_place_id
      and pp.project_id = p_project_id
      and pp.organization_id = v_organization_id
  ) then
    raise exception using errcode = '23503', message = 'evidence_place_must_belong_to_project';
  end if;

  insert into public.evidence_items (
    organization_id, project_id, place_id, created_by
  )
  values (
    v_organization_id, p_project_id, p_place_id, v_actor_id
  )
  returning id into v_evidence_item_id;

  insert into public.evidence_versions (
    evidence_item_id, organization_id, project_id, version_number,
    evidence_type, title, description, source_type, source_name,
    source_reference, source_url, collected_at, collection_method,
    limitations, submitted_by
  )
  values (
    v_evidence_item_id, v_organization_id, p_project_id, 1,
    p_evidence_type, p_title, p_description, p_source_type, p_source_name,
    p_source_reference, p_source_url, p_collected_at, p_collection_method,
    p_limitations, v_actor_id
  )
  returning id into v_evidence_version_id;

  return pg_catalog.jsonb_build_object(
    'evidence_item_id', v_evidence_item_id,
    'evidence_version_id', v_evidence_version_id,
    'version_number', 1
  );
end;
$function$;

revoke all on function public.submit_project_evidence(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz, text, text
) from public, anon, authenticated;

grant execute on function public.submit_project_evidence(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz, text, text
) to authenticated;

comment on function public.submit_project_evidence(
  uuid, uuid, text, text, text, text, text, text, text, timestamptz, text, text
) is 'Atomically creates one project/place-scoped evidence identity and immutable first provenance version under the authenticated caller''s RLS identity.';
