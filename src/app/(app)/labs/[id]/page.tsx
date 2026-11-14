import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { formatDate, formatTime } from '@/lib/utils'
import { MapPin, Users, Package, CalendarDays, ChevronRight, Plus } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function LabDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [lab] = await db.select().from(laboratories).where(eq(laboratories.id, id)).limit(1)
  if (!lab) notFound()

  const facilities = await db.select().from(laboratoryFacilities).where(eq(laboratoryFacilities.laboratoryId, id))

  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const approvedBookings = await db
    .select({ id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose })
    .from(bookings)
    .where(and(eq(bookings.laboratoryId, id), eq(bookings.status, 'APPROVED'), gte(bookings.bookingDate, firstDay), lte(bookings.bookingDate, lastDay)))
    .orderBy(bookings.bookingDate)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 flex-wrap">
        <Link href="/labs" className="hover:text-blue-600 transition-colors">Laboratorium</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2.5} />
        <span className="text-slate-900 font-black">{lab.name}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Lab header card */}
          <div className="neo-card overflow-hidden">
            <div
              aria-hidden="true"
              style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }}
            />
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-300 border border-slate-200 text-slate-950 font-black text-2xl shadow-sm">
                {lab.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-slate-900">{lab.name}</h1>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{lab.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{lab.capacity} orang</span>
                </div>
                {lab.description && <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">{lab.description}</p>}
              </div>
            </div>
          </div>

          {/* Facilities */}
          {facilities.length > 0 && (
            <div className="neo-card overflow-hidden">
              <div className="bg-amber-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-700" strokeWidth={2} />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Fasilitas</h2>
              </div>
              <div className="p-4 grid gap-2.5 sm:grid-cols-2">
                {facilities.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300 border border-slate-200" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900">
                        {f.facilityName}
                        {f.quantity && <span className="ml-1 text-slate-500 font-bold">({f.quantity} unit)</span>}
                      </p>
                      {f.details && <p className="text-[11px] font-bold text-slate-500 mt-0.5">{f.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule this month */}
          <div className="neo-card overflow-hidden">
            <div className="bg-amber-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-700" strokeWidth={2} />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Jadwal Terisi — {today.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="p-4">
              {approvedBookings.length > 0 ? (
                <div className="space-y-2">
                  {approvedBookings.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-amber-50 px-4 py-2.5 shadow-sm">
                      <div>
                        <span className="text-xs font-black text-slate-900">{formatDate(b.bookingDate)}</span>
                        <span className="ml-2 text-xs font-bold text-slate-600">{formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 truncate max-w-[180px]">{b.purpose}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-400 text-center py-6">Tidak ada jadwal yang terisi bulan ini. Lab tersedia!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="neo-card overflow-hidden">
            <div className="bg-amber-100 border-b border-slate-200 px-4 py-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Ingin Meminjam?</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600">Ajukan peminjaman lab ini. Status akan diperbarui setelah Admin memproses permohonan.</p>
              <Link href={`/bookings/new?lab=${lab.id}`} className="neo-btn neo-btn-primary w-full py-2.5 text-xs font-black justify-center">
                <Plus className="h-4 w-4" strokeWidth={2.5} />Ajukan Peminjaman
              </Link>
            </div>
          </div>

          <div className="neo-card p-4 space-y-2">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Informasi</p>
            <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
              <p className="flex items-start gap-1.5"><span className="text-amber-500 font-black mt-0.5 shrink-0">●</span>Pengajuan diproses oleh Admin / Asisten Lab.</p>
              <p className="flex items-start gap-1.5"><span className="text-amber-500 font-black mt-0.5 shrink-0">●</span>Periksa jadwal sebelum mengajukan untuk menghindari bentrok.</p>
              <p className="flex items-start gap-1.5"><span className="text-amber-500 font-black mt-0.5 shrink-0">●</span>Persetujuan digital tidak berarti kunci telah diserahkan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
