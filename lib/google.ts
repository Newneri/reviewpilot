const STAR_TO_INT: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  return {
    accessToken: data.access_token as string,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

export async function listAccounts(accessToken: string) {
  const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to list accounts')
  const data = await res.json()
  return (data.accounts ?? []).map((a: { name: string; accountName: string }) => ({
    id: a.name.split('/')[1],
    name: a.accountName,
  }))
}

export async function listLocations(accountId: string, accessToken: string) {
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.locations ?? []).map((l: { name: string; title: string }) => ({
    id: l.name.split('/').pop() as string,
    accountId,
    name: l.title ?? 'Établissement sans nom',
  }))
}

export type RawReview = {
  googleReviewId: string
  authorName: string
  rating: number
  text: string | null
  publishedAt: Date
}

export async function fetchReviews(
  accountId: string,
  locationId: string,
  bearerToken: string
): Promise<RawReview[]> {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
    { headers: { Authorization: bearerToken } }
  )
  if (!res.ok) throw new Error('Failed to fetch reviews')
  const data = await res.json()
  return (data.reviews ?? []).map((r: any) => ({
    googleReviewId: r.reviewId,
    authorName: r.reviewer?.displayName ?? 'Anonymous',
    rating: STAR_TO_INT[r.starRating] ?? 0,
    text: r.comment ?? null,
    publishedAt: new Date(r.createTime),
  }))
}

export async function publishResponse(
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string,
  bearerToken: string
): Promise<void> {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
    {
      method: 'PUT',
      headers: { Authorization: bearerToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    }
  )
  if (!res.ok) throw new Error('Failed to publish response')
}
