import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceOrganizations } from '@/lib/organizations'
import ProjectCreationForm from '@/components/project-creation-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Create a project | Atlas Sanctum',
  description: 'Create a project and atomically establish its initial manager membership.',
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const organizations = await getWorkspaceOrganizations()
  const manageableOrganizations = organizations.filter((organization) =>
    organization.role === 'owner' || organization.role === 'admin'
  )
  const { organizationId } = await searchParams
  const selected = manageableOrganizations.find((organization) => organization.id === organizationId)
    ?? manageableOrganizations[0]

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/projects" className="text-xs text-[#687168] hover:text-[#17382d]">← Projects</Link>
          <Link href="/workspace" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Institutional workspace / Project</p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">Give the work a <em className="text-[#a07837]">shared structure.</em></h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#687168]">A project defines its purpose and operating domain. Atlas will create your active manager membership together with the project and its audit record.</p>
        <div className="mt-10 max-w-2xl">
          {selected ? (
            <ProjectCreationForm
              organizations={manageableOrganizations.map(({ id, name, slug }) => ({ id, name, slug }))}
              initialOrganizationId={selected.id}
            />
          ) : (
            <div className="border border-dashed border-[#b9b29f] bg-[#f2ede2] p-7 sm:p-9">
              <h2 className="font-serif text-3xl font-light">Organization owner or admin access is required.</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#687168]">
                {organizations.length
                  ? 'Your account belongs to an organization, but it does not currently have an owner or admin role there. An organization administrator can create a project, or you can establish a separate organization that you own.'
                  : 'Create an organization first. The account that creates it becomes the owner and can create its first project.'}
              </p>
              <Link href="/organizations/new" className="mt-7 inline-flex bg-[#17382d] px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df]">Create an organization</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
