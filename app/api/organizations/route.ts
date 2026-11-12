import { NextResponse } from 'next/server'
import { parseOrganizationCreationInput } from '@/lib/organizations/organization-input.mjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = parseOrganizationCreationInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code, field: parsed.field }, { status: 422 })
  }

  const { data, error } = await supabase.rpc('create_workspace_organization', {
    p_name: parsed.value.name,
    p_slug: parsed.value.slug,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'organization_slug_conflict', field: 'slug' }, { status: 409 })
    }
    if (error.code === '42501') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error.code === '22023') {
      return NextResponse.json({ error: 'invalid_organization_input' }, { status: 422 })
    }
    return NextResponse.json({ error: 'organization_creation_failed' }, { status: 503 })
  }

  const record = Array.isArray(data) ? data[0] : null
  if (
    !record?.organization_id ||
    record.membership_user_id !== user.id ||
    record.membership_role !== 'owner' ||
    record.membership_status !== 'active'
  ) {
    return NextResponse.json({ error: 'organization_creation_unconfirmed' }, { status: 503 })
  }

  return NextResponse.json({
    organization: {
      id: record.organization_id,
      name: record.organization_name,
      slug: record.organization_slug,
      role: record.membership_role,
    },
  }, { status: 201 })
}
