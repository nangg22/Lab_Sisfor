import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/users/[id] — update role or isActive
export async function PATCH(request: Request, { params }: Params) {
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

  // Admin tidak bisa ubah dirinya sendiri via API ini (keamanan)
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Tidak dapat mengubah akun Anda sendiri' }, { status: 400 })
  }

  const body = await request.json()
  const { role, isActive } = body as { role?: string; isActive?: boolean }

  const validRoles = ['mahasiswa', 'dosen', 'admin']
  if (role !== undefined && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (role !== undefined) updateData.role = role
  if (isActive !== undefined) updateData.isActive = isActive

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({ id: users.id, role: users.role, isActive: users.isActive })

  if (!updated) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json(updated)
}

