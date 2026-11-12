import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceOrganizations } from '@/lib/organizations'

export const metadata: Metadata = {
  title: 'Projects | Atlas Sanctum',
  description: 'Open institutionally scoped project workspaces and their decision records.',
}

const domainLabels: Record<string, string> = {
  water_climate: 'Water & climate resilience',
  agriculture_food: 'Agriculture & food systems',
  programme_accountability: 'Programme accountability',
  cross_cutting: 'Cross-cutting',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [organizations, membershipResult] = await Promise.all([
    getWorkspaceOrganizations(),
    supabase
      .from('project_memberships')
      .select('project_id, organization_id, access_level, functional_role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  if (membershipResult.error) throw new Error('Unable to load project memberships')

  const memberships = membershipResult.data ?? []
  const projectIds = [...new Set(memberships.map((membership) => membership.project_id))]
  let projects: Array<{
    id: string
    organization_id: string
    name: string
    slug: string
    purpose: string
    domain: string
    status: string
    created_at: string
  }> = []

  if (projectIds.length) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, organization_id, name, slug, purpose, domain, status, created_at')
      .in('id', projectIds)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Unable to load accessible projects')
    projects = data ?? []
  }

  const membershipByProject = new Map(memberships.map((membership) => [membership.project_id, membership]))
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]))

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
          <Link href="/" className="font-serif text-xl tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
          <Link href="/overview" className="text-[10px] uppercase tracking-[0.16em] text-[#687168] hover:text-[#a07837]">Back to overview</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-10">
        <div className="flex flex-col justify-between gap-8 border-b border-[#c9c2b1] pb-12 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Command center / Projects</p>
            <h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.95] tracking-[-0.04em] sm:text-8xl">Work with <em className="text-[#a07837]">accountability.</em></h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#687168]">Projects hold the shared context for places, evidence, decisions, responsibility, and verified outcomes. Only projects where your membership is active appear here.</p>
          </div>
          <Link href="/workspace" className="inline-flex shrink-0 items-center justify-center border border-[#17382d] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Open observatory</Link>
        </div>

        <section aria-labelledby="project-list" className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#c9c2b1] pb-4">
            <div>
              <h2 id="project-list" className="font-serif text-3xl font-light">Your projects</h2>
              <p className="mt-2 text-sm text-[#687168]">Institutional records are scoped to active project membership.</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#687168]">{projects.length} accessible</span>
          </div>

          {projects.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {projects.map((project) => {
                const membership = membershipByProject.get(project.id)
                const organization = organizationById.get(project.organization_id)
                return (
                  <article key={project.id} className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a07837]">{domainLabels[project.domain] ?? project.domain}</span>
                      <span className="border border-[#d4cebd] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#687168]">{project.status.replaceAll('_', ' ')}</span>
                    </div>
                    <h3 className="mt-7 font-serif text-3xl font-light">{project.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#687168]">{project.purpose}</p>
                    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#d4cebd] pt-4 text-[10px] uppercase tracking-[0.12em] text-[#687168]">
                      <span>{organization?.name ?? 'Institutional workspace'}</span>
                      <span>{membership?.access_level ?? 'member'} · {membership?.functional_role ?? 'role not available'}</span>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link href={`/projects/${project.id}/decisions`} className="inline-flex items-center bg-[#17382d] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f0df] hover:bg-[#285344]">Open decision register</Link>
                      <Link href={`/projects/${project.id}/decisions`} className="inline-flex items-center border border-[#c9c2b1] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:border-[#a07837]">View project record</Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-[#b9b29f] bg-[#f2ede2] px-6 py-12 sm:px-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">No active project memberships</p>
              <h3 className="mt-4 max-w-2xl font-serif text-3xl font-light">Your institutional register is ready for its first project.</h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#687168]">
                {organizations.length
                  ? 'Your account belongs to an organization, but it has no active project membership yet. An organization administrator must establish the project and grant your role before project records appear.'
                  : 'This account has no organization membership yet. An organization must be established and a project membership assigned before institutional records can be displayed.'}
              </p>
              <p className="mt-5 max-w-2xl text-xs leading-relaxed text-[#687168]">Project creation and invitation controls are not exposed in this interface yet. No sample or simulated records are shown as live institutional work.</p>
              <Link href="/workspace" className="mt-7 inline-flex border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Return to observatory</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
