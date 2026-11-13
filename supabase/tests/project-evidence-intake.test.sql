
-- Atlas Sanctum v0.2.15 — project evidence intake and independent review tests.
-- Synthetic data only. Run against the dedicated development project; ROLLBACK removes fixtures.
begin;

create temp table atlas_project_evidence_intake_ids (
  analyst_id uuid not null,
  verifier_id uuid not null,
  organization_id uuid,
  project_id uuid,
  place_id uuid,
  evidence_item_id uuid,
  evidence_version_id uuid
) on commit drop;

insert into atlas_project_evidence_intake_ids (analyst_id, verifier_id)
values (
  'f1000000-0000-4000-8000-000000000001',
  'f2000000-0000-4000-8000-000000000002'
);
grant select, insert, update on atlas_project_evidence_intake_ids to authenticated;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_super_admin, is_sso_user, is_anonymous
)
values
(
  'f1000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'atlas-place-evidence-analyst@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"atlas_test":true}'::jsonb,
  now(), now(), false, false, false
),
(
  'f2000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated', 'atlas-place-evidence-verifier@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"atlas_test":true}'::jsonb,
  now(), now(), false, false, false
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

insert into public.workspace_profiles(user_id, role, portfolio, governance)
values (
  'f1000000-0000-4000-8000-000000000001',
  'analyst',
  'Synthetic evidence intake author',
  'Submits source-attributed project evidence'
);

update atlas_project_evidence_intake_ids
set organization_id = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Project Evidence Synthetic Institution',
    'atlas-project-evidence-synthetic'
  )
);

update atlas_project_evidence_intake_ids ids
set project_id = (
  select project_id
  from public.create_workspace_project(
    ids.organization_id,
    'Project Evidence Intake Test',
    'project-evidence-intake-test',
    'Synthetic project for project place and evidence intake validation.',
    'water_climate'
  )
);

with created as (
  insert into public.project_places (
    organization_id, project_id, name, slug, place_type,
    administrative_area, latitude, longitude, description, created_by
  )
  select organization_id, project_id, 'Synthetic Service Zone',
    'synthetic-service-zone', 'ward', 'Nakuru County, Kenya',
    -0.283300, 36.066700, 'Synthetic place anchor for evidence intake tests.', analyst_id
  from atlas_project_evidence_intake_ids
  returning id
)
update atlas_project_evidence_intake_ids
set place_id = (select id from created);

do $test$
declare
  v_result jsonb;
  v_item_id uuid;
  v_version_id uuid;
  v_count integer;
begin
  if not has_function_privilege(
    'authenticated',
    'public.submit_project_evidence(uuid,uuid,text,text,text,text,text,text,text,timestamptz,text,text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated role cannot execute evidence submission function';
  end if;

  if has_function_privilege(
    'anon',
    'public.submit_project_evidence(uuid,uuid,text,text,text,text,text,text,text,timestamptz,text,text)',
    'EXECUTE'
  ) then
    raise exception 'anonymous role can execute evidence submission function';
  end if;

  if (select p.prosecdef from pg_proc p where p.oid =
    'public.submit_project_evidence(uuid,uuid,text,text,text,text,text,text,text,timestamptz,text,text)'::regprocedure) then
    raise exception 'evidence submission function must remain SECURITY INVOKER';
  end if;

  select public.submit_project_evidence(
    ids.project_id,
    ids.place_id,
    'field_observation',
    'Synthetic intermittent water service observation',
    'Synthetic observation describing intermittent water service in the selected project service zone.',
    'field_visit',
    'Atlas synthetic field team',
    'ATLAS-EVIDENCE-INTAKE-001',
    'https://example.invalid/evidence/001',
    now(),
    'Structured observation and simulated operator interview.',
    'Synthetic fixture only; not a real service measurement.'
  ) into v_result
  from atlas_project_evidence_intake_ids ids;

  v_item_id := (v_result->>'evidence_item_id')::uuid;
  v_version_id := (v_result->>'evidence_version_id')::uuid;
  update atlas_project_evidence_intake_ids
  set evidence_item_id = v_item_id, evidence_version_id = v_version_id;

  if v_result->>'version_number' <> '1' then
    raise exception 'unexpected initial evidence version number';
  end if;

  select count(*) into v_count from public.evidence_items where id = v_item_id;
  if v_count <> 1 then raise exception 'evidence item identity not created'; end if;

  select count(*) into v_count
  from public.evidence_versions
  where id = v_version_id and evidence_item_id = v_item_id and version_number = 1;
  if v_count <> 1 then raise exception 'immutable first evidence version not created'; end if;

  select count(*) into v_count
  from public.audit_events
  where entity_id in (v_item_id, v_version_id)
    and event_type in ('evidence_item.created', 'evidence_version.submitted');
  if v_count <> 2 then raise exception 'expected evidence identity and version audit events'; end if;
end;
$test$;

-- An invalid source URL fails after the evidence item insert. The function call
-- must roll back both the item and its audit row rather than leaving an orphan.
do $test$
declare
  v_count integer;
  v_rejected boolean := false;
begin
  begin
    perform public.submit_project_evidence(
      (select project_id from atlas_project_evidence_intake_ids),
      (select place_id from atlas_project_evidence_intake_ids),
      'document',
      'Rejected synthetic document evidence',
      'This deliberately invalid source URL is used to test transaction rollback.',
      'document',
      'Synthetic document archive',
      'ATLAS-EVIDENCE-ROLLBACK-001',
      'http://not-https.invalid/document',
      now(),
      'Synthetic metadata test without a real document.',
      'Synthetic record; not actual evidence.'
    );
  exception when check_violation then
    v_rejected := true;
  end;

  if not v_rejected then
    raise exception 'invalid non-HTTPS source URL was not rejected';
  end if;

  select count(*) into v_count
  from public.evidence_items
  where project_id = (select project_id from atlas_project_evidence_intake_ids);
  if v_count <> 1 then raise exception 'failed submission left an orphan evidence item'; end if;

  select count(*) into v_count
  from public.evidence_versions
  where project_id = (select project_id from atlas_project_evidence_intake_ids);
  if v_count <> 1 then raise exception 'failed submission left an extra evidence version'; end if;

  select count(*) into v_count
  from public.audit_events
  where project_id = (select project_id from atlas_project_evidence_intake_ids)
    and event_type in ('evidence_item.created', 'evidence_version.submitted');
  if v_count <> 2 then raise exception 'failed submission left partial evidence audit events'; end if;
end;
$test$;

-- The verifier creates their own persisted profile. The owner then grants
-- project access, but cannot change the functional role derived from that profile.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);

insert into public.workspace_profiles(user_id, role, portfolio, governance)
values (
  'f2000000-0000-4000-8000-000000000002',
  'verifier',
  'Synthetic independent verifier',
  'Reviews evidence submitted by other project members'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

insert into public.organization_memberships (organization_id, user_id, role, status)
select organization_id, 'f2000000-0000-4000-8000-000000000002', 'member', 'active'
from atlas_project_evidence_intake_ids;

insert into public.project_memberships (
  organization_id, project_id, user_id, access_level, functional_role, status
)
select organization_id, project_id, 'f2000000-0000-4000-8000-000000000002',
  'contributor', 'verifier', 'active'
from atlas_project_evidence_intake_ids;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);

do $test$
declare
  v_rejected boolean := false;
  v_count integer;
begin
  begin
    perform public.submit_project_evidence(
      (select project_id from atlas_project_evidence_intake_ids),
      (select place_id from atlas_project_evidence_intake_ids),
      'field_observation',
      'Verifier role must not submit evidence',
      'This payload checks the difference between review and submission permissions.',
      'field_visit',
      'Synthetic verifier',
      null,
      null,
      now(),
      'Synthetic permission test.',
      'Synthetic fixture only.'
    );
  exception when insufficient_privilege then
    v_rejected := true;
  end;

  if not v_rejected then
    raise exception 'verifier functional role unexpectedly submitted evidence';
  end if;

  select count(*) into v_count
  from public.evidence_items
  where project_id = (select project_id from atlas_project_evidence_intake_ids);
  if v_count <> 1 then raise exception 'unauthorized evidence submission left an item'; end if;
end;
$test$;


-- The verifier records a single append-only review for the exact evidence version.
do $test$
declare
  v_review_id uuid;
  v_count integer;
  v_duplicate_rejected boolean := false;
begin
  insert into public.evidence_reviews (
    evidence_version_id, evidence_item_id, organization_id, project_id,
    outcome, reviewer_note, reviewer_id
  )
  select evidence_version_id, evidence_item_id, organization_id, project_id,
    'accepted',
    'Source identity, collection method, and limitations are sufficiently documented.',
    verifier_id
  from atlas_project_evidence_intake_ids
  returning id into v_review_id;

  select count(*) into v_count
  from public.audit_events
  where entity_id = v_review_id
    and event_type = 'evidence_review.recorded'
    and actor_id = 'f2000000-0000-4000-8000-000000000002';

  if v_count <> 1 then
    raise exception 'independent evidence review audit event was not recorded';
  end if;

  begin
    insert into public.evidence_reviews (
      evidence_version_id, evidence_item_id, organization_id, project_id,
      outcome, reviewer_note, reviewer_id
    )
    select evidence_version_id, evidence_item_id, organization_id, project_id,
      'rejected', 'Duplicate reviews for one version must not overwrite history.', verifier_id
    from atlas_project_evidence_intake_ids;
  exception when unique_violation then
    v_duplicate_rejected := true;
  end;

  if not v_duplicate_rejected then
    raise exception 'reviewer recorded more than one review for the same evidence version';
  end if;

  if has_table_privilege('authenticated', 'public.evidence_reviews', 'UPDATE')
    or has_table_privilege('authenticated', 'public.evidence_reviews', 'DELETE') then
    raise exception 'authenticated users can mutate append-only review history';
  end if;

  if has_table_privilege('anon', 'public.evidence_reviews', 'INSERT') then
    raise exception 'anonymous users can submit evidence reviews';
  end if;

  select count(*) into v_count
  from public.evidence_reviews
  where evidence_version_id = (select evidence_version_id from atlas_project_evidence_intake_ids);

  if v_count <> 1 then
    raise exception 'duplicate review attempt changed evidence review history';
  end if;
end;
$test$;

-- The evidence submitter cannot review their own version, even though they created the project.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

do $test$
declare
  v_rejected boolean := false;
  v_count integer;
begin
  begin
    insert into public.evidence_reviews (
      evidence_version_id, evidence_item_id, organization_id, project_id,
      outcome, reviewer_note, reviewer_id
    )
    select evidence_version_id, evidence_item_id, organization_id, project_id,
      'accepted', 'Submitter cannot review own evidence.', analyst_id
    from atlas_project_evidence_intake_ids;
  exception when insufficient_privilege then
    v_rejected := true;
  end;

  if not v_rejected then
    raise exception 'evidence submitter was allowed to review own evidence';
  end if;

  select count(*) into v_count
  from public.evidence_reviews
  where evidence_version_id = (select evidence_version_id from atlas_project_evidence_intake_ids);

  if v_count <> 1 then
    raise exception 'self-review attempt changed review history';
  end if;
end;
$test$;

reset role;

reset role;
rollback;
