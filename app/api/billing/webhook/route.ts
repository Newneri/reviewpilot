import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== 'subscription') return NextResponse.json({ ok: true })

    const userId = session.metadata?.userId
    if (!userId || !session.customer || !session.subscription) return NextResponse.json({ ok: true })

    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = sub.items.data[0].price.id

    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripePriceId: priceId,
        stripeSubId: sub.id,
        status: sub.status,
        plan: getPlan(priceId),
      },
      update: {
        stripeCustomerId: session.customer as string,
        stripePriceId: priceId,
        stripeSubId: sub.id,
        status: sub.status,
        plan: getPlan(priceId),
      },
    })
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0].price.id
    await db.subscription.updateMany({
      where: { stripeSubId: sub.id },
      data: { status: sub.status, plan: getPlan(priceId), stripePriceId: priceId },
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await db.subscription.updateMany({
      where: { stripeSubId: sub.id },
      data: { status: 'canceled' },
    })
  }

  return NextResponse.json({ ok: true })
}

function getPlan(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_SOLO) return 'solo'
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business'
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return 'agency'
  return 'unknown'
}
