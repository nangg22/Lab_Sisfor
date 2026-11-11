import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import { Plus, ClipboardList, FlaskConical, Clock, ArrowRight } from 'lucide-react'

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const myBookings = await db
    .select({
      id: bookings.id,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      purpose: bookings.purpose,
      participantCount: bookings.participantCount,
      status: bookings.status,
      createdAt: bookings.createdAt,
      labName: laboratories.name,
      labLocation: laboratories.location,
    })
    .from(bookings)
    .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
    .where(eq(bookings.userId, session.user.id))
    .orderBy(desc(bookings.createdAt))

  const filtered =
    filterStatus && filterStatus !== 'ALL'
      ? myBookings.filter((b) => b.status === filterStatus)
      : myBookings

  const pendingCount = myBookings.filter((b) => b.status === 'PENDING').length

  const statusFilters = [
    { value: 'ALL', label: 'Semua' },
    { value: 'PENDING', label: 'Menunggu' },
    { value: 'APPROVED', label: 'Disetujui' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Pengajuan Saya</h1>
          <p className="page-subtitle">Riwayat semua pengajuan peminjaman Anda.</p>
        </div>
        <Link
          href="/bookings/new"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Ajukan Baru</span>
          <span className="sm:hidden">Baru</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const isActive = (f.value === 'ALL' && !filterStatus) || filterStatus === f.value
          return (
            <Link
              key={f.value}
              href={f.value === 'ALL' ? '/bookings' : `/bookings?status=${f.value}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-white/70 border border-white/80 text-slate-600 hover:bg-white hover:text-slate-900 backdrop-blur-sm'
              }`}
            >
              {f.label}
              {f.value === 'PENDING' && pendingCount > 0 && (
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Content */}
      {filtered.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100/70">
                  {['Laboratorium', 'Tanggal', 'Waktu', 'Tujuan', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <FlaskConical className="h-4 w-4 text-blue-500" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm leading-tight">{b.labName ?? '—'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{b.labLocation ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2} />
                        {formatTime(b.startTime)}–{formatTime(b.endTime)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-[200px] truncate">{b.purpose}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Detail
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl px-6 py-16 text-center">
          <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-500 text-sm mb-4">Belum ada pengajuan.</p>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Ajukan Peminjaman Pertama
          </Link>
        </div>
      )}
    </div>
  )
}
