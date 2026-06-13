'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SettingsContent() {
  const [alertEmail, setAlertEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/settings/alert-email')
      .then(r => r.json())
      .then(d => { if (d.alertEmail) setAlertEmail(d.alertEmail) })
  }, [])
  const googleSuccess = searchParams.get('success') === 'connected' || searchParams.get('success') === 'subscribed'
  const googleError = searchParams.get('error') === 'google_denied'

  const saveAlertEmail = async () => {
    setSaving(true)
    await fetch('/api/settings/alert-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertEmail }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const subscribe = async (plan: string) => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const text = await res.text()
    if (!res.ok) {
      alert(`Checkout error: ${text}`)
      return
    }
    const { url } = JSON.parse(text)
    window.location.href = url
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Paramètres</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Business Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {googleSuccess && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
              Opération réussie.
            </p>
          )}
          {googleError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              La connexion Google a été refusée. Veuillez réessayer.
            </p>
          )}
          <p className="text-sm text-gray-600">
            Connectez votre Google Business Profile pour synchroniser automatiquement vos avis toutes les heures.
          </p>
          <Button onClick={() => window.location.href = '/api/google/connect'}>
            Connecter mon compte Google
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Email d'alerte</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Recevez une alerte immédiate dès qu'un avis 1 étoile est posté.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="patron@monrestaurant.fr"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={saveAlertEmail} disabled={saving || !alertEmail}>
              {saved ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Abonnement</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { plan: 'solo', label: 'Solo', price: '29€/mois', desc: '1 établissement' },
              { plan: 'business', label: 'Business', price: '69€/mois', desc: 'Jusqu\'à 5 établissements' },
              { plan: 'agency', label: 'Agency', price: '199€/mois', desc: 'Jusqu\'à 20 établissements' },
            ].map(({ plan, label, price, desc }) => (
              <div key={plan} className="border rounded-xl p-4 text-center">
                <p className="font-semibold">{label}</p>
                <p className="text-2xl font-bold my-1">{price}</p>
                <p className="text-xs text-gray-500 mb-4">{desc}</p>
                <Button size="sm" className="w-full" onClick={() => subscribe(plan)}>
                  S'abonner
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
