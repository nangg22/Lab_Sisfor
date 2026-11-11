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

  const bookedSlots = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      purpose: bookings.purpose,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.laboratoryId, laboratoryId),
        eq(bookings.bookingDate, bookingDate)
      )
    )
    .orderBy(bookings.startTime)

  const activeSlots = bookedSlots.filter(
    (b) => b.status === 'APPROVED' || b.status === 'BLOCKED'
  )

  return NextResponse.json({ slots: activeSlots })
}

