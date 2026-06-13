'use client'
import { useState } from 'react'
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
  const googleSuccess = searchParams.get('success') === 'connected'
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
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Business Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {googleSuccess && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
              Google account connected successfully.
            </p>
          )}
          {googleError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              Google connection was denied. Please try again.
            </p>
          )}
          <p className="text-sm text-gray-600">
            Connect your Google Business Profile to start syncing reviews automatically every hour.
          </p>
          <Button onClick={() => window.location.href = '/api/google/connect'}>
            Connect Google Account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Alert Email</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Get notified instantly when a 1-star review arrives.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="owner@yourbusiness.com"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={saveAlertEmail} disabled={saving || !alertEmail}>
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { plan: 'solo', label: 'Solo', price: '$49/mo', desc: '1 location' },
              { plan: 'business', label: 'Business', price: '$99/mo', desc: '2–5 locations' },
              { plan: 'agency', label: 'Agency', price: '$299/mo', desc: 'Up to 20 locations' },
            ].map(({ plan, label, price, desc }) => (
              <div key={plan} className="border rounded-xl p-4 text-center">
                <p className="font-semibold">{label}</p>
                <p className="text-2xl font-bold my-1">{price}</p>
                <p className="text-xs text-gray-500 mb-4">{desc}</p>
                <Button size="sm" className="w-full" onClick={() => subscribe(plan)}>
                  Subscribe
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
