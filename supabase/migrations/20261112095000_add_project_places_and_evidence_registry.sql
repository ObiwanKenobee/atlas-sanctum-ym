-- Atlas Sanctum v0.2.9 — project places and provenance-preserving evidence registry.
-- Evidence corrections are immutable numbered versions; reviews are separate append-only records.

create or replace function private.can_write_project_records(
  target_project_id uuid,
  target_organization_id uuid,
  allowed_functional_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.project_memberships pm
    join public.organization_memberships om
      on om.organization_id = pm.organization_id
     and om.user_id = pm.user_id
    join public.organizations o
      on o.id = om.organization_id
    join public.projects p
      on p.id = pm.project_id
     and p.organization_id = pm.organization_id
    where pm.project_id = target_project_id
      and pm.organization_id = target_organization_id
      and pm.user_id = (select auth.uid())
      and pm.access_level in ('manager', 'contributor')
      and pm.functional_role = any (allowed_functional_roles)
      and pm.status = 'active'
      and om.status = 'active'
      and o.status = 'active'
      and p.status = 'active'
  );
$function$;

revoke all on function private.can_write_project_records(uuid, uuid, text[]) from public, anon;
grant execute on function private.can_write_project_records(uuid, uuid, text[]) to authenticated;

create table public.project_places (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 80
  ),
  place_type text not null check (
    place_type in (
      'county', 'sub_county', 'ward', 'village', 'community', 'settlement',
      'facility', 'water_point', 'catchment', 'protected_area', 'landscape', 'other'
    )
  ),
  administrative_area text check (
    administrative_area is null
    or char_length(btrim(administrative_area)) between 2 and 240
  ),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  description text check (
    description is null
    or char_length(btrim(description)) between 3 and 1000
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  unique (project_id, slug),
  unique (id, project_id, organization_id),
  check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  )
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  place_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects(id, organization_id) on delete restrict,
  foreign key (place_id, project_id, organization_id)
    references public.project_places(id, project_id, organization_id) on delete restrict,
  unique (id, project_id, organization_id)
);

create table public.evidence_versions (
  id uuid primary key default gen_random_uuid(),
  evidence_item_id uuid not null,
  organization_id uuid not null,
  project_id uuid not null,
  version_number integer not null check (version_number >= 1),
  evidence_type text not null check (
    evidence_type in (
      'field_observation', 'survey', 'administrative_record', 'sensor_reading',
      'remote_sensing', 'photograph', 'document', 'interview', 'assessment', 'other'
    )
  ),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null check (char_length(btrim(description)) between 10 and 3000),
  source_type text not null check (
    source_type in (
      'person', 'organization', 'dataset', 'document', 'device', 'satellite',
      'field_visit', 'public_record', 'other'
    )
  ),
  source_name text not null check (char_length(btrim(source_name)) between 2 and 160),
  source_reference text check (
    source_reference is null
    or char_length(btrim(source_reference)) between 1 and 255
  ),
  source_url text check (
    source_url is null
    or (
      char_length(source_url) <= 2048
      and source_url ~ '^https://[^[:space:]]+$'
    )
  ),
  collected_at timestamptz not null,
  collection_method text not null check (
    char_length(btrim(collection_method)) between 3 and 500
  ),
  limitations text not null check (
    char_length(btrim(limitations)) between 3 and 1000
  ),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (evidence_item_id, project_id, organization_id)
    references public.evidence_items(id, project_id, organization_id) on delete restrict,
  unique (evidence_item_id, version_number),
  unique (id, evidence_item_id, project_id, organization_id)
);

create table public.evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_version_id uuid not null,
  evidence_item_id uuid not null,
  organization_id uuid not null,
  project_id uuid not null,
  outcome text not null check (outcome in ('accepted', 'rejected', 'needs_revision')),
  reviewer_note text not null check (
    char_length(btrim(reviewer_note)) between 3 and 1500
  ),
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  foreign key (evidence_version_id, evidence_item_id, project_id, organization_id)
    references public.evidence_versions(id, evidence_item_id, project_id, organization_id)
    on delete restrict,
  unique (evidence_version_id, reviewer_id)
);

create index project_places_org_project_created_idx
  on public.project_places (organization_id, project_id, created_at desc);
create index project_places_created_by_idx
  on public.project_places (created_by);
create index evidence_items_place_scope_idx
  on public.evidence_items (place_id, project_id, organization_id);
create index evidence_items_created_by_idx
  on public.evidence_items (created_by);
create index evidence_versions_item_scope_idx
  on public.evidence_versions (evidence_item_id, project_id, organization_id);
create index evidence_versions_org_project_submitted_idx
  on public.evidence_versions (organization_id, project_id, submitted_at desc);
create index evidence_versions_submitted_by_idx
  on public.evidence_versions (submitted_by);
create index evidence_reviews_version_scope_idx
  on public.evidence_reviews (evidence_version_id, evidence_item_id, project_id, organization_id);
create index evidence_reviews_org_project_reviewed_idx
  on public.evidence_reviews (organization_id, project_id, reviewed_at desc);
create index evidence_reviews_reviewer_idx
  on public.evidence_reviews (reviewer_id);

create or replace function private.can_review_evidence(
  target_evidence_version_id uuid,
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
    from public.evidence_versions ev
    join public.project_memberships pm
      on pm.project_id = ev.project_id
     and pm.organization_id = ev.organization_id
    join public.organization_memberships om
      on om.organization_id = pm.organization_id
     and om.user_id = pm.user_id
    join public.organizations o
      on o.id = om.organization_id
    join public.projects p
      on p.id = pm.project_id
     and p.organization_id = pm.organization_id
    where ev.id = target_evidence_version_id
      and ev.project_id = target_project_id
      and ev.organization_id = target_organization_id
      and ev.submitted_by <> (select auth.uid())
      and pm.user_id = (select auth.uid())
      and pm.access_level in ('manager', 'contributor')
      and pm.functional_role in ('verifier', 'steward')
      and pm.status = 'active'
      and om.status = 'active'
      and o.status = 'active'
      and p.status = 'active'
  );
$function$;

revoke all on function private.can_review_evidence(uuid, uuid, uuid) from public, anon;
grant execute on function private.can_review_evidence(uuid, uuid, uuid) to authenticated;

create or replace function private.enforce_evidence_version_sequence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null
    or new.submitted_by is distinct from (select auth.uid())
  then
    raise exception using errcode = '42501', message = 'evidence_submitter_must_be_authenticated_actor';
  end if;

  if not private.can_write_project_records(
    new.project_id,
    new.organization_id,
    array['analyst', 'implementer', 'steward']::text[]
  ) then
    raise exception using errcode = '42501', message = 'evidence_contributor_required';
  end if;

  if new.version_number = 1 then
    if exists (
      select 1
      from public.evidence_versions ev
      where ev.evidence_item_id = new.evidence_item_id
        and ev.project_id = new.project_id
        and ev.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23505', message = 'evidence_version_one_already_exists';
    end if;
  elsif not exists (
    select 1
    from public.evidence_versions ev
    where ev.evidence_item_id = new.evidence_item_id
      and ev.project_id = new.project_id
      and ev.organization_id = new.organization_id
      and ev.version_number = new.version_number - 1
  ) then
    raise exception using errcode = '23514', message = 'evidence_versions_must_be_sequential';
  end if;

  return new;
end;
$function$;

revoke all on function private.enforce_evidence_version_sequence() from public, anon, authenticated;

create trigger evidence_versions_enforce_sequence
  before insert on public.evidence_versions
  for each row execute function private.enforce_evidence_version_sequence();

create or replace function private.touch_project_place_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

revoke all on function private.touch_project_place_updated_at() from public, anon, authenticated;

create trigger project_places_touch_updated_at
  before update on public.project_places
  for each row execute function private.touch_project_place_updated_at();

create or replace function private.record_project_record_audit()
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
    nullif(v_row ->> 'submitted_by', '')::uuid,
    nullif(v_row ->> 'reviewer_id', '')::uuid
  );

  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'audit_actor_required';
  end if;

  if tg_table_name = 'project_places' then
    v_entity_type := 'project_place';
    if tg_op = 'INSERT' then
      v_event_type := 'project_place.created';
      v_payload := jsonb_build_object(
        'name', v_row ->> 'name',
        'slug', v_row ->> 'slug',
        'place_type', v_row ->> 'place_type'
      );
    else
      v_event_type := 'project_place.updated';
      v_payload := jsonb_build_object(
        'before_name', to_jsonb(old) ->> 'name',
        'after_name', v_row ->> 'name',
        'before_place_type', to_jsonb(old) ->> 'place_type',
        'after_place_type', v_row ->> 'place_type'
      );
    end if;
  elsif tg_table_name = 'evidence_items' then
    v_entity_type := 'evidence_item';
    v_event_type := 'evidence_item.created';
    v_payload := jsonb_build_object('place_id', v_row ->> 'place_id');
  elsif tg_table_name = 'evidence_versions' then
    v_entity_type := 'evidence_version';
    v_event_type := 'evidence_version.submitted';
    v_payload := jsonb_build_object(
      'evidence_item_id', v_row ->> 'evidence_item_id',
      'version_number', (v_row ->> 'version_number')::integer,
      'evidence_type', v_row ->> 'evidence_type',
      'source_type', v_row ->> 'source_type',
      'collected_at', v_row ->> 'collected_at'
    );
  elsif tg_table_name = 'evidence_reviews' then
    v_entity_type := 'evidence_review';
    v_event_type := 'evidence_review.recorded';
    v_payload := jsonb_build_object(
      'evidence_version_id', v_row ->> 'evidence_version_id',
      'outcome', v_row ->> 'outcome'
    );
  else
    raise exception using errcode = '22023', message = 'unsupported_project_audit_table';
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

revoke all on function private.record_project_record_audit() from public, anon, authenticated;

alter table public.audit_events
  drop constraint audit_events_entity_type_check;
alter table public.audit_events
  add constraint audit_events_entity_type_check
  check (
    entity_type in (
      'project', 'project_membership', 'project_place',
      'evidence_item', 'evidence_version', 'evidence_review'
    )
  );

alter table public.project_places enable row level security;
alter table public.evidence_items enable row level security;
alter table public.evidence_versions enable row level security;
alter table public.evidence_reviews enable row level security;

create policy project_places_select_active_members
  on public.project_places
  for select
  to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy project_places_insert_project_contributors
  on public.project_places
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_write_project_records(
      project_id,
      organization_id,
      array['analyst', 'authorizer', 'implementer', 'verifier', 'steward']::text[]
    )
  );

create policy project_places_update_project_managers
  on public.project_places
  for update
  to authenticated
  using (private.is_project_manager(project_id, organization_id))
  with check (private.is_project_manager(project_id, organization_id));

create policy evidence_items_select_active_members
  on public.evidence_items
  for select
  to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy evidence_items_insert_project_contributors
  on public.evidence_items
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_write_project_records(
      project_id,
      organization_id,
      array['analyst', 'implementer', 'steward']::text[]
    )
  );

create policy evidence_versions_select_active_members
  on public.evidence_versions
  for select
  to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy evidence_versions_insert_project_contributors
  on public.evidence_versions
  for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and private.can_write_project_records(
      project_id,
      organization_id,
      array['analyst', 'implementer', 'steward']::text[]
    )
  );

create policy evidence_reviews_select_active_members
  on public.evidence_reviews
  for select
  to authenticated
  using (private.is_project_member(project_id, organization_id));

create policy evidence_reviews_insert_independent_reviewers
  on public.evidence_reviews
  for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and private.can_review_evidence(evidence_version_id, project_id, organization_id)
  );

create trigger project_places_audit_insert
  after insert on public.project_places
  for each row execute function private.record_project_record_audit();

create trigger project_places_audit_update
  after update on public.project_places
  for each row execute function private.record_project_record_audit();

create trigger evidence_items_audit_insert
  after insert on public.evidence_items
  for each row execute function private.record_project_record_audit();

create trigger evidence_versions_audit_insert
  after insert on public.evidence_versions
  for each row execute function private.record_project_record_audit();

create trigger evidence_reviews_audit_insert
  after insert on public.evidence_reviews
  for each row execute function private.record_project_record_audit();

revoke all privileges on table public.project_places from public, anon, authenticated;
revoke all privileges on table public.evidence_items from public, anon, authenticated;
revoke all privileges on table public.evidence_versions from public, anon, authenticated;
revoke all privileges on table public.evidence_reviews from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert on table public.project_places to authenticated;
grant update (name, slug, place_type, administrative_area, latitude, longitude, description)
  on table public.project_places to authenticated;
grant select, insert on table public.evidence_items to authenticated;
grant select, insert on table public.evidence_versions to authenticated;
grant select, insert on table public.evidence_reviews to authenticated;

comment on table public.project_places is
  'Project-scoped place anchors. A project may cover multiple named places; records are visible only to active project members.';
comment on table public.evidence_items is
  'Stable identity for a provenance-bearing evidence series attached to one project place.';
comment on table public.evidence_versions is
  'Immutable, sequential evidence submissions. Corrections are appended as new versions; original source facts are preserved.';
comment on table public.evidence_reviews is
  'Append-only independent review decisions for an evidence version. Reviewers cannot review their own submissions.';
comment on function private.can_write_project_records(uuid, uuid, text[]) is
  'Checks active project membership, contributor-level access and an explicitly allowed functional role for project record writes.';
comment on function private.can_review_evidence(uuid, uuid, uuid) is
  'Allows an active project verifier or steward to review only another member''s evidence version.';
comment on function private.enforce_evidence_version_sequence() is
  'Requires the authenticated submitter to append evidence versions in sequential order.';
comment on function private.record_project_record_audit() is
  'Writes compact append-only audit events for project places, evidence items, evidence versions and reviews.';
