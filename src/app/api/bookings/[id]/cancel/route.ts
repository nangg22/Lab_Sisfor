import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { auditLogs, bookings, bookingStatusHistory } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [booking] = await db.select({ id: bookings.id, userId: bookings.userId, status: bookings.status })
    .from(bookings).where(eq(bookings.id, id)).limit(1)

  if (!booking) return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 })
  if (booking.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Hanya pengajuan Pending yang dapat dibatalkan.' }, { status: 400 })

  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(bookings)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(and(eq(bookings.id, id), eq(bookings.status, 'PENDING')))
        .returning({ id: bookings.id })

      if (updated.length === 0) {
        const staleError = new Error('Pengajuan sudah diproses oleh pihak lain.')
        ;(staleError as Error & { code?: string }).code = 'STALE_CANCELLATION'
        throw staleError
      }

      await tx.insert(bookingStatusHistory).values({
        bookingId: id,
        oldStatus: 'PENDING',
        newStatus: 'CANCELLED',
        changedByUserId: session.user.id,
        reason: 'Dibatalkan oleh pemohon',
      })
      await tx.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: 'BOOKING_CANCELLED',
        targetType: 'BOOKING',
        targetId: id,
        reason: 'Dibatalkan oleh pemohon',
      })
    })
  } catch (error) {
    if ((error as { code?: string }).code === 'STALE_CANCELLATION') {
      await db.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: 'BOOKING_CANCELLATION_STALE',
        targetType: 'BOOKING',
        targetId: id,
        reason: 'Pembatalan tidak diterapkan karena booking sudah diproses oleh actor lain.',
        metadata: { previousStatus: 'PENDING' },
      })
      return NextResponse.json({ error: 'Pengajuan sudah diproses oleh pihak lain.' }, { status: 409 })
    }
    throw error
  }

  return NextResponse.json({ success: true })
}
