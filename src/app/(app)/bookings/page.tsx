import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'

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

  const filtered = filterStatus && filterStatus !== 'ALL'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengajuan Saya</h1>
          <p className="mt-1 text-gray-500">Riwayat semua pengajuan peminjaman Anda.</p>
        </div>
        <Link href="/bookings/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + Ajukan Baru
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'ALL' ? '/bookings' : `/bookings?status=${f.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              (f.value === 'ALL' && !filterStatus) || filterStatus === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.label}
            {f.value === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs">
                {pendingCount}
              </span>
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
                  {['Laboratorium', 'Tanggal', 'Waktu', 'Tujuan', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{b.labName ?? '—'}</p>
                      <p className="text-xs text-gray-400">{b.labLocation ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatTime(b.startTime)}–{formatTime(b.endTime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{b.purpose}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${b.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Detail</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-gray-400 mb-4">Belum ada pengajuan.</p>
          <Link href="/bookings/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Ajukan Peminjaman Pertama
          </Link>
        </div>
      )}
    </div>
  )
}
