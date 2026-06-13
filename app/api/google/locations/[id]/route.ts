import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const business = await db.business.findFirst({ where: { id, userId: user.id } })
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.business.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
