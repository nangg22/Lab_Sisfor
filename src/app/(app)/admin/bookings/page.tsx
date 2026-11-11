import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { BookingsManagementView } from './bookings-management-view'

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const allBookings = await db
    .select({
      id: bookings.id,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      purpose: bookings.purpose,
      status: bookings.status,
      createdAt: bookings.createdAt,
      labName: laboratories.name,
      userName: users.fullName,
      userRole: users.role,
    })
    .from(bookings)
    .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(bookings.createdAt))

  const filtered =
    filterStatus && filterStatus !== 'ALL'
      ? allBookings.filter((b) => b.status === filterStatus)
      : allBookings

  const pendingCount = allBookings.filter((b) => b.status === 'PENDING').length

  return (
    <BookingsManagementView
      bookings={filtered}
      currentFilter={filterStatus}
      pendingCount={pendingCount}
    />
  )
}
