import { createClient } from '@/lib/supabase/server'

export type AuditEvent = { id: string; organization_id: string; actor_id: string; event_type: string; entity_type: string; entity_id: string | null; payload: Record<string, unknown>; previous_hash: string | null; event_hash: string; created_at: string }
export type DecisionLink = { id: string; organization_id: string; source_type: string; source_id: string; target_type: string; target_id: string; relationship: 'supports' | 'contradicts' | 'supersedes' | 'corrects' | 'informs'; created_by: string; created_at: string }

export async function getAuditEvents(organizationId: string, limit = 50) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('audit_events').select('id, organization_id, actor_id, event_type, entity_type, entity_id, payload, previous_hash, event_hash, created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error('Unable to load the audit trail')
  return (data ?? []) as AuditEvent[]
}

export async function getDecisionLinks(organizationId: string, sourceType: string, sourceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('decision_links').select('id, organization_id, source_type, source_id, target_type, target_id, relationship, created_by, created_at').eq('organization_id', organizationId).eq('source_type', sourceType).eq('source_id', sourceId).order('created_at', { ascending: false })
  if (error) throw new Error('Unable to load decision links')
  return (data ?? []) as DecisionLink[]
}
