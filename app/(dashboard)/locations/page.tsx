'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocation } from '@/contexts/LocationContext'

type GoogleLocation = { id: string; accountId: string; name: string }
type ConnectedLocation = { id: string; name: string; googleLocationId: string }

export default function LocationsPage() {
  const { reload } = useLocation()
  const [available, setAvailable] = useState<GoogleLocation[]>([])
  const [connected, setConnected] = useState<ConnectedLocation[]>([])
  const [planLimit, setPlanLimit] = useState(1)
  const [loadingAvailable, setLoadingAvailable] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchData = async () => {
    const [subRes, connRes, availRes] = await Promise.all([
      fetch('/api/settings/subscription'),
      fetch('/api/google/locations'),
      fetch('/api/google/available-locations'),
    ])
    const subData = await subRes.json()
    const connData = await connRes.json()
    const availData = await availRes.json()

    const limits: Record<string, number> = { solo: 1, business: 5, agency: 20 }
    setPlanLimit(limits[subData.plan] ?? 1)
    setConnected(connData.locations ?? [])
    setAvailable(availData.locations ?? [])
    setLoadingAvailable(false)
  }

  useEffect(() => { fetchData() }, [])

  const addLocation = async (loc: GoogleLocation) => {
    setAdding(loc.id)
    await fetch('/api/google/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleAccountId: loc.accountId, googleLocationId: loc.id, name: loc.name }),
    })
    await fetchData()
    reload()
    setAdding(null)
  }

  const removeLocation = async (id: string) => {
    setRemoving(id)
    await fetch(`/api/google/locations/${id}`, { method: 'DELETE' })
    await fetchData()
    reload()
    setRemoving(null)
  }

  const connectedIds = new Set(connected.map(c => c.googleLocationId))
  const atLimit = connected.length >= planLimit

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mes établissements</h1>
        <p className="text-sm text-gray-500">{connected.length} / {planLimit} établissement{planLimit > 1 ? 's' : ''}</p>
      </div>

      {connected.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Établissements connectés</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {connected.map(loc => (
              <div key={loc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{loc.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLocation(loc.id)}
                  disabled={removing === loc.id}
                >
                  {removing === loc.id ? 'Suppression…' : 'Retirer'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Établissements disponibles</CardTitle></CardHeader>
        <CardContent>
          {loadingAvailable ? (
            <p className="text-sm text-gray-400">Chargement depuis Google…</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun établissement trouvé sur votre compte Google.</p>
          ) : (
            <div className="space-y-2">
              {available.map(loc => {
                const isConnected = connectedIds.has(loc.id)
                return (
                  <div key={loc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{loc.name}</span>
                    <Button
                      size="sm"
                      onClick={() => addLocation(loc)}
                      disabled={isConnected || atLimit || adding === loc.id}
                    >
                      {isConnected ? 'Connecté' : adding === loc.id ? 'Ajout…' : atLimit ? 'Limite atteinte' : 'Ajouter'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {atLimit && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
          Limite de votre plan atteinte ({planLimit} établissement{planLimit > 1 ? 's' : ''}). Passez à un plan supérieur dans les Paramètres pour en ajouter davantage.
        </p>
      )}
    </div>
  )
}
