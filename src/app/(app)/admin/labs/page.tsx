import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, laboratoryFacilities } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { AdminLabsList } from './admin-labs-list'

export default async function AdminLabsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const labs = await db.select().from(laboratories).orderBy(laboratories.name)
  const allFacilities = await db.select().from(laboratoryFacilities)

  const labsWithCount = labs.map((lab) => ({
    ...lab,
    facilityCount: allFacilities.filter((f) => f.laboratoryId === lab.id).length,
  }))

  return <AdminLabsList labs={labsWithCount} />
}
