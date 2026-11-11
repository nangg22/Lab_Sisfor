import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, bookings } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { Navbar } from '@/components/layout/navbar'
import { ColorOSDock } from '@/components/layout/coloros-dock'
import type { RoleCode } from '@/db/schema'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [user] = await db
    .select({ fullName: users.fullName, role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) redirect('/auth/login')

  const isAdmin = user.role === 'admin'
  const [pendingResult] = isAdmin
    ? await db.select({ total: count() }).from(bookings).where(eq(bookings.status, 'PENDING'))
    : await db
        .select({ total: count() })
        .from(bookings)
        .where(and(eq(bookings.userId, session.user.id), eq(bookings.status, 'PENDING')))

  const pendingCount = pendingResult?.total ?? 0

  return (
    <div className="min-h-screen">
      <Navbar
        userName={user.fullName}
        userRole={user.role as RoleCode}
        pendingCount={pendingCount}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-12">
        {children}
      </main>
      <ColorOSDock
        userRole={user.role as RoleCode}
        pendingCount={pendingCount}
      />
    </div>
  )
}
