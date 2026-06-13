import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { buildAuthUrl } from '@/lib/google'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')
  return NextResponse.redirect(buildAuthUrl(state))
}
