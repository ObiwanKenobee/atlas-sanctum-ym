import type { ProjectDomain } from '../projects/project-input.mjs'
import type { WorkspaceFunctionalRole } from '../workspace-roles.mjs'

export type OrganizationMembership = {
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

export type WorkspaceProjectRecord = {
  id: string
  organizationId: string
  name?: string
  slug?: string
  purpose?: string
  domain?: ProjectDomain
}

export type ProjectMembershipRecord = {
  userId: string
  organizationId: string
  projectId: string
  accessLevel: 'manager' | 'contributor' | 'viewer'
  functionalRole: WorkspaceFunctionalRole
  status: 'active' | 'inactive'
}

export type WorkspaceProjectCreationRecord = {
  project: WorkspaceProjectRecord
  membership: ProjectMembershipRecord
}

export type WorkspaceProjectResolver = {
  getAuthenticatedUserId: () => Promise<string | null>
  findOrganizationMembership: (scope: {
    userId: string
    organizationId: string
  }) => Promise<OrganizationMembership | null>
  findWorkspaceFunctionalRole: (scope: {
    userId: string
  }) => Promise<unknown>
  /**
   * Persist the project and initial manager membership atomically.
   * The adapter must roll back both records if either write fails.
   */
  createProjectWithManagerMembership: (input: {
    organizationId: string
    createdBy: string
    project: { name: string; slug: string; purpose: string; domain: ProjectDomain }
    initialMembership: {
      userId: string
      accessLevel: 'manager'
      functionalRole: WorkspaceFunctionalRole
      status: 'active'
    }
  }) => Promise<WorkspaceProjectCreationRecord>
}

export type CreateWorkspaceProjectResult =
  | {
      ok: true
      status: 201
      project: WorkspaceProjectRecord
      membership: ProjectMembershipRecord
    }
  | { ok: false; status: 400 | 401 | 403 | 409 | 422 | 503; code: string; field?: string }

export declare function createWorkspaceProject(
  input: { organizationId: string; body: unknown },
  resolver: WorkspaceProjectResolver,
): Promise<CreateWorkspaceProjectResult>
