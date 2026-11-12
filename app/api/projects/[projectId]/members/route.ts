import { NextResponse } from 'next/server'
import { isWorkspaceFunctionalRole } from '@/lib/workspace-roles.mjs'
import { parseProjectMemberInput } from '@/lib/projects/project-member-input.mjs'
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
  const parsed = parseProjectMemberInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.code, field: parsed.field }, { status: 422 })
  }

  // Read a real project-membership row under RLS to resolve the tenant scope.
  // Project members and organization admins can read this row; arbitrary IDs cannot.
  const { data: projectMembership, error: projectMembershipError } = await supabase
    .from('project_memberships')
    .select('organization_id')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (projectMembershipError) {
    return NextResponse.json({ error: 'project_membership_lookup_failed' }, { status: 503 })
  }
  if (!projectMembership) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

  const organizationId = projectMembership.organization_id
  const { data: actorMembership, error: actorMembershipError } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (actorMembershipError) {
    return NextResponse.json({ error: 'organization_membership_lookup_failed' }, { status: 503 })
  }
  if (!actorMembership || !['owner', 'admin'].includes(actorMembership.role)) {
    return NextResponse.json({ error: 'organization_admin_required' }, { status: 403 })
  }

  // This existing directory RPC independently checks that the caller is an
  // active organization owner/admin. Its role value comes from the persisted profile.
  const { data: directory, error: directoryError } = await supabase.rpc(
    'list_organization_user_directory',
    { target_organization_id: organizationId },
  )

  if (directoryError) {
    return NextResponse.json({ error: 'organization_directory_unavailable' }, { status: 503 })
  }

  const candidate = Array.isArray(directory)
    ? directory.find((entry) => entry.user_id === parsed.value.userId)
    : null
  if (!candidate || !isWorkspaceFunctionalRole(candidate.role)) {
    return NextResponse.json({ error: 'active_organization_member_with_profile_required' }, { status: 422 })
  }

  const { data: existing, error: existingError } = await supabase
    .from('project_memberships')
    .select('user_id, status')
    .eq('project_id', projectId)
    .eq('user_id', parsed.value.userId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: 'project_membership_lookup_failed' }, { status: 503 })
  }
  if (existing) {
    return NextResponse.json({ error: 'project_membership_already_exists' }, { status: 409 })
  }

  const { data: created, error: createError } = await supabase
    .from('project_memberships')
    .insert({
      organization_id: organizationId,
      project_id: projectId,
      user_id: parsed.value.userId,
      access_level: parsed.value.accessLevel,
      functional_role: candidate.role,
      status: 'active',
    })
    .select('project_id, organization_id, user_id, access_level, functional_role, status')
    .single()

  if (createError) {
    if (createError.code === '23505') {
      return NextResponse.json({ error: 'project_membership_already_exists' }, { status: 409 })
    }
    if (createError.code === '42501') {
      return NextResponse.json({ error: 'project_membership_not_authorized' }, { status: 403 })
    }
    if (createError.code === '23514') {
      return NextResponse.json({ error: 'member_profile_or_scope_invalid' }, { status: 422 })
    }
    return NextResponse.json({ error: 'project_member_add_failed' }, { status: 503 })
  }

  return NextResponse.json({ membership: created }, { status: 201 })
}
