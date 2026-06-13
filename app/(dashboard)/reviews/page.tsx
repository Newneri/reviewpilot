'use client'
import { useEffect, useState } from 'react'
import { ReviewCard } from '@/components/ReviewCard'
import { useLocation } from '@/contexts/LocationContext'

type Review = {
  id: string
  authorName: string
  rating: number
  text: string | null
  publishedAt: string
  response: { text: string; status: string } | null
}

export default function ReviewsPage() {
  const { selectedId, locations } = useLocation()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedId === null && locations.length > 0) return
    setLoading(true)
    const url = selectedId ? `/api/reviews?b=${selectedId}` : '/api/reviews'
    fetch(url)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setLoading(false) })
  }, [selectedId, locations.length])

  if (loading) {
    return <p className="text-gray-400 text-sm">Chargement des avis…</p>
  }

  if (!reviews.length) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium mb-1">Aucun avis pour l'instant</p>
        <p className="text-sm text-gray-400">
          Connectez votre Google Business Profile dans les{' '}
          <a href="/locations" className="text-blue-500 underline">Établissements</a>{' '}
          pour démarrer la synchronisation.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Avis</h1>
      <div className="space-y-4">
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  )
}
