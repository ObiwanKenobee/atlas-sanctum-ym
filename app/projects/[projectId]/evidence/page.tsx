
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProjectEvidenceForm from '@/components/project-evidence-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Project evidence | Atlas Sanctum',
  description: 'Submit and inspect project-scoped provenance-bearing evidence versions.',
}

const evidenceRoles = ['analyst', 'implementer', 'steward']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default async function ProjectEvidencePage({
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

  const [membershipResult, placesResult, itemsResult] = await Promise.all([
    supabase.from('project_memberships')
      .select('access_level, functional_role, status')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('project_places')
      .select('id, name, administrative_area')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .order('name', { ascending: true }),
    supabase.from('evidence_items')
      .select('id, place_id, created_at')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .order('created_at', { ascending: false }),
  ])

  if (membershipResult.error) throw new Error('Unable to verify project permissions')
  if (placesResult.error || itemsResult.error) throw new Error('Unable to load project evidence')

  const membership = membershipResult.data
  const canSubmitEvidence = Boolean(
    membership &&
    ['manager', 'contributor'].includes(membership.access_level) &&
    evidenceRoles.includes(membership.functional_role),
  )

  const places = (placesResult.data ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    administrative_area: place.administrative_area,
    label: place.name + (place.administrative_area ? ' · ' + place.administrative_area : ''),
  }))
  const items = itemsResult.data ?? []
  const itemIds = items.map((item) => item.id)

  let versions: Array<{
    id: string
    evidence_item_id: string
    version_number: number
    evidence_type: string
    title: string
    description: string
    source_type: string
    source_name: string
    source_reference: string | null
    source_url: string | null
    collected_at: string
    collection_method: string
    limitations: string
    submitted_at: string
  }> = []

  if (itemIds.length) {
    const { data, error } = await supabase
      .from('evidence_versions')
      .select('id, evidence_item_id, version_number, evidence_type, title, description, source_type, source_name, source_reference, source_url, collected_at, collection_method, limitations, submitted_at')
      .in('evidence_item_id', itemIds)
      .order('submitted_at', { ascending: false })
    if (error) throw new Error('Unable to load evidence versions')
    versions = data ?? []
  }

  const placeById = new Map(places.map((place) => [place.id, place] as const))
  const placeByItemId = new Map(items.map((item) => [item.id, item.place_id] as const))

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href={'/projects/' + project.id + '/decisions'} className="text-xs text-[#687168] hover:text-[#17382d]">← Decision register</Link>
          <Link href="/workspace" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">{project.name} / Evidence registry</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">Evidence with <em className="text-[#a07837]">provenance.</em></h1>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#687168]">Each submission creates a stable project evidence identity and an immutable first version. Source, collection method, collection time, and limitations travel with the record. Corrections are submitted as new versions; previous evidence remains intact.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={'/projects/' + project.id + '/places'} className="border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Manage project places</Link>
          <Link href={'/projects/' + project.id + '/decisions'} className="border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Decision register</Link>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <section>
            <div className="border-b border-[#c9c2b1] pb-4">
              <h2 className="font-serif text-2xl font-light">Evidence history</h2>
              <p className="mt-1 text-xs text-[#687168]">{versions.length} immutable evidence versions across {items.length} evidence records</p>
            </div>
            {versions.length ? (
              <div className="divide-y divide-[#d4cebd]">
                {versions.map((version) => {
                  const placeId = placeByItemId.get(version.evidence_item_id)
                  const place = placeId ? placeById.get(placeId) : null
                  return (
                    <article key={version.id} className="py-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a07837]">{version.evidence_type.replaceAll('_', ' ')} · Version {version.version_number}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#687168]">Submitted {formatDate(version.submitted_at)}</span>
                      </div>
                      <h3 className="mt-3 font-serif text-2xl font-light">{version.title}</h3>
                      <p className="mt-1 text-xs text-[#687168]">{place ? place.name + (place.administrative_area ? ' · ' + place.administrative_area : '') : 'Place unavailable'}</p>
                      <p className="mt-3 text-sm leading-relaxed text-[#687168]">{version.description}</p>
                      <div className="mt-4 grid gap-3 text-xs text-[#687168] sm:grid-cols-2">
                        <p><strong className="font-medium text-[#17382d]">Source:</strong> {version.source_name} · {version.source_type.replaceAll('_', ' ')}</p>
                        <p><strong className="font-medium text-[#17382d]">Collected:</strong> {formatDate(version.collected_at)}</p>
                        <p><strong className="font-medium text-[#17382d]">Method:</strong> {version.collection_method}</p>
                        <p><strong className="font-medium text-[#17382d]">Limitations:</strong> {version.limitations}</p>
                      </div>
                      {version.source_reference && <p className="mt-3 text-xs text-[#687168]">Reference: {version.source_reference}</p>}
                      {version.source_url && <a href={version.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[10px] uppercase tracking-[0.12em] text-[#a07837] underline underline-offset-4">Open source reference ↗</a>}
                      <p className="mt-3 text-[9px] uppercase tracking-[0.1em] text-[#687168]">Submitted record · independent review is a separate workflow</p>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="border border-dashed border-[#b9b29f] bg-[#f2ede2] px-5 py-8">
                <h3 className="font-serif text-2xl font-light">No project evidence yet.</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#687168]">Submit the first place-linked observation, survey, administrative record, sensor reading, document, or other evidence item.</p>
              </div>
            )}
          </section>
          <section>
            <div className="border-b border-[#c9c2b1] pb-4">
              <h2 className="font-serif text-2xl font-light">Submit evidence</h2>
              <p className="mt-1 text-xs text-[#687168]">Only analysts, implementers, and stewards with active manager/contributor access can submit evidence.</p>
            </div>
            <div className="mt-5">
              {places.length === 0 ? (
                <div className="border border-dashed border-[#b9b29f] bg-[#f2ede2] p-6">
                  <h3 className="font-serif text-xl font-light">Register a place first.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#687168]">Every evidence item belongs to a project place. This is a required provenance link, not an optional label.</p>
                  <Link href={'/projects/' + project.id + '/places'} className="mt-5 inline-flex bg-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#f7f3ea]">Register project place</Link>
                </div>
              ) : canSubmitEvidence ? (
                <ProjectEvidenceForm projectId={project.id} places={places.map((place) => ({ id: place.id, label: place.label }))} />
              ) : (
                <div className="border border-[#d4cebd] bg-[#efe9dc] p-6">
                  <h3 className="font-serif text-xl font-light">Evidence-submission permission required</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#687168]">An active project manager or contributor with the analyst, implementer, or steward functional role is required. The database enforces the same rule.</p>
                </div>
              )}
            </div>
          </section>
        </div>
        <p className="mt-10 border-t border-[#d4cebd] pt-5 text-xs leading-relaxed text-[#687168]">This release stores evidence descriptions and provenance metadata. It does not upload binary attachments, certify source truth, or independently review submissions. An evidence record is not itself proof that a measurement is accurate.</p>
      </div>
    </main>
  )
}
