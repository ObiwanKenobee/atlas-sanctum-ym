import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Decision Record | Atlas Sanctum',
  description: 'Inspect the version history, alternatives, source evidence, and independent reviews behind a project decision.',
}

const outcomeLabels: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default async function DecisionRecordPage({
  params,
}: {
  params: Promise<{ projectId: string; decisionId: string }>
}) {
  const { projectId, decisionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id, name')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) throw new Error('Unable to load this project')
  if (!project) notFound()

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .select('id, project_id, organization_id, place_id, created_at')
    .eq('id', decisionId)
    .eq('project_id', project.id)
    .eq('organization_id', project.organization_id)
    .maybeSingle()

  if (decisionError) throw new Error('Unable to load this decision record')
  if (!decision) notFound()

  const [versionResult, optionResult, evidenceLinkResult, approvalResult] = await Promise.all([
    supabase
      .from('decision_versions')
      .select('id, version_number, decision_question, recommendation, rationale, uncertainty, consequence_of_no_action, author_id, created_at')
      .eq('decision_id', decision.id)
      .order('version_number', { ascending: true }),
    supabase
      .from('decision_options')
      .select('id, decision_version_id, option_name, description, expected_benefit, material_risks, estimated_cost, currency_code, is_recommended')
      .eq('decision_id', decision.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('decision_evidence_links')
      .select('id, decision_version_id, evidence_version_id, evidence_item_id, relevance_note, linked_at')
      .eq('decision_id', decision.id)
      .order('linked_at', { ascending: true }),
    supabase
      .from('decision_approvals')
      .select('id, decision_version_id, outcome, reviewer_note, authorizer_id, reviewed_at')
      .eq('decision_id', decision.id)
      .order('reviewed_at', { ascending: true }),
  ])

  if (versionResult.error || optionResult.error || evidenceLinkResult.error || approvalResult.error) {
    throw new Error('Unable to load the complete decision history')
  }

  const versions = versionResult.data ?? []
  const options = optionResult.data ?? []
  const evidenceLinks = evidenceLinkResult.data ?? []
  const approvals = approvalResult.data ?? []
  const evidenceVersionIds = [...new Set(evidenceLinks.map((link) => link.evidence_version_id))]

  let evidenceVersions: Array<{
    id: string
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
  }> = []

  if (evidenceVersionIds.length) {
    const { data, error } = await supabase
      .from('evidence_versions')
      .select('id, version_number, evidence_type, title, description, source_type, source_name, source_reference, source_url, collected_at, collection_method, limitations')
      .in('id', evidenceVersionIds)

    if (error) throw new Error('Unable to load cited evidence versions')
    evidenceVersions = data ?? []
  }

  let place: { name: string; administrative_area: string | null } | null = null
  if (decision.place_id) {
    const { data, error } = await supabase
      .from('project_places')
      .select('name, administrative_area')
      .eq('id', decision.place_id)
      .eq('project_id', project.id)
      .maybeSingle()

    if (error) throw new Error('Unable to load the decision place')
    place = data
  }

  const evidenceByVersion = new Map(evidenceVersions.map((evidence) => [evidence.id, evidence]))

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href={`/projects/${project.id}/decisions`} className="text-xs text-[#687168] hover:text-[#17382d]">← Decision register</Link>
          <Link href="/workspace" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">{project.name} / Decision record</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">The reasoning, <em className="text-[#a07837]">preserved.</em></h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#687168]">A versioned record of the question, recommendation, alternatives, evidence and independent review. Earlier versions remain visible; approvals apply only to the version reviewed.</p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-y border-[#c9c2b1] py-4">
          <div>
            <h2 className="font-serif text-2xl font-light">Decision history</h2>
            <p className="mt-1 text-xs text-[#687168]">{place ? `${place.name}${place.administrative_area ? ` · ${place.administrative_area}` : ''}` : 'Project-wide decision'}</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#687168]">{versions.length} proposal versions</span>
        </div>

        {versions.length ? (
          <div className="space-y-8">
            {versions.map((version) => {
              const versionOptions = options.filter((option) => option.decision_version_id === version.id)
              const versionLinks = evidenceLinks.filter((link) => link.decision_version_id === version.id)
              const approval = approvals.find((item) => item.decision_version_id === version.id)
              return (
                <article key={version.id} className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4cebd] pb-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Proposal version {version.version_number}</p>
                    {approval ? (
                      <span className="border border-[#9eb5bd] bg-[#e6eff1] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#47636c]">{outcomeLabels[approval.outcome] ?? approval.outcome}</span>
                    ) : (
                      <span className="border border-[#c9a95d] bg-[#f4ead0] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#8d682d]">Awaiting authorization</span>
                    )}
                  </div>

                  <h3 className="mt-7 font-serif text-3xl font-light leading-tight sm:text-4xl">{version.decision_question}</h3>
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <section>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Recommendation</h4>
                      <p className="mt-3 text-sm leading-relaxed">{version.recommendation}</p>
                    </section>
                    <section>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Rationale</h4>
                      <p className="mt-3 text-sm leading-relaxed text-[#687168]">{version.rationale}</p>
                    </section>
                    <section>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Uncertainty & limitations</h4>
                      <p className="mt-3 text-sm leading-relaxed text-[#687168]">{version.uncertainty}</p>
                    </section>
                    <section>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Consequence of no action</h4>
                      <p className="mt-3 text-sm leading-relaxed text-[#687168]">{version.consequence_of_no_action}</p>
                    </section>
                  </div>

                  <section className="mt-10 border-t border-[#d4cebd] pt-7">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h4 className="font-serif text-2xl font-light">Alternatives considered</h4>
                        <p className="mt-1 text-xs text-[#687168]">Trade-offs retained with this exact proposal version.</p>
                      </div>
                      <span className="font-mono text-[10px] text-[#687168]">{versionOptions.length} options</span>
                    </div>
                    {versionOptions.length ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {versionOptions.map((option) => (
                          <div key={option.id} className="border border-[#d4cebd] p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h5 className="font-serif text-xl font-light">{option.option_name}</h5>
                              {option.is_recommended && <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a07837]">Recommended</span>}
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[#687168]">{option.description}</p>
                            <p className="mt-4 text-xs leading-relaxed"><strong className="font-medium">Expected benefit:</strong> {option.expected_benefit}</p>
                            <p className="mt-2 text-xs leading-relaxed text-[#687168]"><strong className="font-medium text-[#17382d]">Material risks:</strong> {option.material_risks}</p>
                            {option.estimated_cost !== null && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#687168]">Estimated cost: {option.currency_code} {Number(option.estimated_cost).toLocaleString('en-KE')}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-[#687168]">No alternatives are attached to this version.</p>
                    )}
                  </section>

                  <section className="mt-10 border-t border-[#d4cebd] pt-7">
                    <div>
                      <h4 className="font-serif text-2xl font-light">Cited evidence</h4>
                      <p className="mt-1 text-xs text-[#687168]">Each citation points to an exact, immutable evidence version.</p>
                    </div>
                    {versionLinks.length ? (
                      <div className="mt-5 divide-y divide-[#e1dbce]">
                        {versionLinks.map((link) => {
                          const evidence = evidenceByVersion.get(link.evidence_version_id)
                          return (
                            <article key={link.id} className="py-5">
                              {evidence ? (
                                <>
                                  <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#a07837]">
                                    <span>{evidence.evidence_type.replaceAll('_', ' ')}</span>
                                    <span>·</span>
                                    <span>Evidence v{evidence.version_number}</span>
                                    <span>·</span>
                                    <span>{evidence.source_type.replaceAll('_', ' ')}</span>
                                  </div>
                                  <h5 className="mt-2 font-serif text-xl font-light">{evidence.title}</h5>
                                  <p className="mt-2 text-sm leading-relaxed text-[#687168]">{evidence.description}</p>
                                  <div className="mt-4 grid gap-3 text-xs text-[#687168] sm:grid-cols-2">
                                    <p><strong className="font-medium text-[#17382d]">Source:</strong> {evidence.source_name}{evidence.source_reference ? ` · ${evidence.source_reference}` : ''}</p>
                                    <p><strong className="font-medium text-[#17382d]">Collected:</strong> {formatDate(evidence.collected_at)}</p>
                                    <p><strong className="font-medium text-[#17382d]">Method:</strong> {evidence.collection_method}</p>
                                    <p><strong className="font-medium text-[#17382d]">Limitations:</strong> {evidence.limitations}</p>
                                  </div>
                                  {evidence.source_url && <a href={evidence.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[10px] uppercase tracking-[0.12em] text-[#a07837] underline underline-offset-4">Open source reference ↗</a>}
                                </>
                              ) : (
                                <p className="text-sm text-[#687168]">The cited evidence version is not available to this project member.</p>
                              )}
                              <p className="mt-3 text-xs leading-relaxed text-[#687168]"><strong className="font-medium text-[#17382d]">Why it matters:</strong> {link.relevance_note}</p>
                            </article>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-[#687168]">No evidence citations are attached to this proposal version.</p>
                    )}
                  </section>

                  <section className="mt-10 border-t border-[#d4cebd] pt-7">
                    <h4 className="font-serif text-2xl font-light">Authorization history</h4>
                    {approval ? (
                      <div className="mt-5 border border-[#d4cebd] bg-[#f2ede2] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a07837]">{outcomeLabels[approval.outcome] ?? approval.outcome}</p>
                          <time className="font-mono text-[10px] text-[#687168]" dateTime={approval.reviewed_at}>{formatDate(approval.reviewed_at)}</time>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[#687168]">{approval.reviewer_note}</p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[#687168]">Independent reviewer record · approver identity retained in the audit trail</p>
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-[#687168]">No authorization outcome has been recorded for version {version.version_number}.</p>
                    )}
                  </section>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#d4cebd] pt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#687168]">Submitted {formatDate(version.created_at)}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#687168]">Immutable version · no inherited approvals</p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-[#b9b29f] bg-[#f2ede2] px-6 py-12">
            <h3 className="font-serif text-3xl font-light">This decision has no proposal versions.</h3>
            <p className="mt-3 text-sm text-[#687168]">The decision identity exists, but a versioned proposal has not been submitted.</p>
          </div>
        )}
      </div>
    </main>
  )
}
