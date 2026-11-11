import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, bookingStatusHistory } from '@/db/schema'
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

  await db.update(bookings).set({ status: 'CANCELLED' }).where(and(eq(bookings.id, id), eq(bookings.status, 'PENDING')))
  await db.insert(bookingStatusHistory).values({ bookingId: id, oldStatus: 'PENDING', newStatus: 'CANCELLED', changedByUserId: session.user.id, reason: 'Dibatalkan oleh pemohon' })

  return NextResponse.json({ success: true })
}
