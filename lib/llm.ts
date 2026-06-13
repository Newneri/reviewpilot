import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type GenerateParams = {
  authorName: string
  rating: number
  text: string | null
  businessName: string
  toneExamples: string | null
}

export async function generateResponse(params: GenerateParams): Promise<string> {
  const { authorName, rating, text, businessName, toneExamples } = params
  const toneSection = toneExamples ? `\n\nTone examples from this business:\n${toneExamples}` : ''

  const prompt = `Write a review response for "${businessName}".
Customer: ${authorName} | Rating: ${rating}/5
Review: ${text ?? '(rating only, no text)'}${toneSection}

Write 2-4 sentences. Be genuine, address the customer by name. Output ONLY the response text, nothing else.`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}

export async function extractToneProfile(examples: string[]): Promise<string> {
  const prompt = `Analyze these review responses and return ONLY a JSON object with keys: style (string), formality ("formal"|"casual"), emoji_usage (boolean), signature (string|null).

Examples:
${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}
