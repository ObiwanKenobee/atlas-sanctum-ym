import { createClient } from '@/lib/supabase/server'

export type DevelopmentPriority = { id: string; title: string; description: string; region: string | null; goal: string; urgency: number; equity: number; feasibility: number; status: 'proposed' | 'prioritized' | 'in_progress' | 'verified' | 'archived' }

export async function getDevelopmentPriorities(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('development_priorities').select('id, title, description, region, goal, urgency, equity, feasibility, status').eq('organization_id', organizationId).order('urgency', { ascending: false })
  if (error) throw new Error('Unable to load development priorities')
  return (data ?? []) as DevelopmentPriority[]
}
