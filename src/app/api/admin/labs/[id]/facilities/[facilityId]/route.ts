import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratoryFacilities } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; facilityId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: laboratoryId, facilityId } = await params

  await db
    .delete(laboratoryFacilities)
    .where(
      and(
        eq(laboratoryFacilities.id, facilityId),
        eq(laboratoryFacilities.laboratoryId, laboratoryId)
      )
    )

  return NextResponse.json({ success: true })
}

