CREATE OR REPLACE FUNCTION public.submit_project_decision_packet(p_project_id uuid, p_place_id uuid, p_decision_question text, p_recommendation text, p_rationale text, p_uncertainty text, p_consequence_of_no_action text, p_options jsonb, p_evidence_links jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_organization_id uuid;
  v_decision_id uuid;
  v_decision_version_id uuid;
  v_option jsonb;
  v_link jsonb;
  v_option_count integer;
  v_recommended_count integer;
  v_distinct_option_names integer;
  v_evidence_count integer;
  v_distinct_evidence_versions integer;
  v_evidence_version_id uuid;
  v_evidence_item_id uuid;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'authenticated_decision_author_required';
  end if;

  if p_options is null or pg_catalog.jsonb_typeof(p_options) <> 'array' then
    raise exception using errcode = '22023', message = 'decision_options_array_required';
  end if;
  if pg_catalog.jsonb_array_length(p_options) < 2
    or pg_catalog.jsonb_array_length(p_options) > 10
  then
    raise exception using errcode = '22023', message = 'decision_requires_two_to_ten_options';
  end if;

  if p_evidence_links is null or pg_catalog.jsonb_typeof(p_evidence_links) <> 'array' then
    raise exception using errcode = '22023', message = 'decision_evidence_array_required';
  end if;
  if pg_catalog.jsonb_array_length(p_evidence_links) < 1
    or pg_catalog.jsonb_array_length(p_evidence_links) > 20
  then
    raise exception using errcode = '22023', message = 'decision_requires_one_to_twenty_evidence_citations';
  end if;

  for v_option in select value from pg_catalog.jsonb_array_elements(p_options)
  loop
    if pg_catalog.jsonb_typeof(v_option) <> 'object' then
      raise exception using errcode = '22023', message = 'invalid_decision_option_shape';
    end if;
    if not (v_option ?& array['name', 'description', 'expectedBenefit', 'materialRisks', 'isRecommended']) then
      raise exception using errcode = '22023', message = 'invalid_decision_option_shape';
    end if;
    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(v_option) as supplied(key)
      where supplied.key not in (
        'name', 'description', 'expectedBenefit', 'materialRisks',
        'estimatedCost', 'currencyCode', 'isRecommended'
      )
    ) then
      raise exception using errcode = '22023', message = 'invalid_decision_option_shape';
    end if;
    if pg_catalog.jsonb_typeof(v_option->'name') <> 'string'
      or pg_catalog.jsonb_typeof(v_option->'description') <> 'string'
      or pg_catalog.jsonb_typeof(v_option->'expectedBenefit') <> 'string'
      or pg_catalog.jsonb_typeof(v_option->'materialRisks') <> 'string'
      or pg_catalog.jsonb_typeof(v_option->'isRecommended') <> 'boolean'
    then
      raise exception using errcode = '22023', message = 'invalid_decision_option_field_type';
    end if;
    if v_option ? 'estimatedCost'
      and v_option->'estimatedCost' <> 'null'::jsonb
      and pg_catalog.jsonb_typeof(v_option->'estimatedCost') not in ('string', 'number')
    then
      raise exception using errcode = '22023', message = 'invalid_decision_option_cost';
    end if;
    if v_option ? 'currencyCode'
      and v_option->'currencyCode' <> 'null'::jsonb
      and pg_catalog.jsonb_typeof(v_option->'currencyCode') <> 'string'
    then
      raise exception using errcode = '22023', message = 'invalid_decision_option_currency';
    end if;
  end loop;

  select
    count(*),
    count(*) filter (where value->'isRecommended' = 'true'::jsonb),
    count(distinct pg_catalog.lower(pg_catalog.btrim(value->>'name')))
  into v_option_count, v_recommended_count, v_distinct_option_names
  from pg_catalog.jsonb_array_elements(p_options);

  if v_recommended_count <> 1 then
    raise exception using errcode = '22023', message = 'decision_requires_exactly_one_recommended_option';
  end if;
  if v_distinct_option_names <> v_option_count then
    raise exception using errcode = '22023', message = 'decision_option_names_must_be_unique';
  end if;

  for v_link in select value from pg_catalog.jsonb_array_elements(p_evidence_links)
  loop
    if pg_catalog.jsonb_typeof(v_link) <> 'object' then
      raise exception using errcode = '22023', message = 'invalid_decision_evidence_link_shape';
    end if;
    if not (v_link ?& array['evidenceVersionId', 'relevanceNote']) then
      raise exception using errcode = '22023', message = 'invalid_decision_evidence_link_shape';
    end if;
    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(v_link) as supplied(key)
      where supplied.key not in ('evidenceVersionId', 'relevanceNote')
    ) then
      raise exception using errcode = '22023', message = 'invalid_decision_evidence_link_shape';
    end if;
    if pg_catalog.jsonb_typeof(v_link->'evidenceVersionId') <> 'string'
      or pg_catalog.jsonb_typeof(v_link->'relevanceNote') <> 'string'
    then
      raise exception using errcode = '22023', message = 'invalid_decision_evidence_link_field_type';
    end if;
  end loop;

  select
    count(*),
    count(distinct value->>'evidenceVersionId')
  into v_evidence_count, v_distinct_evidence_versions
  from pg_catalog.jsonb_array_elements(p_evidence_links);

  if v_distinct_evidence_versions <> v_evidence_count then
    raise exception using errcode = '22023', message = 'decision_evidence_versions_must_be_unique';
  end if;

  select p.organization_id
    into v_organization_id
  from public.projects p
  where p.id = p_project_id
    and p.status = 'active';

  if not found then
    raise exception using errcode = '42501', message = 'active_project_membership_required';
  end if;

  if p_place_id is not null and not exists (
    select 1
    from public.project_places pp
    where pp.id = p_place_id
      and pp.project_id = p_project_id
      and pp.organization_id = v_organization_id
  ) then
    raise exception using errcode = '23503', message = 'decision_place_must_belong_to_project';
  end if;

  insert into public.decisions (
    organization_id, project_id, place_id, created_by
  )
  values (
    v_organization_id, p_project_id, p_place_id, v_actor_id
  )
  returning id into v_decision_id;

  insert into public.decision_versions (
    decision_id, organization_id, project_id, version_number,
    decision_question, recommendation, rationale, uncertainty,
    consequence_of_no_action, author_id
  )
  values (
    v_decision_id, v_organization_id, p_project_id, 1,
    p_decision_question, p_recommendation, p_rationale, p_uncertainty,
    p_consequence_of_no_action, v_actor_id
  )
  returning id into v_decision_version_id;

  for v_option in select value from pg_catalog.jsonb_array_elements(p_options)
  loop
    insert into public.decision_options (
      decision_version_id, decision_id, organization_id, project_id,
      option_name, description, expected_benefit, material_risks,
      estimated_cost, currency_code, is_recommended, created_by
    )
    values (
      v_decision_version_id, v_decision_id, v_organization_id, p_project_id,
      v_option->>'name', v_option->>'description',
      v_option->>'expectedBenefit', v_option->>'materialRisks',
      nullif(v_option->>'estimatedCost', '')::numeric,
      nullif(pg_catalog.upper(pg_catalog.btrim(v_option->>'currencyCode')), ''),
      (v_option->>'isRecommended')::boolean, v_actor_id
    );
  end loop;

  for v_link in select value from pg_catalog.jsonb_array_elements(p_evidence_links)
  loop
    v_evidence_version_id := (v_link->>'evidenceVersionId')::uuid;

    select ev.evidence_item_id
      into v_evidence_item_id
    from public.evidence_versions ev
    where ev.id = v_evidence_version_id
      and ev.project_id = p_project_id
      and ev.organization_id = v_organization_id;

    if not found then
      raise exception using errcode = '23503', message = 'cited_evidence_version_must_belong_to_project';
    end if;

    insert into public.decision_evidence_links (
      decision_version_id, decision_id, organization_id, project_id,
      evidence_version_id, evidence_item_id, relevance_note, linked_by
    )
    values (
      v_decision_version_id, v_decision_id, v_organization_id, p_project_id,
      v_evidence_version_id, v_evidence_item_id, v_link->>'relevanceNote', v_actor_id
    );
  end loop;

  return pg_catalog.jsonb_build_object(
    'decision_id', v_decision_id,
    'decision_version_id', v_decision_version_id,
    'version_number', 1
  );
end;
$function$
;

REVOKE ALL ON FUNCTION public.submit_project_decision_packet(
  uuid, uuid, text, text, text, text, text, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_project_decision_packet(
  uuid, uuid, text, text, text, text, text, jsonb, jsonb
) TO authenticated;

COMMENT ON FUNCTION public.submit_project_decision_packet(
  uuid, uuid, text, text, text, text, text, jsonb, jsonb
) IS 'Atomically creates an immutable first decision version, its alternatives, and exact project-scoped evidence citations under the caller''s RLS identity.';
