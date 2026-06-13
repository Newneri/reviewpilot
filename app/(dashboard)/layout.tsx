import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { getDbUser } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await getDbUser()
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">ReviewPilot</span>
          <Link href="/reviews" className="text-sm text-gray-600 hover:text-gray-900">Reviews</Link>
          <Link href="/responses" className="text-sm text-gray-600 hover:text-gray-900">Responses</Link>
          <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
        </div>
        <UserButton />
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
