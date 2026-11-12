import { authorizeWorkspaceAction } from '../workspace-policy.mjs'

const RESOURCE_SCOPED_ACTIONS = new Set([
  'evidence.review',
  'decision.approve',
  'action.assign',
  'action.update',
  'outcome.submit',
  'outcome.verify',
])

const failure = (status, reason) => ({ ok: false, status, reason })

const nonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Server-side orchestration around the pure workspace authorization policy.
 *
 * The resolver must use the authenticated Supabase server client:
 * - getAuthenticatedUserId must call auth.getUser(), not trust a request body.
 * - findProjectMembership must query a real active membership for the supplied
 *   user, organization and project.
 * - findResourceScope must load the target record from the database and return
 *   its persisted organization/project IDs and relevant workflow attributes.
 *
 * This module deliberately does not issue SQL or assume a live schema. The
 * resolver is the only schema-specific adapter and must be implemented after
 * Supabase reconnaissance. Database RLS and constraints remain mandatory.
 */
export async function authorizeWorkspaceRequest(input, resolver) {
  if (!input || typeof input !== 'object') {
    return failure(400, 'invalid_request')
  }

  const { organizationId, projectId, action, resourceId } = input

  if (!nonEmptyString(organizationId) || !nonEmptyString(projectId)) {
    return failure(400, 'organization_and_project_required')
  }
  if (!nonEmptyString(action)) {
    return failure(400, 'action_required')
  }
  if (!resolver || typeof resolver !== 'object') {
    return failure(503, 'authorization_resolver_unavailable')
  }
  if (typeof resolver.getAuthenticatedUserId !== 'function' ||
      typeof resolver.findProjectMembership !== 'function') {
    return failure(503, 'authorization_resolver_incomplete')
  }

  let userId
  try {
    userId = await resolver.getAuthenticatedUserId()
  } catch {
    return failure(503, 'authentication_lookup_failed')
  }
  if (!nonEmptyString(userId)) {
    return failure(401, 'unauthenticated')
  }

  let membership
  try {
    membership = await resolver.findProjectMembership({
      userId,
      organizationId,
      projectId,
    })
  } catch {
    return failure(503, 'membership_lookup_failed')
  }
  if (!membership) {
    return failure(403, 'membership_required')
  }

  let resource
  if (RESOURCE_SCOPED_ACTIONS.has(action)) {
    if (!nonEmptyString(resourceId)) {
      return failure(400, 'resource_id_required')
    }
    if (typeof resolver.findResourceScope !== 'function') {
      return failure(503, 'resource_scope_resolver_unavailable')
    }
    try {
      resource = await resolver.findResourceScope({
        userId,
        action,
        resourceId,
      })
    } catch {
      return failure(503, 'resource_lookup_failed')
    }
    if (!resource) {
      return failure(404, 'resource_not_found')
    }
  }

  const decision = authorizeWorkspaceAction({
    actor: { userId },
    scope: { organizationId, projectId },
    membership,
    ...(resource ? { resource } : {}),
  }, action)

  if (!decision.allowed) {
    return failure(403, decision.reason)
  }

  return {
    ok: true,
    userId,
    membership,
    ...(resource ? { resource } : {}),
  }
}
