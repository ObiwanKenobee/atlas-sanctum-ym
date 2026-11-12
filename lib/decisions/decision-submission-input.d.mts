export type DecisionOptionInput = {
  name: string
  description: string
  expectedBenefit: string
  materialRisks: string
  estimatedCost: string | null
  currencyCode: string | null
  isRecommended: boolean
}

export type DecisionEvidenceLinkInput = {
  evidenceVersionId: string
  relevanceNote: string
}

export type DecisionSubmissionInput = {
  placeId: string | null
  decisionQuestion: string
  recommendation: string
  rationale: string
  uncertainty: string
  consequenceOfNoAction: string
  options: DecisionOptionInput[]
  evidenceLinks: DecisionEvidenceLinkInput[]
}

export type DecisionSubmissionResult =
  | { ok: true; value: DecisionSubmissionInput }
  | { ok: false; field: string; code: string }

export function parseDecisionSubmissionInput(input: unknown): DecisionSubmissionResult
