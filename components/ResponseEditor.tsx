'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Props = {
  responseId: string
  reviewAuthor: string
  reviewText: string | null
  rating: number
  draftText: string
  onDone: () => void
}

export function ResponseEditor({ responseId, reviewAuthor, reviewText, rating, draftText, onDone }: Props) {
  const [text, setText] = useState(draftText)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const ratingColor = rating <= 2 ? 'text-red-500' : rating === 3 ? 'text-yellow-500' : 'text-green-500'

  const approve = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/responses/${responseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onDone()
    } catch {
      setError('Failed to save draft. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const publish = async () => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`/api/responses/${responseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const res = await fetch(`/api/responses/${responseId}/publish`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to publish')
      onDone()
    } catch {
      setError('Failed to publish. Check your Google connection in Settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{reviewAuthor}</span>
          <span className={`text-sm ${ratingColor}`}>{stars}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{reviewText ?? '(No text — rating only)'}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          placeholder="Edit the AI response before publishing..."
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" onClick={approve} disabled={loading}>
            Save Draft
          </Button>
          <Button onClick={publish} disabled={loading}>
            {loading ? 'Publishing…' : 'Publish to Google'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
