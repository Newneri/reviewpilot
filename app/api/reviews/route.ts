import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = req.nextUrl.searchParams.get('b')
  const business = await db.business.findFirst({
    where: b
      ? { id: b, userId: user.id }
      : { userId: user.id, googleLocationId: { not: null } },
  })
  if (!business) return NextResponse.json({ reviews: [] })

  const reviews = await db.review.findMany({
    where: { businessId: business.id },
    include: { response: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ reviews })
}
