import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { laboratories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { BookingForm } from './booking-form'

interface Props { searchParams: Promise<{ lab?: string }> }

export default async function NewBookingPage({ searchParams }: Props) {
  const { lab: labId } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const labs = await db
    .select({ id: laboratories.id, name: laboratories.name, location: laboratories.location, capacity: laboratories.capacity })
    .from(laboratories)
    .where(eq(laboratories.isActive, true))
    .orderBy(laboratories.name)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajukan Peminjaman</h1>
        <p className="mt-1 text-gray-500">Isi form di bawah untuk mengajukan peminjaman laboratorium.</p>
      </div>
      <BookingForm labs={labs} defaultLabId={labId} userId={session.user.id} />
    </div>
  )
}
