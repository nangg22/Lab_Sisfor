import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, bookings } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { AppShell } from '@/components/layout/app-shell'
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

  const [pendingResult] = user.role === 'admin'
    ? await db.select({ total: count() }).from(bookings).where(eq(bookings.status, 'PENDING'))
    : await db
        .select({ total: count() })
        .from(bookings)
        .where(and(eq(bookings.userId, session.user.id), eq(bookings.status, 'PENDING')))

  const pendingCount = pendingResult?.total ?? 0

  return <AppShell userName={user.fullName} userRole={user.role as RoleCode} pendingCount={pendingCount}>{children}</AppShell>
}
