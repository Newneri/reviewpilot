import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { listAccounts, listLocations, refreshAccessToken } from '@/lib/google'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await db.business.findFirst({
    where: { userId: user.id, refreshToken: { not: null } },
  })
  if (!business) return NextResponse.json({ locations: [] })

  let token = business.accessToken!
  if (business.tokenExpiresAt && business.tokenExpiresAt < new Date(Date.now() + 300_000)) {
    const refreshed = await refreshAccessToken(business.refreshToken!)
    token = refreshed.accessToken
    await db.business.update({
      where: { id: business.id },
      data: { accessToken: token, tokenExpiresAt: refreshed.expiresAt },
    })
  }

  try {
    const accounts = await listAccounts(token)
    const all: { id: string; accountId: string; name: string }[] = []
    for (const account of accounts) {
      const locs = await listLocations(account.id, token)
      all.push(...locs)
    }
    return NextResponse.json({ locations: all })
  } catch {
    return NextResponse.json({ locations: [] })
  }
}
