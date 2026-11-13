import assert from 'node:assert/strict'
import test from 'node:test'
import { parseProjectMemberInput } from './project-member-input.mjs'

const userId = 'e5000000-0000-4000-8000-000000000005'

test('accepts an existing member ID and an allowed project access level', () => {
  assert.deepEqual(parseProjectMemberInput({ userId, accessLevel: 'contributor' }), {
    ok: true,
    value: { userId, accessLevel: 'contributor' },
  })
})

test('accepts manager, contributor and viewer access levels', () => {
  for (const accessLevel of ['manager', 'contributor', 'viewer']) {
    assert.equal(parseProjectMemberInput({ userId, accessLevel }).ok, true)
  }
})

test('rejects invalid user IDs and access levels', () => {
  assert.equal(parseProjectMemberInput({ userId: 'not-a-uuid', accessLevel: 'viewer' }).field, 'userId')
  assert.equal(parseProjectMemberInput({ userId, accessLevel: 'owner' }).field, 'accessLevel')
})

test('rejects client-selected functional role, organization and project ownership fields', () => {
  for (const extra of [
    { functionalRole: 'authorizer' },
    { functional_role: 'authorizer' },
    { organizationId: 'org-a' },
    { projectId: 'project-a' },
    { status: 'active' },
    { role: 'owner' },
  ]) {
    assert.equal(parseProjectMemberInput({ userId, accessLevel: 'viewer', ...extra }).code, 'field_not_allowed')
  }
})
