import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await db.subscription.findUnique({ where: { userId: user.id } })
  return NextResponse.json({
    plan: sub?.plan ?? null,
    status: sub?.status ?? null,
  })
}
