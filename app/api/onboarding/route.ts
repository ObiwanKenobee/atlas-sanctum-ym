import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedRoles = new Set(['Program lead', 'Researcher', 'Funder / investor', 'Implementation partner'])
const allowedGovernance = new Set(['I approve decisions for my team', 'I contribute evidence and recommendations', 'I manage the workspace and permissions'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const input = body as Record<string, unknown>
  const role = typeof input.role === 'string' ? input.role.trim() : ''
  const portfolio = typeof input.portfolio === 'string' ? input.portfolio.trim() : ''
  const governance = typeof input.governance === 'string' ? input.governance.trim() : ''
  if (!allowedRoles.has(role) || !allowedGovernance.has(governance) || portfolio.length < 2 || portfolio.length > 160) return NextResponse.json({ error: 'Invalid onboarding data' }, { status: 422 })

  const { error } = await supabase.from('workspace_profiles').upsert({ user_id: user.id, role, portfolio, governance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: 'Could not save profile' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
