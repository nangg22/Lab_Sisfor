import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Kata sandi saat ini dan baru wajib diisi.' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Kata sandi baru minimal 8 karakter.' }, { status: 400 })
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!match) {
    return NextResponse.json({ error: 'Kata sandi saat ini salah.' }, { status: 400 })
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, session.user.id))

  return NextResponse.json({ success: true })
}

