import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { laboratoryFacilities } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: laboratoryId } = await params
  const facilities = await db
    .select({
      id: laboratoryFacilities.id,
      facilityName: laboratoryFacilities.facilityName,
      category: laboratoryFacilities.category,
      brandModel: laboratoryFacilities.brandModel,
      details: laboratoryFacilities.details,
      quantity: laboratoryFacilities.quantity,
      condition: laboratoryFacilities.condition,
      isBorrowable: laboratoryFacilities.isBorrowable,
    })
    .from(laboratoryFacilities)
    .where(eq(laboratoryFacilities.laboratoryId, laboratoryId))
    .orderBy(laboratoryFacilities.createdAt)

  return NextResponse.json({ facilities })
}
