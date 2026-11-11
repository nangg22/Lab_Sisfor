import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, bookings } from '@/db/schema'
import { eq, desc, count, and } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ fullName: users.fullName, role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!currentUser) redirect('/auth/login')

  const isAdmin = currentUser.role === 'admin'

  // Labs aktif (untuk sidebar + admin stats)
  const activeLabs = await db
    .select({ id: laboratories.id, name: laboratories.name, location: laboratories.location, capacity: laboratories.capacity })
    .from(laboratories)
    .where(eq(laboratories.isActive, true))

  const labs = activeLabs.slice(0, 3)

  // Recent bookings
  const recentBookings = isAdmin
    ? await db
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
        })
        .from(bookings)
        .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .orderBy(desc(bookings.createdAt))
        .limit(5)
    : await db
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
        })
        .from(bookings)
        .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.userId, session.user.id))
        .orderBy(desc(bookings.createdAt))
        .limit(5)

  // Stats
  const allBookingsForStats = isAdmin
    ? await db.select({ status: bookings.status }).from(bookings)
    : await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.userId, session.user.id))

  const stats = {
    total: allBookingsForStats.length,
    pending: allBookingsForStats.filter((b) => b.status === 'PENDING').length,
    approved: allBookingsForStats.filter((b) => b.status === 'APPROVED').length,
    rejected: allBookingsForStats.filter((b) => b.status === 'REJECTED').length,
  }

  // Admin-only: Lab terpopuler + total pengguna terdaftar
  let topLabs: { labName: string | null; labId: string | null; total: number }[] = []
  let totalUsers = 0

  if (isAdmin) {
    const labBookingCounts = await db
      .select({
        labId: bookings.laboratoryId,
        labName: laboratories.name,
        total: count(),
      })
      .from(bookings)
      .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
      .where(eq(bookings.status, 'APPROVED'))
      .groupBy(bookings.laboratoryId, laboratories.name)
      .orderBy(desc(count()))
      .limit(5)

    topLabs = labBookingCounts.map((r) => ({
      labName: r.labName,
      labId: r.labId,
      total: r.total,
    }))

    const [userCountRow] = await db.select({ total: count() }).from(users)
    totalUsers = userCountRow?.total ?? 0
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {currentUser.fullName.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-gray-500">
          {isAdmin
            ? 'Pantau dan kelola pengajuan peminjaman laboratorium.'
            : 'Ajukan peminjaman laboratorium dengan mudah.'}
        </p>
      </div>

      {/* Statistik */}
      <div className={`grid grid-cols-2 gap-4 ${isAdmin ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-4'}`}>
        {[
          { label: isAdmin ? 'Total Pengajuan' : 'Pengajuan Saya', value: stats.total, color: 'text-blue-600 bg-blue-50' },
          { label: 'Menunggu', value: stats.pending, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Disetujui', value: stats.approved, color: 'text-green-600 bg-green-50' },
          { label: 'Ditolak', value: stats.rejected, color: 'text-red-600 bg-red-50' },
          ...(isAdmin
            ? [
                { label: 'Lab Aktif', value: activeLabs.length, color: 'text-cyan-600 bg-cyan-50' },
                { label: 'Pengguna', value: totalUsers, color: 'text-purple-600 bg-purple-50' },
              ]
            : []),
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color} rounded-lg px-2 py-0.5 inline-block`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pengajuan terbaru */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              {isAdmin ? 'Pengajuan Terbaru' : 'Pengajuan Saya Terbaru'}
            </h2>
            <Link href={isAdmin ? '/admin/bookings' : '/bookings'} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.length > 0 ? (
              recentBookings.map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{b.labName ?? '—'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(b.bookingDate)} · {formatTime(b.startTime)}–{formatTime(b.endTime)}
                    </p>
                    {isAdmin && <p className="text-xs text-gray-400 mt-0.5">oleh {b.userName ?? '—'}</p>}
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">Belum ada pengajuan.</div>
            )}
          </div>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-4">
          {/* Lab terpopuler (admin) atau Lab tersedia (user) */}
          {isAdmin && topLabs.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Lab Terpopuler</h2>
                <Link href="/admin/labs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Kelola →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {topLabs.map((lab, idx) => (
                  <div key={lab.labId ?? idx} className="flex items-center gap-3 px-6 py-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{lab.labName ?? '—'}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                      {lab.total}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Shortcut Lab */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Laboratorium</h2>
              <Link href="/labs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat semua →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {labs.length > 0 ? (
                labs.map((lab) => (
                  <Link key={lab.id} href={`/labs/${lab.id}`} className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                    <p className="font-medium text-gray-900">{lab.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{lab.location}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Kapasitas: {lab.capacity} orang</p>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-10 text-center text-gray-400 text-sm">Belum ada data laboratorium.</div>
              )}
            </div>
            {isAdmin ? (
              <div className="border-t border-gray-100 px-6 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/admin/labs/new" className="flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                    + Tambah Lab
                  </Link>
                  <Link href="/admin/users" className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Kelola Pengguna
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-100 px-6 py-4">
                <Link href="/labs" className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  + Ajukan Peminjaman
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
