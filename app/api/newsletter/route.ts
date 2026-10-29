import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Newsletter service is not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  if (body && typeof body.website === 'string' && body.website.trim()) {
    // Silently accept bot submissions without storing them.
    return NextResponse.json({ ok: true })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const consent = body?.consent === true
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !consent) {
    return NextResponse.json({ error: 'Enter a valid email and confirm consent.' }, { status: 400 })
  }
  if (email.length > 254) return NextResponse.json({ error: 'Email address is too long.' }, { status: 400 })

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await supabase.from('newsletter_subscriptions').upsert(
    { email, consented_at: new Date().toISOString(), status: 'active' },
    { onConflict: 'email' },
  )
  if (error) return NextResponse.json({ error: 'Unable to save your subscription.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
