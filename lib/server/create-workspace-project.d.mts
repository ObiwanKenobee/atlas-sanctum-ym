import type { ProjectDomain } from '../projects/project-input.mjs'

export type OrganizationMembership = {
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member' | 'viewer' | string
}

export type WorkspaceProjectRecord = {
  id: string
  organizationId: string
  name?: string
  slug?: string
  purpose?: string
  domain?: ProjectDomain
}

export type WorkspaceProjectResolver = {
  getAuthenticatedUserId: () => Promise<string | null>
  findOrganizationMembership: (scope: {
    userId: string
    organizationId: string
  }) => Promise<OrganizationMembership | null>
  insertProject: (input: {
    organizationId: string
    createdBy: string
    project: { name: string; slug: string; purpose: string; domain: ProjectDomain }
  }) => Promise<WorkspaceProjectRecord>
}

export type CreateWorkspaceProjectResult =
  | { ok: true; status: 201; project: WorkspaceProjectRecord }
  | { ok: false; status: 400 | 401 | 403 | 409 | 422 | 503; code: string; field?: string }

export declare function createWorkspaceProject(
  input: { organizationId: string; body: unknown },
  resolver: WorkspaceProjectResolver,
): Promise<CreateWorkspaceProjectResult>
