import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import { Plus, ClipboardList, FlaskConical, Clock, ArrowRight } from 'lucide-react'

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: filterStatus } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const myBookings = await db
    .select({ id: bookings.id, bookingType: bookings.bookingType, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, participantCount: bookings.participantCount, status: bookings.status, createdAt: bookings.createdAt, labName: laboratories.name, labLocation: laboratories.location })
    .from(bookings).leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id)).where(eq(bookings.userId, session.user.id)).orderBy(desc(bookings.createdAt))

  const filtered = filterStatus && filterStatus !== 'ALL' ? myBookings.filter((b) => b.status === filterStatus) : myBookings
  const pendingCount = myBookings.filter((b) => b.status === 'PENDING').length

  const statusFilters = [
    { value: 'ALL', label: 'Semua' },
    { value: 'PENDING', label: 'Menunggu' },
    { value: 'APPROVED', label: 'Disetujui' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Pengajuan Saya</h1>
          <p className="text-sm font-bold text-slate-500 mt-0.5">Riwayat semua pengajuan peminjaman Anda.</p>
        </div>
        <Link href="/bookings/new" className="neo-btn neo-btn-primary px-4 py-2.5 text-xs font-black">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span>Ajukan Baru</span>
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const isActive = (f.value === 'ALL' && !filterStatus) || filterStatus === f.value
          return (
            <Link
              key={f.value}
              href={f.value === 'ALL' ? '/bookings' : `/bookings?status=${f.value}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black border transition-all ${
                isActive
                  ? 'bg-amber-300 border-slate-200 text-slate-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-200'
              }`}
            >
              {f.label}
              {f.value === 'PENDING' && pendingCount > 0 && (
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black leading-none border ${isActive ? 'bg-slate-900 text-white border-slate-200' : 'bg-rose-500 text-white border-rose-700'}`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Mobile card list */}
      {filtered.length > 0 ? (
        <>
          <div className="block sm:hidden space-y-3">
            {filtered.map((b) => (
              <Link key={b.id} href={`/bookings/${b.id}`} className="neo-card block p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 border border-slate-200 shadow-sm">
                      <FlaskConical className="h-4 w-4 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-black text-slate-900 truncate">{b.labName ?? '—'}</span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-[11px] font-bold text-slate-500 ml-10">{b.labLocation ?? '—'}</p>
                <div className="mt-2 ml-10 flex items-center gap-3 text-[11px] font-bold text-slate-600">
                  <span>{formatDate(b.bookingDate)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                </div>
                <p className="mt-1 ml-10 text-[11px] text-slate-500 truncate">{b.purpose}</p>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block neo-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-amber-100 border-b border-slate-200 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="px-4 py-3">Laboratorium</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Tujuan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 border border-slate-200">
                            <FlaskConical className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-black text-slate-900">{b.labName ?? '—'}</p>
                              {b.bookingType === 'EQUIPMENT' && (
                                <span className="rounded-full bg-blue-100 border border-blue-300 px-1.5 py-0.5 text-[9px] font-black text-blue-800">
                                  Alat Khusus
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">{b.labLocation ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <Clock className="h-3 w-3 text-slate-400" />{formatTime(b.startTime)}–{formatTime(b.endTime)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[180px] truncate">{b.purpose}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3.5">
                        <Link href={`/bookings/${b.id}`} className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700">
                          Detail<ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="neo-card px-6 py-14 text-center">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-bold text-slate-500 mb-4">Belum ada pengajuan.</p>
          <Link href="/bookings/new" className="neo-btn neo-btn-primary px-5 py-2.5 text-xs font-black inline-flex">
            <Plus className="h-4 w-4" strokeWidth={2.5} />Ajukan Peminjaman Pertama
          </Link>
        </div>
      )}
    </div>
  )
}
