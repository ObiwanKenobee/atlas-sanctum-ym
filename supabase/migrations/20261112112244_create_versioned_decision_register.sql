-- Atlas Sanctum v0.2.10 — versioned decision register.
-- Each decision version is immutable, cites exact evidence versions, records
-- alternatives and uncertainty, and requires a separate project authorizer.

create or replace function private.can_create_decision(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select private.can_write_project_records(
    target_project_id,
    target_organization_id,
    array['analyst', 'implementer', 'steward']::text[]
  );
$function$;

revoke all on function private.can_create_decision(uuid, uuid) from public, anon;
grant execute on function private.can_create_decision(uuid, uuid) to authenticated;

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  place_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  foreign key (place_id, project_id, organization_id)
    references public.project_places(id, project_id, organization_id) on delete restrict,
  unique (id, project_id, organization_id)
);

create table public.decision_versions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null,
  organization_id uuid not null,
  project_id uuid not null,
  version_number integer not null check (version_number >= 1),
  decision_question text not null check (
    char_length(btrim(decision_question)) between 10 and 2000
  ),
  recommendation text not null check (
    char_length(btrim(recommendation)) between 10 and 3000
  ),
  rationale text not null check (
    char_length(btrim(rationale)) between 10 and 3000
  ),
  uncertainty text not null check (
    char_length(btrim(uncertainty)) between 3 and 2000
  ),
  consequence_of_no_action text not null check (
    char_length(btrim(consequence_of_no_action)) between 3 and 2000
  ),
  author_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (decision_id, project_id, organization_id)
    references public.decisions(id, project_id, organization_id) on delete restrict,
  unique (decision_id, version_number),
  unique (id, decision_id, project_id, organization_id)
);

create table public.decision_options (
  id uuid primary key default gen_random_uuid(),
  decision_version_id uuid not null,
  decision_id uuid not null,
  organization_id uuid not null,
  project_id uuid not null,
  option_name text not null check (char_length(btrim(option_name)) between 2 and 120),
  description text not null check (
    char_length(btrim(description)) between 10 and 2000
  ),
  expected_benefit text not null check (
    char_length(btrim(expected_benefit)) between 3 and 1500
  ),
  material_risks text not null check (
    char_length(btrim(material_risks)) between 3 and 1500
  ),
  estimated_cost numeric(14, 2) check (estimated_cost is null or estimated_cost >= 0),
  currency_code text check (
    currency_code is null
    or currency_code ~ '^[A-Z]{3}$'
  ),
  is_recommended boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (decision_version_id, decision_id, project_id, organization_id)
    references public.decision_versions(id, decision_id, project_id, organization_id) on delete restrict,
  unique (decision_version_id, option_name),
  check (
    (estimated_cost is null and currency_code is null)
    or (estimated_cost is not null and currency_code is not null)
  )
);

create table public.decision_evidence_links (
  id uuid primary key default gen_random_uuid(),
  decision_version_id uuid not null,
  decision_id uuid not null,
  organization_id uuid not null,
  project_id uuid not null,
  evidence_version_id uuid not null,
  evidence_item_id uuid not null,
  relevance_note text not null check (
    char_length(btrim(relevance_note)) between 5 and 1200
  ),
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  foreign key (decision_version_id, decision_id, project_id, organization_id)
    references public.decision_versions(id, decision_id, project_id, organization_id) on delete restrict,
  foreign key (evidence_version_id, evidence_item_id, project_id, organization_id)
    references public.evidence_versions(id, evidence_item_id, project_id, organization_id) on delete restrict,
  unique (decision_version_id, evidence_version_id)
);

create table public.decision_approvals (
  id uuid primary key default gen_random_uuid(),
  decision_version_id uuid not null,
  decision_id uuid not null,
  organization_id uuid not null,
  project_id uuid not null,
  outcome text not null check (
    outcome in ('approved', 'rejected', 'revision_requested')
  ),
  reviewer_note text not null check (
    char_length(btrim(reviewer_note)) between 5 and 2000
  ),
  authorizer_id uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  foreign key (decision_version_id, decision_id, project_id, organization_id)
    references public.decision_versions(id, decision_id, project_id, organization_id) on delete restrict,
  unique (decision_version_id)
);

create index decisions_project_org_created_idx
  on public.decisions (project_id, organization_id, created_at desc);
create index decisions_place_scope_idx
  on public.decisions (place_id, project_id, organization_id);
create index decisions_created_by_idx
  on public.decisions (created_by);

create index decision_versions_decision_scope_idx
  on public.decision_versions (decision_id, project_id, organization_id);
create index decision_versions_project_created_idx
  on public.decision_versions (organization_id, project_id, created_at desc);
create index decision_versions_author_idx
  on public.decision_versions (author_id);

create index decision_options_version_scope_idx
  on public.decision_options (decision_version_id, decision_id, project_id, organization_id);
create index decision_options_created_by_idx
  on public.decision_options (created_by);

create index decision_evidence_links_version_scope_idx
  on public.decision_evidence_links (decision_version_id, decision_id, project_id, organization_id);
create index decision_evidence_links_evidence_scope_idx
  on public.decision_evidence_links (evidence_version_id, evidence_item_id, project_id, organization_id);
create index decision_evidence_links_linked_by_idx
  on public.decision_evidence_links (linked_by);

create index decision_approvals_version_scope_idx
  on public.decision_approvals (decision_version_id, decision_id, project_id, organization_id);
create index decision_approvals_authorizer_idx
  on public.decision_approvals (authorizer_id);

create or replace function private.can_create_decision_version(
  target_decision_id uuid,
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.decisions d
    where d.id = target_decision_id
      and d.project_id = target_project_id
      and d.organization_id = target_organization_id
      and d.created_by = (select auth.uid())
      and private.can_create_decision(target_project_id, target_organization_id)
  );
$function$;

create or replace function private.can_author_decision_version(
  target_decision_version_id uuid,
  target_decision_id uuid,
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.decision_versions dv
    where dv.id = target_decision_version_id
      and dv.decision_id = target_decision_id
      and dv.project_id = target_project_id
      and dv.organization_id = target_organization_id
      and dv.author_id = (select auth.uid())
      and private.can_create_decision(target_project_id, target_organization_id)
      and not exists (
        select 1
        from public.decision_approvals da
        where da.decision_version_id = dv.id
      )
  );
$function$;

create or replace function private.can_approve_decision(
  target_decision_version_id uuid,
  target_decision_id uuid,
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.decision_versions dv
    join public.project_memberships pm
      on pm.project_id = dv.project_id
     and pm.organization_id = dv.organization_id
    join public.organization_memberships om
      on om.organization_id = pm.organization_id
     and om.user_id = pm.user_id
    join public.organizations o
      on o.id = om.organization_id
    join public.projects p
      on p.id = pm.project_id
     and p.organization_id = pm.organization_id
    where dv.id = target_decision_version_id
      and dv.decision_id = target_decision_id
      and dv.project_id = target_project_id
      and dv.organization_id = target_organization_id
      and dv.author_id <> (select auth.uid())
      and pm.user_id = (select auth.uid())
      and pm.access_level in ('manager', 'contributor')
      and pm.functional_role = 'authorizer'
      and private.workspace_functional_role((select auth.uid())) = 'authorizer'
      and pm.status = 'active'
      and om.status = 'active'
      and o.status = 'active'
      and p.status = 'active'
  );
$function$;

revoke all on function private.can_create_decision_version(uuid, uuid, uuid) from public, anon;
revoke all on function private.can_author_decision_version(uuid, uuid, uuid, uuid) from public, anon;
revoke all on function private.can_approve_decision(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function private.can_create_decision_version(uuid, uuid, uuid) to authenticated;
grant execute on function private.can_author_decision_version(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function private.can_approve_decision(uuid, uuid, uuid, uuid) to authenticated;

create or replace function private.enforce_decision_version_sequence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null
    or new.author_id is distinct from (select auth.uid())
  then
    raise exception using errcode = '42501', message = 'decision_author_must_be_authenticated_actor';
  end if;

  if not private.can_create_decision_version(
    new.decision_id,
    new.project_id,
    new.organization_id
  ) then
    raise exception using errcode = '42501', message = 'decision_author_required';
  end if;

  if new.version_number = 1 then
    if exists (
      select 1
      from public.decision_versions dv
      where dv.decision_id = new.decision_id
        and dv.project_id = new.project_id
        and dv.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23505', message = 'decision_version_one_already_exists';
    end if;
  elsif not exists (
    select 1
    from public.decision_versions dv
    where dv.decision_id = new.decision_id
      and dv.project_id = new.project_id
      and dv.organization_id = new.organization_id
      and dv.version_number = new.version_number - 1
  ) then
    raise exception using errcode = '23514', message = 'decision_versions_must_be_sequential';
  end if;

  return new;
end;
$function$;

create or replace function private.enforce_decision_approval_requirements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_option_count integer;
  v_recommended_count integer;
  v_evidence_count integer;
begin
  if (select auth.uid()) is null
    or new.authorizer_id is distinct from (select auth.uid())
  then
    raise exception using errcode = '42501', message = 'decision_authorizer_must_be_authenticated_actor';
  end if;

  if not private.can_approve_decision(
    new.decision_version_id,
    new.decision_id,
    new.project_id,
    new.organization_id
  ) then
    raise exception using errcode = '42501', message = 'independent_project_authorizer_required';
  end if;

  select count(*), count(*) filter (where is_recommended)
    into v_option_count, v_recommended_count
  from public.decision_options
  where decision_version_id = new.decision_version_id
    and decision_id = new.decision_id
    and project_id = new.project_id
    and organization_id = new.organization_id;

  if v_option_count < 2 or v_recommended_count <> 1 then
    raise exception using errcode = '23514', message = 'decision_requires_two_options_and_one_recommendation';
  end if;

  select count(*)
    into v_evidence_count
  from public.decision_evidence_links
  where decision_version_id = new.decision_version_id
    and decision_id = new.decision_id
    and project_id = new.project_id
    and organization_id = new.organization_id;

  if v_evidence_count < 1 then
    raise exception using errcode = '23514', message = 'decision_requires_cited_evidence';
  end if;

  return new;
end;
$function$;

revoke all on function private.enforce_decision_version_sequence() from public, anon, authenticated;
revoke all on function private.enforce_decision_approval_requirements() from public, anon, authenticated;

create trigger decision_versions_enforce_sequence
  before insert on public.decision_versions
  for each row execute function private.enforce_decision_version_sequence();

create trigger decision_approvals_enforce_independent_review
  before insert on public.decision_approvals
  for each row execute function private.enforce_decision_approval_requirements();

create or replace function private.record_decision_record_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row jsonb := to_jsonb(new);
  v_org_id uuid;
  v_project_id uuid;
  v_entity_id uuid;
  v_actor_id uuid;
  v_entity_type text;
  v_event_type text;
  v_payload jsonb;
begin
  v_org_id := (v_row ->> 'organization_id')::uuid;
  v_project_id := (v_row ->> 'project_id')::uuid;
  v_entity_id := (v_row ->> 'id')::uuid;
  v_actor_id := coalesce(
    (select auth.uid()),
    nullif(v_row ->> 'created_by', '')::uuid,
    nullif(v_row ->> 'author_id', '')::uuid,
    nullif(v_row ->> 'linked_by', '')::uuid,
    nullif(v_row ->> 'authorizer_id', '')::uuid
  );

  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'decision_audit_actor_required';
  end if;

  if tg_table_name = 'decisions' then
    v_entity_type := 'decision';
    v_event_type := 'decision.created';
    v_payload := jsonb_build_object('place_id', v_row ->> 'place_id');
  elsif tg_table_name = 'decision_versions' then
    v_entity_type := 'decision_version';
    v_event_type := 'decision.version_submitted';
    v_payload := jsonb_build_object(
      'decision_id', v_row ->> 'decision_id',
      'version_number', (v_row ->> 'version_number')::integer,
      'author_id', v_row ->> 'author_id'
    );
  elsif tg_table_name = 'decision_options' then
    v_entity_type := 'decision_option';
    v_event_type := 'decision.option_added';
    v_payload := jsonb_build_object(
      'decision_version_id', v_row ->> 'decision_version_id',
      'option_name', v_row ->> 'option_name',
      'is_recommended', (v_row ->> 'is_recommended')::boolean
    );
  elsif tg_table_name = 'decision_evidence_links' then
    v_entity_type := 'decision_evidence_link';
    v_event_type := 'decision.evidence_linked';
    v_payload := jsonb_build_object(
      'decision_version_id', v_row ->> 'decision_version_id',
      'evidence_version_id', v_row ->> 'evidence_version_id'
    );
  elsif tg_table_name = 'decision_approvals' then
    v_entity_type := 'decision_approval';
    v_event_type := 'decision.' || (v_row ->> 'outcome');
    v_payload := jsonb_build_object(
      'decision_version_id', v_row ->> 'decision_version_id',
      'outcome', v_row ->> 'outcome',
      'authorizer_id', v_row ->> 'authorizer_id'
    );
  else
    raise exception using errcode = '22023', message = 'unsupported_decision_audit_table';
  end if;

  insert into public.audit_events (
    organization_id, project_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    v_org_id, v_project_id, v_actor_id, v_event_type, v_entity_type, v_entity_id, v_payload
  );

  return new;
end;
$function$;

revoke all on function private.record_decision_record_audit() from public, anon, authenticated;

alter table public.audit_events
  drop constraint audit_events_entity_type_check;
alter table public.audit_events
  add constraint audit_events_entity_type_check
  check (
    entity_type in (
      'project', 'project_membership', 'project_place',
      'evidence_item', 'evidence_version', 'evidence_review',
      'decision', 'decision_version', 'decision_option',
      'decision_evidence_link', 'decision_approval'
    )
  );

alter table public.decisions enable row level security;
alter table public.decision_versions enable row level security;
alter table public.decision_options enable row level security;
alter table public.decision_evidence_links enable row level security;
alter table public.decision_approvals enable row level security;

create policy decisions_select_active_project_members
  on public.decisions for select to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy decisions_insert_authorized_project_contributors
  on public.decisions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_create_decision(project_id, organization_id)
  );

create policy decision_versions_select_active_project_members
  on public.decision_versions for select to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy decision_versions_insert_decision_author
  on public.decision_versions for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.can_create_decision_version(decision_id, project_id, organization_id)
  );

create policy decision_options_select_active_project_members
  on public.decision_options for select to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy decision_options_insert_version_author
  on public.decision_options for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_author_decision_version(
      decision_version_id, decision_id, project_id, organization_id
    )
  );

create policy decision_evidence_links_select_active_project_members
  on public.decision_evidence_links for select to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy decision_evidence_links_insert_version_author
  on public.decision_evidence_links for insert to authenticated
  with check (
    linked_by = (select auth.uid())
    and private.can_author_decision_version(
      decision_version_id, decision_id, project_id, organization_id
    )
  );

create policy decision_approvals_select_active_project_members
  on public.decision_approvals for select to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy decision_approvals_insert_independent_authorizer
  on public.decision_approvals for insert to authenticated
  with check (
    authorizer_id = (select auth.uid())
    and private.can_approve_decision(
      decision_version_id, decision_id, project_id, organization_id
    )
  );

create trigger decisions_audit_insert
  after insert on public.decisions
  for each row execute function private.record_decision_record_audit();

create trigger decision_versions_audit_insert
  after insert on public.decision_versions
  for each row execute function private.record_decision_record_audit();

create trigger decision_options_audit_insert
  after insert on public.decision_options
  for each row execute function private.record_decision_record_audit();

create trigger decision_evidence_links_audit_insert
  after insert on public.decision_evidence_links
  for each row execute function private.record_decision_record_audit();

create trigger decision_approvals_audit_insert
  after insert on public.decision_approvals
  for each row execute function private.record_decision_record_audit();

revoke all privileges on table public.decisions from public, anon, authenticated;
revoke all privileges on table public.decision_versions from public, anon, authenticated;
revoke all privileges on table public.decision_options from public, anon, authenticated;
revoke all privileges on table public.decision_evidence_links from public, anon, authenticated;
revoke all privileges on table public.decision_approvals from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert on table public.decisions to authenticated;
grant select, insert on table public.decision_versions to authenticated;
grant select, insert on table public.decision_options to authenticated;
grant select, insert on table public.decision_evidence_links to authenticated;
grant select, insert on table public.decision_approvals to authenticated;

comment on table public.decisions is
  'Stable project-scoped decision identity. Each proposal revision is stored as an immutable decision version.';
comment on table public.decision_versions is
  'Immutable decision proposal versions capturing question, recommendation, rationale, uncertainty and consequence of no action.';
comment on table public.decision_options is
  'Alternatives considered for an exact decision version. Exactly one option must be recommended before review.';
comment on table public.decision_evidence_links is
  'Links a decision version to exact immutable evidence versions from the same project and organization.';
comment on table public.decision_approvals is
  'Append-only independent authorization or rejection of one exact decision version by a separate project authorizer.';
comment on function private.can_approve_decision(uuid, uuid, uuid, uuid) is
  'Allows only an active project authorizer distinct from the version author to adjudicate that exact version.';
comment on function private.enforce_decision_approval_requirements() is
  'Requires two or more alternatives, exactly one recommendation and at least one evidence citation before an approval decision can be recorded.';
comment on function private.record_decision_record_audit() is
  'Writes compact audit metadata for decisions, version submissions, alternatives, evidence citations and authorization outcomes.';
