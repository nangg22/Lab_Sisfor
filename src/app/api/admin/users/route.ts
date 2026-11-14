import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/admin/users — list all users
export async function GET() {
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

  const allUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      institutionalId: users.institutionalId,
      role: users.role,
      isActive: users.isActive,
      verificationStatus: users.verificationStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt)

  return NextResponse.json(allUsers)
}

