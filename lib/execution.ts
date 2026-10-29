import { createClient } from '@/lib/supabase/server'

export type ExecutionRecord = { id: string; title: string; system_type: 'finance' | 'humanitarian' | 'regenerative' | 'development'; status: 'authorized' | 'in_progress' | 'paused' | 'completed' | 'cancelled'; started_at: string | null; completed_at: string | null }

export async function getExecutionRecords(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('execution_records').select('id, title, system_type, status, started_at, completed_at').eq('organization_id', organizationId).order('created_at', { ascending: false })
  if (error) throw new Error('Unable to load execution records')
  return (data ?? []) as ExecutionRecord[]
}
