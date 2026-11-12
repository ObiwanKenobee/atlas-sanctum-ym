import { parseProjectCreationInput } from '../projects/project-input.mjs'

const failure = (status, code, field) => ({
  ok: false,
  status,
  code,
  ...(field ? { field } : {}),
})

const nonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Create a project through an injected, schema-specific repository adapter.
 * The actor comes from trusted server-side authentication. Membership is
 * resolved from the database. The repository must use a user-scoped Supabase
 * client and database RLS. No caller-supplied owner, creator, status, or tenant
 * fields are persisted.
 */
export async function createWorkspaceProject(input, resolver) {
  if (!input || typeof input !== 'object') return failure(400, 'invalid_request')

  const { body } = input
  const organizationId = typeof input.organizationId === 'string'
    ? input.organizationId.trim()
    : ''
  if (!nonEmptyString(organizationId)) return failure(400, 'organization_required')

  const parsed = parseProjectCreationInput(body)
  if (!parsed.ok) return failure(422, 'invalid_project_input', parsed.field)

  if (!resolver || typeof resolver !== 'object' ||
      typeof resolver.getAuthenticatedUserId !== 'function' ||
      typeof resolver.findOrganizationMembership !== 'function' ||
      typeof resolver.insertProject !== 'function') {
    return failure(503, 'project_creation_adapter_unavailable')
  }

  let userId
  try {
    userId = await resolver.getAuthenticatedUserId()
  } catch {
    return failure(503, 'authentication_lookup_failed')
  }
  if (!nonEmptyString(userId)) return failure(401, 'unauthenticated')

  let membership
  try {
    membership = await resolver.findOrganizationMembership({ userId, organizationId })
  } catch {
    return failure(503, 'membership_lookup_failed')
  }
  if (!membership) return failure(403, 'organization_membership_required')
  if (membership.userId !== userId || membership.organizationId !== organizationId) {
    return failure(403, 'organization_membership_scope_mismatch')
  }
  if (!['owner', 'admin'].includes(membership.role)) {
    return failure(403, 'organization_admin_required')
  }

  let project
  try {
    project = await resolver.insertProject({
      organizationId,
      createdBy: userId,
      project: parsed.value,
    })
  } catch (error) {
    if (error && error.code === '23505') return failure(409, 'project_slug_conflict', 'slug')
    return failure(503, 'project_creation_failed')
  }

  if (!project || !nonEmptyString(project.id) || project.organizationId !== organizationId) {
    return failure(503, 'project_creation_unconfirmed')
  }

  return { ok: true, status: 201, project }
}
