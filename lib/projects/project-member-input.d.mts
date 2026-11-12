export type ProjectAccessLevel = 'manager' | 'contributor' | 'viewer'

export type ProjectMemberInput = {
  userId: string
  accessLevel: ProjectAccessLevel
}

export type ProjectMemberInputResult =
  | { ok: true; value: ProjectMemberInput }
  | { ok: false; field: string; code: string }

export function parseProjectMemberInput(input: unknown): ProjectMemberInputResult
