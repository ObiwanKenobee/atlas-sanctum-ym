import { parseProjectCreationInput } from '../projects/project-input.mjs'
import { isWorkspaceFunctionalRole } from '../workspace-roles.mjs'

const failure = (status, code, field) => ({
  ok: false,
  status,
  code,
  ...(field ? { field } : {}),
})

const nonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Create a project and its creator's initial project membership.
 *
 * The resolver is schema-specific and must:
 * - derive identity from trusted server-side authentication;
 * - read the creator's functional role from the persisted workspace profile;
 * - persist the project and manager membership atomically;
 * - use a user-scoped Supabase client and rely on database RLS/constraints.
 *
 * A successful project insert without the creator's active manager membership
 * is not a successful workspace creation. No caller-supplied owner, creator,
 * status, project role, or tenant fields are persisted.
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
      typeof resolver.findWorkspaceFunctionalRole !== 'function' ||
      typeof resolver.createProjectWithManagerMembership !== 'function') {
    return failure(503, 'project_creation_adapter_unavailable')
  }

  let userId
  try {
    userId = await resolver.getAuthenticatedUserId()
  } catch {
    return failure(503, 'authentication_lookup_failed')
  }
  if (!nonEmptyString(userId)) return failure(401, 'unauthenticated')

  let organizationMembership
  try {
    organizationMembership = await resolver.findOrganizationMembership({ userId, organizationId })
  } catch {
    return failure(503, 'membership_lookup_failed')
  }
  if (!organizationMembership) return failure(403, 'organization_membership_required')
  if (organizationMembership.userId !== userId ||
      organizationMembership.organizationId !== organizationId) {
    return failure(403, 'organization_membership_scope_mismatch')
  }
  if (!['owner', 'admin'].includes(organizationMembership.role)) {
    return failure(403, 'organization_admin_required')
  }

  let functionalRole
  try {
    functionalRole = await resolver.findWorkspaceFunctionalRole({ userId })
  } catch {
    return failure(503, 'workspace_profile_lookup_failed')
  }
  if (!isWorkspaceFunctionalRole(functionalRole)) {
    return failure(409, 'workspace_profile_required')
  }

  let creation
  try {
    creation = await resolver.createProjectWithManagerMembership({
      organizationId,
      createdBy: userId,
      project: parsed.value,
      initialMembership: {
        userId,
        accessLevel: 'manager',
        functionalRole,
        status: 'active',
      },
    })
  } catch (error) {
    if (error && error.code === '23505') return failure(409, 'project_slug_conflict', 'slug')
    if (error && error.code === '42501') return failure(403, 'organization_admin_required')
    if (error && error.code === '23514') return failure(409, 'workspace_profile_required')
    return failure(503, 'project_creation_failed')
  }

  const project = creation?.project
  if (!project || !nonEmptyString(project.id) || project.organizationId !== organizationId) {
    return failure(503, 'project_creation_unconfirmed')
  }

  const projectMembership = creation?.membership
  if (
    !projectMembership ||
    projectMembership.userId !== userId ||
    projectMembership.organizationId !== organizationId ||
    projectMembership.projectId !== project.id ||
    projectMembership.accessLevel !== 'manager' ||
    projectMembership.functionalRole !== functionalRole ||
    projectMembership.status !== 'active'
  ) {
    return failure(503, 'project_membership_unconfirmed')
  }

  return {
    ok: true,
    status: 201,
    project,
    membership: projectMembership,
  }
}
