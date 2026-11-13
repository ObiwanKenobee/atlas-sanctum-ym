
import { NextResponse } from 'next/server'
import { parseProjectPlaceInput } from '@/lib/places/project-place-input.mjs'
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
  const parsed = parseProjectPlaceInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code, field: parsed.field }, { status: 422 })
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id, status')
    .eq('id', projectId)
    .eq('status', 'active')
    .maybeSingle()

  if (projectError) {
    return NextResponse.json({ error: 'project_lookup_failed' }, { status: 503 })
  }
  if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

  const { data: place, error: createError } = await supabase
    .from('project_places')
    .insert({
      organization_id: project.organization_id,
      project_id: project.id,
      name: parsed.value.name,
      slug: parsed.value.slug,
      place_type: parsed.value.placeType,
      administrative_area: parsed.value.administrativeArea,
      latitude: parsed.value.latitude,
      longitude: parsed.value.longitude,
      description: parsed.value.description,
      created_by: user.id,
    })
    .select('id, name, slug, place_type, administrative_area, latitude, longitude, description, created_at')
    .single()

  if (createError) {
    if (createError.code === '23505') {
      return NextResponse.json({ error: 'place_slug_already_exists' }, { status: 409 })
    }
    if (createError.code === '42501') {
      return NextResponse.json({ error: 'place_creation_not_authorized' }, { status: 403 })
    }
    if (createError.code === '23514' || createError.code === '23503') {
      return NextResponse.json({ error: 'place_input_invalid' }, { status: 422 })
    }
    return NextResponse.json({ error: 'place_creation_unavailable' }, { status: 503 })
  }

  return NextResponse.json({ place }, { status: 201 })
}
