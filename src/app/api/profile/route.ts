import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, institutionalId } = await request.json()
  if (!fullName?.trim()) return NextResponse.json({ error: 'Nama tidak boleh kosong.' }, { status: 400 })

  await db.update(users)
    .set({ fullName: fullName.trim(), institutionalId: institutionalId?.trim() || null })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ success: true })
}
