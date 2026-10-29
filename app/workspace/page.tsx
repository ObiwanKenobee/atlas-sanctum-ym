import { redirect } from 'next/navigation'
import AtlasWorkspace from '@/components/atlas-workspace'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceOrganizations } from '@/lib/organizations'

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const organizations = await getWorkspaceOrganizations()
  return <AtlasWorkspace organizations={organizations} />
}

