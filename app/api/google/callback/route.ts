import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_denied`)
  }

  const { userId } = JSON.parse(Buffer.from(state, 'base64').toString())
  const tokens = await exchangeCodeForTokens(code)

  const existing = await db.business.findFirst({ where: { userId } })
  if (existing) {
    await db.business.update({
      where: { id: existing.id },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      },
    })
  } else {
    await db.business.create({
      data: {
        userId,
        name: 'My Business',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      },
    })
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=connected`)
}
