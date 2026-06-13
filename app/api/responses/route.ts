import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) return NextResponse.json({ responses: [] })

  const responses = await db.response.findMany({
    where: { review: { businessId: business.id }, status: 'draft' },
    include: { review: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ responses })
}
