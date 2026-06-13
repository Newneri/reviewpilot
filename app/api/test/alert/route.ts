import { NextRequest, NextResponse } from 'next/server'
import { sendLowRatingAlert } from '@/lib/alerts'

// Temporary test endpoint — remove before production
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const email = new URL(req.url).searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Pass ?email=your@email.com' }, { status: 400 })
  }

  await sendLowRatingAlert({
    toEmail: email,
    businessName: 'Mario Pizzeria',
    authorName: 'John Smith',
    rating: 1,
    reviewText: 'Terrible service, waited 45 minutes and the food was cold.',
    reviewId: 'test-review-id',
  })

  return NextResponse.json({ ok: true, sentTo: email })
}
