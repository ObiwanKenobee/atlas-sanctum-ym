export type ProjectDomain =
  | 'water_climate'
  | 'agriculture_food'
  | 'programme_accountability'
  | 'cross_cutting'

export type ProjectCreationInput = {
  name: string
  slug?: string
  purpose: string
  domain: ProjectDomain
}

export type ProjectInputValidation =
  | { ok: true; value: { name: string; slug: string; purpose: string; domain: ProjectDomain } }
  | { ok: false; field: string; code: string }

export declare const PROJECT_DOMAINS: readonly ProjectDomain[]
export declare function parseProjectCreationInput(input: unknown): ProjectInputValidation
