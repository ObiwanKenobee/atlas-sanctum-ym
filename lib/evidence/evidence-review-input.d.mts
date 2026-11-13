export type EvidenceReviewOutcome = 'accepted' | 'rejected' | 'needs_revision'

export type EvidenceReviewInput = {
  outcome: EvidenceReviewOutcome
  reviewerNote: string
}

export type EvidenceReviewParseResult =
  | { ok: true; value: EvidenceReviewInput }
  | { ok: false; field: string; code: string }

export function parseEvidenceReviewInput(input: unknown): EvidenceReviewParseResult
