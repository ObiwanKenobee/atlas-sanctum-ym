-- Atlas Sanctum v0.2.10 — decision register authorization and evidence-citation tests.
--
-- SAFE FOR THE DEDICATED DEVELOPMENT PROJECT ONLY.
-- Two synthetic Auth users and all created records are inside one transaction.
-- The final ROLLBACK removes every fixture.

begin;

create temp table atlas_decision_test_ids (
  user_a uuid not null,
  user_b uuid not null,
  organization_a uuid,
  organization_b uuid,
  project_a uuid,
  project_b uuid,
  place_a uuid,
  evidence_item_a uuid,
  evidence_version_a uuid,
  decision_id uuid,
  decision_version_a uuid,
  decision_version_b uuid,
  alternatives_missing_decision_id uuid,
  alternatives_missing_version_id uuid,
  citations_missing_decision_id uuid,
  citations_missing_version_id uuid,
  approval_id uuid
) on commit drop;

insert into atlas_decision_test_ids (user_a, user_b)
values (
  'e5000000-0000-4000-8000-000000000005',
  'f6000000-0000-4000-8000-000000000006'
);

grant select, insert, update on table atlas_decision_test_ids to authenticated;

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
  select user_a as user_id, 'atlas-decision-analyst@example.invalid'::text as email
  from atlas_decision_test_ids
  union all
  select user_b, 'atlas-decision-authorizer@example.invalid'
  from atlas_decision_test_ids
) synthetic_users;

-- User A is the analyst/decision author.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'e5000000-0000-4000-8000-000000000005',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'e5000000-0000-4000-8000-000000000005',
  'analyst',
  'Synthetic decision author',
  'Prepares evidence-based decision proposals'
);

update atlas_decision_test_ids
set organization_a = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Decision Synthetic Institution A',
    'atlas-decision-synthetic-a'
  )
);

update atlas_decision_test_ids ids
set project_a = (
  select project_id
  from public.create_workspace_project(
    ids.organization_a,
    'Nakuru Water Reliability — Decision Test',
    'nakuru-water-reliability-decision-test',
    'Synthetic project for decision versioning and approval authorization tests.',
    'water_climate'
  )
);

with new_place as (
  insert into public.project_places (
    organization_id, project_id, name, slug, place_type,
    administrative_area, latitude, longitude, description, created_by
  )
  select
    organization_a, project_a, 'Synthetic Nakuru Water Service Zone',
    'synthetic-nakuru-water-service-zone', 'ward',
    'Nakuru County, Kenya', -0.2833, 36.0667,
    'Synthetic place anchor for decision register tests.',
    user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set place_a = (select id from new_place);

with new_item as (
  insert into public.evidence_items (
    organization_id, project_id, place_id, created_by
  )
  select organization_a, project_a, place_a, user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set evidence_item_a = (select id from new_item);

with new_version as (
  insert into public.evidence_versions (
    evidence_item_id, organization_id, project_id, version_number,
    evidence_type, title, description, source_type, source_name,
    source_reference, collected_at, collection_method, limitations, submitted_by
  )
  select
    evidence_item_a, organization_a, project_a, 1,
    'field_observation',
    'Intermittent service in test zone',
    'Synthetic site observation describing intermittent water service in the selected zone.',
    'field_visit',
    'Atlas synthetic field team',
    'ATLAS-DECISION-TEST-001',
    now(),
    'Structured observation and a simulated operator interview.',
    'Synthetic one-day sample; it is not a real service measurement.',
    user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set evidence_version_a = (select id from new_version);

-- Create a complete decision packet: question, recommendation, rationale,
-- uncertainty, no-action consequence, two options and an exact evidence citation.
with new_decision as (
  insert into public.decisions (
    organization_id, project_id, place_id, created_by
  )
  select organization_a, project_a, place_a, user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set decision_id = (select id from new_decision);

with new_version as (
  insert into public.decision_versions (
    decision_id, organization_id, project_id, version_number,
    decision_question, recommendation, rationale, uncertainty,
    consequence_of_no_action, author_id
  )
  select
    decision_id, organization_a, project_a, 1,
    'Which response should be piloted to improve reliability in this service zone?',
    'Pilot a targeted repair and operator-maintenance response at the identified service points.',
    'The recommended approach is reversible, measurable and can be tested within one project cycle.',
    'The synthetic evidence covers one observation period and does not establish the frequency of interruption.',
    'Without an intervention, intermittent service may persist and the project will learn little about the causes.',
    user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set decision_version_a = (select id from new_version);

insert into public.decision_options (
  decision_version_id, decision_id, organization_id, project_id,
  option_name, description, expected_benefit, material_risks,
  estimated_cost, currency_code, is_recommended, created_by
)
select
  decision_version_a, decision_id, organization_a, project_a,
  'Targeted repair and maintenance',
  'Repair the identified faults and establish a scheduled operator-maintenance check.',
  'A focused intervention may restore reliability while producing measurable operating evidence.',
  'The underlying cause may extend beyond the selected service points.',
  650000.00, 'KES', true, user_a
from atlas_decision_test_ids
union all
select
  decision_version_a, decision_id, organization_a, project_a,
  'Replace the entire local distribution segment',
  'Replace the broader distribution segment before collecting further operational measurements.',
  'A wider replacement could address multiple hidden faults at once.',
  'Higher cost and wider disruption may be incurred without confirming the actual failure source.',
  4200000.00, 'KES', false, user_a
from atlas_decision_test_ids;

insert into public.decision_evidence_links (
  decision_version_id, decision_id, organization_id, project_id,
  evidence_version_id, evidence_item_id, relevance_note, linked_by
)
select
  decision_version_a, decision_id, organization_a, project_a,
  evidence_version_a, evidence_item_a,
  'This exact field-observation version supports the stated reliability problem, but its sampling limitation remains material.',
  user_a
from atlas_decision_test_ids;

-- Create an intentionally incomplete packet with only one option.
with new_decision as (
  insert into public.decisions (
    organization_id, project_id, place_id, created_by
  )
  select organization_a, project_a, place_a, user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set alternatives_missing_decision_id = (select id from new_decision);

with new_version as (
  insert into public.decision_versions (
    decision_id, organization_id, project_id, version_number,
    decision_question, recommendation, rationale, uncertainty,
    consequence_of_no_action, author_id
  )
  select
    alternatives_missing_decision_id, organization_a, project_a, 1,
    'Should the test zone receive a targeted maintenance intervention?',
    'Start a targeted maintenance intervention.',
    'The proposal is intended to test whether maintenance can address the service interruption.',
    'The sample is limited and additional observations may change the preferred response.',
    'The project may continue without learning whether targeted maintenance would improve reliability.',
    user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set alternatives_missing_version_id = (select id from new_version);

insert into public.decision_options (
  decision_version_id, decision_id, organization_id, project_id,
  option_name, description, expected_benefit, material_risks,
  is_recommended, created_by
)
select
  alternatives_missing_version_id, alternatives_missing_decision_id,
  organization_a, project_a,
  'Only supplied option',
  'A single option is deliberately insufficient for a decision review.',
  'It describes one possible benefit.',
  'No alternative has been evaluated.',
  true, user_a
from atlas_decision_test_ids;

-- Create a second intentionally incomplete packet: two options but no evidence citation.
with new_decision as (
  insert into public.decisions (
    organization_id, project_id, place_id, created_by
  )
  select organization_a, project_a, place_a, user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set citations_missing_decision_id = (select id from new_decision);

with new_version as (
  insert into public.decision_versions (
    decision_id, organization_id, project_id, version_number,
    decision_question, recommendation, rationale, uncertainty,
    consequence_of_no_action, author_id
  )
  select
    citations_missing_decision_id, organization_a, project_a, 1,
    'Which response should be considered for the synthetic service zone?',
    'Prefer a targeted maintenance pilot.',
    'A reversible intervention is proposed pending supporting evidence.',
    'No supporting evidence has been linked to this version.',
    'The project cannot establish whether an intervention is warranted.',
    user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set citations_missing_version_id = (select id from new_version);

insert into public.decision_options (
  decision_version_id, decision_id, organization_id, project_id,
  option_name, description, expected_benefit, material_risks,
  is_recommended, created_by
)
select
  citations_missing_version_id, citations_missing_decision_id,
  organization_a, project_a,
  'Targeted maintenance',
  'Test a limited maintenance intervention.',
  'Could address the immediate reported issue.',
  'The problem may have a different cause.',
  true, user_a
from atlas_decision_test_ids
union all
select
  citations_missing_version_id, citations_missing_decision_id,
  organization_a, project_a,
  'Wait and collect more observations',
  'Gather additional observations before starting an intervention.',
  'Could improve confidence in the problem diagnosis.',
  'Delays any immediate service improvement.',
  false, user_a
from atlas_decision_test_ids;

-- Version numbers cannot skip a predecessor.
do $test$
declare
  ids atlas_decision_test_ids%rowtype;
  sequence_denied boolean := false;
begin
  select * into strict ids from atlas_decision_test_ids;
  begin
    insert into public.decision_versions (
      decision_id, organization_id, project_id, version_number,
      decision_question, recommendation, rationale, uncertainty,
      consequence_of_no_action, author_id
    )
    values (
      ids.decision_id, ids.organization_a, ids.project_a, 3,
      'This version intentionally skips version two.',
      'This recommendation must not be stored.',
      'The sequence gate must reject the skipped version.',
      'This is a synthetic test.',
      'There is no operational consequence for this synthetic test.',
      ids.user_a
    );
  exception
    when check_violation then sequence_denied := true;
  end;

  if not sequence_denied then
    raise exception 'FAIL: decision version sequence accepted a skipped version';
  end if;
end;
$test$;

-- The analyst who authored a decision cannot authorize it.
do $test$
declare
  ids atlas_decision_test_ids%rowtype;
  self_approval_denied boolean := false;
begin
  select * into strict ids from atlas_decision_test_ids;
  begin
    insert into public.decision_approvals (
      decision_version_id, decision_id, organization_id, project_id,
      outcome, reviewer_note, authorizer_id
    )
    values (
      ids.decision_version_a, ids.decision_id, ids.organization_a, ids.project_a,
      'approved', 'The decision author cannot approve their own proposal.', ids.user_a
    );
  exception
    when insufficient_privilege then self_approval_denied := true;
  end;

  if not self_approval_denied then
    raise exception 'FAIL: decision author approved their own decision version';
  end if;
end;
$test$;

reset role;

-- User B is an authorizer in a separate institution. B must not see A's
-- decision packet before A explicitly grants organization/project membership.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'f6000000-0000-4000-8000-000000000006',
  true
);

insert into public.workspace_profiles (user_id, role, portfolio, governance)
values (
  'f6000000-0000-4000-8000-000000000006',
  'authorizer',
  'Synthetic decision authorizer',
  'Reviews decision versions independently of their authors'
);

update atlas_decision_test_ids
set organization_b = (
  select organization_id
  from public.create_workspace_organization(
    'Atlas Decision Synthetic Institution B',
    'atlas-decision-synthetic-b'
  )
);

update atlas_decision_test_ids ids
set project_b = (
  select project_id
  from public.create_workspace_project(
    ids.organization_b,
    'Independent Authorizer Test Project',
    'independent-authorizer-test-project',
    'Separate synthetic project used to test decision tenant isolation.',
    'programme_accountability'
  )
);

do $test$
declare
  ids atlas_decision_test_ids%rowtype;
begin
  select * into strict ids from atlas_decision_test_ids;

  if exists (select 1 from public.decisions where id = ids.decision_id)
    or exists (select 1 from public.decision_versions where id = ids.decision_version_a)
    or exists (
      select 1 from public.decision_options
      where decision_version_id = ids.decision_version_a
    )
    or exists (
      select 1 from public.decision_evidence_links
      where decision_version_id = ids.decision_version_a
    )
  then
    raise exception 'FAIL: authorizer tenant B can see tenant A decision packet before invitation';
  end if;
end;
$test$;

reset role;

-- Tenant A cannot create a decision in tenant B's project, even with known UUIDs.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'e5000000-0000-4000-8000-000000000005',
  true
);

do $test$
declare
  ids atlas_decision_test_ids%rowtype;
  cross_tenant_write_denied boolean := false;
begin
  select * into strict ids from atlas_decision_test_ids;
  begin
    insert into public.decisions (
      organization_id, project_id, created_by
    )
    values (ids.organization_b, ids.project_b, ids.user_a);
  exception
    when insufficient_privilege then cross_tenant_write_denied := true;
  end;

  if not cross_tenant_write_denied then
    raise exception 'FAIL: tenant A created a decision inside tenant B project';
  end if;
end;
$test$;

-- The project owner explicitly invites user B as an authorizer.
do $test$
declare
  ids atlas_decision_test_ids%rowtype;
begin
  select * into strict ids from atlas_decision_test_ids;

  insert into public.organization_memberships (
    organization_id, user_id, role, status
  )
  values (ids.organization_a, ids.user_b, 'member', 'active');

  insert into public.project_memberships (
    organization_id, project_id, user_id,
    access_level, functional_role, status
  )
  values (
    ids.organization_a, ids.project_a, ids.user_b,
    'contributor', 'authorizer', 'active'
  );
end;
$test$;

reset role;

-- The invited authorizer cannot approve either incomplete packet.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'f6000000-0000-4000-8000-000000000006',
  true
);

do $test$
declare
  ids atlas_decision_test_ids%rowtype;
  options_gate_denied boolean := false;
  citation_gate_denied boolean := false;
begin
  select * into strict ids from atlas_decision_test_ids;

  begin
    insert into public.decision_approvals (
      decision_version_id, decision_id, organization_id, project_id,
      outcome, reviewer_note, authorizer_id
    )
    values (
      ids.alternatives_missing_version_id,
      ids.alternatives_missing_decision_id,
      ids.organization_a, ids.project_a,
      'approved', 'Approval must fail because alternatives are incomplete.', ids.user_b
    );
  exception
    when check_violation then options_gate_denied := true;
  end;

  if not options_gate_denied then
    raise exception 'FAIL: decision with one option was approved';
  end if;

  begin
    insert into public.decision_approvals (
      decision_version_id, decision_id, organization_id, project_id,
      outcome, reviewer_note, authorizer_id
    )
    values (
      ids.citations_missing_version_id,
      ids.citations_missing_decision_id,
      ids.organization_a, ids.project_a,
      'approved', 'Approval must fail because evidence was not cited.', ids.user_b
    );
  exception
    when check_violation then citation_gate_denied := true;
  end;

  if not citation_gate_denied then
    raise exception 'FAIL: decision without cited evidence was approved';
  end if;
end;
$test$;

-- A separate authorizer can approve the complete packet; approval binds to v1.
with new_approval as (
  insert into public.decision_approvals (
    decision_version_id, decision_id, organization_id, project_id,
    outcome, reviewer_note, authorizer_id
  )
  select
    decision_version_a, decision_id, organization_a, project_a,
    'approved',
    'The alternatives, evidence citation and uncertainty are documented for this test.',
    user_b
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set approval_id = (select id from new_approval);

-- The authorizer cannot add or change the author's decision alternatives.
do $test$
declare
  ids atlas_decision_test_ids%rowtype;
  author_change_denied boolean := false;
begin
  select * into strict ids from atlas_decision_test_ids;
  begin
    insert into public.decision_options (
      decision_version_id, decision_id, organization_id, project_id,
      option_name, description, expected_benefit, material_risks,
      is_recommended, created_by
    )
    values (
      ids.decision_version_a, ids.decision_id, ids.organization_a, ids.project_a,
      'Unauthorized option',
      'The authorizer cannot edit another member''s decision packet.',
      'No benefit.',
      'This would alter the version after submission.',
      false, ids.user_b
    );
  exception
    when insufficient_privilege then author_change_denied := true;
  end;

  if not author_change_denied then
    raise exception 'FAIL: non-author added an option to another member''s decision version';
  end if;
end;
$test$;

-- The author appends version two after the prior version is approved. The
-- previous approval remains tied to version one and does not transfer forward.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'e5000000-0000-4000-8000-000000000005',
  true
);

with new_version as (
  insert into public.decision_versions (
    decision_id, organization_id, project_id, version_number,
    decision_question, recommendation, rationale, uncertainty,
    consequence_of_no_action, author_id
  )
  select
    decision_id, organization_a, project_a, 2,
    'Which intervention should proceed after the first review?',
    'Proceed with the targeted maintenance pilot, with a repeat measurement protocol.',
    'The new version responds to review while preserving the original evidence citation.',
    'The baseline remains limited and should be improved through repeat observations.',
    'Without a pilot, the institution will not learn whether the targeted intervention works.',
    user_a
  from atlas_decision_test_ids
  returning id
)
update atlas_decision_test_ids
set decision_version_b = (select id from new_version);

insert into public.decision_options (
  decision_version_id, decision_id, organization_id, project_id,
  option_name, description, expected_benefit, material_risks,
  is_recommended, created_by
)
select
  decision_version_b, decision_id, organization_a, project_a,
  'Targeted maintenance with repeat measurement',
  'Repair selected faults and repeat the same service observation protocol.',
  'Adds a comparable measurement to evaluate whether reliability improves.',
  'A short observation window may still miss seasonal variation.',
  true, user_a
from atlas_decision_test_ids
union all
select
  decision_version_b, decision_id, organization_a, project_a,
  'Defer intervention and expand diagnosis',
  'Collect more baseline observations before starting repair work.',
  'May reduce the risk of selecting an ineffective intervention.',
  'Service problems may continue while diagnosis is extended.',
  false, user_a
from atlas_decision_test_ids;

insert into public.decision_evidence_links (
  decision_version_id, decision_id, organization_id, project_id,
  evidence_version_id, evidence_item_id, relevance_note, linked_by
)
select
  decision_version_b, decision_id, organization_a, project_a,
  evidence_version_a, evidence_item_a,
  'The same source version is retained as a baseline; this newer decision version explicitly acknowledges its sampling limitation.',
  user_a
from atlas_decision_test_ids;

-- Application users cannot edit/delete decision packets or authorizations.
do $test$
declare
  ids atlas_decision_test_ids%rowtype;
  version_update_denied boolean := false;
  approval_delete_denied boolean := false;
begin
  select * into strict ids from atlas_decision_test_ids;

  begin
    update public.decision_versions
    set recommendation = 'Tampered recommendation'
    where id = ids.decision_version_a;
  exception
    when insufficient_privilege then version_update_denied := true;
  end;

  begin
    delete from public.decision_approvals
    where id = ids.approval_id;
  exception
    when insufficient_privilege then approval_delete_denied := true;
  end;

  if not version_update_denied or not approval_delete_denied then
    raise exception 'FAIL: authenticated client edited a decision version or deleted an approval';
  end if;

  if has_table_privilege('authenticated', 'public.decision_versions', 'UPDATE')
    or has_table_privilege('authenticated', 'public.decision_versions', 'DELETE')
    or has_table_privilege('authenticated', 'public.decision_approvals', 'UPDATE')
    or has_table_privilege('authenticated', 'public.decision_approvals', 'DELETE')
    or has_table_privilege('authenticated', 'public.audit_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.audit_events', 'UPDATE')
    or has_table_privilege('authenticated', 'public.audit_events', 'DELETE')
  then
    raise exception 'FAIL: immutable decision or audit tables have application write grants';
  end if;

  if has_table_privilege('anon', 'public.decisions', 'SELECT')
    or has_table_privilege('anon', 'public.decision_approvals', 'INSERT')
  then
    raise exception 'FAIL: anonymous clients have decision table privileges';
  end if;
end;
$test$;

-- The version-one approval is not inherited by version two.
do $test$
declare
  ids atlas_decision_test_ids%rowtype;
begin
  select * into strict ids from atlas_decision_test_ids;

  if (select count(*) from public.decision_versions where decision_id = ids.decision_id) <> 2 then
    raise exception 'FAIL: decision version history did not preserve versions one and two';
  end if;

  if not exists (
    select 1 from public.decision_approvals
    where id = ids.approval_id
      and decision_version_id = ids.decision_version_a
      and decision_id = ids.decision_id
      and outcome = 'approved'
      and authorizer_id = ids.user_b
  ) then
    raise exception 'FAIL: approval was not bound to exact decision version one';
  end if;

  if exists (
    select 1 from public.decision_approvals
    where decision_version_id = ids.decision_version_b
  ) then
    raise exception 'FAIL: approval incorrectly transferred to decision version two';
  end if;

  if not exists (
    select 1 from public.decision_evidence_links
    where decision_version_id = ids.decision_version_b
      and evidence_version_id = ids.evidence_version_a
  ) then
    raise exception 'FAIL: decision version two did not retain an exact evidence-version citation';
  end if;

  if not exists (
    select 1 from public.audit_events
    where project_id = ids.project_a
      and entity_type = 'decision_approval'
      and event_type = 'decision.approved'
      and entity_id = ids.approval_id
  ) then
    raise exception 'FAIL: decision approval audit event was not recorded';
  end if;

  if (select count(*) from public.audit_events
      where project_id = ids.project_a
        and entity_type = 'decision_version'
        and event_type = 'decision.version_submitted') < 4
  then
    raise exception 'FAIL: expected all decision version submissions in audit history';
  end if;
end;
$test$;

rollback;
