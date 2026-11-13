import { NextResponse } from 'next/server'
import { parseEvidenceReviewInput } from '@/lib/evidence/evidence-review-input.mjs'
import { createClient } from '@/lib/supabase/server'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; evidenceVersionId: string }> },
) {
  const { projectId, evidenceVersionId } = await params
  if (!uuidPattern.test(projectId) || !uuidPattern.test(evidenceVersionId)) {
    return NextResponse.json({ error: 'evidence_version_not_found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = parseEvidenceReviewInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code, field: parsed.field }, { status: 422 })
  }

  const { data: evidenceVersion, error: evidenceError } = await supabase
    .from('evidence_versions')
    .select('id, evidence_item_id, organization_id, project_id, submitted_by')
    .eq('id', evidenceVersionId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (evidenceError) {
    return NextResponse.json({ error: 'evidence_review_unavailable' }, { status: 503 })
  }
  if (!evidenceVersion) {
    return NextResponse.json({ error: 'evidence_version_not_found' }, { status: 404 })
  }
  if (evidenceVersion.submitted_by === user.id) {
    return NextResponse.json({ error: 'evidence_self_review_forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('evidence_reviews')
    .insert({
      evidence_version_id: evidenceVersion.id,
      evidence_item_id: evidenceVersion.evidence_item_id,
      organization_id: evidenceVersion.organization_id,
      project_id: evidenceVersion.project_id,
      outcome: parsed.value.outcome,
      reviewer_note: parsed.value.reviewerNote,
      reviewer_id: user.id,
    })
    .select('id, evidence_version_id, outcome, reviewed_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'evidence_version_already_reviewed' }, { status: 409 })
    }
    if (error.code === '42501') {
      return NextResponse.json({ error: 'evidence_review_authorization_required' }, { status: 403 })
    }
    if (['23514', '23503', '22P02'].includes(error.code ?? '')) {
      return NextResponse.json({ error: 'evidence_review_input_invalid' }, { status: 422 })
    }
    return NextResponse.json({ error: 'evidence_review_unavailable' }, { status: 503 })
  }

  if (!data) {
    return NextResponse.json({ error: 'evidence_review_unconfirmed' }, { status: 503 })
  }

  return NextResponse.json({
    reviewId: data.id,
    evidenceVersionId: data.evidence_version_id,
    outcome: data.outcome,
    reviewedAt: data.reviewed_at,
  }, { status: 201 })
}
