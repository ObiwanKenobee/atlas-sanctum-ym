import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDecisionRegisterRows } from './view-model.mjs'

const decisions = [{ id: 'decision-a' }, { id: 'decision-b' }, { id: 'decision-c' }]
const versions = [
  { id: 'a-v1', decision_id: 'decision-a', version_number: 1 },
  { id: 'a-v2', decision_id: 'decision-a', version_number: 2 },
  { id: 'b-v1', decision_id: 'decision-b', version_number: 1 },
]
const approvals = [
  { decision_version_id: 'a-v1', outcome: 'approved' },
  { decision_version_id: 'b-v1', outcome: 'rejected' },
]

test('uses the latest immutable proposal version for each decision', () => {
  const rows = buildDecisionRegisterRows(decisions, versions, approvals)
  assert.equal(rows[0].latestVersion.id, 'a-v2')
  assert.equal(rows[0].latestVersion.version_number, 2)
})

test('does not carry an earlier version approval to a newer revision', () => {
  const rows = buildDecisionRegisterRows(decisions, versions, approvals)
  assert.equal(rows[0].approval, null)
  assert.equal(rows[0].status, 'pending')
})

test('distinguishes approved, rejected, pending and unversioned decisions', () => {
  const rows = buildDecisionRegisterRows(decisions, versions, approvals)
  assert.deepEqual(rows.map((row) => row.status), [
    'pending',
    'rejected',
    'unversioned',
  ])
})

test('preserves the decision order supplied by the scoped database query', () => {
  const ordered = [decisions[2], decisions[0]]
  const rows = buildDecisionRegisterRows(ordered, versions, approvals)
  assert.deepEqual(rows.map((row) => row.decision.id), ['decision-c', 'decision-a'])
})

test('returns safe empty state for an empty project register', () => {
  assert.deepEqual(buildDecisionRegisterRows([], [], []), [])
})
