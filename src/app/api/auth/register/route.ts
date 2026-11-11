import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { fullName, institutionalId, email, password, role } = await request.json()

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      fullName: fullName.trim(),
      institutionalId: institutionalId?.trim() || null,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role === 'dosen' ? 'dosen' : 'mahasiswa',
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
