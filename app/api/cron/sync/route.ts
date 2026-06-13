import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchReviews, refreshAccessToken } from '@/lib/google'
import { generateResponse } from '@/lib/llm'
import { sendLowRatingAlert } from '@/lib/alerts'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await db.business.findMany({
    where: {
      googleLocationId: { not: null },
      googleAccountId: { not: null },
      accessToken: { not: null },
    },
  })

  let synced = 0
  let generated = 0

  for (const business of businesses) {
    try {
      let token = business.accessToken!

      // Refresh token if expiring within 5 minutes
      if (business.tokenExpiresAt && business.tokenExpiresAt < new Date(Date.now() + 300_000)) {
        const refreshed = await refreshAccessToken(business.refreshToken!)
        token = refreshed.accessToken
        await db.business.update({
          where: { id: business.id },
          data: { accessToken: refreshed.accessToken, tokenExpiresAt: refreshed.expiresAt },
        })
      }

      const reviews = await fetchReviews(
        business.googleAccountId!,
        business.googleLocationId!,
        `Bearer ${token}`
      )

      for (const raw of reviews) {
        const exists = await db.review.findUnique({ where: { googleReviewId: raw.googleReviewId } })
        if (exists) continue

        const review = await db.review.create({
          data: {
            businessId: business.id,
            googleReviewId: raw.googleReviewId,
            authorName: raw.authorName,
            rating: raw.rating,
            text: raw.text,
            publishedAt: raw.publishedAt,
          },
        })
        synced++

        // Alert on 1-star reviews
        if (raw.rating === 1 && business.alertEmail) {
          await sendLowRatingAlert({
            toEmail: business.alertEmail,
            businessName: business.name,
            authorName: raw.authorName,
            rating: raw.rating,
            reviewText: raw.text,
            reviewId: review.id,
          })
          await db.review.update({ where: { id: review.id }, data: { alertSent: true } })
        }

        // Generate AI response draft
        const responseText = await generateResponse({
          authorName: raw.authorName,
          rating: raw.rating,
          text: raw.text,
          businessName: business.name,
          toneExamples: business.toneExamples,
        })

        await db.response.create({
          data: {
            reviewId: review.id,
            text: responseText,
            status: business.autoPublish ? 'approved' : 'draft',
          },
        })
        generated++
      }
    } catch (err) {
      console.error(`Sync failed for business ${business.id}:`, err)
    }
  }

  return NextResponse.json({ synced, generated })
}
