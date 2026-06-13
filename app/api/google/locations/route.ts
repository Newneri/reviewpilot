import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPlanLimit } from '@/lib/planLimits'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locations = await db.business.findMany({
    where: { userId: user.id, googleLocationId: { not: null } },
    select: { id: true, name: true, googleLocationId: true, googleAccountId: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ locations })
}

export async function POST(req: NextRequest) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { googleAccountId, googleLocationId, name } = await req.json()
  if (!googleAccountId || !googleLocationId || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const sub = await db.subscription.findUnique({ where: { userId: user.id } })
  const limit = getPlanLimit(sub?.plan)
  const currentCount = await db.business.count({
    where: { userId: user.id, googleLocationId: { not: null } },
  })
  if (currentCount >= limit) {
    return NextResponse.json({ error: 'Plan limit reached' }, { status: 403 })
  }

  const alreadyAdded = await db.business.findFirst({ where: { userId: user.id, googleLocationId } })
  if (alreadyAdded) {
    return NextResponse.json({ error: 'Location already added' }, { status: 409 })
  }

  const tokenSource = await db.business.findFirst({
    where: { userId: user.id, refreshToken: { not: null } },
  })
  if (!tokenSource) return NextResponse.json({ error: 'Google not connected' }, { status: 400 })

  // Reuse master record (no location yet) or create new one
  const master = await db.business.findFirst({
    where: { userId: user.id, googleLocationId: null },
  })

  if (master) {
    await db.business.update({
      where: { id: master.id },
      data: {
        name,
        googleAccountId,
        googleLocationId,
        accessToken: tokenSource.accessToken,
        refreshToken: tokenSource.refreshToken,
        tokenExpiresAt: tokenSource.tokenExpiresAt,
      },
    })
  } else {
    await db.business.create({
      data: {
        userId: user.id,
        name,
        googleAccountId,
        googleLocationId,
        accessToken: tokenSource.accessToken,
        refreshToken: tokenSource.refreshToken,
        tokenExpiresAt: tokenSource.tokenExpiresAt,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
