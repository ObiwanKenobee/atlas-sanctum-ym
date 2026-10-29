import { createClient } from '@/lib/supabase/server'

export type PortfolioObservation = { id: string; title: string; domain: 'water_climate' | 'agriculture_food' | 'programme_accountability' | 'cross_cutting'; status: 'planned' | 'active' | 'paused' | 'completed'; summary: string; metric_label: string | null; metric_value: string | null; observed_at: string | null }

export async function getPortfolioObservations(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('portfolio_observations').select('id, title, domain, status, summary, metric_label, metric_value, observed_at').eq('organization_id', organizationId).order('updated_at', { ascending: false })
  if (error) throw new Error('Unable to load portfolio observations')
  return (data ?? []) as PortfolioObservation[]
}
