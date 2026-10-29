import { redirect } from 'next/navigation'
import AtlasWorkspace from '@/components/atlas-workspace'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceOrganizations } from '@/lib/organizations'
import { getPortfolioObservations } from '@/lib/portfolio'

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const organizations = await getWorkspaceOrganizations()
  const portfolioObservations = organizations[0] ? await getPortfolioObservations(organizations[0].id) : []
  return <AtlasWorkspace organizations={organizations} portfolioObservations={portfolioObservations} />
}

