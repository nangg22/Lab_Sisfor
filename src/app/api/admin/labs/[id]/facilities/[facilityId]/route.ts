import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratoryFacilities } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return null
  return session
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; facilityId: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId, facilityId } = await params
  const { facilityName, category, brandModel, quantity, condition, isBorrowable, details } = await request.json()

  if (!facilityName?.trim()) {
    return NextResponse.json({ error: 'Nama inventaris/fasilitas wajib diisi.' }, { status: 400 })
  }

  const parsedQty = quantity !== null && quantity !== undefined && quantity !== '' ? parseInt(String(quantity), 10) : null
  if (parsedQty !== null && (isNaN(parsedQty) || parsedQty < 1)) {
    return NextResponse.json({ error: 'Jumlah unit harus minimal 1.' }, { status: 400 })
  }

  const [updated] = await db
    .update(laboratoryFacilities)
    .set({
      facilityName: facilityName.trim(),
      category: typeof category === 'string' && category.trim() ? category.trim() : 'Lainnya',
      brandModel: typeof brandModel === 'string' && brandModel.trim() ? brandModel.trim() : null,
      quantity: parsedQty,
      condition: typeof condition === 'string' && condition.trim() ? condition.trim() : 'Baik',
      isBorrowable: typeof isBorrowable === 'boolean' ? isBorrowable : true,
      details: typeof details === 'string' && details.trim() ? details.trim() : null,
    })
    .where(
      and(
        eq(laboratoryFacilities.id, facilityId),
        eq(laboratoryFacilities.laboratoryId, laboratoryId)
      )
    )
    .returning()

  if (!updated) return NextResponse.json({ error: 'Fasilitas tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ success: true, facility: updated })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; facilityId: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId, facilityId } = await params

  await db
    .delete(laboratoryFacilities)
    .where(
      and(
        eq(laboratoryFacilities.id, facilityId),
        eq(laboratoryFacilities.laboratoryId, laboratoryId)
      )
    )

  return NextResponse.json({ success: true })
}
