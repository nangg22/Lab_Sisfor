import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { ExportCsvButton } from './export-csv-button'
import { ClipboardList, ArrowRight, User } from 'lucide-react'

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: filterStatus } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const allBookings = await db
    .select({
      id: bookings.id,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      purpose: bookings.purpose,
      status: bookings.status,
      createdAt: bookings.createdAt,
      labName: laboratories.name,
      userName: users.fullName,
      userRole: users.role,
    })
    .from(bookings)
    .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(bookings.createdAt))

  const filtered = filterStatus && filterStatus !== 'ALL'
    ? allBookings.filter((b) => b.status === filterStatus)
    : allBookings

  const pendingCount = allBookings.filter((b) => b.status === 'PENDING').length

  const statusFilters = [
    { value: 'ALL', label: 'Semua' },
    { value: 'PENDING', label: 'Menunggu' },
    { value: 'APPROVED', label: 'Disetujui' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
    { value: 'BLOCKED', label: 'Diblokir / Maint.' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-slate-900">Kelola Pengajuan</h1>
          <p className="page-subtitle text-slate-600 font-medium">Proses dan pantau permohonan peminjaman laboratorium mahasiswa & dosen.</p>
        </div>
        <ExportCsvButton bookings={filtered} currentFilter={filterStatus} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const isActive = (f.value === 'ALL' && !filterStatus) || filterStatus === f.value
          return (
            <Link
              key={f.value}
              href={f.value === 'ALL' ? '/admin/bookings' : `/admin/bookings?status=${f.value}`}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white/80 border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              {f.label}
              {f.value === 'PENDING' && pendingCount > 0 && (
                <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Skalabilitas & Horizontal Scroll Tabel */}
      {filtered.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[800px] w-full divide-y divide-slate-100/80">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  {['Pemohon', 'Laboratorium', 'Tanggal & Waktu', 'Tujuan Kegiatan', 'Status', 'Diajukan', 'Aksi'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 text-sm">{b.userName ?? '—'}</p>
                      <p className="text-xs text-slate-600 font-medium capitalize">{b.userRole ?? 'User'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{b.labName ?? '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-800 whitespace-nowrap">
                      <p className="font-semibold">{formatDate(b.bookingDate)}</p>
                      <p className="text-xs text-slate-600 font-medium">{formatTime(b.startTime)}–{formatTime(b.endTime)} WIB</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{b.purpose}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium whitespace-nowrap">
                      {formatDateTime(b.createdAt.toISOString())}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          b.status === 'PENDING'
                            ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                            : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {b.status === 'PENDING' ? 'Proses' : 'Detail'}
                        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
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
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-600 font-medium">
            Tidak ada data pengajuan{filterStatus && filterStatus !== 'ALL' ? ` dengan status ${filterStatus}` : ''}.
          </p>
        </div>
      )}
    </div>
  )
}
