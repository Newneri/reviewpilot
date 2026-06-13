'use client'
import { useEffect, useState } from 'react'
import { ResponseEditor } from '@/components/ResponseEditor'

type Response = {
  id: string
  text: string
  review: {
    authorName: string
    text: string | null
    rating: number
  }
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/responses')
      .then(r => r.json())
      .then(d => { setResponses(d.responses ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <p className="text-gray-400 text-sm">Chargement des réponses…</p>
  }

  if (!responses.length) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium mb-1">Aucune réponse en attente</p>
        <p className="text-sm text-gray-400">
          Les nouveaux avis apparaîtront ici avec des brouillons générés par l'IA, prêts à relire.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Réponses en attente</h1>
      <p className="text-sm text-gray-400 mb-6">{responses.length} brouillon{responses.length !== 1 ? 's' : ''} en attente de validation</p>
      <div className="space-y-4">
        {responses.map(r => (
          <ResponseEditor
            key={r.id}
            responseId={r.id}
            reviewAuthor={r.review.authorName}
            reviewText={r.review.text}
            rating={r.review.rating}
            draftText={r.text}
            onDone={load}
          />
        ))}
      </div>
    </div>
  )
}
