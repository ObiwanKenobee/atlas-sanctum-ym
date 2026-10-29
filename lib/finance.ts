import { createClient } from '@/lib/supabase/server'

export type FinanceCommitment = { id: string; title: string; funder: string; currency: string; committed_amount: number; disbursed_amount: number; status: 'proposed' | 'committed' | 'active' | 'closed' }

export async function getFinanceCommitments(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('finance_commitments').select('id, title, funder, currency, committed_amount, disbursed_amount, status').eq('organization_id', organizationId).order('updated_at', { ascending: false })
  if (error) throw new Error('Unable to load finance commitments')
  return (data ?? []) as FinanceCommitment[]
}
