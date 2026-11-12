-- Atlas Sanctum v0.2.9 — evidence registry authorization and provenance tests.
--
-- SAFE FOR THE DEDICATED DEVELOPMENT PROJECT ONLY.
-- Two synthetic Auth users and all created records are inside one transaction.
-- The final ROLLBACK removes every fixture. No real identity is created.

begin;

create temp table atlas_evidence_test_ids (
  user_a uuid not null,
  user_b uuid not null,
  organization_a uuid,
  organization_b uuid,
  project_a uuid,
  project_b uuid,
  place_a uuid,
  place_b uuid,
  item_a uuid,
  item_b uuid,
  version_a uuid,
  version_b uuid,
  review_a uuid
) on commit drop;

insert into atlas_evidence_test_ids (user_a, user_b)
values (
  'c3000000-0000-4000-8000-000000000003',
  'd4000000-0000-4000-8000-000000000004'
);

grant select, insert, update on table atlas_evidence_test_ids to authenticated;

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
  select user_a as user_id, 'atlas-evidence-a@example.invalid'::text as email
  from atlas_evidence_test_ids
  union all
  select user_b, 'atlas-evidence-b@example.invalid'
  from atlas_evidence_test_ids
) synthetic_users;

-- Tenant A creates an institution, project, project place and first evidence version.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c3000000-0000-4000-8000-000000000003',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'c3000000-0000-4000-8000-000000000003',
  'steward',
  'Synthetic evidence tenant A',
  'Steward of provenance and evidence quality'
);

update atlas_evidence_test_ids
set organization_a = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Evidence Synthetic Institution A',
    'atlas-evidence-synthetic-a'
  )
);

update atlas_evidence_test_ids ids
set project_a = (
  select project_id
  from public.create_workspace_project(
    ids.organization_a,
    'Nakuru Water Reliability — Test A',
    'nakuru-water-reliability-test-a',
    'Synthetic project for evidence-registry authorization tests.',
    'water_climate'
  )
);

with new_place as (
  insert into public.project_places (
    organization_id, project_id, name, slug, place_type,
    administrative_area, latitude, longitude, description, created_by
  )
  select
    organization_a, project_a, 'Nakuru Town Ward East',
    'nakuru-town-ward-east', 'ward', 'Nakuru County, Kenya',
    -0.2833, 36.0667,
    'Synthetic place anchor for a water reliability evidence test.',
    user_a
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set place_a = (select id from new_place);

with new_item as (
  insert into public.evidence_items (
    organization_id, project_id, place_id, created_by
  )
  select organization_a, project_a, place_a, user_a
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set item_a = (select id from new_item);

with new_version as (
  insert into public.evidence_versions (
    evidence_item_id, organization_id, project_id, version_number,
    evidence_type, title, description, source_type, source_name,
    source_reference, collected_at, collection_method, limitations, submitted_by
  )
  select
    item_a, organization_a, project_a, 1,
    'field_observation',
    'Water point service interruption',
    'Synthetic observation of intermittent supply at the named water point.',
    'field_visit',
    'Atlas synthetic field team',
    'ATLAS-TEST-A-001',
    now(),
    'Structured site observation and operator interview.',
    'Single daytime visit; no independent repeat sample.',
    user_a
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set version_a = (select id from new_version);

-- A version cannot skip a predecessor, even when the submitter is authorized.
do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
  sequence_denied boolean := false;
begin
  select * into strict ids from atlas_evidence_test_ids;
  begin
    insert into public.evidence_versions (
      evidence_item_id, organization_id, project_id, version_number,
      evidence_type, title, description, source_type, source_name,
      collected_at, collection_method, limitations, submitted_by
    )
    values (
      ids.item_a, ids.organization_a, ids.project_a, 3,
      'field_observation', 'Skipped evidence version',
      'This version must not be accepted because version two is missing.',
      'field_visit', 'Atlas synthetic field team', now(),
      'Structured site observation.',
      'Synthetic test intentionally skips version two.',
      ids.user_a
    );
  exception
    when check_violation then sequence_denied := true;
  end;

  if not sequence_denied then
    raise exception 'FAIL: evidence version sequence accepted a skipped version';
  end if;
end;
$test$;

-- A submitter cannot review their own evidence, even when their functional role is steward.
do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
  self_review_denied boolean := false;
begin
  select * into strict ids from atlas_evidence_test_ids;
  begin
    insert into public.evidence_reviews (
      evidence_version_id, evidence_item_id, organization_id, project_id,
      outcome, reviewer_note, reviewer_id
    )
    values (
      ids.version_a, ids.item_a, ids.organization_a, ids.project_a,
      'accepted', 'Self-review must be rejected.', ids.user_a
    );
  exception
    when insufficient_privilege then self_review_denied := true;
  end;

  if not self_review_denied then
    raise exception 'FAIL: evidence submitter reviewed their own version';
  end if;
end;
$test$;

reset role;

-- Tenant B creates its own independent project and evidence.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'd4000000-0000-4000-8000-000000000004',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'd4000000-0000-4000-8000-000000000004',
  'steward',
  'Synthetic evidence tenant B',
  'Steward of provenance and evidence quality'
);

update atlas_evidence_test_ids
set organization_b = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Evidence Synthetic Institution B',
    'atlas-evidence-synthetic-b'
  )
);

update atlas_evidence_test_ids ids
set project_b = (
  select project_id
  from public.create_workspace_project(
    ids.organization_b,
    'Nakuru Water Reliability — Test B',
    'nakuru-water-reliability-test-b',
    'Synthetic project for independent tenant isolation tests.',
    'water_climate'
  )
);

with new_place as (
  insert into public.project_places (
    organization_id, project_id, name, slug, place_type,
    administrative_area, latitude, longitude, description, created_by
  )
  select
    organization_b, project_b, 'Synthetic Tenant B Water Point',
    'tenant-b-water-point', 'water_point', 'Nakuru County, Kenya',
    -0.3000, 36.0800,
    'Synthetic place anchor for tenant B evidence isolation.',
    user_b
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set place_b = (select id from new_place);

with new_item as (
  insert into public.evidence_items (
    organization_id, project_id, place_id, created_by
  )
  select organization_b, project_b, place_b, user_b
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set item_b = (select id from new_item);

with new_version as (
  insert into public.evidence_versions (
    evidence_item_id, organization_id, project_id, version_number,
    evidence_type, title, description, source_type, source_name,
    source_reference, collected_at, collection_method, limitations, submitted_by
  )
  select
    item_b, organization_b, project_b, 1,
    'field_observation',
    'Tenant B water point status',
    'Synthetic observation showing the independent tenant B evidence record.',
    'field_visit',
    'Atlas synthetic field team B',
    'ATLAS-TEST-B-001',
    now(),
    'Structured site observation.',
    'Synthetic data; not an operational measurement.',
    user_b
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set version_b = (select id from new_version);

-- Tenant B cannot see tenant A's known place, item or version identifiers.
do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
begin
  select * into strict ids from atlas_evidence_test_ids;

  if (select count(*) from public.project_places) <> 1
    or exists (select 1 from public.project_places where id = ids.place_a)
  then
    raise exception 'FAIL: tenant B can read tenant A project places';
  end if;

  if (select count(*) from public.evidence_items) <> 1
    or exists (select 1 from public.evidence_items where id = ids.item_a)
  then
    raise exception 'FAIL: tenant B can read tenant A evidence items';
  end if;

  if (select count(*) from public.evidence_versions) <> 1
    or exists (select 1 from public.evidence_versions where id = ids.version_a)
  then
    raise exception 'FAIL: tenant B can read tenant A evidence versions';
  end if;
end;
$test$;

reset role;

-- Tenant A cannot see or write into tenant B's project, even with known IDs.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c3000000-0000-4000-8000-000000000003',
  true
);

do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
  cross_tenant_write_denied boolean := false;
begin
  select * into strict ids from atlas_evidence_test_ids;

  if (select count(*) from public.project_places) <> 1
    or exists (select 1 from public.project_places where id = ids.place_b)
  then
    raise exception 'FAIL: tenant A can read tenant B project places';
  end if;

  if (select count(*) from public.evidence_items) <> 1
    or exists (select 1 from public.evidence_items where id = ids.item_b)
  then
    raise exception 'FAIL: tenant A can read tenant B evidence items';
  end if;

  if (select count(*) from public.evidence_versions) <> 1
    or exists (select 1 from public.evidence_versions where id = ids.version_b)
  then
    raise exception 'FAIL: tenant A can read tenant B evidence versions';
  end if;

  begin
    insert into public.evidence_items (
      organization_id, project_id, place_id, created_by
    )
    values (ids.organization_b, ids.project_b, ids.place_b, ids.user_a);
  exception
    when insufficient_privilege then cross_tenant_write_denied := true;
  end;

  if not cross_tenant_write_denied then
    raise exception 'FAIL: tenant A created evidence in tenant B project';
  end if;
end;
$test$;

-- The project owner explicitly invites B into project A as a contributor/steward.
-- This is a legitimate access grant and happens only after the cross-tenant denial checks.
do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
begin
  select * into strict ids from atlas_evidence_test_ids;

  insert into public.organization_memberships (
    organization_id, user_id, role, status
  )
  values (ids.organization_a, ids.user_b, 'member', 'active');

  insert into public.project_memberships (
    organization_id, project_id, user_id, access_level, functional_role, status
  )
  values (
    ids.organization_a, ids.project_a, ids.user_b,
    'contributor', 'steward', 'active'
  );
end;
$test$;

reset role;

-- The invited second member can independently review A's evidence version.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'd4000000-0000-4000-8000-000000000004',
  true
);

with new_review as (
  insert into public.evidence_reviews (
    evidence_version_id, evidence_item_id, organization_id, project_id,
    outcome, reviewer_note, reviewer_id
  )
  select
    version_a, item_a, organization_a, project_a,
    'accepted',
    'Source metadata and collection method are adequate for this test.',
    user_b
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set review_a = (select id from new_review);

reset role;

-- The original submitter appends version two; version one and its review remain intact.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c3000000-0000-4000-8000-000000000003',
  true
);

with new_version as (
  insert into public.evidence_versions (
    evidence_item_id, organization_id, project_id, version_number,
    evidence_type, title, description, source_type, source_name,
    source_reference, collected_at, collection_method, limitations, submitted_by
  )
  select
    item_a, organization_a, project_a, 2,
    'field_observation',
    'Water point service interruption — corrected record',
    'Corrected synthetic observation with a clearer collection description and limitation.',
    'field_visit',
    'Atlas synthetic field team',
    'ATLAS-TEST-A-001-CORRECTED',
    now(),
    'Repeat structured site observation with an operator confirmation.',
    'Synthetic correction; independent sample still required.',
    user_a
  from atlas_evidence_test_ids
  returning id
)
update atlas_evidence_test_ids
set version_a = (select id from new_version);

-- A project manager may update the project place; the change creates an audit event.
update public.project_places
set description = 'Updated synthetic place anchor; no real service-point data.'
where id = (select place_a from atlas_evidence_test_ids);

-- Application roles cannot rewrite or delete submitted evidence or reviews.
do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
  update_denied boolean := false;
  delete_denied boolean := false;
begin
  select * into strict ids from atlas_evidence_test_ids;

  begin
    update public.evidence_versions
    set title = 'Tampered title'
    where id = ids.version_a;
  exception
    when insufficient_privilege then update_denied := true;
  end;

  begin
    delete from public.evidence_versions
    where id = ids.version_a;
  exception
    when insufficient_privilege then delete_denied := true;
  end;

  if not update_denied or not delete_denied then
    raise exception 'FAIL: authenticated client mutated or deleted immutable evidence versions';
  end if;

  if has_table_privilege('authenticated', 'public.evidence_versions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.evidence_versions', 'DELETE')
    or has_table_privilege('authenticated', 'public.evidence_reviews', 'UPDATE')
    or has_table_privilege('authenticated', 'public.evidence_reviews', 'DELETE')
  then
    raise exception 'FAIL: authenticated clients have update/delete grants on immutable evidence tables';
  end if;

  if has_table_privilege('authenticated', 'public.audit_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.audit_events', 'UPDATE')
    or has_table_privilege('authenticated', 'public.audit_events', 'DELETE')
  then
    raise exception 'FAIL: authenticated clients can write audit events directly';
  end if;

  if has_table_privilege('anon', 'public.evidence_versions', 'SELECT')
    or has_table_privilege('anon', 'public.evidence_versions', 'INSERT')
  then
    raise exception 'FAIL: anonymous clients have evidence table privileges';
  end if;
end;
$test$;

-- Manager A can inspect the review and audit trail for the project.
do $test$
declare
  ids atlas_evidence_test_ids%rowtype;
begin
  select * into strict ids from atlas_evidence_test_ids;

  if (select count(*) from public.evidence_versions where evidence_item_id = ids.item_a) <> 2 then
    raise exception 'FAIL: correction did not preserve both evidence versions';
  end if;

  if not exists (
    select 1
    from public.evidence_reviews
    where id = ids.review_a
      and evidence_version_id = (
        select id from public.evidence_versions
        where evidence_item_id = ids.item_a and version_number = 1
      )
      and outcome = 'accepted'
  ) then
    raise exception 'FAIL: independent review was not preserved against version one';
  end if;

  if not exists (
    select 1 from public.audit_events
    where project_id = ids.project_a
      and entity_type = 'evidence_version'
      and event_type = 'evidence_version.submitted'
  ) then
    raise exception 'FAIL: evidence version audit event was not recorded';
  end if;

  if not exists (
    select 1 from public.audit_events
    where project_id = ids.project_a
      and entity_type = 'evidence_review'
      and event_type = 'evidence_review.recorded'
  ) then
    raise exception 'FAIL: evidence review audit event was not recorded';
  end if;

  if not exists (
    select 1 from public.audit_events
    where project_id = ids.project_a
      and entity_type = 'project_place'
      and event_type = 'project_place.updated'
  ) then
    raise exception 'FAIL: project place change was not audited';
  end if;
end;
$test$;

rollback;
