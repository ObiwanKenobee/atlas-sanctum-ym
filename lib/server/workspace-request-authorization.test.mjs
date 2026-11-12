import assert from 'node:assert/strict'
import test from 'node:test'

import { authorizeWorkspaceRequest } from './workspace-request-authorization.mjs'

const membership = {
  userId: 'user-a',
  organizationId: 'org-a',
  projectId: 'project-a',
  status: 'active',
  accessLevel: 'contributor',
  functionalRole: 'analyst',
}

const resource = {
  organizationId: 'org-a',
  projectId: 'project-a',
  proposedBy: 'user-b',
  decisionStatus: 'submitted',
  submittedBy: 'user-b',
  verificationStatus: 'pending',
}

function makeResolver(overrides = {}) {
  const calls = []
  const resolver = {
    async getAuthenticatedUserId() {
      calls.push('getAuthenticatedUserId')
      return 'user-a'
    },
    async findProjectMembership(input) {
      calls.push(['findProjectMembership', input])
      return membership
    },
    async findResourceScope(input) {
      calls.push(['findResourceScope', input])
      return resource
    },
    ...overrides,
  }
  return { resolver, calls }
}

const request = {
  organizationId: 'org-a',
  projectId: 'project-a',
  action: 'decision.approve',
  resourceId: 'decision-a',
}

test('derives actor identity before resolving membership and resource scope', async () => {
  const { resolver, calls } = makeResolver({
    async getAuthenticatedUserId() {
      calls.push('getAuthenticatedUserId')
      return 'user-authorizer'
    },
    async findProjectMembership(input) {
      calls.push(['findProjectMembership', input])
      return {
        ...membership,
        userId: 'user-authorizer',
        functionalRole: 'authorizer',
      }
    },
  })

  const result = await authorizeWorkspaceRequest(request, resolver)

  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
  assert.equal(result.reason, 'decision_not_pending_approval')
  assert.equal(calls[0], 'getAuthenticatedUserId')
  assert.deepEqual(calls[1], ['findProjectMembership', {
    userId: 'user-authorizer',
    organizationId: 'org-a',
    projectId: 'project-a',
  }])
})

test('does not accept a caller-supplied actor identity', async () => {
  const { resolver, calls } = makeResolver()
  const result = await authorizeWorkspaceRequest({
    ...request,
    userId: 'user-attacker',
    actor: { userId: 'user-attacker' },
  }, resolver)

  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
  assert.equal(result.reason, 'authorizer_role_required')
  assert.equal(calls[0], 'getAuthenticatedUserId')
})

test('fails closed when authentication lookup fails or no user is signed in', async () => {
  const unavailable = makeResolver({
    async getAuthenticatedUserId() { throw new Error('auth service down') },
  })
  assert.deepEqual(await authorizeWorkspaceRequest(request, unavailable.resolver), {
    ok: false, status: 503, reason: 'authentication_lookup_failed',
  })

  const anonymous = makeResolver({
    async getAuthenticatedUserId() { return null },
  })
  assert.deepEqual(await authorizeWorkspaceRequest(request, anonymous.resolver), {
    ok: false, status: 401, reason: 'unauthenticated',
  })
})

test('fails closed when membership lookup fails or membership is absent', async () => {
  const unavailable = makeResolver({
    async findProjectMembership() { throw new Error('database unavailable') },
  })
  assert.deepEqual(await authorizeWorkspaceRequest(request, unavailable.resolver), {
    ok: false, status: 503, reason: 'membership_lookup_failed',
  })

  const absent = makeResolver({
    async findProjectMembership() { return null },
  })
  assert.deepEqual(await authorizeWorkspaceRequest(request, absent.resolver), {
    ok: false, status: 403, reason: 'membership_required',
  })
})

test('requires a trusted resource lookup for resource-bound actions', async () => {
  const missingId = await authorizeWorkspaceRequest({
    ...request,
    resourceId: '',
  }, makeResolver().resolver)
  assert.deepEqual(missingId, {
    ok: false, status: 400, reason: 'resource_id_required',
  })

  const missingResolver = makeResolver()
  delete missingResolver.resolver.findResourceScope
  assert.deepEqual(await authorizeWorkspaceRequest(request, missingResolver.resolver), {
    ok: false, status: 503, reason: 'resource_scope_resolver_unavailable',
  })
})

test('rejects a resource that belongs to a different organization or project', async () => {
  const crossTenant = makeResolver({
    async getAuthenticatedUserId() { return 'user-verifier' },
    async findProjectMembership() {
      return { ...membership, functionalRole: 'verifier', userId: 'user-verifier' }
    },
    async findResourceScope() {
      return { ...resource, organizationId: 'org-b' }
    },
  })
  assert.deepEqual(await authorizeWorkspaceRequest({
    ...request,
    action: 'outcome.verify',
    resourceId: 'outcome-a',
  }, crossTenant.resolver), {
    ok: false, status: 403, reason: 'resource_organization_scope_mismatch',
  })

  const crossProject = makeResolver({
    async getAuthenticatedUserId() { return 'user-verifier' },
    async findProjectMembership() {
      return { ...membership, functionalRole: 'verifier', userId: 'user-verifier' }
    },
    async findResourceScope() {
      return { ...resource, projectId: 'project-b' }
    },
  })
  assert.deepEqual(await authorizeWorkspaceRequest({
    ...request,
    action: 'outcome.verify',
    resourceId: 'outcome-a',
  }, crossProject.resolver), {
    ok: false, status: 403, reason: 'resource_project_scope_mismatch',
  })
})

test('allows a different authorizer after trusted lookups and matching scope', async () => {
  const { resolver } = makeResolver({
    async getAuthenticatedUserId() { return 'user-authorizer' },
    async findProjectMembership() {
      return {
        ...membership,
        userId: 'user-authorizer',
        functionalRole: 'authorizer',
      }
    },
    async findResourceScope() {
      return { ...resource, proposedBy: 'user-proposer' }
    },
  })
  const result = await authorizeWorkspaceRequest(request, resolver)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.userId, 'user-authorizer')
    assert.equal(result.resource?.organizationId, 'org-a')
  }
})

test('does not load resource data for non-resource project actions', async () => {
  const { resolver, calls } = makeResolver()
  const result = await authorizeWorkspaceRequest({
    organizationId: 'org-a',
    projectId: 'project-a',
    action: 'evidence.submit',
  }, resolver)

  assert.equal(result.ok, true)
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'findResourceScope'), false)
})

test('fails closed when resource lookup throws or returns no record', async () => {
  const unavailable = makeResolver({
    async findResourceScope() { throw new Error('query failed') },
  })
  assert.deepEqual(await authorizeWorkspaceRequest(request, unavailable.resolver), {
    ok: false, status: 503, reason: 'resource_lookup_failed',
  })

  const absent = makeResolver({
    async findResourceScope() { return null },
  })
  assert.deepEqual(await authorizeWorkspaceRequest(request, absent.resolver), {
    ok: false, status: 404, reason: 'resource_not_found',
  })
})

test('rejects malformed requests and incomplete resolver configuration', async () => {
  assert.deepEqual(await authorizeWorkspaceRequest(null, {}), {
    ok: false, status: 400, reason: 'invalid_request',
  })
  assert.deepEqual(await authorizeWorkspaceRequest({
    organizationId: '',
    projectId: 'project-a',
    action: 'project.read',
  }, {}), {
    ok: false, status: 400, reason: 'organization_and_project_required',
  })
  assert.deepEqual(await authorizeWorkspaceRequest({
    organizationId: 'org-a',
    projectId: 'project-a',
    action: 'project.read',
  }, {}), {
    ok: false, status: 503, reason: 'authorization_resolver_incomplete',
  })
})
