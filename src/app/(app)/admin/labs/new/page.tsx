import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { LabForm } from '../lab-form'

export default async function NewLabPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Laboratorium</h1>
      <LabForm mode="create" />
    </div>
  )
}
