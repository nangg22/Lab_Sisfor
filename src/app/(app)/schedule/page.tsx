import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { laboratories, bookings, users } from '@/db/schema'
import { eq, and, or, inArray } from 'drizzle-orm'
import { ScheduleMatrixView } from './schedule-matrix-view'

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function SchedulePage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const isAdmin = currentUser?.role === 'admin'

  const { date } = await searchParams
  // Default ke hari ini jika tidak dipilih
  const todayStr = new Date().toLocaleDateString('sv-SE')
  const selectedDate = date || todayStr

  // Ambil semua lab aktif
  const labs = await db
    .select({
      id: laboratories.id,
      name: laboratories.name,
      location: laboratories.location,
      capacity: laboratories.capacity,
    })
    .from(laboratories)
    .where(eq(laboratories.isActive, true))
    .orderBy(laboratories.name)

  // Ambil booking berstatus APPROVED atau BLOCKED pada tanggal terpilih
  const scheduleSlots = await db
    .select({
      id: bookings.id,
      laboratoryId: bookings.laboratoryId,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      purpose: bookings.purpose,
      status: bookings.status,
      userName: users.fullName,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(
      and(
        eq(bookings.bookingDate, selectedDate),
        inArray(bookings.status, ['APPROVED', 'BLOCKED'])
      )
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Penggunaan Ruang & Laboratorium</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Pantau ketersediaan seluruh laboratorium secara visual per jam seperti sistem RuangUISI.
        </p>
      </div>

      <ScheduleMatrixView
        labs={labs}
        bookings={scheduleSlots}
        selectedDate={selectedDate}
        isAdmin={isAdmin}
      />
    </div>
  )
}

