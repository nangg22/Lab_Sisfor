import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratoryAssignments } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// GET — daftar aslab yang ditugaskan ke lab ini
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId } = await params

  const assignments = await db
    .select({
      id: laboratoryAssignments.id,
      userId: laboratoryAssignments.userId,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
    })
    .from(laboratoryAssignments)
    .leftJoin(users, eq(laboratoryAssignments.userId, users.id))
    .where(eq(laboratoryAssignments.laboratoryId, laboratoryId))

  return NextResponse.json({ assignments })
}

// POST — assign aslab baru ke lab
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId } = await params
  const { userId } = await request.json()

  if (!userId) return NextResponse.json({ error: 'userId wajib diisi.' }, { status: 400 })

  // Pastikan user yang di-assign adalah aslab
  const [targetUser] = await db
    .select({ id: users.id, role: users.role, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!targetUser) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
  if (targetUser.role !== 'aslab') return NextResponse.json({ error: 'Hanya aslab yang bisa ditugaskan ke lab.' }, { status: 400 })

  // Cek duplikat
  const [existing] = await db
    .select({ id: laboratoryAssignments.id })
    .from(laboratoryAssignments)
    .where(and(eq(laboratoryAssignments.userId, userId), eq(laboratoryAssignments.laboratoryId, laboratoryId)))
    .limit(1)

  if (existing) return NextResponse.json({ error: 'Aslab ini sudah ditugaskan ke lab.' }, { status: 409 })

  const [assignment] = await db
    .insert(laboratoryAssignments)
    .values({ userId, laboratoryId })
    .returning({ id: laboratoryAssignments.id })

  return NextResponse.json({ success: true, id: assignment.id }, { status: 201 })
}

// DELETE — hapus assignment
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId } = await params
  const { userId } = await request.json()

  await db
    .delete(laboratoryAssignments)
    .where(and(eq(laboratoryAssignments.userId, userId), eq(laboratoryAssignments.laboratoryId, laboratoryId)))

  return NextResponse.json({ success: true })
}
