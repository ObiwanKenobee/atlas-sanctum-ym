import { createClient } from '@/lib/supabase/server'

export type DirectoryUser = { user_id: string; email: string | null; role: 'analyst' | 'authorizer' | 'implementer' | 'verifier' | 'steward' | null; organization_role: 'owner' | 'admin' | 'member' | 'viewer'; portfolio: string | null; governance: string | null; joined_at: string }

export async function getOrganizationUserDirectory(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('list_organization_user_directory', { target_organization_id: organizationId })
  if (error) throw new Error('Unable to load the organization user directory')
  return (data ?? []) as DirectoryUser[]
}
