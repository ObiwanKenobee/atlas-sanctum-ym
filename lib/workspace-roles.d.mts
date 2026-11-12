export declare const WORKSPACE_FUNCTIONAL_ROLES: readonly [
  'analyst',
  'authorizer',
  'implementer',
  'verifier',
  'steward',
]

export type WorkspaceFunctionalRole = (typeof WORKSPACE_FUNCTIONAL_ROLES)[number]

export declare function isWorkspaceFunctionalRole(
  value: unknown,
): value is WorkspaceFunctionalRole
