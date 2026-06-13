'use client'
import { useEffect, useState } from 'react'
import { ReviewCard } from '@/components/ReviewCard'

type Review = {
  id: string
  authorName: string
  rating: number
  text: string | null
  publishedAt: string
  response: { text: string; status: string } | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setLoading(false) })
  }, [])

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading reviews…</p>
  }

  if (!reviews.length) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium mb-1">No reviews yet</p>
        <p className="text-sm text-gray-400">
          Connect your Google Business Profile in{' '}
          <a href="/settings" className="text-blue-500 underline">Settings</a>{' '}
          to start syncing.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Reviews</h1>
      <div className="space-y-4">
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  )
}
