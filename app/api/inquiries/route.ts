import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Inquiry service is not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true })
  }

  const textField = (value: unknown, max: number) =>
    typeof value === 'string' ? value.trim().slice(0, max) : ''
  const name = textField(body.name, 120)
  const email = textField(body.email, 254).toLowerCase()
  const organization = textField(body.organization, 180)
  const role = textField(body.role, 120)
  const sector = textField(body.sector, 120) || textField(body.scope, 120)
  const location = textField(body.location, 180)
  const problem = textField(body.problem, 4000) || textField(body.message, 4000)
  const consent = body.consent === true || body.consent === 'true'

  if (!name || !email || !organization || !sector || !location || problem.length < 20 ||
      !/^\S+@\S+\.\S+$/.test(email) || !consent) {
    return NextResponse.json({
      error: 'Please provide your name, valid email, organization, sector, location, a problem of at least 20 characters, and consent.',
    }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await supabase.from('pilot_inquiries').insert({
    name,
    email,
    organization,
    role: role || null,
    scope: sector,
    sector,
    location,
    message: problem,
    consented_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: 'Unable to save the inquiry right now.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
