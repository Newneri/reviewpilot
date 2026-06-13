import { NextResponse } from 'next/server'
import { generateResponse } from '@/lib/llm'

// Temporary test endpoint — remove before production
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const response = await generateResponse({
    authorName: 'John Smith',
    rating: 1,
    text: 'Terrible service, waited 45 minutes and the food was cold.',
    businessName: 'Mario Pizzeria',
    toneExamples: null,
  })

  return NextResponse.json({ response })
}
