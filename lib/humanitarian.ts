import { createClient } from '@/lib/supabase/server'

export type HumanitarianNeed = { id: string; title: string; description: string; severity: 'critical' | 'high' | 'moderate' | 'low'; status: 'open' | 'triaged' | 'referred' | 'resolved'; created_at: string }

export async function getHumanitarianNeeds(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('humanitarian_needs').select('id, title, description, severity, status, created_at').eq('organization_id', organizationId).order('created_at', { ascending: false })
  if (error) throw new Error('Unable to load humanitarian needs')
  return (data ?? []) as HumanitarianNeed[]
}
