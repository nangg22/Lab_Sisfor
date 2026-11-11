import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, laboratoryFacilities } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ToggleLabStatusButton } from './toggle-lab-status-button'

export default async function AdminLabsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const labs = await db.select().from(laboratories).orderBy(laboratories.name)
  const allFacilities = await db.select().from(laboratoryFacilities)

  const labsWithCount = labs.map((lab) => ({
    ...lab,
    facilityCount: allFacilities.filter((f) => f.laboratoryId === lab.id).length,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Laboratorium</h1>
          <p className="mt-1 text-gray-500">Manajemen data master laboratorium.</p>
        </div>
        <Link href="/admin/labs/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Tambah Lab
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {labsWithCount.map((lab) => (
          <div key={lab.id} className={`rounded-xl border bg-white p-5 shadow-sm ${!lab.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">{lab.name.charAt(0)}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lab.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {lab.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">{lab.name}</h3>
            <p className="text-sm text-gray-500">{lab.location}</p>
            <p className="text-sm text-gray-500">Kapasitas: {lab.capacity} orang</p>
            {lab.facilityCount > 0 && <p className="text-xs text-gray-400 mt-1">{lab.facilityCount} fasilitas</p>}
            <div className="mt-4 flex items-center gap-2">
              <Link href={`/admin/labs/${lab.id}/edit`} className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Edit
              </Link>
              <ToggleLabStatusButton labId={lab.id} initialActive={lab.isActive} />
            </div>
          </div>
        ))}
      </div>

      {labsWithCount.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-gray-400 mb-4">Belum ada laboratorium.</p>
          <Link href="/admin/labs/new" className="text-blue-600 font-medium hover:underline">Tambah laboratorium pertama</Link>
        </div>
      )}
    </div>
  )
}
