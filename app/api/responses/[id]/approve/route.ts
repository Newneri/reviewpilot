import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { text } = await req.json()

  const response = await db.response.findUnique({
    where: { id },
    include: { review: { include: { business: true } } },
  })

  if (!response || response.review.business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.response.update({
    where: { id },
    data: { status: 'approved', ...(text ? { text } : {}) },
  })

  return NextResponse.json({ response: updated })
}
