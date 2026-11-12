import { isWorkspaceFunctionalRole } from './workspace-roles.mjs'

const accessLevels = new Set(['manager', 'contributor', 'viewer'])
const resourceScopedActions = new Set([
  'evidence.review',
  'decision.approve',
  'action.assign',
  'action.update',
  'outcome.submit',
  'outcome.verify',
])
const actions = new Set([
  'project.read',
  'project.manage',
  'membership.manage',
  'evidence.submit',
  'evidence.review',
  'decision.draft',
  'decision.approve',
  'action.assign',
  'action.update',
  'outcome.submit',
  'outcome.verify',
  'audit.read',
])

const denied = (reason) => ({ allowed: false, reason })
const allowed = () => ({ allowed: true, reason: 'allowed' })

/**
 * Evaluate a project-scoped workflow permission.
 *
 * The actor and membership must be derived server-side from the authenticated
 * session and trusted database reads. Resource-bound actions also require the
 * target resource's organization/project IDs to be loaded from the database.
 *
 * This helper is not a substitute for Supabase RLS, database constraints,
 * or route-level authentication.
 */
export function authorizeWorkspaceAction(context, action) {
  if (!context || typeof context !== 'object') return denied('invalid_context')

  const { actor, scope, membership } = context
  const resource = context.resource && typeof context.resource === 'object'
    ? context.resource
    : {}

  if (!actor || typeof actor.userId !== 'string' || !actor.userId) {
    return denied('invalid_actor')
  }
  if (
    !scope ||
    typeof scope.organizationId !== 'string' ||
    !scope.organizationId ||
    typeof scope.projectId !== 'string' ||
    !scope.projectId
  ) {
    return denied('invalid_scope')
  }
  if (!membership || typeof membership !== 'object') {
    return denied('membership_required')
  }
  if (membership.userId !== actor.userId) return denied('actor_membership_mismatch')
  if (membership.organizationId !== scope.organizationId) {
    return denied('organization_scope_mismatch')
  }
  if (membership.projectId !== scope.projectId) return denied('project_scope_mismatch')
  if (membership.status !== 'active') return denied('membership_not_active')
  if (!accessLevels.has(membership.accessLevel)) return denied('invalid_access_level')
  if (!isWorkspaceFunctionalRole(membership.functionalRole)) {
    return denied('invalid_functional_role')
  }
  if (!actions.has(action)) return denied('unknown_action')

  if (resourceScopedActions.has(action)) {
    if (resource.organizationId !== scope.organizationId) {
      return denied('resource_organization_scope_mismatch')
    }
    if (resource.projectId !== scope.projectId) {
      return denied('resource_project_scope_mismatch')
    }
  }

  const { accessLevel, functionalRole } = membership
  const isViewer = accessLevel === 'viewer'

  if (action === 'project.read') return allowed()
  if (action === 'audit.read') {
    return functionalRole === 'steward' || accessLevel === 'manager'
      ? allowed()
      : denied('audit_read_not_permitted')
  }

  if (isViewer) return denied('viewer_is_read_only')

  switch (action) {
    case 'project.manage':
    case 'membership.manage':
      return accessLevel === 'manager' ? allowed() : denied('manager_access_required')

    case 'evidence.submit':
      return functionalRole === 'analyst' || functionalRole === 'steward'
        ? allowed()
        : denied('evidence_submit_role_required')

    case 'evidence.review':
      return functionalRole === 'steward' || functionalRole === 'verifier'
        ? allowed()
        : denied('evidence_review_role_required')

    case 'decision.draft':
      return functionalRole === 'analyst' || functionalRole === 'steward'
        ? allowed()
        : denied('decision_draft_role_required')

    case 'decision.approve':
      if (functionalRole !== 'authorizer') return denied('authorizer_role_required')
      if (resource.decisionStatus !== 'submitted') {
        return denied('decision_not_pending_approval')
      }
      if (typeof resource.proposedBy !== 'string' || !resource.proposedBy) {
        return denied('decision_proposer_required')
      }
      return resource.proposedBy !== actor.userId
        ? allowed()
        : denied('proposer_cannot_approve_own_decision')

    case 'action.assign':
      return accessLevel === 'manager' || functionalRole === 'authorizer'
        ? allowed()
        : denied('action_assignment_role_required')

    case 'action.update':
      return functionalRole === 'implementer' || accessLevel === 'manager'
        ? allowed()
        : denied('implementer_role_required')

    case 'outcome.submit':
      return functionalRole === 'implementer'
        ? allowed()
        : denied('implementer_role_required')

    case 'outcome.verify':
      if (functionalRole !== 'verifier') return denied('verifier_role_required')
      if (resource.verificationStatus !== 'pending') {
        return denied('outcome_not_pending_verification')
      }
      if (typeof resource.submittedBy !== 'string' || !resource.submittedBy) {
        return denied('outcome_submitter_required')
      }
      return resource.submittedBy !== actor.userId
        ? allowed()
        : denied('submitter_cannot_verify_own_outcome')

    default:
      return denied('unknown_action')
  }
}
