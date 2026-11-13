
'use client'

import { FormEvent, useState } from 'react'

type PlaceChoice = { id: string; label: string }

const evidenceTypes = [
  ['field_observation', 'Field observation'],
  ['survey', 'Survey'],
  ['administrative_record', 'Administrative record'],
  ['sensor_reading', 'Sensor reading'],
  ['remote_sensing', 'Remote sensing'],
  ['photograph', 'Photograph'],
  ['document', 'Document'],
  ['interview', 'Interview'],
  ['assessment', 'Assessment'],
  ['other', 'Other'],
]

const sourceTypes = [
  ['person', 'Person'],
  ['organization', 'Organization'],
  ['dataset', 'Dataset'],
  ['document', 'Document'],
  ['device', 'Device'],
  ['satellite', 'Satellite'],
  ['field_visit', 'Field visit'],
  ['public_record', 'Public record'],
  ['other', 'Other'],
]

function localDateTime() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function ProjectEvidenceForm({
  projectId,
  places,
}: {
  projectId: string
  places: PlaceChoice[]
}) {
  const [placeId, setPlaceId] = useState(places[0]?.id ?? '')
  const [evidenceType, setEvidenceType] = useState('field_observation')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceType, setSourceType] = useState('field_visit')
  const [sourceName, setSourceName] = useState('')
  const [sourceReference, setSourceReference] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [collectedAt, setCollectedAt] = useState(localDateTime())
  const [collectionMethod, setCollectionMethod] = useState('')
  const [limitations, setLimitations] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/projects/' + projectId + '/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId, evidenceType, title, description, sourceType, sourceName,
          sourceReference: sourceReference || null,
          sourceUrl: sourceUrl || null,
          collectedAt: new Date(collectedAt).toISOString(), collectionMethod, limitations,
        }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) {
        const messages: Record<string, string> = {
          unauthenticated: 'Your session has expired. Sign in again.',
          evidence_authorization_required: 'Your project role does not permit submitting evidence.',
          evidence_place_not_in_project: 'Select a place registered in this project.',
          evidence_input_invalid: 'The database rejected one or more evidence fields.',
        }
        setError(messages[result?.error ?? ''] ?? 'The evidence could not be submitted. Review the fields and try again.')
        return
      }
      window.location.assign('/projects/' + projectId + '/evidence')
    } catch {
      setError('The request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-8">
      <div>
        <label htmlFor="evidence-place" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Project place</label>
        <select id="evidence-place" required value={placeId} onChange={(event) => setPlaceId(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm">
          {places.map((place) => <option key={place.id} value={place.id}>{place.label}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="evidence-type" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Evidence type</label>
          <select id="evidence-type" value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm">
            {evidenceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="evidence-collected-at" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Collected at</label>
          <input id="evidence-collected-at" type="datetime-local" required value={collectedAt} onChange={(event) => setCollectedAt(event.target.value)}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="evidence-title" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Evidence title</label>
        <input id="evidence-title" required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      </div>
      <div>
        <label htmlFor="evidence-description" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">What does this evidence record?</label>
        <textarea id="evidence-description" required minLength={10} maxLength={3000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm leading-relaxed" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="evidence-source-type" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Source type</label>
          <select id="evidence-source-type" value={sourceType} onChange={(event) => setSourceType(event.target.value)}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm">
            {sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="evidence-source-name" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Source name</label>
          <input id="evidence-source-name" required minLength={2} maxLength={160} value={sourceName} onChange={(event) => setSourceName(event.target.value)}
            placeholder="Organization, enumerator, device, dataset…"
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="evidence-source-reference" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Source reference (optional)</label>
          <input id="evidence-source-reference" maxLength={255} value={sourceReference} onChange={(event) => setSourceReference(event.target.value)}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
        <div>
          <label htmlFor="evidence-source-url" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Source URL (optional, HTTPS)</label>
          <input id="evidence-source-url" type="url" maxLength={2048} value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://…"
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="evidence-method" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Collection method</label>
        <textarea id="evidence-method" required minLength={3} maxLength={500} rows={2} value={collectionMethod} onChange={(event) => setCollectionMethod(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      </div>
      <div>
        <label htmlFor="evidence-limitations" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Limitations and uncertainty</label>
        <textarea id="evidence-limitations" required minLength={3} maxLength={1000} rows={3} value={limitations} onChange={(event) => setLimitations(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      </div>
      <p className="text-xs leading-relaxed text-[#687168]">This records provenance metadata and a text description. It does not upload or store a photograph, document, or other binary attachment. Corrections must be added as a new immutable evidence version.</p>
      {error && <p role="alert" className="border border-[#c96e5b] bg-[#f9e8e2] p-3 text-sm text-[#914634]">{error}</p>}
      <button type="submit" disabled={pending || places.length === 0} className="bg-[#17382d] px-5 py-4 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">
        {pending ? 'Submitting evidence…' : 'Submit first evidence version'}
      </button>
    </form>
  )
}
