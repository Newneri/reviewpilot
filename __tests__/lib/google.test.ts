import { buildAuthUrl, exchangeCodeForTokens, fetchReviews } from '@/lib/google'

describe('buildAuthUrl', () => {
  it('returns a Google OAuth URL containing state and scope', () => {
    process.env.GOOGLE_CLIENT_ID = 'test_client_id'
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/google/callback'
    const url = buildAuthUrl('test-state')
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(url).toContain('test-state')
    expect(url).toContain('business.manage')
    expect(url).toContain('test_client_id')
  })
})

describe('exchangeCodeForTokens', () => {
  it('returns tokens on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'acc_123', refresh_token: 'ref_123', expires_in: 3600 }),
    })
    const result = await exchangeCodeForTokens('valid-code')
    expect(result.accessToken).toBe('acc_123')
    expect(result.refreshToken).toBe('ref_123')
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('throws on failed token exchange', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    await expect(exchangeCodeForTokens('bad-code')).rejects.toThrow('Token exchange failed')
  })
})

describe('fetchReviews', () => {
  it('maps Google star ratings to integers', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [{
          reviewId: 'r1',
          reviewer: { displayName: 'Alice' },
          starRating: 'FIVE',
          comment: 'Great place!',
          createTime: '2024-01-01T00:00:00Z',
        }],
      }),
    })
    const reviews = await fetchReviews('acc_123', 'loc_456', 'Bearer token')
    expect(reviews).toHaveLength(1)
    expect(reviews[0].rating).toBe(5)
    expect(reviews[0].authorName).toBe('Alice')
    expect(reviews[0].googleReviewId).toBe('r1')
    expect(reviews[0].text).toBe('Great place!')
  })

  it('handles reviews with no comment', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [{
          reviewId: 'r2',
          reviewer: { displayName: 'Bob' },
          starRating: 'THREE',
          createTime: '2024-01-02T00:00:00Z',
        }],
      }),
    })
    const reviews = await fetchReviews('acc_123', 'loc_456', 'Bearer token')
    expect(reviews[0].text).toBeNull()
    expect(reviews[0].rating).toBe(3)
  })

  it('returns empty array when no reviews', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    const reviews = await fetchReviews('acc_123', 'loc_456', 'Bearer token')
    expect(reviews).toHaveLength(0)
  })

  it('throws on API error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    await expect(fetchReviews('acc_123', 'loc_456', 'Bearer token')).rejects.toThrow('Failed to fetch reviews')
  })
})
