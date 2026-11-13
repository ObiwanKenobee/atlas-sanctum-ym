'use client'

import { FormEvent, useState } from 'react'

type Choice = { id: string; label: string }
type EvidenceChoice = { id: string; label: string; detail: string; description: string; limitations: string }
type OptionDraft = {
  name: string
  description: string
  expectedBenefit: string
  materialRisks: string
  estimatedCost: string
  currencyCode: string
  isRecommended: boolean
}

function Field({
  id, label, value, onChange, minLength, maxLength, rows = 3,
}: {
  id: string; label: string; value: string; onChange: (value: string) => void
  minLength: number; maxLength: number; rows?: number
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.12em] text-[#687168]">{label}</label>
      <textarea id={id} required minLength={minLength} maxLength={maxLength} rows={rows} value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#a07837]" />
    </div>
  )
}

function OptionFields({
  index, value, onChange, onRecommend,
}: {
  index: number; value: OptionDraft; onChange: (patch: Partial<OptionDraft>) => void
  onRecommend: () => void
}) {
  return (
    <article className="border border-[#d4cebd] bg-[#f2ede2] p-5 sm:p-6">
      <h3 className="font-serif text-xl font-light">Alternative {index + 1}</h3>
      <label htmlFor={`option-name-${index}`} className="mt-4 block text-xs uppercase tracking-[0.12em] text-[#687168]">Name</label>
      <input id={`option-name-${index}`} required minLength={2} maxLength={120} value={value.name}
        onChange={(event) => onChange({ name: event.target.value })}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      <Field id={`option-description-${index}`} label="Description" value={value.description}
        onChange={(description) => onChange({ description })} minLength={10} maxLength={2000} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={`option-benefit-${index}`} label="Expected benefit" value={value.expectedBenefit}
          onChange={(expectedBenefit) => onChange({ expectedBenefit })} minLength={3} maxLength={1500} />
        <Field id={`option-risk-${index}`} label="Material risks" value={value.materialRisks}
          onChange={(materialRisks) => onChange({ materialRisks })} minLength={3} maxLength={1500} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_140px]">
        <div>
          <label htmlFor={`cost-${index}`} className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Estimated cost (optional)</label>
          <input id={`cost-${index}`} inputMode="decimal" value={value.estimatedCost}
            onChange={(event) => onChange({ estimatedCost: event.target.value })}
            placeholder="150000.00" className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
        <div>
          <label htmlFor={`currency-${index}`} className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Currency</label>
          <input id={`currency-${index}`} maxLength={3} value={value.currencyCode} disabled={!value.estimatedCost}
            onChange={(event) => onChange({ currencyCode: event.target.value.toUpperCase() })}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm uppercase disabled:opacity-50" />
        </div>
      </div>
      <label className="mt-5 flex items-center gap-3 text-xs">
        <input type="radio" name="recommended-option" checked={value.isRecommended} onChange={onRecommend} className="h-4 w-4 accent-[#17382d]" />
        Recommended alternative
      </label>
    </article>
  )
}

export default function DecisionSubmissionForm({
  projectId, places, evidence,
}: { projectId: string; places: Choice[]; evidence: EvidenceChoice[] }) {
  const [placeId, setPlaceId] = useState('')
  const [question, setQuestion] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [rationale, setRationale] = useState('')
  const [uncertainty, setUncertainty] = useState('')
  const [noAction, setNoAction] = useState('')
  const [options, setOptions] = useState<OptionDraft[]>([
    { name: 'Option A', description: '', expectedBenefit: '', materialRisks: '', estimatedCost: '', currencyCode: 'KES', isRecommended: true },
    { name: 'Option B', description: '', expectedBenefit: '', materialRisks: '', estimatedCost: '', currencyCode: 'KES', isRecommended: false },
  ])
  const [evidenceVersionId, setEvidenceVersionId] = useState(evidence[0]?.id ?? '')
  const [relevanceNote, setRelevanceNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((current) => current.map((option, i) => i === index ? { ...option, ...patch } : option))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${projectId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: placeId || null,
          decisionQuestion: question,
          recommendation,
          rationale,
          uncertainty,
          consequenceOfNoAction: noAction,
          options: options.map((option) => ({
            ...option,
            estimatedCost: option.estimatedCost || null,
            currencyCode: option.estimatedCost ? option.currencyCode : null,
          })),
          evidenceLinks: [{ evidenceVersionId, relevanceNote }],
        }),
      })
      const result = await response.json().catch(() => null) as { decisionId?: string; error?: string } | null
      if (!response.ok || !result?.decisionId) {
        const messages: Record<string, string> = {
          unauthenticated: 'Your session has expired. Sign in again.',
          decision_authorization_required: 'Your project membership does not permit proposal submission.',
          decision_packet_invalid: 'The proposal or its evidence citation did not satisfy the database contract.',
          project_not_found: 'This project is not available to your account.',
        }
        setError(messages[result?.error ?? ''] ?? 'The proposal could not be submitted. Review the fields and try again.')
        return
      }
      window.location.assign(`/projects/${projectId}/decisions/${result.decisionId}`)
    } catch {
      setError('The request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  const selectedEvidence = evidence.find((item) => item.id === evidenceVersionId)

  return (
    <form onSubmit={submit} className="space-y-9">
      <section className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">01 / Decision</p>
        <label htmlFor="decision-place" className="mt-5 block text-xs uppercase tracking-[0.12em] text-[#687168]">Place (optional)</label>
        <select id="decision-place" value={placeId} onChange={(event) => setPlaceId(event.target.value)} className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm">
          <option value="">Project-wide decision</option>
          {places.map((place) => <option key={place.id} value={place.id}>{place.label}</option>)}
        </select>
        <Field id="decision-question" label="What decision must be made?" value={question} onChange={setQuestion} minLength={10} maxLength={2000} />
        <Field id="decision-recommendation" label="Recommended course of action" value={recommendation} onChange={setRecommendation} minLength={10} maxLength={3000} />
        <Field id="decision-rationale" label="Rationale" value={rationale} onChange={setRationale} minLength={10} maxLength={3000} rows={4} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="decision-uncertainty" label="Uncertainty and limitations" value={uncertainty} onChange={setUncertainty} minLength={3} maxLength={2000} />
          <Field id="decision-no-action" label="Consequence of no action" value={noAction} onChange={setNoAction} minLength={3} maxLength={2000} />
        </div>
      </section>

      <section className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">02 / Alternatives</p>
        <h2 className="mt-3 font-serif text-2xl font-light">Compare at least two credible options.</h2>
        <p className="mt-2 text-xs leading-relaxed text-[#687168]">Exactly one alternative must be recommended. The database currently allows up to ten alternatives; this first interface records two.</p>
        <div className="mt-6 space-y-5">
          {options.map((option, index) => (
            <OptionFields key={index} index={index} value={option}
              onChange={(patch) => updateOption(index, patch)}
              onRecommend={() => setOptions((current) => current.map((item, i) => ({ ...item, isRecommended: i === index })))} />
          ))}
        </div>
      </section>

      <section className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">03 / Evidence</p>
        <h2 className="mt-3 font-serif text-2xl font-light">Cite one exact project evidence version.</h2>
        <label htmlFor="evidence-version" className="mt-5 block text-xs uppercase tracking-[0.12em] text-[#687168]">Evidence version</label>
        <select id="evidence-version" required value={evidenceVersionId} onChange={(event) => setEvidenceVersionId(event.target.value)} className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm">
          <option value="">Select an evidence version</option>
          {evidence.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {selectedEvidence && <div className="mt-3 border-l-2 border-[#a07837] pl-3 text-xs leading-relaxed text-[#687168]">
          <p>{selectedEvidence.detail}</p><p className="mt-2">{selectedEvidence.description}</p><p className="mt-2">Limitations: {selectedEvidence.limitations}</p>
        </div>}
        <Field id="evidence-relevance" label="Why does this evidence matter?" value={relevanceNote} onChange={setRelevanceNote} minLength={5} maxLength={1200} rows={3} />
      </section>

      {error && <p role="alert" className="border border-[#c96e5b] bg-[#f9e8e2] p-4 text-sm text-[#914634]">{error}</p>}
      <div className="border-t border-[#c9c2b1] pt-6">
        <p className="max-w-3xl text-xs leading-relaxed text-[#687168]">Submission creates an immutable first version and audit events. A separate eligible project authorizer must review this exact version. Submission does not assign work, release funds, or authorize implementation.</p>
        <button type="submit" disabled={pending || evidence.length === 0} className="mt-6 bg-[#17382d] px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">{pending ? 'Submitting…' : 'Submit proposal for review'}</button>
      </div>
    </form>
  )
}
