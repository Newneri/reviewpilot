const mockCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

import { generateResponse, extractToneProfile } from '@/lib/llm'

beforeEach(() => mockCreate.mockClear())

describe('generateResponse', () => {
  it('calls Haiku and returns response text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Thank you, Alice! We loved having you.' }],
    })
    const result = await generateResponse({
      authorName: 'Alice',
      rating: 5,
      text: 'Great food!',
      businessName: 'Mario Pizzeria',
      toneExamples: null,
    })
    expect(result).toBe('Thank you, Alice! We loved having you.')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: expect.stringContaining('haiku') })
    )
  })

  it('handles reviews with no text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Thanks for the rating, Bob!' }],
    })
    const result = await generateResponse({
      authorName: 'Bob',
      rating: 4,
      text: null,
      businessName: 'Test Biz',
      toneExamples: null,
    })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes tone examples in prompt when provided', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'We appreciate you!' }],
    })
    await generateResponse({
      authorName: 'Carol',
      rating: 5,
      text: 'Lovely!',
      businessName: 'Test Biz',
      toneExamples: 'Thank you so much! We loved having you!',
    })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('Thank you so much!')
  })

  it('throws on unexpected response type', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'image' }] })
    await expect(generateResponse({
      authorName: 'Dave', rating: 3, text: 'OK', businessName: 'Biz', toneExamples: null,
    })).rejects.toThrow('Unexpected response type')
  })
})

describe('extractToneProfile', () => {
  it('returns JSON string with required keys', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ style: 'warm', formality: 'casual', emoji_usage: false, signature: null }) }],
    })
    const result = await extractToneProfile(['Thanks so much!', 'We loved having you!'])
    const parsed = JSON.parse(result)
    expect(parsed).toHaveProperty('style')
    expect(parsed).toHaveProperty('formality')
  })
})
