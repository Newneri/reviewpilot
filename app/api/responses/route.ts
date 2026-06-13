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
  if (!business) return NextResponse.json({ responses: [] })

  const responses = await db.response.findMany({
    where: { review: { businessId: business.id }, status: 'draft' },
    include: { review: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ responses })
}
