import { Resend } from 'resend'

type AlertParams = {
  toEmail: string
  businessName: string
  authorName: string
  rating: number
  reviewText: string | null
  reviewId: string
}

export async function sendLowRatingAlert(params: AlertParams): Promise<void> {
  if (params.rating > 1) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { toEmail, businessName, authorName, rating, reviewText, reviewId } = params

  await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL!,
    to: toEmail,
    subject: `Urgent: ${rating}-star review for ${businessName}`,
    html: `
      <h2>Low Rating Alert — ${businessName}</h2>
      <p><strong>${authorName}</strong> left a <strong>${rating}-star</strong> review:</p>
      <blockquote style="border-left:3px solid #e53e3e;padding-left:12px;color:#555">
        ${reviewText ?? '(No text provided)'}
      </blockquote>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/responses?review=${reviewId}"
         style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">
        Respond Now
      </a>
    `,
  })
}
