import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { fullName, institutionalId, email, password, role } = await request.json()
    const normalizedEmail = String(email ?? '').toLowerCase().trim()
    const normalizedRole = role === 'dosen' ? 'dosen' : role === 'mahasiswa' ? 'mahasiswa' : null

    if (!fullName || !normalizedEmail || !password || !normalizedRole || !institutionalId?.trim()) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    if (!normalizedEmail.endsWith('@uisi.ac.id')) {
      return NextResponse.json({ error: 'Registrasi hanya diperbolehkan menggunakan email @uisi.ac.id.' }, { status: 400 })
    }

    if (!/^[A-Za-z0-9./-]{4,50}$/.test(institutionalId.trim())) {
      return NextResponse.json({ error: 'NIM/NIP tidak valid.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      fullName: fullName.trim(),
      institutionalId: institutionalId?.trim() || null,
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
      verificationStatus: 'PENDING',
      isActive: false,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
