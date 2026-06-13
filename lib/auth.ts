import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function getDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  let user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) return null
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      },
    })
  }
  return user
}
