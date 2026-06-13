import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Review = {
  id: string
  authorName: string
  rating: number
  text: string | null
  publishedAt: string
  response: { text: string; status: string } | null
}

const BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  approved: 'secondary',
  draft: 'outline',
}

export function ReviewCard({ review }: { review: Review }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  const ratingColor = review.rating <= 2 ? 'text-red-500' : review.rating === 3 ? 'text-yellow-500' : 'text-green-500'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{review.authorName}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${ratingColor}`}>{stars}</span>
            {review.response && (
              <Badge variant={BADGE_VARIANT[review.response.status] ?? 'outline'}>
                {review.response.status}
              </Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(review.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">{review.text ?? '(No text — rating only)'}</p>
        {review.response && (
          <div className="mt-3 pl-3 border-l-2 border-blue-200">
            <p className="text-xs text-gray-400 mb-1">AI Response</p>
            <p className="text-sm text-gray-600">{review.response.text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
