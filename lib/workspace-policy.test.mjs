import assert from 'node:assert/strict'
import test from 'node:test'

import { authorizeWorkspaceAction } from './workspace-policy.mjs'

const baseContext = {
  actor: { userId: 'user-a' },
  scope: { organizationId: 'org-a', projectId: 'project-a' },
  membership: {
    userId: 'user-a',
    organizationId: 'org-a',
    projectId: 'project-a',
    status: 'active',
    accessLevel: 'contributor',
    functionalRole: 'analyst',
  },
}

const evaluate = (context, action) => authorizeWorkspaceAction(context, action)

test('allows an active project member to read the matching project', () => {
  assert.deepEqual(evaluate(baseContext, 'project.read'), {
    allowed: true,
    reason: 'allowed',
  })
})

test('denies membership outside the requested organization or project', () => {
  assert.equal(evaluate({
    ...baseContext,
    membership: { ...baseContext.membership, organizationId: 'org-b' },
  }, 'project.read').reason, 'organization_scope_mismatch')

  assert.equal(evaluate({
    ...baseContext,
    membership: { ...baseContext.membership, projectId: 'project-b' },
  }, 'project.read').reason, 'project_scope_mismatch')
})

test('denies a membership belonging to a different authenticated actor', () => {
  assert.equal(evaluate({
    ...baseContext,
    membership: { ...baseContext.membership, userId: 'user-b' },
  }, 'project.read').reason, 'actor_membership_mismatch')
})

test('denies invited, suspended and revoked memberships', () => {
  for (const status of ['invited', 'suspended', 'revoked']) {
    assert.equal(evaluate({
      ...baseContext,
      membership: { ...baseContext.membership, status },
    }, 'project.read').reason, 'membership_not_active')
  }
})

test('keeps viewers read-only while allowing project reads', () => {
  const viewer = {
    ...baseContext,
    membership: { ...baseContext.membership, accessLevel: 'viewer' },
  }
  assert.equal(evaluate(viewer, 'project.read').allowed, true)
  assert.equal(evaluate(viewer, 'evidence.submit').reason, 'viewer_is_read_only')
  assert.equal(evaluate(viewer, 'decision.draft').reason, 'viewer_is_read_only')
  assert.equal(evaluate(viewer, 'outcome.verify').reason, 'viewer_is_read_only')
})

test('requires manager access for project and membership administration', () => {
  assert.equal(evaluate(baseContext, 'project.manage').reason, 'manager_access_required')
  assert.equal(evaluate(baseContext, 'membership.manage').reason, 'manager_access_required')

  const manager = {
    ...baseContext,
    membership: { ...baseContext.membership, accessLevel: 'manager' },
  }
  assert.equal(evaluate(manager, 'project.manage').allowed, true)
  assert.equal(evaluate(manager, 'membership.manage').allowed, true)
})

test('allows analysts to submit evidence and draft decisions', () => {
  assert.equal(evaluate(baseContext, 'evidence.submit').allowed, true)
  assert.equal(evaluate(baseContext, 'decision.draft').allowed, true)
  assert.equal(evaluate(baseContext, 'decision.approve',).allowed, false)
})

test('allows a different authorizer to approve a decision', () => {
  const authorizer = {
    ...baseContext,
    membership: { ...baseContext.membership, functionalRole: 'authorizer' },
  }
  assert.equal(evaluate({
    ...authorizer,
    resource: { proposedBy: 'user-b' },
  }, 'decision.approve').allowed, true)
})

test('prevents an authorizer from approving their own decision', () => {
  const authorizer = {
    ...baseContext,
    membership: { ...baseContext.membership, functionalRole: 'authorizer' },
    resource: { proposedBy: 'user-a' },
  }
  assert.equal(evaluate(authorizer, 'decision.approve').reason, 'proposer_cannot_approve_own_decision')
})

test('requires a distinct verifier and a pending outcome', () => {
  const verifier = {
    ...baseContext,
    membership: { ...baseContext.membership, functionalRole: 'verifier' },
    resource: { verificationStatus: 'pending', submittedBy: 'user-b' },
  }
  assert.equal(evaluate(verifier, 'outcome.verify').allowed, true)

  assert.equal(evaluate({
    ...verifier,
    resource: { ...verifier.resource, submittedBy: 'user-a' },
  }, 'outcome.verify').reason, 'submitter_cannot_verify_own_outcome')

  assert.equal(evaluate({
    ...verifier,
    resource: { ...verifier.resource, verificationStatus: 'verified' },
  }, 'outcome.verify').reason, 'outcome_not_pending_verification')
})

test('only implementers submit outcomes; verifiers do not self-authorize workflow writes', () => {
  const implementer = {
    ...baseContext,
    membership: { ...baseContext.membership, functionalRole: 'implementer' },
  }
  assert.equal(evaluate(implementer, 'outcome.submit').allowed, true)
  assert.equal(evaluate(baseContext, 'outcome.submit').reason, 'implementer_role_required')
  assert.equal(evaluate(implementer, 'outcome.verify').reason, 'verifier_role_required')
})

test('limits audit access to stewards or project managers', () => {
  assert.equal(evaluate(baseContext, 'audit.read').reason, 'audit_read_not_permitted')

  const steward = {
    ...baseContext,
    membership: { ...baseContext.membership, functionalRole: 'steward' },
  }
  assert.equal(evaluate(steward, 'audit.read').allowed, true)
})

test('denies invalid contexts, role values and unknown actions', () => {
  assert.equal(evaluate(null, 'project.read').reason, 'invalid_context')
  assert.equal(evaluate({ ...baseContext, membership: null }, 'project.read').reason, 'membership_required')
  assert.equal(evaluate({
    ...baseContext,
    membership: { ...baseContext.membership, functionalRole: 'superadmin' },
  }, 'project.read').reason, 'invalid_functional_role')
  assert.equal(evaluate(baseContext, 'unknown.action').reason, 'unknown_action')
})
