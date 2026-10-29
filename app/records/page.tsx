import { redirect } from 'next/navigation'
import AtlasRecords from '@/components/atlas-records'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Field records | Atlas Sanctum', description: 'Capture and review evidence in your Atlas Sanctum workspace.' }

export default async function RecordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data } = await supabase.from('field_records').select('id, title, region, category, observed_on, summary, source_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  return <AtlasRecords records={data ?? []} />
}
