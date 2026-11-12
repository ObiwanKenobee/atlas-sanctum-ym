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
      calls.push(['organization-membership', scope])
      return { userId: 'user-owner', organizationId: 'org-a', role: 'owner' }
    },
    async findWorkspaceFunctionalRole(scope) {
      calls.push(['functional-role', scope])
      return 'analyst'
    },
    async createProjectWithManagerMembership(args) {
      calls.push(['create-project-with-membership', args])
      return {
        project: { id: 'project-1', organizationId: 'org-a', ...args.project },
        membership: {
          userId: args.initialMembership.userId,
          organizationId: args.organizationId,
          projectId: 'project-1',
          accessLevel: args.initialMembership.accessLevel,
          functionalRole: args.initialMembership.functionalRole,
          status: args.initialMembership.status,
        },
      }
    },
    ...overrides,
  }
  return { resolver, calls }
}

test('creates a project and active manager membership for its creator atomically', async () => {
  const { resolver, calls } = makeResolver()
  const result = await createWorkspaceProject(input, resolver)

  assert.equal(result.ok, true)
  assert.equal(result.status, 201)
  assert.equal(result.project.id, 'project-1')
  assert.deepEqual(result.membership, {
    userId: 'user-owner',
    organizationId: 'org-a',
    projectId: 'project-1',
    accessLevel: 'manager',
    functionalRole: 'analyst',
    status: 'active',
  })
  assert.equal(calls[0], 'auth')
  assert.deepEqual(calls[1], [
    'organization-membership',
    { userId: 'user-owner', organizationId: 'org-a' },
  ])
  assert.deepEqual(calls[2], ['functional-role', { userId: 'user-owner' }])
  assert.deepEqual(calls[3][1], {
    organizationId: 'org-a',
    createdBy: 'user-owner',
    project: {
      name: 'Nakuru Water Reliability',
      slug: 'nakuru-water-reliability',
      purpose: 'Improve the reliability of selected water service points.',
      domain: 'water_climate',
    },
    initialMembership: {
      userId: 'user-owner',
      accessLevel: 'manager',
      functionalRole: 'analyst',
      status: 'active',
    },
  })
})

test('allows organization admins to create projects and become project managers', async () => {
  const { resolver } = makeResolver({
    async findOrganizationMembership() {
      return { userId: 'user-owner', organizationId: 'org-a', role: 'admin' }
    },
  })
  const result = await createWorkspaceProject(input, resolver)
  assert.equal(result.ok, true)
  assert.equal(result.membership.accessLevel, 'manager')
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

test('rejects organization members and viewers who are not organization admins', async () => {
  for (const role of ['member', 'viewer']) {
    const { resolver, calls } = makeResolver({
      async findOrganizationMembership() {
        return { userId: 'user-owner', organizationId: 'org-a', role }
      },
    })
    const result = await createWorkspaceProject(input, resolver)
    assert.deepEqual(result, {
      ok: false, status: 403, code: 'organization_admin_required',
    })
    assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'functional-role'), false)
    assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'create-project-with-membership'), false)
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

test('fails closed when authentication or organization membership lookup is unavailable', async () => {
  const authError = makeResolver({ async getAuthenticatedUserId() { throw new Error('auth unavailable') } })
  assert.equal((await createWorkspaceProject(input, authError.resolver)).code, 'authentication_lookup_failed')

  const membershipError = makeResolver({ async findOrganizationMembership() { throw new Error('db unavailable') } })
  assert.equal((await createWorkspaceProject(input, membershipError.resolver)).code, 'membership_lookup_failed')
})

test('fails closed when the creator functional-role lookup is unavailable', async () => {
  const { resolver } = makeResolver({
    async findWorkspaceFunctionalRole() { throw new Error('profile unavailable') },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 503, code: 'workspace_profile_lookup_failed',
  })
})

test('requires a persisted canonical functional role before project creation', async () => {
  for (const role of [null, undefined, 'Researcher', 'manager', 42]) {
    const { resolver, calls } = makeResolver({
      async findWorkspaceFunctionalRole() { return role },
    })
    assert.deepEqual(await createWorkspaceProject(input, resolver), {
      ok: false, status: 409, code: 'workspace_profile_required',
    })
    assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'create-project-with-membership'), false)
  }
})

test('rejects invalid project payloads before authentication or database calls', async () => {
  const { resolver, calls } = makeResolver()
  const result = await createWorkspaceProject({
    ...input,
    body: { ...input.body, created_by: 'attacker' },
  }, resolver)
  assert.deepEqual(result, {
    ok: false, status: 422, code: 'invalid_project_input', field: 'created_by',
  })
  assert.deepEqual(calls, [])
})

test('rejects caller-supplied organization and creator fields in the project body', async () => {
  const { resolver, calls } = makeResolver()
  const result = await createWorkspaceProject({
    ...input,
    body: { ...input.body, organizationId: 'org-attacker', createdBy: 'user-attacker' },
  }, resolver)
  assert.equal(result.status, 422)
  assert.equal(calls.length, 0)
})

test('maps unique-constraint errors to a conflict', async () => {
  const { resolver } = makeResolver({
    async createProjectWithManagerMembership() {
      throw Object.assign(new Error('duplicate'), { code: '23505' })
    },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 409, code: 'project_slug_conflict', field: 'slug',
  })
})

test('does not report success when the inserted project has the wrong organization', async () => {
  const { resolver } = makeResolver({
    async createProjectWithManagerMembership(args) {
      return {
        project: { id: 'project-other', organizationId: 'org-b', ...args.project },
        membership: {
          userId: 'user-owner',
          organizationId: 'org-b',
          projectId: 'project-other',
          accessLevel: 'manager',
          functionalRole: 'analyst',
          status: 'active',
        },
      }
    },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 503, code: 'project_creation_unconfirmed',
  })
})

test('does not report success unless the creator has the correct active project manager membership', async () => {
  const { resolver } = makeResolver({
    async createProjectWithManagerMembership(args) {
      return {
        project: { id: 'project-1', organizationId: 'org-a', ...args.project },
        membership: {
          userId: 'user-attacker',
          organizationId: 'org-a',
          projectId: 'project-1',
          accessLevel: 'manager',
          functionalRole: 'analyst',
          status: 'active',
        },
      }
    },
  })
  assert.deepEqual(await createWorkspaceProject(input, resolver), {
    ok: false, status: 503, code: 'project_membership_unconfirmed',
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
