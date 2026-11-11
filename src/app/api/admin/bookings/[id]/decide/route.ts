import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, bookings, bookingApprovalActions, bookingStatusHistory } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { decision, reason } = await request.json()

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return NextResponse.json({ error: 'Decision tidak valid.' }, { status: 400 })
  }
  if (decision === 'REJECTED' && !reason?.trim()) {
    return NextResponse.json({ error: 'Alasan penolakan wajib diisi.' }, { status: 400 })
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1)
  if (!booking) return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 })
  if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Pengajuan sudah diproses.' }, { status: 400 })

  // Cek konflik jadwal saat approve (BR-004, CON-017)
  if (decision === 'APPROVED') {
    const conflicts = await db
      .select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(and(eq(bookings.laboratoryId, booking.laboratoryId), eq(bookings.bookingDate, booking.bookingDate), eq(bookings.status, 'APPROVED')))

    const hasConflict = conflicts.some(
      (c) => booking.startTime < c.endTime && booking.endTime > c.startTime && c.id !== id
    )

    if (hasConflict) {
      return NextResponse.json({ error: 'Konflik jadwal: ada peminjaman lain yang sudah disetujui pada waktu tersebut.' }, { status: 409 })
    }
  }

  await db.update(bookings).set({ status: decision }).where(and(eq(bookings.id, id), eq(bookings.status, 'PENDING')))
  await db.insert(bookingApprovalActions).values({ bookingId: id, approverUserId: session.user.id, decision, reason: reason?.trim() || null })
  await db.insert(bookingStatusHistory).values({ bookingId: id, oldStatus: 'PENDING', newStatus: decision, changedByUserId: session.user.id, reason: reason?.trim() || null })

  return NextResponse.json({ success: true })
}
