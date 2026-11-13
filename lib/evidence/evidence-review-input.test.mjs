import test from 'node:test'
import assert from 'node:assert/strict'
import { parseEvidenceReviewInput } from './evidence-review-input.mjs'

const validInput = (overrides = {}) => ({
  outcome: 'accepted',
  reviewerNote: 'Source identity and collection method are adequately documented.',
  ...overrides,
})

test('accepts valid review outcomes and normalizes reviewer notes', () => {
  for (const outcome of ['accepted', 'rejected', 'needs_revision']) {
    const result = parseEvidenceReviewInput(validInput({ outcome, reviewerNote: '  Review note is clear.  ' }))
    assert.equal(result.ok, true)
    assert.equal(result.value.outcome, outcome)
    assert.equal(result.value.reviewerNote, 'Review note is clear.')
  }
})

test('rejects missing, array, and non-object request bodies', () => {
  assert.equal(parseEvidenceReviewInput(null).code, 'object_required')
  assert.equal(parseEvidenceReviewInput([]).code, 'object_required')
  assert.equal(parseEvidenceReviewInput('accepted').code, 'object_required')
})

test('rejects mass-assignment and client-supplied authorization fields', () => {
  assert.equal(parseEvidenceReviewInput(validInput({ reviewerId: 'user-id' })).code, 'field_not_allowed')
  assert.equal(parseEvidenceReviewInput(validInput({ projectId: 'project-id' })).code, 'field_not_allowed')
  assert.equal(parseEvidenceReviewInput(validInput({ organizationId: 'org-id' })).code, 'field_not_allowed')
})

test('rejects unsupported review outcomes', () => {
  assert.equal(parseEvidenceReviewInput(validInput({ outcome: 'approved' })).field, 'outcome')
  assert.equal(parseEvidenceReviewInput(validInput({ outcome: '' })).code, 'invalid_review_outcome')
})

test('requires a reviewer note within database limits', () => {
  assert.equal(parseEvidenceReviewInput(validInput({ reviewerNote: '  ' })).code, 'invalid_length')
  assert.equal(parseEvidenceReviewInput(validInput({ reviewerNote: 'x'.repeat(1501) })).code, 'invalid_length')
})

test('rejects a missing or non-string reviewer note', () => {
  assert.equal(parseEvidenceReviewInput({ outcome: 'accepted' }).code, 'reviewer_note_required')
  assert.equal(parseEvidenceReviewInput(validInput({ reviewerNote: 42 })).code, 'reviewer_note_required')
})
