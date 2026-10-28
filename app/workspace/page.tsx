import { redirect } from 'next/navigation'
import AtlasWorkspace from '@/components/atlas-workspace'
import { createClient } from '@/lib/supabase/server'

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  return <AtlasWorkspace />
}

