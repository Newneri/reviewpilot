'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type Location = { id: string; name: string }

type LocationContextType = {
  locations: Location[]
  selectedId: string | null
  setSelectedId: (id: string) => void
  reload: () => void
}

const LocationContext = createContext<LocationContextType>({
  locations: [],
  selectedId: null,
  setSelectedId: () => {},
  reload: () => {},
})

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedId, setSelectedIdState] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/google/locations')
    const data = await res.json()
    const locs: Location[] = data.locations ?? []
    setLocations(locs)
    const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedLocationId') : null
    if (stored && locs.find(l => l.id === stored)) {
      setSelectedIdState(stored)
    } else if (locs.length > 0) {
      setSelectedIdState(locs[0].id)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setSelectedId = (id: string) => {
    setSelectedIdState(id)
    localStorage.setItem('selectedLocationId', id)
  }

  return (
    <LocationContext.Provider value={{ locations, selectedId, setSelectedId, reload: load }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
