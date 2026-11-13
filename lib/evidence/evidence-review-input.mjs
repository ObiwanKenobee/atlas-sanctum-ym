const allowedFields = new Set(['outcome', 'reviewerNote'])
const outcomes = new Set(['accepted', 'rejected', 'needs_revision'])

const invalid = (field, code) => ({ ok: false, field, code })

export function parseEvidenceReviewInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }

  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) return invalid(key, 'field_not_allowed')
  }

  if (typeof input.outcome !== 'string' || !outcomes.has(input.outcome)) {
    return invalid('outcome', 'invalid_review_outcome')
  }

  if (typeof input.reviewerNote !== 'string') {
    return invalid('reviewerNote', 'reviewer_note_required')
  }

  const reviewerNote = input.reviewerNote.trim()
  if (reviewerNote.length < 3 || reviewerNote.length > 1500) {
    return invalid('reviewerNote', 'invalid_length')
  }

  return {
    ok: true,
    value: {
      outcome: input.outcome,
      reviewerNote,
    },
  }
}
