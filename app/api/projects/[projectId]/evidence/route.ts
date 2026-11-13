
import { NextResponse } from 'next/server'
import { parseProjectEvidenceInput } from '@/lib/evidence/project-evidence-input.mjs'
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
  const parsed = parseProjectEvidenceInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code, field: parsed.field }, { status: 422 })
  }

  const evidence = parsed.value
  const { data, error } = await supabase.rpc('submit_project_evidence', {
    p_project_id: projectId,
    p_place_id: evidence.placeId,
    p_evidence_type: evidence.evidenceType,
    p_title: evidence.title,
    p_description: evidence.description,
    p_source_type: evidence.sourceType,
    p_source_name: evidence.sourceName,
    p_source_reference: evidence.sourceReference,
    p_source_url: evidence.sourceUrl,
    p_collected_at: evidence.collectedAt,
    p_collection_method: evidence.collectionMethod,
    p_limitations: evidence.limitations,
  })

  if (error) {
    if (error.code === '42501') {
      return NextResponse.json({ error: 'evidence_authorization_required' }, { status: 403 })
    }
    if (error.code === '23503') {
      return NextResponse.json({ error: 'evidence_place_not_in_project' }, { status: 422 })
    }
    if (['22007', '22023', '22P02', '23514'].includes(error.code ?? '')) {
      return NextResponse.json({ error: 'evidence_input_invalid' }, { status: 422 })
    }
    return NextResponse.json({ error: 'evidence_submission_unavailable' }, { status: 503 })
  }

  const result = data as {
    evidence_item_id?: unknown
    evidence_version_id?: unknown
    version_number?: unknown
  } | null

  if (
    !result ||
    typeof result.evidence_item_id !== 'string' ||
    typeof result.evidence_version_id !== 'string' ||
    result.version_number !== 1
  ) {
    return NextResponse.json({ error: 'evidence_submission_unconfirmed' }, { status: 503 })
  }

  return NextResponse.json({
    evidenceItemId: result.evidence_item_id,
    evidenceVersionId: result.evidence_version_id,
    versionNumber: result.version_number,
  }, { status: 201 })
}
