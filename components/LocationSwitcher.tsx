'use client'
import { useLocation } from '@/contexts/LocationContext'

export function LocationSwitcher() {
  const { locations, selectedId, setSelectedId } = useLocation()
  if (locations.length <= 1) return null

  return (
    <select
      value={selectedId ?? ''}
      onChange={e => setSelectedId(e.target.value)}
      className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none"
    >
      {locations.map(l => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  )
}
