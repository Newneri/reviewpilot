import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { SubscribeGate } from '@/components/SubscribeGate'
import { LocationProvider } from '@/contexts/LocationContext'
import { LocationSwitcher } from '@/components/LocationSwitcher'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getDbUser()

  const sub = user
    ? await db.subscription.findUnique({ where: { userId: user.id } })
    : null

  if (sub?.status !== 'active') return <SubscribeGate />

  return (
    <LocationProvider>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">ReviewPilot</span>
            <Link href="/reviews" className="text-sm text-gray-600 hover:text-gray-900">Avis</Link>
            <Link href="/responses" className="text-sm text-gray-600 hover:text-gray-900">Réponses</Link>
            <Link href="/locations" className="text-sm text-gray-600 hover:text-gray-900">Établissements</Link>
            <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Paramètres</Link>
          </div>
          <div className="flex items-center gap-3">
            <LocationSwitcher />
            <UserButton />
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </div>
    </LocationProvider>
  )
}
