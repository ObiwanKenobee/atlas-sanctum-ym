
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseProjectEvidenceInput } from './project-evidence-input.mjs'

const PLACE_ID = '10000000-0000-4000-8000-000000000001'

function validInput(overrides = {}) {
  return {
    placeId: PLACE_ID,
    evidenceType: 'field_observation',
    title: 'Intermittent water service observation',
    description: 'A structured observation of water service availability at the selected project place.',
    sourceType: 'field_visit',
    sourceName: 'Project field team',
    sourceReference: 'FIELD-OBS-001',
    sourceUrl: 'https://example.org/field-log/001',
    collectedAt: '2026-11-12T08:30:00+03:00',
    collectionMethod: 'Structured observation and operator interview.',
    limitations: 'One visit only; repeat sampling is required.',
    ...overrides,
  }
}

test('accepts a complete evidence record and normalizes collection time', () => {
  const result = parseProjectEvidenceInput(validInput())
  assert.equal(result.ok, true)
  assert.equal(result.value.collectedAt, '2026-11-12T05:30:00.000Z')
})

test('accepts absent optional source metadata', () => {
  const result = parseProjectEvidenceInput(validInput({ sourceReference: null, sourceUrl: null }))
  assert.equal(result.ok, true)
  assert.equal(result.value.sourceUrl, null)
})

test('rejects non-object bodies and mass assignment', () => {
  assert.equal(parseProjectEvidenceInput([]).code, 'object_required')
  assert.equal(parseProjectEvidenceInput(validInput({ organizationId: 'x' })).code, 'field_not_allowed')
  assert.equal(parseProjectEvidenceInput(validInput({ submittedBy: 'x' })).code, 'field_not_allowed')
})

test('rejects invalid place IDs and evidence/source types', () => {
  assert.equal(parseProjectEvidenceInput(validInput({ placeId: 'bad' })).field, 'placeId')
  assert.equal(parseProjectEvidenceInput(validInput({ evidenceType: 'guess' })).field, 'evidenceType')
  assert.equal(parseProjectEvidenceInput(validInput({ sourceType: 'social_media' })).field, 'sourceType')
})

test('requires valid https source URLs', () => {
  assert.equal(parseProjectEvidenceInput(validInput({ sourceUrl: 'http://example.org' })).code, 'https_source_url_required')
  assert.equal(parseProjectEvidenceInput(validInput({ sourceUrl: 'not a url' })).code, 'invalid_source_url')
})

test('rejects invalid collection timestamps and undersized descriptions', () => {
  assert.equal(parseProjectEvidenceInput(validInput({ collectedAt: 'yesterday' })).field, 'collectedAt')
  assert.equal(parseProjectEvidenceInput(validInput({ description: 'short' })).code, 'invalid_length')
})
