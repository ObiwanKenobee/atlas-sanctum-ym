-- Cover the leading column order of project scope composite foreign keys.
create index if not exists project_places_project_org_idx
  on public.project_places (project_id, organization_id);

create index if not exists evidence_items_project_org_idx
  on public.evidence_items (project_id, organization_id);
