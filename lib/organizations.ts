import { createClient } from '@/lib/supabase/server'

export type WorkspaceOrganization = { id: string; name: string; slug: string; role: 'owner' | 'admin' | 'member' | 'viewer' }

export async function getWorkspaceOrganizations(): Promise<WorkspaceOrganization[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('organization_memberships').select('role, organizations (id, name, slug)').order('created_at', { ascending: true })
  if (error) throw new Error('Unable to load workspace organizations')
  return (data ?? []).flatMap((membership) => {
    const organization = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations
    return organization ? [{ id: organization.id, name: organization.name, slug: organization.slug, role: membership.role as WorkspaceOrganization['role'] }] : []
  })
}
