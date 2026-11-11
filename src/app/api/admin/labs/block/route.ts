import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users, bookingStatusHistory } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// POST /api/admin/labs/block — Blokir jadwal lab oleh Admin
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (currentUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya Admin yang dapat memblokir jadwal lab.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { laboratoryId, bookingDate, startTime, endTime, reason } = body

    if (!laboratoryId || !bookingDate || !startTime || !endTime || !reason) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi.' }, { status: 400 })
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: 'Waktu selesai harus setelah waktu mulai.' }, { status: 400 })
    }

    // Pastikan lab ada
    const [lab] = await db
      .select({ id: laboratories.id, name: laboratories.name })
      .from(laboratories)
      .where(eq(laboratories.id, laboratoryId))
      .limit(1)

    if (!lab) {
      return NextResponse.json({ error: 'Laboratorium tidak ditemukan.' }, { status: 404 })
    }

    // Cek apakah ada jadwal APPROVED pada slot ini
    const existingApproved = await db
      .select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(
        and(
          eq(bookings.laboratoryId, laboratoryId),
          eq(bookings.bookingDate, bookingDate),
          eq(bookings.status, 'APPROVED')
        )
      )

    const hasConflict = existingApproved.some(
      (slot) => startTime < slot.endTime && endTime > slot.startTime
    )

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Ada peminjaman yang sudah disetujui pada jam ini. Batalkan atau sesuaikan peminjaman tersebut terlebih dahulu.' },
        { status: 409 }
      )
    }

    // Simpan jadwal pemblokiran
    const [blockBooking] = await db
      .insert(bookings)
      .values({
        userId: session.user.id,
        laboratoryId,
        bookingDate,
        startTime,
        endTime,
        purpose: `[DIBLOKIR / MAINTENANCE] ${reason.trim()}`,
        status: 'BLOCKED',
        notes: 'Diblokir oleh Administrator sistem',
      })
      .returning({ id: bookings.id })

    await db.insert(bookingStatusHistory).values({
      bookingId: blockBooking.id,
      oldStatus: null,
      newStatus: 'BLOCKED',
      changedByUserId: session.user.id,
      reason: `Pemblokiran lab: ${reason}`,
    })

    return NextResponse.json({ success: true, id: blockBooking.id }, { status: 201 })
  } catch (error) {
    console.error('Error blocking lab slot:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

