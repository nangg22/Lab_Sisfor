import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users, laboratoryAssignments } from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { BookingsManagementView } from './bookings-management-view'
import { hasPermission } from '@/lib/permissions'

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!currentUser?.isActive || !hasPermission(currentUser.role, 'booking:read_all')) redirect('/dashboard')

  const assignedLabIds = currentUser.role === 'aslab'
    ? (await db.select({ laboratoryId: laboratoryAssignments.laboratoryId }).from(laboratoryAssignments).where(eq(laboratoryAssignments.userId, session.user.id))).map((row) => row.laboratoryId)
    : null

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
    .where(assignedLabIds ? (assignedLabIds.length > 0 ? inArray(bookings.laboratoryId, assignedLabIds) : eq(bookings.id, '00000000-0000-0000-0000-000000000000')) : undefined)
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
      canApprove={hasPermission(currentUser.role, 'booking:approve')}
      viewerRole={currentUser.role}
    />
  )
}
