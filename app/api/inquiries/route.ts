import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Inquiry service is not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const organization = typeof body?.organization === 'string' ? body.organization.trim() : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : ''
  const scope = typeof body?.scope === 'string' ? body.scope.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (!name || !email || !organization || !scope || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid name, work email, organization, and pilot scope.' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await supabase.from('pilot_inquiries').insert({ name, email, organization, role: role || null, scope, message: message || null })

  if (error) {
    return NextResponse.json({ error: 'Unable to save the inquiry right now.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
