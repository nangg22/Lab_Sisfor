import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, location, capacity, description, isActive } = await request.json()

  await db.update(laboratories).set({ name, location, capacity, description: description ?? null, isActive }).where(eq(laboratories.id, id))
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { isActive } = await request.json()

  await db.update(laboratories).set({ isActive }).where(eq(laboratories.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  try {
    // 1. Hapus fasilitas terkait lab
    await db.delete(laboratoryFacilities).where(eq(laboratoryFacilities.laboratoryId, id))

    // 2. Hapus bookings terkait lab (jika ada)
    await db.delete(bookings).where(eq(bookings.laboratoryId, id))

    // 3. Hapus data laboratorium
    await db.delete(laboratories).where(eq(laboratories.id, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete lab error:', err)
    return NextResponse.json({ error: 'Gagal menghapus laboratorium.' }, { status: 500 })
  }
}
