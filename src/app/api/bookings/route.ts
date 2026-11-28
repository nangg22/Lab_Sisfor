import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { auditLogs, bookings, bookingStatusHistory, laboratories, notifications, users } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { validateBookingTiming } from '@/lib/booking-rules'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verifikasi ulang isActive ke DB (JWT mungkin sudah stale)
    const [currentUser] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    if (!currentUser?.isActive) {
    return NextResponse.json({ error: 'Akun Anda telah dinonaktifkan.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      laboratoryId,
      bookingDate,
      startTime,
      endTime,
      purpose,
      participantCount,
      notes,
      bookingType: rawBookingType,
      includedItems: rawIncludedItems,
    } = body

    const bookingType = rawBookingType === 'EQUIPMENT' ? 'EQUIPMENT' : 'ROOM'
    const includedItems = Array.isArray(rawIncludedItems)
      ? rawIncludedItems
          .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0)
          .map((item) => ({
            facilityId: typeof item.facilityId === 'string' ? item.facilityId : undefined,
            name: item.name.trim(),
            quantity:
              item.quantity !== null && item.quantity !== undefined && item.quantity !== ''
                ? Math.max(1, Number(item.quantity) || 1)
                : null,
            details: typeof item.details === 'string' && item.details.trim() ? item.details.trim() : null,
          }))
      : []

    if (bookingType === 'EQUIPMENT' && includedItems.length === 0) {
      return NextResponse.json(
        { error: 'Untuk peminjaman khusus/alat, pilih minimal 1 unit/inventaris yang ingin dipinjam.' },
        { status: 400 }
      )
    }

    if (!laboratoryId || !bookingDate || !startTime || !endTime || typeof purpose !== 'string') {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (bookingDate < todayStr) {
      return NextResponse.json({ error: 'Tanggal peminjaman tidak boleh di masa lalu.' }, { status: 400 })
    }
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'Waktu selesai harus setelah waktu mulai.' }, { status: 400 })
    }
    const timingError = validateBookingTiming(bookingDate, startTime, endTime)
    if (timingError) {
      return NextResponse.json({ error: timingError }, { status: 400 })
    }
    const trimmedPurpose = purpose.trim()
    if (trimmedPurpose.length < 15) {
      return NextResponse.json({ error: 'Tujuan peminjaman minimal 15 karakter.' }, { status: 400 })
    }
    if (trimmedPurpose.length > 250) {
      return NextResponse.json({ error: 'Tujuan peminjaman maksimal 250 karakter.' }, { status: 400 })
    }
    const parsedParticipantCount = participantCount === null || participantCount === undefined || participantCount === ''
      ? null
      : Number(participantCount)

    if (parsedParticipantCount !== null && (!Number.isInteger(parsedParticipantCount) || parsedParticipantCount <= 0)) {
      return NextResponse.json({ error: 'Jumlah peserta harus lebih dari 0.' }, { status: 400 })
    }

    // Pastikan lab aktif
    const [lab] = await db
      .select({ id: laboratories.id, name: laboratories.name, capacity: laboratories.capacity, isActive: laboratories.isActive })
      .from(laboratories)
      .where(eq(laboratories.id, laboratoryId))
      .limit(1)

    if (!lab || !lab.isActive) {
      return NextResponse.json({ error: 'Laboratorium tidak ditemukan atau sedang tidak aktif.' }, { status: 404 })
    }

    if (parsedParticipantCount !== null && parsedParticipantCount > lab.capacity) {
      return NextResponse.json({ error: `Jumlah peserta melebihi kapasitas lab (${lab.capacity} orang).` }, { status: 400 })
    }

    // Conflict check — neon-http tidak support transaksi, gunakan sequential queries.
    // Race condition window sangat kecil karena booking baru masuk PENDING (bukan APPROVED),
    // dan hanya admin yang bisa APPROVE. Double-booking di PENDING tidak menyebabkan masalah
    // nyata karena admin akan menolak salah satunya saat review.
    const existingSlots = await db
      .select({
        id: bookings.id,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        bookingType: bookings.bookingType,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.laboratoryId, laboratoryId),
          eq(bookings.bookingDate, bookingDate),
          inArray(bookings.status, ['APPROVED', 'BLOCKED'])
        )
      )

    const conflict = existingSlots.find((s) => {
      const overlaps = startTime < s.endTime && endTime > s.startTime
      if (!overlaps) return false
      if (s.status === 'BLOCKED') return true
      // Peminjaman ruangan bentrok dengan peminjaman ruangan lain.
      // Peminjaman khusus alat (EQUIPMENT) tetap diperbolehkan selama lab tidak diblokir (akan direview admin).
      return bookingType === 'ROOM' && s.bookingType !== 'EQUIPMENT'
    })

    if (conflict) {
      return NextResponse.json(
        {
          error: conflict.status === 'BLOCKED'
            ? 'Laboratorium sedang diblokir untuk pemeliharaan/agenda khusus pada jam tersebut.'
            : 'Slot waktu yang Anda pilih telah terisi oleh peminjaman lain yang disetujui. Silakan pilih waktu lain.',
        },
        { status: 409 }
      )
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: session.user.id,
        laboratoryId,
        bookingType,
        includedItems: includedItems.length > 0 ? includedItems : null,
        bookingDate,
        startTime,
        endTime,
        purpose: trimmedPurpose,
        participantCount: parsedParticipantCount,
        notes: notes ? notes.trim() : null,
        status: 'PENDING',
      })
      .returning({ id: bookings.id })

    await db.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      oldStatus: null,
      newStatus: 'PENDING',
      changedByUserId: session.user.id,
      reason: bookingType === 'EQUIPMENT' ? 'Pengajuan peminjaman khusus/alat dibuat' : 'Pengajuan peminjaman ruangan dibuat',
    })
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: 'BOOKING_CREATED',
      targetType: 'BOOKING',
      targetId: booking.id,
      reason: bookingType === 'EQUIPMENT' ? 'Pengajuan peminjaman khusus/alat dibuat' : 'Pengajuan peminjaman ruangan dibuat',
      metadata: { laboratoryId, bookingType, includedItems, bookingDate, startTime, endTime },
    })

    // Notifikasi ke semua admin
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))

    for (const adm of admins) {
      await db.insert(notifications).values({
        userId: adm.id,
        title: 'Pengajuan Baru Masuk',
        message: `${session.user.name || 'Pengguna'} mengajukan peminjaman ${lab.name} untuk tanggal ${bookingDate}.`,
        type: 'NEW_BOOKING',
        link: `/admin/bookings/${booking.id}`,
        isRead: false,
      })
    }

    return NextResponse.json({ id: booking.id }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
