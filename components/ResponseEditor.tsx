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
      setError('Impossible d\'enregistrer le brouillon. Réessayez.')
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
      setError('Impossible de publier. Vérifiez votre connexion Google dans les Paramètres.')
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
        <p className="text-sm text-gray-600 mt-1">{reviewText ?? '(Aucun texte — note uniquement)'}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          placeholder="Modifiez la réponse IA avant de publier..."
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button variant="outline" onClick={approve} disabled={loading}>
            Enregistrer le brouillon
          </Button>
          <Button onClick={publish} disabled={loading}>
            {loading ? 'Publication…' : 'Publier sur Google'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
