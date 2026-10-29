import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const ALLOWED_AMOUNTS = new Set([1000, 2500, 5000, 10000, 25000])

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { amountInCents?: unknown } | null
  const amountInCents = typeof body?.amountInCents === 'number' ? body.amountInCents : Number(body?.amountInCents)
  if (!Number.isInteger(amountInCents) || !ALLOWED_AMOUNTS.has(amountInCents)) return NextResponse.json({ error: 'Choose one of the available donation amounts.' }, { status: 422 })

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Atlas Sanctum contribution', description: 'Support open infrastructure for evidence-led public decisions.' }, unit_amount: amountInCents }, quantity: 1 }],
    success_url: `${origin}/?donation=success#donate`,
    cancel_url: `${origin}/?donation=cancelled#donate`,
    submit_type: 'donate',
    billing_address_collection: 'auto',
    integration_identifier: `atlas_donation_${Math.random().toString(36).slice(2, 10)}`,
  })
  return NextResponse.json({ url: session.url })
}
