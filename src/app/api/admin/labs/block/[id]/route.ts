import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ id: string }>
}

// DELETE /api/admin/labs/block/[id] — Membuka kembali slot lab yang diblokir
export async function DELETE(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (currentUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const [booking] = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1)

  if (!booking || booking.status !== 'BLOCKED') {
    return NextResponse.json({ error: 'Data pemblokiran tidak ditemukan.' }, { status: 404 })
  }

  // Hapus atau batalkan pemblokiran
  await db.delete(bookings).where(eq(bookings.id, id))

  return NextResponse.json({ success: true, message: 'Pemblokiran berhasil dibuka kembali.' })
}

