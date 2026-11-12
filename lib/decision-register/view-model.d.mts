export type DecisionReviewOutcome = 'approved' | 'rejected' | 'revision_requested'
export type DecisionRegisterStatus = 'unversioned' | 'pending' | DecisionReviewOutcome

export type DecisionIdentity = { id: string }
export type DecisionVersion = {
  id: string
  decision_id: string
  version_number: number
}
export type DecisionApproval = {
  decision_version_id: string
  outcome: DecisionReviewOutcome
}

export type DecisionRegisterRow<
  TDecision extends DecisionIdentity,
  TVersion extends DecisionVersion,
  TApproval extends DecisionApproval,
> = {
  decision: TDecision
  latestVersion: TVersion | null
  approval: TApproval | null
  status: DecisionRegisterStatus
}

export function buildDecisionRegisterRows<
  TDecision extends DecisionIdentity,
  TVersion extends DecisionVersion,
  TApproval extends DecisionApproval,
>(
  decisions: TDecision[],
  versions: TVersion[],
  approvals: TApproval[],
): DecisionRegisterRow<TDecision, TVersion, TApproval>[]
