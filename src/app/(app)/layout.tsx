import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, bookings } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ColorOSDock } from '@/components/layout/coloros-dock'
import type { RoleCode } from '@/db/schema'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [user] = await db
    .select({ fullName: users.fullName, email: users.email, role: users.role })
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
    <div className="min-h-screen bg-slate-50">
      {/* 1. Desktop Fixed Left Sidebar */}
      <Sidebar
        userName={user.fullName}
        userEmail={user.email}
        userRole={user.role as RoleCode}
        pendingCount={pendingCount}
      />

      {/* 2. Main Content Area */}
      <div className="flex flex-col md:pl-64">
        {/* Minimalist Top Header */}
        <Header isAdmin={isAdmin} />

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* 3. Mobile Dock (strictly mobile only, md:hidden) */}
      <ColorOSDock
        userRole={user.role as RoleCode}
        pendingCount={pendingCount}
      />
    </div>
  )
}
