import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { auditLogs, users, bookings, bookingApprovalActions, bookingStatusHistory, laboratories, notifications, laboratoryAssignments } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { hasPermission } from '@/lib/permissions'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db.select({ role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!currentUser?.isActive || !hasPermission(currentUser.role, 'booking:approve')) {
    return NextResponse.json({ error: 'Anda tidak memiliki kewenangan memproses pengajuan.' }, { status: 403 })
  }

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
  if (currentUser.role === 'aslab') {
    const [assignment] = await db.select({ id: laboratoryAssignments.id }).from(laboratoryAssignments).where(and(eq(laboratoryAssignments.userId, session.user.id), eq(laboratoryAssignments.laboratoryId, booking.laboratoryId))).limit(1)
    if (!assignment) return NextResponse.json({ error: 'Anda tidak ditugaskan pada laboratorium ini.' }, { status: 403 })
  }
  if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Pengajuan sudah diproses.' }, { status: 400 })

  // Conflict check saat APPROVE
  if (decision === 'APPROVED') {
    const conflicts = await db
      .select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(
        and(
          eq(bookings.laboratoryId, booking.laboratoryId),
          eq(bookings.bookingDate, booking.bookingDate),
          eq(bookings.status, 'APPROVED')
        )
      )

    const hasConflict = conflicts.some(
      (c) => booking.startTime < c.endTime && booking.endTime > c.startTime && c.id !== id
    )
    if (hasConflict) {
      await db.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: 'BOOKING_APPROVAL_CONFLICT',
        targetType: 'BOOKING',
        targetId: id,
        reason: 'Persetujuan dihentikan karena jadwal telah bertabrakan dengan booking approved.',
        metadata: { laboratoryId: booking.laboratoryId, bookingDate: booking.bookingDate, startTime: booking.startTime, endTime: booking.endTime, source: 'precheck' },
      })
      return NextResponse.json(
        { error: 'Konflik jadwal: ada peminjaman lain yang sudah disetujui pada waktu tersebut.' },
        { status: 409 }
      )
    }
  }

  // Update status — WHERE status = 'PENDING' sebagai atomic guard
  // Jika dua admin approve bersamaan, hanya satu yang akan berhasil update.
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(bookings)
        .set({ status: decision, updatedAt: new Date() })
        .where(and(eq(bookings.id, id), eq(bookings.status, 'PENDING')))
        .returning({ id: bookings.id })

      if (updated.length === 0) {
        const staleError = new Error('Pengajuan sudah diproses oleh admin lain.')
        ;(staleError as Error & { code?: string }).code = 'STALE_BOOKING'
        throw staleError
      }

      await tx.insert(bookingApprovalActions).values({
        bookingId: id,
        approverUserId: session.user.id,
        decision,
        reason: reason?.trim() || null,
      })
      await tx.insert(bookingStatusHistory).values({
        bookingId: id,
        oldStatus: 'PENDING',
        newStatus: decision,
        changedByUserId: session.user.id,
        reason: reason?.trim() || null,
      })
      await tx.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: decision === 'APPROVED' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
        targetType: 'BOOKING',
        targetId: id,
        reason: reason?.trim() || null,
        metadata: { laboratoryId: booking.laboratoryId, bookingDate: booking.bookingDate, startTime: booking.startTime, endTime: booking.endTime },
      })

      const [lab] = await tx
        .select({ name: laboratories.name })
        .from(laboratories)
        .where(eq(laboratories.id, booking.laboratoryId))
        .limit(1)

      const labName = lab?.name || 'Laboratorium'
      const isApproved = decision === 'APPROVED'
      await tx.insert(notifications).values({
        userId: booking.userId,
        title: isApproved ? 'Pengajuan Peminjaman Disetujui' : 'Pengajuan Peminjaman Ditolak',
        message: isApproved
          ? `Pengajuan Anda untuk ${labName} pada tanggal ${booking.bookingDate} telah disetujui. Silakan cetak bukti untuk mengambil kunci.`
          : `Pengajuan Anda untuk ${labName} pada tanggal ${booking.bookingDate} ditolak. Alasan: ${reason || 'Tidak ada alasan khusus.'}`,
        type: decision,
        link: `/bookings/${booking.id}`,
        isRead: false,
      })
    })
  } catch (error) {
    // PostgreSQL exclusion constraint is the final race-safe conflict guard.
    if (decision === 'APPROVED' && (error as { code?: string }).code === '23P01') {
      await db.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: 'BOOKING_APPROVAL_CONFLICT',
        targetType: 'BOOKING',
        targetId: id,
        reason: 'Persetujuan ditolak karena jadwal bertabrakan dengan booking lain.',
        metadata: { laboratoryId: booking.laboratoryId, bookingDate: booking.bookingDate, startTime: booking.startTime, endTime: booking.endTime },
      })
      return NextResponse.json(
        { error: 'Konflik jadwal: booking lain telah disetujui untuk waktu tersebut.' },
        { status: 409 }
      )
    }
    if ((error as { code?: string }).code === 'STALE_BOOKING') {
      await db.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: 'BOOKING_DECISION_STALE',
        targetType: 'BOOKING',
        targetId: id,
        reason: 'Keputusan tidak diterapkan karena booking sudah diproses oleh actor lain.',
        metadata: { requestedDecision: decision, previousStatus: 'PENDING' },
      })
      return NextResponse.json({ error: 'Pengajuan sudah diproses oleh admin lain.' }, { status: 409 })
    }
    throw error
  }

  return NextResponse.json({ success: true })
}
