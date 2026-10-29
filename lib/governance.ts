import { createClient } from '@/lib/supabase/server'

export type GovernanceSummary = { appeals: number; privacyRequests: number }

export async function getGovernanceSummary(organizationId: string): Promise<GovernanceSummary> {
  const supabase = await createClient()
  const [{ count: appeals, error: appealsError }, { count: privacyRequests, error: privacyError }] = await Promise.all([
    supabase.from('governance_appeals').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    supabase.from('privacy_requests').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
  ])
  if (appealsError || privacyError) throw new Error('Unable to load governance summary')
  return { appeals: appeals ?? 0, privacyRequests: privacyRequests ?? 0 }
}
