import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token tidak valid.' }, { status: 400 })
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Kata sandi baru minimal 8 karakter.' }, { status: 400 })
    }

    // Hash token dari request untuk dibandingkan dengan DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1)

    if (!record) {
      return NextResponse.json({ error: 'Token tidak valid atau sudah digunakan.' }, { status: 400 })
    }

    if (new Date() > record.expiresAt) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id))
      return NextResponse.json({ error: 'Token sudah kedaluwarsa. Silakan minta reset ulang.' }, { status: 400 })
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId))

    // Hapus token setelah dipakai — single-use
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id))

    return NextResponse.json({ message: 'Kata sandi berhasil diubah. Silakan login.' })
  } catch (err) {
    console.error('Password reset error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
