'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const outcomes = [
  ['accepted', 'Accept evidence'],
  ['rejected', 'Reject evidence'],
  ['needs_revision', 'Request revision'],
] as const

export default function EvidenceReviewForm({
  projectId,
  evidenceVersionId,
}: {
  projectId: string
  evidenceVersionId: string
}) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<'accepted' | 'rejected' | 'needs_revision'>('accepted')
  const [reviewerNote, setReviewerNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      const response = await fetch(
        '/api/projects/' + projectId + '/evidence/' + evidenceVersionId + '/reviews',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome, reviewerNote }),
        },
      )
      const result = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        const messages: Record<string, string> = {
          unauthenticated: 'Your session has expired. Sign in again.',
          evidence_version_not_found: 'This evidence version is no longer available in the project.',
          evidence_self_review_forbidden: 'You cannot review evidence that you submitted.',
          evidence_review_authorization_required: 'Your active project role does not permit independent evidence review.',
          evidence_version_already_reviewed: 'You have already recorded a review for this evidence version.',
          evidence_review_input_invalid: 'The database rejected the review note or outcome.',
        }
        setError(messages[result?.error ?? ''] ?? 'The review could not be recorded. Try again.')
        return
      }

      router.refresh()
    } catch {
      setError('The review request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 border border-[#d4cebd] bg-[#f2ede2] p-4">
      <label className="block text-[10px] uppercase tracking-[0.12em] text-[#687168]">
        Independent review outcome
        <select
          value={outcome}
          onChange={(event) => setOutcome(event.target.value as typeof outcome)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm normal-case tracking-normal text-[#17382d]"
        >
          {outcomes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block text-[10px] uppercase tracking-[0.12em] text-[#687168]">
        Reason and review notes
        <textarea
          required
          minLength={3}
          maxLength={1500}
          rows={3}
          value={reviewerNote}
          onChange={(event) => setReviewerNote(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm normal-case tracking-normal text-[#17382d]"
        />
      </label>
      <p className="text-[11px] leading-relaxed text-[#687168]">
        This records an independent governance review of this exact version. It does not certify that the source or measurement is true.
      </p>
      {error && <p role="alert" className="border border-[#c96e5b] bg-[#f9e8e2] p-3 text-xs text-[#914634]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start bg-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60"
      >
        {pending ? 'Recording review…' : 'Record independent review'}
      </button>
    </form>
  )
}
