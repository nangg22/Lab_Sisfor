import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, laboratoryFacilities } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ToggleLabStatusButton } from './toggle-lab-status-button'
import { Plus, Pencil, FlaskConical, MapPin, Users as UsersIcon, Layers } from 'lucide-react'

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-slate-900">Kelola Laboratorium</h1>
          <p className="page-subtitle text-slate-600 font-medium">Manajemen data master laboratorium dan fasilitas.</p>
        </div>
        <Link
          href="/admin/labs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Tambah Lab Baru
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {labsWithCount.map((lab) => (
          <div
            key={lab.id}
            className={`glass-card rounded-2xl p-5 flex flex-col justify-between ${
              !lab.isActive ? 'opacity-70 bg-slate-50/70' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-sm">
                  {lab.name.charAt(0)}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    lab.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${lab.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {lab.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <h3 className="mt-4 font-bold text-slate-900 text-base">{lab.name}</h3>
              
              <div className="mt-2 space-y-1 text-xs text-slate-600 font-medium">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  {lab.location}
                </p>
                <p className="flex items-center gap-1.5">
                  <UsersIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  Kapasitas: {lab.capacity} orang
                </p>
                {lab.facilityCount > 0 && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Layers className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    {lab.facilityCount} fasilitas terdaftar
                  </p>
                )}
              </div>
            </div>

            {/* Affordance Tombol Aksi yang Jelas */}
            <div className="mt-5 pt-3.5 border-t border-slate-100/80 flex items-center gap-2.5">
              <Link
                href={`/admin/labs/${lab.id}/edit`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300 transition-all shadow-xs"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                Edit Lab
              </Link>
              <ToggleLabStatusButton labId={lab.id} initialActive={lab.isActive} />
            </div>
          </div>
        ))}
      </div>

      {labsWithCount.length === 0 && (
        <div className="glass-card rounded-2xl px-6 py-16 text-center">
          <FlaskConical className="h-10 w-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-600 font-medium mb-4">Belum ada laboratorium terdaftar.</p>
          <Link
            href="/admin/labs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/25"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Tambah laboratorium pertama
          </Link>
        </div>
      )}
    </div>
  )
}
