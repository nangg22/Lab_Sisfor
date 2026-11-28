import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email'

// Token berlaku 1 jam
const TOKEN_TTL_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const [user] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, isActive: users.isActive })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    // Jangan beri tahu apakah email terdaftar atau tidak (mencegah user enumeration)
    if (!user || !user.isActive) {
      return NextResponse.json({
        message: 'Jika email terdaftar, instruksi reset telah dikirim.',
      })
    }

    // Hapus token lama untuk user ini
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

    // Buat token baru
    const rawToken  = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    })

    const appUrl   = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`
    const isDev    = process.env.NODE_ENV !== 'production'

    if (isEmailConfigured()) {
      // Production: kirim via Resend
      await sendPasswordResetEmail(user.email, user.fullName, resetUrl)
      return NextResponse.json({
        message: 'Instruksi reset telah dikirim ke email kamu.',
      })
    } else {
      // Development / belum konfigurasi email: kembalikan URL langsung
      console.info(`[DEV] Password reset URL for ${user.email}: ${resetUrl}`)
      return NextResponse.json({
        message: 'Instruksi reset telah disiapkan.',
        ...(isDev ? { resetUrl, note: 'resetUrl hanya tampil di development (RESEND_API_KEY belum diset)' } : {}),
      })
    }
  } catch (err) {
    console.error('Password reset request error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
