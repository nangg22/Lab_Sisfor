import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users, laboratoryAssignments } from '@/db/schema'
import { eq, desc, inArray, count } from 'drizzle-orm'
import { BookingsManagementView } from './bookings-management-view'
import { hasPermission } from '@/lib/permissions'

const PAGE_SIZE = 25

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status: filterStatus, page: pageParam } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!currentUser?.isActive || !hasPermission(currentUser.role, 'booking:read_all')) {
    redirect('/dashboard')
  }

  // Aslab hanya lihat lab yang ditugaskan
  const assignedLabIds = currentUser.role === 'aslab'
    ? (await db
        .select({ laboratoryId: laboratoryAssignments.laboratoryId })
        .from(laboratoryAssignments)
        .where(eq(laboratoryAssignments.userId, session.user.id))
      ).map((r) => r.laboratoryId)
    : null

  // Base where condition
  const whereClause = assignedLabIds
    ? (assignedLabIds.length > 0
        ? inArray(bookings.laboratoryId, assignedLabIds)
        : eq(bookings.id, '00000000-0000-0000-0000-000000000000')) // kosong → no results
    : undefined

  // Total count untuk pagination
  const [countRow] = await db
    .select({ total: count() })
    .from(bookings)
    .where(whereClause)

  const totalCount  = countRow?.total ?? 0
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const totalPages  = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage    = Math.min(currentPage, totalPages)
  const offset      = (safePage - 1) * PAGE_SIZE

  const allBookings = await db
    .select({
      id:        bookings.id,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime:   bookings.endTime,
      purpose:   bookings.purpose,
      status:    bookings.status,
      createdAt: bookings.createdAt,
      labName:   laboratories.name,
      userName:  users.fullName,
      userRole:  users.role,
    })
    .from(bookings)
    .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(whereClause)
    .orderBy(desc(bookings.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)

  // Filter by status (client-side dari halaman yang sudah dipaginasi — cukup untuk 25 row)
  const filtered = filterStatus && filterStatus !== 'ALL'
    ? allBookings.filter((b) => b.status === filterStatus)
    : allBookings

  const pendingCount = await db
    .select({ total: count() })
    .from(bookings)
    .where(whereClause)
    .then(async () => {
      const [r] = await db
        .select({ total: count() })
        .from(bookings)
        .where(eq(bookings.status, 'PENDING'))
      return r?.total ?? 0
    })

  return (
    <BookingsManagementView
      bookings={filtered}
      currentFilter={filterStatus}
      pendingCount={pendingCount}
      canApprove={hasPermission(currentUser.role, 'booking:approve')}
      viewerRole={currentUser.role}
      pagination={{ currentPage: safePage, totalPages, totalCount }}
    />
  )
}
