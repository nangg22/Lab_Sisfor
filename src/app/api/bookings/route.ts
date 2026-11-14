import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { auditLogs, bookings, bookingStatusHistory, laboratories, notifications, users } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

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
    const { laboratoryId, bookingDate, startTime, endTime, purpose, participantCount, notes } = body

    if (!laboratoryId || !bookingDate || !startTime || !endTime || !purpose) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

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
      .select({ id: laboratories.id, name: laboratories.name, capacity: laboratories.capacity, isActive: laboratories.isActive })
      .from(laboratories)
      .where(eq(laboratories.id, laboratoryId))
      .limit(1)

    if (!lab || !lab.isActive) {
      return NextResponse.json({ error: 'Laboratorium tidak ditemukan atau sedang tidak aktif.' }, { status: 404 })
    }

    if (participantCount !== null && participantCount !== undefined && Number(participantCount) > lab.capacity) {
      return NextResponse.json({ error: `Jumlah peserta melebihi kapasitas lab (${lab.capacity} orang).` }, { status: 400 })
    }

    // Conflict check — neon-http tidak support transaksi, gunakan sequential queries.
    // Race condition window sangat kecil karena booking baru masuk PENDING (bukan APPROVED),
    // dan hanya admin yang bisa APPROVE. Double-booking di PENDING tidak menyebabkan masalah
    // nyata karena admin akan menolak salah satunya saat review.
    const existingSlots = await db
      .select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime, status: bookings.status })
      .from(bookings)
      .where(
        and(
          eq(bookings.laboratoryId, laboratoryId),
          eq(bookings.bookingDate, bookingDate),
          inArray(bookings.status, ['APPROVED', 'BLOCKED'])
        )
      )

    const conflict = existingSlots.find(
      (s) => startTime < s.endTime && endTime > s.startTime
    )

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
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: 'BOOKING_CREATED',
      targetType: 'BOOKING',
      targetId: booking.id,
      reason: 'Pengajuan dibuat',
      metadata: { laboratoryId, bookingDate, startTime, endTime },
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
