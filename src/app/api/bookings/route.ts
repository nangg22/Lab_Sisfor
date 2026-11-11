import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, bookingStatusHistory, laboratories } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { laboratoryId, bookingDate, startTime, endTime, purpose, participantCount, notes } = body

    if (!laboratoryId || !bookingDate || !startTime || !endTime || !purpose) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    // Validasi tanggal tidak boleh di masa lalu
    const todayStr = new Date().toISOString().split('T')[0]
    if (bookingDate < todayStr) {
      return NextResponse.json({ error: 'Tanggal peminjaman tidak boleh di masa lalu.' }, { status: 400 })
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: 'Waktu selesai harus setelah waktu mulai.' }, { status: 400 })
    }

    if (purpose.trim().length < 10) {
      return NextResponse.json({ error: 'Tujuan peminjaman minimal 10 karakter.' }, { status: 400 })
    }

    if (participantCount !== null && participantCount !== undefined && participantCount <= 0) {
      return NextResponse.json({ error: 'Jumlah peserta harus lebih dari 0.' }, { status: 400 })
    }

    // Pastikan lab aktif
    const [lab] = await db
      .select({ id: laboratories.id, isActive: laboratories.isActive })
      .from(laboratories)
      .where(eq(laboratories.id, laboratoryId))
      .limit(1)

    if (!lab || !lab.isActive) {
      return NextResponse.json({ error: 'Laboratorium tidak ditemukan atau sedang tidak aktif.' }, { status: 404 })
    }

    // Cek apakah slot waktu yang diminta bertabrakan dengan peminjaman APPROVED atau BLOCKED yang sudah ada
    const approvedOrBlocked = await db
      .select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime, status: bookings.status })
      .from(bookings)
      .where(
        and(
          eq(bookings.laboratoryId, laboratoryId),
          eq(bookings.bookingDate, bookingDate)
        )
      )

    const conflictingSlot = approvedOrBlocked.find(
      (slot) => (slot.status === 'APPROVED' || slot.status === 'BLOCKED') &&
                startTime < slot.endTime && endTime > slot.startTime
    )

    if (conflictingSlot) {
      if (conflictingSlot.status === 'BLOCKED') {
        return NextResponse.json(
          { error: 'Laboratorium sedang diblokir untuk pemeliharaan/agenda khusus pada jam tersebut.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Slot waktu yang Anda pilih telah terisi oleh peminjaman lain yang disetujui. Silakan pilih waktu lain.' },
        { status: 409 }
      )
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: session.user.id,
        laboratoryId,
        bookingDate,
        startTime,
        endTime,
        purpose: purpose.trim(),
        participantCount: participantCount ? parseInt(participantCount) : null,
        notes: notes ? notes.trim() : null,
        status: 'PENDING',
      })
      .returning({ id: bookings.id })

    await db.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      oldStatus: null,
      newStatus: 'PENDING',
      changedByUserId: session.user.id,
      reason: 'Pengajuan dibuat',
    })

    return NextResponse.json({ id: booking.id }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
