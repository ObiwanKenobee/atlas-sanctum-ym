import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProjectTeamManager from '@/components/project-team-manager'
import { getWorkspaceOrganizations } from '@/lib/organizations'
import { isWorkspaceFunctionalRole } from '@/lib/workspace-roles.mjs'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Project team | Atlas Sanctum',
  description: 'Inspect project membership and assign existing organization members.',
}

type DirectoryRecord = {
  user_id: string
  email: string | null
  role: string | null
}

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id, name, purpose')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) throw new Error('Unable to load this project')
  if (!project) notFound()

  const [membershipResult, organizations] = await Promise.all([
    supabase
      .from('project_memberships')
      .select('user_id, access_level, functional_role, status, created_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true }),
    getWorkspaceOrganizations(),
  ])

  if (membershipResult.error) throw new Error('Unable to load project team membership')

  const organization = organizations.find((item) => item.id === project.organization_id)
  const canManage = organization?.role === 'owner' || organization?.role === 'admin'
  let directory: DirectoryRecord[] = []

  if (canManage) {
    const { data, error } = await supabase.rpc('list_organization_user_directory', {
      target_organization_id: project.organization_id,
    })
    if (error) throw new Error('Unable to load the organization member directory')
    directory = Array.isArray(data) ? data as DirectoryRecord[] : []
  }

  const directoryByUser = new Map(directory.map((record) => [record.user_id, record] as const))
  const memberRows = membershipResult.data ?? []
  const existingIds = new Set(memberRows.map((member) => member.user_id))

  const members = memberRows.map((member) => ({
    userId: member.user_id,
    email: canManage ? directoryByUser.get(member.user_id)?.email ?? null : null,
    accessLevel: member.access_level as 'manager' | 'contributor' | 'viewer',
    functionalRole: member.functional_role,
    status: member.status as 'active' | 'inactive',
  }))

  const candidates = directory.flatMap((record) => {
    if (
      !record.user_id ||
      existingIds.has(record.user_id) ||
      !isWorkspaceFunctionalRole(record.role)
    ) return []

    return [{
      userId: record.user_id,
      email: record.email ?? `Member ${record.user_id.slice(0, 8)}`,
      functionalRole: record.role,
    }]
  })

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href={`/projects/${project.id}/decisions`} className="text-xs text-[#687168] hover:text-[#17382d]">← Decision register</Link>
          <Link href="/projects" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Project / Team & access</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">{project.name}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#687168]">{project.purpose}</p>
        <div className="mt-10">
          <ProjectTeamManager
            projectId={project.id}
            members={members}
            candidates={candidates}
            canManage={Boolean(canManage)}
          />
        </div>
        <p className="mt-9 border-t border-[#d4cebd] pt-5 text-xs leading-relaxed text-[#687168]">Project access (manager, contributor, viewer) is distinct from functional role (analyst, authorizer, implementer, verifier, steward). The database checks both against the organization and the member’s persisted workspace profile.</p>
      </div>
    </main>
  )
}
