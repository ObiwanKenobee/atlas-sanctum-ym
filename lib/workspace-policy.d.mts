import type { WorkspaceFunctionalRole } from './workspace-roles.mjs'

export type ProjectAccessLevel = 'manager' | 'contributor' | 'viewer'
export type ProjectMembershipStatus = 'invited' | 'active' | 'suspended' | 'revoked'

export type WorkspaceAction =
  | 'project.read'
  | 'project.manage'
  | 'membership.manage'
  | 'evidence.submit'
  | 'evidence.review'
  | 'decision.draft'
  | 'decision.approve'
  | 'action.assign'
  | 'action.update'
  | 'outcome.submit'
  | 'outcome.verify'
  | 'audit.read'

export type WorkspaceAuthorizationContext = {
  actor: { userId: string }
  scope: { organizationId: string; projectId: string }
  membership: {
    userId: string
    organizationId: string
    projectId: string
    status: ProjectMembershipStatus
    accessLevel: ProjectAccessLevel
    functionalRole: WorkspaceFunctionalRole
  }
  resource?: {
    proposedBy?: string
    submittedBy?: string
    verificationStatus?: 'pending' | 'verified' | 'rejected'
  }
}

export type WorkspaceAuthorizationResult =
  | { allowed: true; reason: 'allowed' }
  | { allowed: false; reason: string }

/**
 * Evaluates application-level policy only. Call after deriving actor and
 * membership from trusted server-side sources; database RLS remains required.
 */
export declare function authorizeWorkspaceAction(
  context: WorkspaceAuthorizationContext,
  action: WorkspaceAction | string,
): WorkspaceAuthorizationResult
