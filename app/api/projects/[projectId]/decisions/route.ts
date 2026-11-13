import { NextResponse } from 'next/server'
import { parseDecisionSubmissionInput } from '@/lib/decisions/decision-submission-input.mjs'
import { createClient } from '@/lib/supabase/server'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  if (!uuidPattern.test(projectId)) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = parseDecisionSubmissionInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code, field: parsed.field }, { status: 422 })
  }

  const proposal = parsed.value
  const { data, error } = await supabase.rpc('submit_project_decision_packet', {
    p_project_id: projectId,
    p_place_id: proposal.placeId,
    p_decision_question: proposal.decisionQuestion,
    p_recommendation: proposal.recommendation,
    p_rationale: proposal.rationale,
    p_uncertainty: proposal.uncertainty,
    p_consequence_of_no_action: proposal.consequenceOfNoAction,
    p_options: proposal.options,
    p_evidence_links: proposal.evidenceLinks,
  })

  if (error) {
    if (error.code === '42501') {
      return NextResponse.json({ error: 'decision_authorization_required' }, { status: 403 })
    }
    if (error.code === '23505') {
      return NextResponse.json({ error: 'decision_conflict' }, { status: 409 })
    }
    if (['22023', '23503', '23514', '22P02', '22003'].includes(error.code ?? '')) {
      return NextResponse.json({ error: 'decision_packet_invalid' }, { status: 422 })
    }
    return NextResponse.json({ error: 'decision_submission_unavailable' }, { status: 503 })
  }

  const result = data as {
    decision_id?: unknown
    decision_version_id?: unknown
    version_number?: unknown
  } | null

  if (
    !result ||
    typeof result.decision_id !== 'string' ||
    typeof result.decision_version_id !== 'string' ||
    result.version_number !== 1
  ) {
    return NextResponse.json({ error: 'decision_submission_unconfirmed' }, { status: 503 })
  }

  return NextResponse.json({
    decisionId: result.decision_id,
    decisionVersionId: result.decision_version_id,
    versionNumber: result.version_number,
  }, { status: 201 })
}
