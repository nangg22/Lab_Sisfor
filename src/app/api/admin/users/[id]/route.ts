import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, auditLogs } from '@/db/schema'
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
  const { fullName, role, isActive, verificationStatus, reason } = body as { fullName?: string; role?: string; isActive?: boolean; verificationStatus?: string; reason?: string }

  if (fullName !== undefined && (fullName.trim().length < 2 || fullName.trim().length > 150)) {
    return NextResponse.json({ error: 'Nama harus memiliki 2 sampai 150 karakter' }, { status: 400 })
  }

  const validRoles = ['mahasiswa', 'dosen', 'aslab', 'kaprodi', 'pembina_lab', 'admin']
  if (role !== undefined && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
  }
  if (verificationStatus !== undefined && !['PENDING', 'ACTIVE', 'REJECTED'].includes(verificationStatus)) {
    return NextResponse.json({ error: 'Status verifikasi tidak valid' }, { status: 400 })
  }
  if (verificationStatus === 'REJECTED' && !reason?.trim()) {
    return NextResponse.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (fullName !== undefined) updateData.fullName = fullName.trim()
  if (role !== undefined) updateData.role = role
  if (isActive !== undefined) {
    updateData.isActive = isActive
    // Mengaktifkan akun pending sekaligus menyelesaikan verifikasi akun.
    if (isActive) updateData.verificationStatus = 'ACTIVE'
  }
  if (verificationStatus !== undefined) {
    updateData.verificationStatus = verificationStatus
    if (verificationStatus === 'ACTIVE') updateData.isActive = true
    if (verificationStatus === 'REJECTED') updateData.isActive = false
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({ id: users.id, fullName: users.fullName, role: users.role, isActive: users.isActive, verificationStatus: users.verificationStatus })

  if (!updated) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  await db.insert(auditLogs).values({
    actorUserId: session.user.id,
    action: verificationStatus === 'ACTIVE' ? 'USER_VERIFIED' : verificationStatus === 'REJECTED' ? 'USER_VERIFICATION_REJECTED' : fullName !== undefined ? 'USER_PROFILE_UPDATED' : role !== undefined ? 'USER_ROLE_CHANGED' : 'USER_STATUS_CHANGED',
    targetType: 'USER',
    targetId: id,
    reason: reason?.trim() || null,
    metadata: { fullName, role, isActive, verificationStatus },
  })

  return NextResponse.json(updated)
}

