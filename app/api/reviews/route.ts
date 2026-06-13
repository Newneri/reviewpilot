import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) return NextResponse.json({ reviews: [] })

  const reviews = await db.review.findMany({
    where: { businessId: business.id },
    include: { response: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ reviews })
}
