'use client'
import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'

const PLANS = [
  { plan: 'solo', label: 'Solo', price: '29€/mois', desc: '1 établissement', features: ['Synchronisation toutes les heures', 'Réponses IA illimitées', 'Alertes avis négatifs'] },
  { plan: 'business', label: 'Business', price: '69€/mois', desc: "Jusqu'à 5 établissements", features: ['Tout Solo', '5 établissements', 'Publication automatique'] },
  { plan: 'agency', label: 'Agency', price: '199€/mois', desc: "Jusqu'à 20 établissements", features: ['Tout Business', '20 établissements', 'Onboarding dédié'] },
]

export function SubscribeGate() {
  const [loading, setLoading] = useState<string | null>(null)

  const subscribe = async (plan: string) => {
    setLoading(plan)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-semibold">ReviewPilot</span>
        <UserButton />
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Choisissez votre plan</h1>
          <p className="text-gray-500">Commencez à répondre à vos avis Google en quelques minutes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map(({ plan, label, price, desc, features }, i) => {
            const highlight = i === 1
            return (
              <div
                key={plan}
                className={`rounded-2xl p-8 border ${highlight ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}
              >
                <p className={`font-semibold text-lg mb-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                <p className={`text-4xl font-bold mb-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>
                  {price.split('/')[0]}<span className="text-base font-normal">/{price.split('/')[1]}</span>
                </p>
                <p className={`text-sm mb-6 ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
                <ul className="space-y-2 mb-8">
                  {features.map(f => (
                    <li key={f} className={`text-sm flex items-start gap-2 ${highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribe(plan)}
                  disabled={loading !== null}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                    highlight
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === plan ? 'Redirection…' : "S'abonner"}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
