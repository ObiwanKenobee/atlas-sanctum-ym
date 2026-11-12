-- Serialize decision packet support inserts against authorization.
-- Both support material and approval lock the same immutable decision-version row.
-- This closes the race where a concurrent option/citation insert could pass its
-- pre-approval RLS check while an authorizer was approving the same version.

create or replace function private.lock_decision_packet_support()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_author_id uuid;
  v_actor_id uuid;
  v_is_reviewed boolean;
begin
  v_actor_id := (select auth.uid());
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'decision_support_actor_required';
  end if;

  select dv.author_id
    into v_author_id
  from public.decision_versions dv
  where dv.id = new.decision_version_id
    and dv.decision_id = new.decision_id
    and dv.project_id = new.project_id
    and dv.organization_id = new.organization_id
  for update;

  if not found or v_author_id is distinct from v_actor_id then
    raise exception using errcode = '42501', message = 'decision_version_author_required';
  end if;

  if not private.can_create_decision(new.project_id, new.organization_id) then
    raise exception using errcode = '42501', message = 'decision_contributor_required';
  end if;

  select exists (
    select 1
    from public.decision_approvals da
    where da.decision_version_id = new.decision_version_id
      and da.decision_id = new.decision_id
      and da.project_id = new.project_id
      and da.organization_id = new.organization_id
  )
  into v_is_reviewed;

  if v_is_reviewed then
    raise exception using errcode = '42501', message = 'decision_packet_locked_after_review';
  end if;

  return new;
end;
$function$;

revoke all on function private.lock_decision_packet_support() from public, anon, authenticated;

create trigger decision_options_lock_after_review
  before insert on public.decision_options
  for each row execute function private.lock_decision_packet_support();

create trigger decision_evidence_links_lock_after_review
  before insert on public.decision_evidence_links
  for each row execute function private.lock_decision_packet_support();

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

  -- The same row lock is taken by support-material inserts. This serializes
  -- packet completion and approval under concurrent transactions.
  perform 1
  from public.decision_versions dv
  where dv.id = new.decision_version_id
    and dv.decision_id = new.decision_id
    and dv.project_id = new.project_id
    and dv.organization_id = new.organization_id
  for update;

  if not found then
    raise exception using errcode = '23503', message = 'decision_version_not_found';
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

comment on function private.lock_decision_packet_support() is
  'Serializes decision option and evidence citation inserts against approval; reviewed versions are immutable.';
comment on function private.enforce_decision_approval_requirements() is
  'Locks the exact decision version before validating its alternatives and evidence citations, preventing concurrent packet changes during authorization.';
