import { NextResponse } from 'next/server'
import { createWorkspaceProject } from '@/lib/server/create-workspace-project.mjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const organizationId = typeof input.organizationId === 'string' ? input.organizationId : ''
  const projectInput = {
    name: input.name,
    slug: input.slug,
    purpose: input.purpose,
    domain: input.domain,
    ...(Object.keys(input).filter((key) => !['organizationId', 'name', 'slug', 'purpose', 'domain'].includes(key))
      .reduce<Record<string, unknown>>((extras, key) => {
        extras[key] = input[key]
        return extras
      }, {})),
  }

  const resolver = {
    async getAuthenticatedUserId() {
      return user.id
    },
    async findOrganizationMembership({ userId, organizationId: targetOrganizationId }: {
      userId: string
      organizationId: string
    }) {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select('user_id, organization_id, role')
        .eq('user_id', userId)
        .eq('organization_id', targetOrganizationId)
        .eq('status', 'active')
        .maybeSingle()

      if (error) throw error
      return data ? {
        userId: data.user_id,
        organizationId: data.organization_id,
        role: data.role as 'owner' | 'admin' | 'member' | 'viewer',
      } : null
    },
    async findWorkspaceFunctionalRole({ userId }: { userId: string }) {
      const { data, error } = await supabase
        .from('workspace_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data?.role ?? null
    },
    async createProjectWithManagerMembership({
      organizationId: targetOrganizationId,
      project,
    }: {
      organizationId: string
      createdBy: string
      project: { name: string; slug: string; purpose: string; domain: 'water_climate' | 'agriculture_food' | 'programme_accountability' | 'cross_cutting' }
      initialMembership: { userId: string; accessLevel: 'manager'; functionalRole: 'analyst' | 'authorizer' | 'implementer' | 'verifier' | 'steward'; status: 'active' }
    }) {
      const { data, error } = await supabase.rpc('create_workspace_project', {
        p_organization_id: targetOrganizationId,
        p_name: project.name,
        p_slug: project.slug,
        p_purpose: project.purpose,
        p_domain: project.domain,
      })

      if (error) throw error
      const record = Array.isArray(data) ? data[0] : null
      if (!record) return { project: null, membership: null }

      return {
        project: {
          id: record.project_id,
          organizationId: record.organization_id,
          name: record.project_name,
          slug: record.project_slug,
          purpose: record.project_purpose,
          domain: record.project_domain,
        },
        membership: {
          userId: record.membership_user_id,
          organizationId: record.organization_id,
          projectId: record.membership_project_id,
          accessLevel: record.membership_access_level,
          functionalRole: record.membership_functional_role,
          status: record.membership_status,
        },
      }
    },
  }

  const result = await createWorkspaceProject({
    organizationId,
    body: projectInput,
  }, resolver)

  if (!result.ok) {
    return NextResponse.json({
      error: result.code,
      ...(result.field ? { field: result.field } : {}),
    }, { status: result.status })
  }

  return NextResponse.json({
    project: result.project,
    membership: result.membership,
  }, { status: 201 })
}
