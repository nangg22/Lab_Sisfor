import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, laboratoryFacilities } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { LabForm } from '../../lab-form'
import { LabFacilitiesEditor } from './lab-facilities-editor'

interface Props { params: Promise<{ id: string }> }

export default async function EditLabPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') redirect('/dashboard')

  const [lab] = await db.select().from(laboratories).where(eq(laboratories.id, id)).limit(1)
  if (!lab) notFound()

  const facilities = await db
    .select({
      id: laboratoryFacilities.id,
      facilityName: laboratoryFacilities.facilityName,
      quantity: laboratoryFacilities.quantity,
      details: laboratoryFacilities.details,
    })
    .from(laboratoryFacilities)
    .where(eq(laboratoryFacilities.laboratoryId, id))
    .orderBy(laboratoryFacilities.createdAt)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Laboratorium</h1>
      <LabForm
        mode="edit"
        lab={{
          id: lab.id,
          name: lab.name,
          location: lab.location,
          capacity: lab.capacity,
          description: lab.description,
          isActive: lab.isActive,
        }}
      />
      <LabFacilitiesEditor laboratoryId={lab.id} initialFacilities={facilities} />
    </div>
  )
}
