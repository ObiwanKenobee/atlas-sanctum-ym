const statusValues = new Set(['approved', 'rejected', 'revision_requested'])

/**
 * Join project decisions to their newest immutable proposal version and the
 * review attached to that exact version. A prior version's approval must
 * never be presented as approval of a newer revision.
 */
export function buildDecisionRegisterRows(decisions, versions, approvals) {
  const latestVersionByDecision = new Map()

  for (const version of versions) {
    const current = latestVersionByDecision.get(version.decision_id)
    if (!current || version.version_number > current.version_number) {
      latestVersionByDecision.set(version.decision_id, version)
    }
  }

  const approvalByVersion = new Map(
    approvals
      .filter((approval) => statusValues.has(approval.outcome))
      .map((approval) => [approval.decision_version_id, approval]),
  )

  return decisions.map((decision) => {
    const latestVersion = latestVersionByDecision.get(decision.id) ?? null
    const approval = latestVersion
      ? approvalByVersion.get(latestVersion.id) ?? null
      : null

    return {
      decision,
      latestVersion,
      approval,
      status: !latestVersion ? 'unversioned' : approval?.outcome ?? 'pending',
    }
  })
}
