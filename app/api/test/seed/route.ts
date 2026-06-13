import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

const FAKE_REVIEWS = [
  {
    googleReviewId: 'fake_r1',
    authorName: 'Alice Martin',
    rating: 5,
    text: 'Absolutely amazing experience! The food was incredible and the service was top-notch. Will definitely be coming back.',
    publishedAt: new Date('2024-06-01'),
    responseDraft: 'Thank you so much, Alice! We\'re thrilled you enjoyed your experience and we can\'t wait to welcome you back soon!',
  },
  {
    googleReviewId: 'fake_r2',
    authorName: 'Bob Dupont',
    rating: 1,
    text: 'Terrible service. Waited over an hour for our food and it arrived cold. Very disappointing.',
    publishedAt: new Date('2024-06-03'),
    responseDraft: 'Dear Bob, we sincerely apologise for this unacceptable experience. A one-hour wait and cold food are not the standards we hold ourselves to. Please contact us directly so we can make this right.',
  },
  {
    googleReviewId: 'fake_r3',
    authorName: 'Caroline Petit',
    rating: 4,
    text: 'Great food and atmosphere. Service was a bit slow but overall a lovely evening.',
    publishedAt: new Date('2024-06-05'),
    responseDraft: 'Thank you for the lovely feedback, Caroline! We\'re glad you enjoyed the food and atmosphere. We\'re working on improving our service speed — hope to see you again soon!',
  },
  {
    googleReviewId: 'fake_r4',
    authorName: 'David Chen',
    rating: 2,
    text: 'Food was okay but nothing special. Overpriced for what you get.',
    publishedAt: new Date('2024-06-07'),
    responseDraft: 'Thank you for your honest feedback, David. We\'re sorry the experience didn\'t meet your expectations on value. We\'d love the chance to show you what we\'re truly capable of — please reach out and we\'ll make it worth your while.',
  },
  {
    googleReviewId: 'fake_r5',
    authorName: 'Emma Wilson',
    rating: 5,
    text: 'Best restaurant in town! The pasta was divine and the staff made us feel so welcome.',
    publishedAt: new Date('2024-06-09'),
    responseDraft: null, // no response yet — will show as no badge
  },
  {
    googleReviewId: 'fake_r6',
    authorName: 'François Leblanc',
    rating: 3,
    text: 'Decent place. Nothing exceptional but nothing bad either. Would try again.',
    publishedAt: new Date('2024-06-11'),
    responseDraft: 'Thank you for visiting, François! We appreciate the honest feedback and hope to impress you more on your next visit.',
  },
]

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  // Create or reuse a fake business for this user
  let business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) {
    business = await db.business.create({
      data: {
        userId: user.id,
        name: 'Mario Pizzeria',
        alertEmail: user.email,
      },
    })
  } else {
    await db.business.update({
      where: { id: business.id },
      data: { name: 'Mario Pizzeria' },
    })
  }

  let created = 0

  for (const fake of FAKE_REVIEWS) {
    const exists = await db.review.findUnique({ where: { googleReviewId: fake.googleReviewId } })
    if (exists) continue

    const review = await db.review.create({
      data: {
        businessId: business.id,
        googleReviewId: fake.googleReviewId,
        authorName: fake.authorName,
        rating: fake.rating,
        text: fake.text,
        publishedAt: fake.publishedAt,
      },
    })

    if (fake.responseDraft) {
      await db.response.create({
        data: {
          reviewId: review.id,
          text: fake.responseDraft,
          status: 'draft',
        },
      })
    }

    created++
  }

  return NextResponse.json({ ok: true, created, businessId: business.id })
}

export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) return NextResponse.json({ ok: true, deleted: 0 })

  const googleIds = FAKE_REVIEWS.map(r => r.googleReviewId)
  const reviews = await db.review.findMany({
    where: { businessId: business.id, googleReviewId: { in: googleIds } },
  })

  await db.response.deleteMany({ where: { reviewId: { in: reviews.map(r => r.id) } } })
  await db.review.deleteMany({ where: { id: { in: reviews.map(r => r.id) } } })

  return NextResponse.json({ ok: true, deleted: reviews.length })
}
