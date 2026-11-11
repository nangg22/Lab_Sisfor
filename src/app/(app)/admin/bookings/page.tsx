import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { ExportCsvButton } from './export-csv-button'

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: filterStatus } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const allBookings = await db
    .select({
      id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime,
      endTime: bookings.endTime, purpose: bookings.purpose, status: bookings.status, createdAt: bookings.createdAt,
      labName: laboratories.name, userName: users.fullName, userRole: users.role,
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
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Pengajuan</h1>
          <p className="mt-1 text-gray-500">Proses permohonan peminjaman laboratorium.</p>
        </div>
        <ExportCsvButton bookings={filtered} currentFilter={filterStatus} />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link key={f.value} href={f.value === 'ALL' ? '/admin/bookings' : `/admin/bookings?status=${f.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${(f.value === 'ALL' && !filterStatus) || filterStatus === f.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
            {f.label}
            {f.value === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs">{pendingCount}</span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Pemohon', 'Laboratorium', 'Tanggal & Waktu', 'Tujuan', 'Status', 'Diajukan', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{b.userName ?? '—'}</p>
                      <p className="text-xs text-gray-400 capitalize">{b.userRole}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.labName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      <p>{formatDate(b.bookingDate)}</p>
                      <p className="text-xs text-gray-400">{formatTime(b.startTime)}–{formatTime(b.endTime)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs"><p className="line-clamp-2">{b.purpose}</p></td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(b.createdAt.toISOString())}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className={`text-sm font-medium ${b.status === 'PENDING' ? 'text-blue-600 hover:text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        {b.status === 'PENDING' ? 'Proses →' : 'Detail'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-gray-400">Tidak ada pengajuan{filterStatus && filterStatus !== 'ALL' ? ` dengan status ${filterStatus}` : ''}.</p>
        </div>
      )}
    </div>
  )
}
