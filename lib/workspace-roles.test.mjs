import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isWorkspaceFunctionalRole,
  WORKSPACE_FUNCTIONAL_ROLES,
} from './workspace-roles.mjs'

test('exposes the canonical workspace functional roles', () => {
  assert.deepEqual([...WORKSPACE_FUNCTIONAL_ROLES], [
    'analyst',
    'authorizer',
    'implementer',
    'verifier',
    'steward',
  ])
})

test('accepts every canonical workspace functional role', () => {
  for (const role of WORKSPACE_FUNCTIONAL_ROLES) {
    assert.equal(isWorkspaceFunctionalRole(role), true, role)
  }
})

test('rejects legacy onboarding labels and unknown values', () => {
  for (const role of [
    'Program lead',
    'Researcher',
    'Funder / investor',
    'Implementation partner',
    '',
    null,
    undefined,
    42,
    {},
  ]) {
    assert.equal(isWorkspaceFunctionalRole(role), false)
  }
})
