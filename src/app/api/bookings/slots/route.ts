import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const laboratoryId = searchParams.get('laboratoryId')
  const bookingDate = searchParams.get('bookingDate')

  if (!laboratoryId || !bookingDate) {
    return NextResponse.json({ slots: [] })
  }

  const approvedSlots = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      purpose: bookings.purpose,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.laboratoryId, laboratoryId),
        eq(bookings.bookingDate, bookingDate),
        eq(bookings.status, 'APPROVED')
      )
    )
    .orderBy(bookings.startTime)

  return NextResponse.json({ slots: approvedSlots })
}

