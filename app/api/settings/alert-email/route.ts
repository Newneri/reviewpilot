import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await db.business.findFirst({ where: { userId: user.id } })
  return NextResponse.json({ alertEmail: business?.alertEmail ?? '' })
}

export async function POST(req: NextRequest) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { alertEmail } = await req.json()
  if (!alertEmail || typeof alertEmail !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) return NextResponse.json({ error: 'No business found' }, { status: 404 })

  await db.business.update({
    where: { id: business.id },
    data: { alertEmail },
  })

  return NextResponse.json({ ok: true })
}
