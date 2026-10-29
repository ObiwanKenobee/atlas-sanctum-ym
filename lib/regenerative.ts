import { createClient } from '@/lib/supabase/server'

export type RegenerativeIndicator = { id: string; name: string; category: 'water' | 'soil' | 'biodiversity' | 'livelihoods' | 'circularity'; value: number; unit: string; target: number | null; observed_at: string; source: string }

export async function getRegenerativeIndicators(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('regenerative_indicators').select('id, name, category, value, unit, target, observed_at, source').eq('organization_id', organizationId).order('observed_at', { ascending: false })
  if (error) throw new Error('Unable to load regenerative indicators')
  return (data ?? []) as RegenerativeIndicator[]
}
