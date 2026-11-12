import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorkspaceProject } from './create-workspace-project.mjs'

const input = {
  organizationId: 'org-a',
  body: {
    name: 'Nakuru Water Reliability',
    purpose: 'Improve the reliability of selected water service points.',
    domain: 'water_climate',
  },
}

function makeResolver(overrides = {}) {
  const calls = []
  const resolver = {
    async getAuthenticatedUserId() {
      calls.push('auth')
      return 'user-owner'
    },
    async findOrganizationMembership(scope) {
      calls.push(['membership', scope])
      return { userId: 'user-owner', organizationId: 'org-a', role: 'owner' }
    },
    async insertProject(args) {
      calls.push(['insert', args])
      return { id: 'project-1', organizationId: 'org-a', ...args.project }
    },
    ...overrides,
  }
  return { resolver, calls }
}

test('creates only after trusted authentication and owner membership lookup', async () => {
  const { resolver, calls } = makeResolver()
  const result = await createWorkspaceProject(input, resolver)
  assert.equal(result.ok, true)
  assert.equal(result.status, 201)
  assert.equal(calls[0], 'auth')
  assert.deepEqual(calls[1], ['membership', { userId: 'user-owner', organizationId: 'org-a' }])
  assert.deepEqual(calls[2][1], {
    organizationId: 'org-a',
    createdBy: 'user-owner',
    project: {
      name: 'Nakuru Water Reliability',
      slug: 'nakuru-water-reliability',
      purpose: 'Improve the reliability of selected water service points.',
      domain: 'water_climate',
    },
  })
})

test('allows organization admins to create projects', async () => {
  const { resolver } = makeResolver({
    async findOrganizationMembership() {
      return { userId: 'user-owner', organizationId: 'org-a', role: 'admin' }
    },
  })
  assert.equal((await createWorkspaceProject(input, resolver)).ok, true)
})

test('rejects anonymous users without looking up membership or inserting', async () => {
  const { resolver, calls } = makeResolver({
    async getAuthenticatedUserId() { calls.push('auth'); return null },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 401, code: 'unauthenticated',
  })
  assert.deepEqual(calls, ['auth'])
})

test('rejects members and viewers who are not organization admins', async () => {
  for (const role of ['member', 'viewer', 'ownerless', 'unknown']) {
    const { resolver, calls } = makeResolver({
      async findOrganizationMembership() {
        return { userId: 'user-owner', organizationId: 'org-a', role }
      },
    })
    const result = await createWorkspaceProject(input, resolver)
    assert.deepEqual(result, { ok: false, status: 403, code: 'organization_admin_required' })
    assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'insert'), false)
  }
})

test('rejects membership returned for a different user or organization', async () => {
  const { resolver } = makeResolver({
    async findOrganizationMembership() {
      return { userId: 'user-attacker', organizationId: 'org-b', role: 'owner' }
    },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 403, code: 'organization_membership_scope_mismatch',
  })
})

test('fails closed when authentication or membership lookup is unavailable', async () => {
  const authError = makeResolver({ async getAuthenticatedUserId() { throw new Error('auth unavailable') } })
  assert.equal((await createWorkspaceProject(input, authError.resolver)).code, 'authentication_lookup_failed')

  const membershipError = makeResolver({ async findOrganizationMembership() { throw new Error('db unavailable') } })
  assert.equal((await createWorkspaceProject(input, membershipError.resolver)).code, 'membership_lookup_failed')
})

test('rejects invalid input before making authentication or database calls', async () => {
  const { resolver, calls } = makeResolver()
  const result = await createWorkspaceProject({ ...input, body: { ...input.body, created_by: 'attacker' } }, resolver)
  assert.deepEqual(result, { ok: false, status: 422, code: 'invalid_project_input', field: 'created_by' })
  assert.deepEqual(calls, [])
})

test('rejects caller-supplied organization and creator fields', async () => {
  const { resolver, calls } = makeResolver()
  const result = await createWorkspaceProject({
    ...input,
    body: { ...input.body, organizationId: 'org-attacker', createdBy: 'user-attacker' },
  }, resolver)
  assert.equal(result.status, 422)
  assert.equal(calls.length, 0)
})

test('maps duplicate slug errors to conflict', async () => {
  const { resolver } = makeResolver({
    async insertProject() { throw Object.assign(new Error('duplicate'), { code: '23505' }) },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 409, code: 'project_slug_conflict', field: 'slug',
  })
})

test('does not report success unless inserted project belongs to requested organization', async () => {
  const { resolver } = makeResolver({
    async insertProject() { return { id: 'project-other', organizationId: 'org-b' } },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 503, code: 'project_creation_unconfirmed',
  })
})

test('rejects missing organization and incomplete adapters', async () => {
  assert.deepEqual(await createWorkspaceProject({ ...input, organizationId: '' }, {}), {
    ok: false, status: 400, code: 'organization_required',
  })
  assert.deepEqual(await createWorkspaceProject(input, {}), {
    ok: false, status: 503, code: 'project_creation_adapter_unavailable',
  })
})
