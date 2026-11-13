import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDecisionSubmissionInput } from './decision-submission-input.mjs'

const PLACE_ID = '10000000-0000-4000-8000-000000000001'
const EVIDENCE_ID = '20000000-0000-4000-8000-000000000002'
const OTHER_EVIDENCE_ID = '20000000-0000-4000-8000-000000000003'

function validInput(overrides = {}) {
  return {
    placeId: PLACE_ID,
    decisionQuestion: 'How should the service zone improve water reliability?',
    recommendation: 'Implement targeted repairs with pressure monitoring.',
    rationale: 'The approach addresses priority failures while generating measurable operating data.',
    uncertainty: 'The baseline measurements are incomplete.',
    consequenceOfNoAction: 'Service interruptions may continue without a monitored remediation plan.',
    options: [
      {
        name: 'Targeted repairs',
        description: 'Repair priority leaks and damaged connections identified in a site audit.',
        expectedBenefit: 'Reduce service interruptions.',
        materialRisks: 'Repair costs may exceed initial estimates.',
        estimatedCost: '150000.00',
        currencyCode: 'KES',
        isRecommended: true,
      },
      {
        name: 'Monitoring only',
        description: 'Install monitoring equipment without committing to immediate repairs.',
        expectedBenefit: 'Improve fault visibility.',
        materialRisks: 'Monitoring alone may not restore service.',
        isRecommended: false,
      },
    ],
    evidenceLinks: [
      { evidenceVersionId: EVIDENCE_ID, relevanceNote: 'Supports the baseline service reliability assessment.' },
    ],
    ...overrides,
  }
}

test('accepts a complete proposal and normalizes optional cost metadata', () => {
  const result = parseDecisionSubmissionInput(validInput())
  assert.equal(result.ok, true)
  assert.equal(result.value.options[0].currencyCode, 'KES')
  assert.equal(result.value.options[1].estimatedCost, null)
  assert.equal(result.value.placeId, PLACE_ID)
})

test('accepts a project-wide proposal without a place', () => {
  const result = parseDecisionSubmissionInput(validInput({ placeId: null }))
  assert.equal(result.ok, true)
  assert.equal(result.value.placeId, null)
})

test('rejects a non-object request body', () => {
  assert.equal(parseDecisionSubmissionInput([]).code, 'object_required')
})

test('rejects tenant and identity mass-assignment fields', () => {
  assert.equal(parseDecisionSubmissionInput(validInput({ organizationId: PLACE_ID })).code, 'field_not_allowed')
  assert.equal(parseDecisionSubmissionInput(validInput({ createdBy: PLACE_ID })).code, 'field_not_allowed')
})

test('rejects a malformed project place identifier', () => {
  assert.equal(parseDecisionSubmissionInput(validInput({ placeId: 'not-a-uuid' })).field, 'placeId')
})

test('rejects a short decision question', () => {
  assert.equal(parseDecisionSubmissionInput(validInput({ decisionQuestion: 'Too short' })).code, 'invalid_length')
})

test('requires two or more alternatives', () => {
  assert.equal(parseDecisionSubmissionInput(validInput({ options: [validInput().options[0]] })).code, 'two_to_ten_options_required')
})

test('caps alternatives at ten', () => {
  const options = Array.from({ length: 11 }, (_, index) => ({
    ...validInput().options[1], name: `Alternative ${index + 1}`,
  }))
  options[0].isRecommended = true
  assert.equal(parseDecisionSubmissionInput(validInput({ options })).code, 'two_to_ten_options_required')
})

test('requires exactly one recommended alternative', () => {
  const options = validInput().options.map((option) => ({ ...option, isRecommended: false }))
  assert.equal(parseDecisionSubmissionInput(validInput({ options })).code, 'exactly_one_recommended_option_required')
})

test('rejects duplicate option names case-insensitively', () => {
  const options = validInput().options.map((option) => ({ ...option }))
  options[1].name = 'targeted repairs'
  assert.equal(parseDecisionSubmissionInput(validInput({ options })).code, 'duplicate_option_name')
})

test('rejects a client-supplied option identity or tenant field', () => {
  const options = validInput().options.map((option) => ({ ...option }))
  options[0].decisionId = PLACE_ID
  assert.equal(parseDecisionSubmissionInput(validInput({ options })).code, 'field_not_allowed')
})

test('requires at least one exact evidence-version citation', () => {
  assert.equal(parseDecisionSubmissionInput(validInput({ evidenceLinks: [] })).code, 'one_to_twenty_evidence_citations_required')
})

test('rejects malformed or duplicated evidence-version IDs', () => {
  assert.equal(parseDecisionSubmissionInput(validInput({
    evidenceLinks: [{ evidenceVersionId: 'bad', relevanceNote: 'Supports the assessment.' }],
  })).code, 'invalid_evidence_version_id')
  assert.equal(parseDecisionSubmissionInput(validInput({
    evidenceLinks: [
      { evidenceVersionId: EVIDENCE_ID, relevanceNote: 'Supports the baseline.' },
      { evidenceVersionId: EVIDENCE_ID, relevanceNote: 'Confirms the same baseline.' },
    ],
  })).code, 'duplicate_evidence_version')
})

test('rejects invalid or unpaired cost and currency values', () => {
  const option = { ...validInput().options[0], currencyCode: null }
  assert.equal(parseDecisionSubmissionInput(validInput({ options: [option, validInput().options[1]] })).code, 'cost_and_currency_must_be_paired')
  const invalidCost = { ...validInput().options[0], estimatedCost: '-2' }
  assert.equal(parseDecisionSubmissionInput(validInput({ options: [invalidCost, validInput().options[1]] })).code, 'invalid_cost')
})

test('rejects non-ISO three-letter currency values', () => {
  const option = { ...validInput().options[0], currencyCode: 'KESX' }
  assert.equal(parseDecisionSubmissionInput(validInput({ options: [option, validInput().options[1]] })).code, 'invalid_currency_code')
})

test('rejects duplicate citations with a distinct source note but same version ID', () => {
  const links = [
    { evidenceVersionId: EVIDENCE_ID, relevanceNote: 'Supports the baseline.' },
    { evidenceVersionId: OTHER_EVIDENCE_ID, relevanceNote: 'Adds another measurement.' },
  ]
  const result = parseDecisionSubmissionInput(validInput({ evidenceLinks: links }))
  assert.equal(result.ok, true)
  assert.equal(result.value.evidenceLinks.length, 2)
})
