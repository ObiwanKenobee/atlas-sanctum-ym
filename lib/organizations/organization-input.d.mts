export type OrganizationCreationInput = {
  name: string
  slug: string
}

export type OrganizationInputResult =
  | { ok: true; value: OrganizationCreationInput }
  | { ok: false; field: string; code: string }

export function parseOrganizationCreationInput(input: unknown): OrganizationInputResult
