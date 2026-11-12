import type {
  ProjectMembershipStatus,
  ProjectAccessLevel,
  WorkspaceAction,
} from '../workspace-policy.mjs'
import type { WorkspaceFunctionalRole } from '../workspace-roles.mjs'

export type TrustedProjectMembership = {
  userId: string
  organizationId: string
  projectId: string
  status: ProjectMembershipStatus
  accessLevel: ProjectAccessLevel
  functionalRole: WorkspaceFunctionalRole
}

export type TrustedWorkspaceResourceScope = {
  organizationId: string
  projectId: string
  proposedBy?: string
  decisionStatus?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'superseded'
  submittedBy?: string
  verificationStatus?: 'pending' | 'verified' | 'rejected'
}

export type WorkspaceAuthorizationResolver = {
  /** Must derive identity using the server-side Supabase auth.getUser(). */
  getAuthenticatedUserId: () => Promise<string | null>
  /** Must query membership from the database, never from client-supplied role data. */
  findProjectMembership: (scope: {
    userId: string
    organizationId: string
    projectId: string
  }) => Promise<TrustedProjectMembership | null>
  /** Required for evidence.review, decision.approve, action.*, and outcome.* actions. */
  findResourceScope?: (target: {
    userId: string
    organizationId: string
    projectId: string
    action: string
    resourceId: string
  }) => Promise<TrustedWorkspaceResourceScope | null>
}

export type WorkspaceRequestAuthorizationInput = {
  organizationId: string
  projectId: string
  action: WorkspaceAction | string
  resourceId?: string
}

export type WorkspaceRequestAuthorizationResult =
  | {
      ok: true
      userId: string
      membership: TrustedProjectMembership
      resource?: TrustedWorkspaceResourceScope
    }
  | {
      ok: false
      status: 400 | 401 | 403 | 404 | 503
      reason: string
    }

/**
 * Resolve trusted authentication, membership and resource scope before
 * evaluating project permissions. This does not replace Supabase RLS.
 */
export declare function authorizeWorkspaceRequest(
  input: WorkspaceRequestAuthorizationInput,
  resolver: WorkspaceAuthorizationResolver,
): Promise<WorkspaceRequestAuthorizationResult>
