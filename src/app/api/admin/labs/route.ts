import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, location, capacity, description, isActive } = await request.json()
  if (!name || !location || !capacity) return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })

  await db.insert(laboratories).values({ name, location, capacity, description: description ?? null, isActive: isActive ?? true })
  return NextResponse.json({ success: true }, { status: 201 })
}
