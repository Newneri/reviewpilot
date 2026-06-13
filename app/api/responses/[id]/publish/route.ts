import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { publishResponse } from '@/lib/google'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const response = await db.response.findUnique({
    where: { id },
    include: { review: { include: { business: true } } },
  })

  if (!response || response.review.business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { review } = response
  const { business } = review

  await publishResponse(
    business.googleAccountId!,
    business.googleLocationId!,
    review.googleReviewId,
    response.text,
    `Bearer ${business.accessToken}`
  )

  const updated = await db.response.update({
    where: { id },
    data: { status: 'published', publishedAt: new Date() },
  })

  return NextResponse.json({ response: updated })
}
