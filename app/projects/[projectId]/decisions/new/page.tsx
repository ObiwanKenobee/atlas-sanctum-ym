import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import DecisionSubmissionForm from '@/components/decision-submission-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Submit Decision Proposal | Atlas Sanctum',
  description: 'Create an evidence-linked, versioned project decision proposal.',
}

const authorRoles = ['analyst', 'implementer', 'steward']

export default async function NewDecisionPage({
  params,
}: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id, name, purpose, status')
    .eq('id', projectId)
    .maybeSingle()
  if (projectError) throw new Error('Unable to load this project')
  if (!project || project.status !== 'active') notFound()

  const { data: membership, error: membershipError } = await supabase
    .from('project_memberships')
    .select('access_level, functional_role, status')
    .eq('project_id', project.id)
    .eq('organization_id', project.organization_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membershipError) throw new Error('Unable to verify project permissions')

  const canSubmit = Boolean(
    membership &&
    ['manager', 'contributor'].includes(membership.access_level) &&
    authorRoles.includes(membership.functional_role),
  )

  const [placeResult, evidenceResult] = await Promise.all([
    supabase.from('project_places')
      .select('id, name, administrative_area')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .order('name', { ascending: true }),
    supabase.from('evidence_versions')
      .select('id, version_number, evidence_type, title, description, source_name, source_reference, collected_at, limitations')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .order('version_number', { ascending: false }),
  ])
  if (placeResult.error || evidenceResult.error) {
    throw new Error('Unable to load project places and evidence')
  }

  const places = (placeResult.data ?? []).map((place) => ({
    id: place.id,
    label: `${place.name}${place.administrative_area ? ` · ${place.administrative_area}` : ''}`,
  }))
  const evidence = (evidenceResult.data ?? []).map((item) => ({
    id: item.id,
    label: `v${item.version_number} · ${item.title} · ${item.source_name}`,
    detail: `${item.evidence_type} · ${item.source_reference ?? 'No source reference'} · ${new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(item.collected_at))}`,
    description: item.description,
    limitations: item.limitations,
  }))

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href={`/projects/${project.id}/decisions`} className="text-xs text-[#687168] hover:text-[#17382d]">← Decision register</Link>
          <Link href="/workspace" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">{project.name} / Decision proposal</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">Make the reasoning <em className="text-[#a07837]">reviewable.</em></h1>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#687168]">Submission creates an immutable proposal version with alternatives and exact evidence citations. It does not approve the decision or authorize implementation.</p>

        {!canSubmit ? (
          <section className="mt-10 border border-[#d4cebd] bg-[#efe9dc] p-7">
            <h2 className="font-serif text-2xl font-light">Authoring permission required</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#687168]">Only active project managers or contributors with the analyst, implementer, or steward functional role can create a proposal.</p>
          </section>
        ) : evidence.length === 0 ? (
          <section className="mt-10 border border-dashed border-[#b9b29f] bg-[#f2ede2] p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">Evidence required</p>
            <h2 className="mt-4 font-serif text-2xl font-light">No project evidence versions are available.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#687168]">At least one exact, project-scoped evidence version is required. Personal field records are not automatically institutional evidence. The project evidence intake interface is not yet implemented, so this proposal form remains unavailable until evidence is registered.</p>
          </section>
        ) : (
          <div className="mt-10"><DecisionSubmissionForm projectId={project.id} places={places} evidence={evidence} /></div>
        )}
      </div>
    </main>
  )
}
