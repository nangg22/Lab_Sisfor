import { NextResponse } from 'next/server'
import { db } from '@/db'
import { emailVerificationTokens, users } from '@/db/schema'
import { eq, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { createEmailVerificationToken } from '@/lib/email-verification'
import { isEmailConfigured, sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { fullName, institutionalId, email, password, role } = await request.json()
    const normalizedEmail = String(email ?? '').toLowerCase().trim()
    const normalizedInstId = String(institutionalId ?? '').trim()
    const normalizedRole = role === 'dosen' ? 'dosen' : role === 'mahasiswa' ? 'mahasiswa' : null

    if (!fullName?.trim() || !normalizedEmail || !password || !normalizedRole || !normalizedInstId) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    // Validasi domain email khusus sivitas akademika UISI
    if (normalizedRole === 'mahasiswa' && !normalizedEmail.endsWith('@student.uisi.ac.id')) {
      return NextResponse.json(
        { error: 'Mahasiswa wajib menggunakan email resmi @student.uisi.ac.id.' },
        { status: 400 }
      )
    }

    if (
      normalizedRole === 'dosen' &&
      (!normalizedEmail.endsWith('@uisi.ac.id') || normalizedEmail.endsWith('@student.uisi.ac.id'))
    ) {
      return NextResponse.json(
        { error: 'Dosen wajib menggunakan email resmi @uisi.ac.id (bukan @student.uisi.ac.id).' },
        { status: 400 }
      )
    }

    if (!/^[A-Za-z0-9./-]{4,50}$/.test(normalizedInstId)) {
      return NextResponse.json({ error: 'NIM/NIP tidak valid.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })
    }

    const existing = await db
      .select({ id: users.id, email: users.email, institutionalId: users.institutionalId })
      .from(users)
      .where(or(eq(users.email, normalizedEmail), eq(users.institutionalId, normalizedInstId)))
      .limit(1)

    if (existing.length > 0) {
      if (existing[0].email === normalizedEmail) {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'NIM/NIP sudah terdaftar pada akun lain.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const { rawToken, tokenHash, expiresAt } = createEmailVerificationToken()

    await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(users).values({
        fullName: fullName.trim(),
        institutionalId: normalizedInstId,
        email: normalizedEmail,
        passwordHash,
        role: normalizedRole,
        verificationStatus: 'PENDING',
        isActive: false,
      }).returning({ id: users.id })

      await tx.insert(emailVerificationTokens).values({
        userId: newUser.id,
        tokenHash,
        expiresAt,
      })
    })

    const verificationUrl = `/auth/verify-email?token=${rawToken}`

    if (isEmailConfigured()) {
      const origin = new URL(request.url).origin
      try {
        await sendVerificationEmail(normalizedEmail, fullName.trim(), `${origin}${verificationUrl}`)
      } catch (mailErr) {
        console.error('Send verification email failed:', mailErr)
      }
    }

    return NextResponse.json({
      success: true,
      verificationRequired: true,
      ...(process.env.NODE_ENV !== 'production' ? { verificationUrl } : {}),
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
