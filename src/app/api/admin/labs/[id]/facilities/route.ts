import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratoryFacilities } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fix #6: role check — hanya admin yang boleh mengakses daftar fasilitas
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId } = await params
  const facilities = await db
    .select()
    .from(laboratoryFacilities)
    .where(eq(laboratoryFacilities.laboratoryId, laboratoryId))
    .orderBy(laboratoryFacilities.createdAt)

  return NextResponse.json({ facilities })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId } = await params
  const { facilityName, category, brandModel, quantity, condition, isBorrowable, details } = await request.json()

  if (!facilityName || !facilityName.trim()) {
    return NextResponse.json({ error: 'Nama inventaris/fasilitas wajib diisi.' }, { status: 400 })
  }

  const parsedQty = quantity !== null && quantity !== undefined && quantity !== '' ? parseInt(String(quantity), 10) : null
  if (parsedQty !== null && (isNaN(parsedQty) || parsedQty < 1)) {
    return NextResponse.json({ error: 'Jumlah unit harus minimal 1.' }, { status: 400 })
  }

  const [facility] = await db
    .insert(laboratoryFacilities)
    .values({
      laboratoryId,
      facilityName: facilityName.trim(),
      category: typeof category === 'string' && category.trim() ? category.trim() : 'Lainnya',
      brandModel: typeof brandModel === 'string' && brandModel.trim() ? brandModel.trim() : null,
      quantity: parsedQty,
      condition: typeof condition === 'string' && condition.trim() ? condition.trim() : 'Baik',
      isBorrowable: typeof isBorrowable === 'boolean' ? isBorrowable : true,
      details: typeof details === 'string' && details.trim() ? details.trim() : null,
    })
    .returning()

  return NextResponse.json({ success: true, facility }, { status: 201 })
}

