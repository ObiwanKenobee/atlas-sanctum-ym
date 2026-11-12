import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildDecisionRegisterRows } from '@/lib/decision-register/view-model.mjs'

export const metadata: Metadata = {
  title: 'Decision Register | Atlas Sanctum',
  description: 'Inspect versioned project decisions, their alternatives, evidence, and review status.',
}

const statusLabels: Record<string, string> = {
  unversioned: 'No proposal version',
  pending: 'Awaiting authorization',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
}

const statusStyles: Record<string, string> = {
  unversioned: 'border-[#d4cebd] text-[#687168]',
  pending: 'border-[#c9a95d] bg-[#f4ead0] text-[#8d682d]',
  approved: 'border-[#98b29e] bg-[#e6efe5] text-[#47634e]',
  rejected: 'border-[#c89b8f] bg-[#f5e8e4] text-[#8b5144]',
  revision_requested: 'border-[#9eb5bd] bg-[#e6eff1] text-[#47636c]',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(value))
}

export default async function ProjectDecisionsPage({
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
    .select('id, organization_id, name, purpose, domain, status')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) throw new Error('Unable to load this project')
  if (!project) notFound()

  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('id, place_id, created_at')
    .eq('project_id', project.id)
    .eq('organization_id', project.organization_id)
    .order('created_at', { ascending: false })

  if (decisionsError) throw new Error('Unable to load the project decision register')

  const decisionRows = decisions ?? []
  const decisionIds = decisionRows.map((decision) => decision.id)
  let versions: Array<{
    id: string
    decision_id: string
    version_number: number
    decision_question: string
    recommendation: string
    created_at: string
  }> = []
  let approvals: Array<{
    decision_version_id: string
    outcome: 'approved' | 'rejected' | 'revision_requested'
    reviewed_at: string
  }> = []
  let places: Array<{ id: string; name: string; administrative_area: string | null }> = []

  if (decisionIds.length) {
    const [versionResult, approvalResult] = await Promise.all([
      supabase
        .from('decision_versions')
        .select('id, decision_id, version_number, decision_question, recommendation, created_at')
        .in('decision_id', decisionIds)
        .order('version_number', { ascending: false }),
      supabase
        .from('decision_approvals')
        .select('decision_version_id, outcome, reviewed_at')
        .in('decision_id', decisionIds),
    ])

    if (versionResult.error || approvalResult.error) {
      throw new Error('Unable to load decision versions and reviews')
    }
    versions = versionResult.data ?? []
    approvals = approvalResult.data ?? []

    const placeIds = [...new Set(decisionRows.map((decision) => decision.place_id).filter((placeId): placeId is string => typeof placeId === 'string'))]
    if (placeIds.length) {
      const { data, error } = await supabase
        .from('project_places')
        .select('id, name, administrative_area')
        .in('id', placeIds)
        .eq('project_id', project.id)
      if (error) throw new Error('Unable to load decision place references')
      places = data ?? []
    }
  }

  const placeById = new Map(places.map((place) => [place.id, place] as const))
  const register = buildDecisionRegisterRows(decisionRows, versions, approvals)

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/projects" className="text-xs text-[#687168] hover:text-[#17382d]">← Projects</Link>
          <Link href="/workspace" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Project / Decision register</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">{project.name}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#687168]">{project.purpose}</p>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-y border-[#c9c2b1] py-4">
          <div>
            <h2 className="font-serif text-2xl font-light">Decisions</h2>
            <p className="mt-1 text-xs text-[#687168]">Each review is attached to one immutable proposal version.</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#687168]">{register.length} records</span>
        </div>

        {register.length ? (
          <div className="divide-y divide-[#d4cebd]">
            {register.map(({ decision, latestVersion, approval, status }) => {
              const place = decision.place_id ? placeById.get(decision.place_id) : null
              return (
                <article key={decision.id} className="py-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#687168]">
                      {place ? `${place.name}${place.administrative_area ? ` · ${place.administrative_area}` : ''}` : 'Project-wide decision'}
                      {latestVersion ? ` · Version ${latestVersion.version_number}` : ''}
                    </span>
                    <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${statusStyles[status] ?? statusStyles.unversioned}`}>{statusLabels[status] ?? 'Status unavailable'}</span>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-light sm:text-3xl">{latestVersion?.decision_question ?? 'Decision record created; proposal version not yet recorded.'}</h3>
                  {latestVersion && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#687168]"><span className="font-medium text-[#17382d]">Current recommendation:</span> {latestVersion.recommendation}</p>}
                  {approval && <p className="mt-3 text-xs text-[#687168]">Reviewed {formatDate(approval.reviewed_at)} · outcome recorded for version {latestVersion?.version_number}</p>}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <time className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#687168]" dateTime={decision.created_at}>Created {formatDate(decision.created_at)}</time>
                    <Link href={`/projects/${project.id}/decisions/${decision.id}`} className="border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Inspect full record →</Link>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-[#b9b29f] bg-[#f2ede2] px-6 py-12 sm:px-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">No decisions recorded</p>
            <h3 className="mt-4 font-serif text-3xl font-light">The decision register is empty.</h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#687168]">When a proposal is submitted, its question, alternatives, cited evidence, uncertainty, and subsequent review will appear here. This register is read-only in the current release.</p>
          </div>
        )}
        <p className="mt-10 border-t border-[#d4cebd] pt-5 text-xs leading-relaxed text-[#687168]">Visibility is enforced by the authenticated project membership and database row-level security. This page does not grant access or authority through interface state.</p>
      </div>
    </main>
  )
}
