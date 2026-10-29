import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const categories = new Set(['Water access', 'Food systems', 'Climate resilience', 'Public health', 'Other'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to save a field record.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const region = typeof body?.region === 'string' ? body.region.trim() : ''
  const category = typeof body?.category === 'string' ? body.category.trim() : ''
  const observedOn = typeof body?.observedOn === 'string' ? body.observedOn : ''
  const summary = typeof body?.summary === 'string' ? body.summary.trim() : ''
  const sourceName = typeof body?.sourceName === 'string' ? body.sourceName.trim() : ''

  if (title.length < 2 || title.length > 140 || region.length < 2 || region.length > 120 || !categories.has(category) || !/^\d{4}-\d{2}-\d{2}$/.test(observedOn) || summary.length < 10 || summary.length > 3000 || sourceName.length > 160) {
    return NextResponse.json({ error: 'Complete each field using the indicated format and limits.' }, { status: 422 })
  }

  const { data, error } = await supabase.from('field_records').insert({ user_id: user.id, title, region, category, observed_on: observedOn, summary, source_name: sourceName || null, status: 'submitted' }).select('id').single()
  if (error) return NextResponse.json({ error: 'Unable to save this record right now.' }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
