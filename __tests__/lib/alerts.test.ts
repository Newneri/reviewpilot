const mockSend = jest.fn()

jest.mock('resend', () => ({
  __esModule: true,
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}))

import { sendLowRatingAlert } from '@/lib/alerts'

beforeEach(() => mockSend.mockClear())

describe('sendLowRatingAlert', () => {
  it('sends email for a 1-star review', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_1' }, error: null })
    await sendLowRatingAlert({
      toEmail: 'owner@test.com',
      businessName: 'Test Biz',
      authorName: 'Dave',
      rating: 1,
      reviewText: 'Awful experience.',
      reviewId: 'rev_abc',
    })
    expect(mockSend).toHaveBeenCalledTimes(1)
    const call = mockSend.mock.calls[0][0]
    expect(call.to).toBe('owner@test.com')
    expect(call.subject).toContain('1-star')
    expect(call.html).toContain('Dave')
    expect(call.html).toContain('Awful experience.')
  })

  it('does not send for a 2-star review', async () => {
    await sendLowRatingAlert({
      toEmail: 'owner@test.com',
      businessName: 'Test Biz',
      authorName: 'Dave',
      rating: 2,
      reviewText: 'Not great.',
      reviewId: 'rev_abc',
    })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('does not send for a 3-star review', async () => {
    await sendLowRatingAlert({
      toEmail: 'owner@test.com',
      businessName: 'Test Biz',
      authorName: 'Dave',
      rating: 3,
      reviewText: 'It was okay.',
      reviewId: 'rev_abc',
    })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('handles reviews with no text', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_2' }, error: null })
    await sendLowRatingAlert({
      toEmail: 'owner@test.com',
      businessName: 'Test Biz',
      authorName: 'Eve',
      rating: 1,
      reviewText: null,
      reviewId: 'rev_xyz',
    })
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend.mock.calls[0][0].html).toContain('No text')
  })
})
