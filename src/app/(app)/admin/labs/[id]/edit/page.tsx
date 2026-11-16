import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import Link from 'next/link'
import { LabForm } from '../../lab-form'
import { LabFacilitiesEditor } from './lab-facilities-editor'
import {
  ArrowLeft,
  FlaskConical,
  Users,
  MapPin,
  Calendar,
  Layers,
  Activity,
} from 'lucide-react'

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

  // Stat: total bookings for this lab
  const [bookingCountRow] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.laboratoryId, id))

  const totalBookings = bookingCountRow?.count ?? 0

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/labs"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Manajemen Lab
        </Link>
      </div>

      {/* Page Title */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 border border-slate-200 shadow-sm text-slate-900 font-black text-lg">
          {lab.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{lab.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border border-slate-200 shadow-sm ${
              lab.isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${lab.isActive ? 'bg-slate-950' : 'bg-slate-500'}`} />
              {lab.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {lab.location}
          </p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="neo-card bg-white p-4 text-center">
          <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" strokeWidth={2} />
          <p className="text-2xl font-black text-slate-900">{lab.capacity}</p>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Kapasitas</p>
        </div>
        <div className="neo-card bg-white p-4 text-center">
          <Layers className="h-5 w-5 text-amber-600 mx-auto mb-1" strokeWidth={2} />
          <p className="text-2xl font-black text-slate-900">{facilities.length}</p>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Fasilitas</p>
        </div>
        <div className="neo-card bg-white p-4 text-center">
          <Calendar className="h-5 w-5 text-emerald-600 mx-auto mb-1" strokeWidth={2} />
          <p className="text-2xl font-black text-slate-900">{totalBookings}</p>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Total Booking</p>
        </div>
      </div>

      {/* Section: Edit Lab Info */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Pengaturan Ruangan</h2>
        </div>
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
      </div>

      {/* Section: Facilities Editor */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Kelola Fasilitas & Inventaris</h2>
        </div>
        <LabFacilitiesEditor laboratoryId={lab.id} initialFacilities={facilities} />
      </div>

      {/* Danger Zone */}
      <div className="neo-card bg-white border-rose-500 p-5" style={{ borderColor: '#f43f5e', boxShadow: '0 4px 10px rgba(244, 63, 94, 0.12)' }}>
        <h3 className="text-sm font-black text-rose-700 mb-1">Zona Berbahaya</h3>
        <p className="text-xs font-bold text-slate-600 mb-4">
          Tindakan di bawah bersifat permanen. Nonaktifkan lab terlebih dahulu sebelum menghapus untuk mencegah kehilangan data.
        </p>
        <div className="flex gap-3">
          <Link
            href="/admin/labs"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl border border-rose-600 text-rose-600 hover:bg-rose-50 transition-colors"
          >
          Hapus Ruangan Ini &rarr;
          </Link>
        </div>
        <p className="text-[11px] font-bold text-slate-400 mt-2">
          * Gunakan opsi &quot;Hapus Ruangan&quot; dari halaman Manajemen Lab (menu titik tiga pada kartu lab).
        </p>
      </div>
    </div>
  )
}
