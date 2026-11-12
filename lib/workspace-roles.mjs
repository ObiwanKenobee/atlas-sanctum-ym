export const WORKSPACE_FUNCTIONAL_ROLES = Object.freeze([
  'analyst',
  'authorizer',
  'implementer',
  'verifier',
  'steward',
])

const workspaceFunctionalRoleSet = new Set(WORKSPACE_FUNCTIONAL_ROLES)

export function isWorkspaceFunctionalRole(value) {
  return typeof value === 'string' && workspaceFunctionalRoleSet.has(value)
}
