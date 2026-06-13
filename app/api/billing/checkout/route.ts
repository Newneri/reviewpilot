import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'

const PRICE_IDS: Record<string, string | undefined> = {
  solo: process.env.STRIPE_PRICE_SOLO,
  business: process.env.STRIPE_PRICE_BUSINESS,
  agency: process.env.STRIPE_PRICE_AGENCY,
}

export async function POST(req: NextRequest) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const priceId = PRICE_IDS[plan]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const stripe = getStripe()

  let customerId: string | undefined
  const existing = await db.subscription.findUnique({ where: { userId: user.id } })
  if (existing) {
    customerId = existing.stripeCustomerId
  } else {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=subscribed`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
