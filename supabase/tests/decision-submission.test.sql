-- Atlas Sanctum v0.2.13 — atomic initial decision proposal submission.
-- Synthetic data only. Run against the dedicated development project; ROLLBACK removes fixtures.
begin;

create temp table atlas_decision_submission_test_ids (
  user_id uuid not null,
  organization_id uuid,
  project_id uuid,
  place_id uuid,
  evidence_item_id uuid,
  evidence_version_id uuid
) on commit drop;
grant select, insert, update on atlas_decision_submission_test_ids to authenticated;
insert into atlas_decision_submission_test_ids(user_id)
values ('e9000000-0000-4000-8000-000000000009');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_super_admin, is_sso_user, is_anonymous
) values (
  'e9000000-0000-4000-8000-000000000009',
  'authenticated', 'authenticated', 'atlas-decision-submit-author@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"atlas_test":true}'::jsonb,
  now(), now(), false, false, false
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e9000000-0000-4000-8000-000000000009', true);

insert into public.workspace_profiles(user_id, role, portfolio, governance)
values (
  'e9000000-0000-4000-8000-000000000009',
  'analyst',
  'Synthetic decision proposal author',
  'Prepares evidence-linked decision proposals for review'
);

update atlas_decision_submission_test_ids
set organization_id = (
  select organization_id from public.create_workspace_organization(
    'Atlas Decision Submission Synthetic Institution',
    'atlas-decision-submission-synthetic'
  )
);

update atlas_decision_submission_test_ids ids
set project_id = (
  select project_id from public.create_workspace_project(
    ids.organization_id,
    'Decision Submission Test Project',
    'decision-submission-test-project',
    'Synthetic project for atomic proposal submission validation.',
    'water_climate'
  )
);

with created as (
  insert into public.project_places (
    organization_id, project_id, name, slug, place_type,
    administrative_area, latitude, longitude, description, created_by
  )
  select organization_id, project_id, 'Synthetic Water Service Zone',
    'synthetic-water-service-zone', 'ward', 'Nakuru County, Kenya',
    -0.2833, 36.0667, 'Synthetic place anchor for decision submission tests.', user_id
  from atlas_decision_submission_test_ids
  returning id
)
update atlas_decision_submission_test_ids set place_id = (select id from created);

with created as (
  insert into public.evidence_items(organization_id, project_id, place_id, created_by)
  select organization_id, project_id, place_id, user_id
  from atlas_decision_submission_test_ids
  returning id
)
update atlas_decision_submission_test_ids set evidence_item_id = (select id from created);

with created as (
  insert into public.evidence_versions (
    evidence_item_id, organization_id, project_id, version_number,
    evidence_type, title, description, source_type, source_name,
    source_reference, collected_at, collection_method, limitations, submitted_by
  )
  select evidence_item_id, organization_id, project_id, 1,
    'field_observation', 'Synthetic intermittent water service observation',
    'Synthetic observation describing intermittent water service in the selected zone.',
    'field_visit', 'Atlas synthetic field team', 'ATLAS-DECISION-SUBMIT-001',
    now(), 'Structured observation and simulated operator interview.',
    'Synthetic fixture only; not a real service measurement.', user_id
  from atlas_decision_submission_test_ids
  returning id
)
update atlas_decision_submission_test_ids set evidence_version_id = (select id from created);

do $test$
declare
  v_result jsonb;
  v_decision_id uuid;
  v_version_id uuid;
  v_count integer;
begin
  select public.submit_project_decision_packet(
    ids.project_id,
    ids.place_id,
    'How should this test zone improve water reliability?',
    'Implement targeted repairs supported by pressure monitoring.',
    'The approach addresses priority failures while generating measurable operating data.',
    'The baseline field measurements remain incomplete.',
    'Service interruptions may continue without a verified remediation plan.',
    '[
      {"name":"Targeted repairs","description":"Repair priority leaks and damaged connections identified in a site audit.","expectedBenefit":"Reduce service interruptions.","materialRisks":"Repair costs may exceed initial estimates.","estimatedCost":"150000.00","currencyCode":"KES","isRecommended":true},
      {"name":"Monitoring only","description":"Install monitoring equipment without committing to immediate repairs.","expectedBenefit":"Improve fault visibility.","materialRisks":"Monitoring alone may not restore service.","isRecommended":false}
    ]'::jsonb,
    jsonb_build_array(jsonb_build_object(
      'evidenceVersionId', ids.evidence_version_id::text,
      'relevanceNote', 'Supports the baseline service reliability assessment.'
    ))
  ) into v_result
  from atlas_decision_submission_test_ids ids;

  v_decision_id := (v_result->>'decision_id')::uuid;
  v_version_id := (v_result->>'decision_version_id')::uuid;
  if v_result->>'version_number' <> '1' then
    raise exception 'unexpected initial decision version number';
  end if;

  select count(*) into v_count
  from public.decision_options
  where decision_id = v_decision_id and decision_version_id = v_version_id;
  if v_count <> 2 then raise exception 'expected two options'; end if;

  select count(*) into v_count
  from public.decision_options
  where decision_id = v_decision_id and decision_version_id = v_version_id and is_recommended;
  if v_count <> 1 then raise exception 'expected exactly one recommendation'; end if;

  select count(*) into v_count
  from public.decision_evidence_links
  where decision_id = v_decision_id
    and decision_version_id = v_version_id
    and evidence_version_id = (select evidence_version_id from atlas_decision_submission_test_ids);
  if v_count <> 1 then raise exception 'expected exact evidence version citation'; end if;

  select count(*) into v_count
  from public.audit_events
  where entity_id in (v_decision_id, v_version_id)
    and event_type in ('decision.created', 'decision.version_submitted');
  if v_count <> 2 then raise exception 'expected decision and version audit events'; end if;

  -- The invalid packet must be rejected before a second decision is inserted.
  begin
    perform public.submit_project_decision_packet(
      (select project_id from atlas_decision_submission_test_ids),
      null,
      'An invalid second proposal should not persist.',
      'A recommendation even though no option is recommended.',
      'This invalid packet is deliberately rejected by database validation rules.',
      'The test does not rely on real field evidence.',
      'A failed test should not create a partial decision identity.',
      '[
        {"name":"Option A","description":"One complete test alternative description.","expectedBenefit":"Test benefit A.","materialRisks":"Test risk A.","isRecommended":false},
        {"name":"Option B","description":"Another complete test alternative description.","expectedBenefit":"Test benefit B.","materialRisks":"Test risk B.","isRecommended":false}
      ]'::jsonb,
      jsonb_build_array(jsonb_build_object(
        'evidenceVersionId', (select evidence_version_id::text from atlas_decision_submission_test_ids),
        'relevanceNote', 'A valid evidence citation for the invalid decision packet.'
      ))
    );
    raise exception using errcode = 'P0001', message = 'invalid_packet_was_not_rejected';
  exception when sqlstate '22023' then
    null;
  end;

  -- The database trust boundary must reject PostgreSQL numeric special values,
  -- even when a caller bypasses the application input validator.
  begin
    perform public.submit_project_decision_packet(
      (select project_id from atlas_decision_submission_test_ids),
      null,
      'How should the synthetic zone improve water reliability?',
      'Implement targeted repairs supported by pressure monitoring.',
      'The approach addresses priority failures while generating measurable operating data.',
      'The baseline field measurements remain incomplete.',
      'Service interruptions may continue without a verified remediation plan.',
      '[
        {"name":"Targeted repairs","description":"Repair priority leaks and damaged connections identified in a site audit.","expectedBenefit":"Reduce service interruptions.","materialRisks":"Repair costs may exceed initial estimates.","estimatedCost":"NaN","currencyCode":"KES","isRecommended":true},
        {"name":"Monitoring only","description":"Install monitoring equipment without committing to immediate repairs.","expectedBenefit":"Improve fault visibility.","materialRisks":"Monitoring alone may not restore service.","isRecommended":false}
      ]'::jsonb,
      jsonb_build_array(jsonb_build_object(
        'evidenceVersionId', (select evidence_version_id::text from atlas_decision_submission_test_ids),
        'relevanceNote', 'Supports the baseline service reliability assessment.'
      ))
    );
    raise exception using errcode = 'P0001', message = 'nan_cost_was_not_rejected';
  exception when sqlstate '22023' then
    null;
  end;

  -- A failure after identity, version and alternatives have been inserted must
  -- roll the entire function call (including its audit events) back.
  begin
    perform public.submit_project_decision_packet(
      (select project_id from atlas_decision_submission_test_ids),
      null,
      'How should the synthetic zone improve water reliability?',
      'Implement targeted repairs supported by pressure monitoring.',
      'The approach addresses priority failures while generating measurable operating data.',
      'The baseline field measurements remain incomplete.',
      'Service interruptions may continue without a verified remediation plan.',
      '[
        {"name":"Targeted repairs","description":"Repair priority leaks and damaged connections identified in a site audit.","expectedBenefit":"Reduce service interruptions.","materialRisks":"Repair costs may exceed initial estimates.","estimatedCost":"150000.00","currencyCode":"KES","isRecommended":true},
        {"name":"Monitoring only","description":"Install monitoring equipment without committing to immediate repairs.","expectedBenefit":"Improve fault visibility.","materialRisks":"Monitoring alone may not restore service.","isRecommended":false}
      ]'::jsonb,
      jsonb_build_array(jsonb_build_object(
        'evidenceVersionId', 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        'relevanceNote', 'This deliberately references no evidence version in the project.'
      ))
    );
    raise exception using errcode = 'P0001', message = 'cross_project_evidence_was_not_rejected';
  exception when sqlstate '23503' then
    null;
  end;

  select count(*) into v_count from public.decisions;
  if v_count <> 1 then raise exception 'failed packet left partial decision identity'; end if;
  select count(*) into v_count from public.decision_versions;
  if v_count <> 1 then raise exception 'failed packet left a partial decision version'; end if;
  select count(*) into v_count from public.decision_options;
  if v_count <> 2 then raise exception 'failed packet left partial decision options'; end if;
  select count(*) into v_count from public.decision_evidence_links;
  if v_count <> 1 then raise exception 'failed packet left partial evidence links'; end if;
  select count(*) into v_count
  from public.audit_events
  where project_id = (select project_id from atlas_decision_submission_test_ids)
    and event_type in ('decision.created', 'decision.version_submitted', 'decision.option_added', 'decision.evidence_linked');
  if v_count <> 5 then raise exception 'failed packet left partial decision audit events'; end if;
end;
$test$;

reset role;
rollback;
