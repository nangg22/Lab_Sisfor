import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

// Token berlaku 1 jam
const TOKEN_TTL_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 })
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, isActive: users.isActive })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1)

    // Jangan beri tahu apakah email terdaftar atau tidak (security)
    if (!user || !user.isActive) {
      return NextResponse.json({
        message: 'Jika email terdaftar, instruksi reset akan tersedia.',
      })
    }

    // Hapus token lama untuk user ini
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

    // Buat token baru
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    })

    const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${rawToken}`

    // Dalam produksi kirim via email (SMTP/Resend/Nodemailer).
    // Untuk development, kembalikan URL langsung agar bisa ditest.
    const isDev = process.env.NODE_ENV !== 'production'

    return NextResponse.json({
      message: 'Instruksi reset kata sandi telah disiapkan.',
      ...(isDev ? { resetUrl, note: 'resetUrl hanya tampil di development' } : {}),
    })
  } catch (err) {
    console.error('Password reset request error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
