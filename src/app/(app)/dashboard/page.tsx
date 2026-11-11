import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, bookings } from '@/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import {
  ArrowRight,
  Plus,
  ArrowUpRight,
  Building2,
  Users as UsersIcon,
  ClipboardList,
} from 'lucide-react'

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

  // Total active labs
  const activeLabs = await db
    .select({
      id: laboratories.id,
      name: laboratories.name,
      location: laboratories.location,
      capacity: laboratories.capacity,
    })
    .from(laboratories)
    .where(eq(laboratories.isActive, true))

  const labsPreview = activeLabs.slice(0, 4)

  // Total registered users
  const [userCountRow] = await db.select({ total: count() }).from(users)
  const totalUsersCount = userCountRow?.total ?? 0

  // Recent bookings query
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
        .limit(6)
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
        .limit(6)

  // All bookings for statistics calculation
  const allBookingsForStats = isAdmin
    ? await db.select({ status: bookings.status }).from(bookings)
    : await db
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.userId, session.user.id))

  const totalBookings = allBookingsForStats.length
  const pendingCount = allBookingsForStats.filter((b) => b.status === 'PENDING').length
  const approvedCount = allBookingsForStats.filter((b) => b.status === 'APPROVED').length
  const rejectedCount = allBookingsForStats.filter((b) => b.status === 'REJECTED').length
  const cancelledCount = allBookingsForStats.filter((b) => b.status === 'CANCELLED').length
  const blockedCount = allBookingsForStats.filter((b) => b.status === 'BLOCKED').length

  // Calculate percentage shares for progress bar (safe against divide-by-zero)
  const calcPercent = (val: number) =>
    totalBookings > 0 ? ((val / totalBookings) * 100).toFixed(1) : '0'

  const pApproved = calcPercent(approvedCount)
  const pPending = calcPercent(pendingCount)
  const pBlocked = calcPercent(blockedCount)
  const pCancelled = calcPercent(cancelledCount)
  const pRejected = calcPercent(rejectedCount)

  const firstName = currentUser.fullName.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Ringkasan Sistem
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selamat datang kembali, {firstName}. Pantau performa penggunaan laboratorium.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            Lihat Jadwal Ruang
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/labs/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Tambah Lab Baru
            </Link>
          ) : (
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Ajukan Peminjaman
            </Link>
          )}
        </div>
      </div>

      {/* ── Section 3: Clean Metrics Row & Breakdown Bar ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">
            {isAdmin ? 'Total Pengajuan Masuk' : 'Total Pengajuan Saya'}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {totalBookings}
            </span>
            <span className="text-xs font-medium text-slate-500">permohonan</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            {pendingCount} menunggu evaluasi
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Laboratorium Aktif</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {activeLabs.length}
            </span>
            <span className="text-xs font-medium text-slate-500">ruangan</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">Siap digunakan operasional</div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">
            {isAdmin ? 'Total Pengguna' : 'Slot Terjadwal'}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {isAdmin ? totalUsersCount : approvedCount}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {isAdmin ? 'civitas terdaftar' : 'berhasil disetujui'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            {isAdmin ? 'Mahasiswa, Dosen & Asisten' : 'Jadwal lab aktif Anda'}
          </div>
        </div>

        {/* Breakdown Widget Card: Single Horizontal Segmented Progress Bar */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Breakdown Status</p>
            <span className="text-[11px] font-semibold text-slate-700">
              {totalBookings} Total
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
            {approvedCount > 0 && (
              <div
                style={{ width: `${pApproved}%` }}
                className="bg-emerald-500 transition-all"
                title={`Disetujui: ${approvedCount}`}
              />
            )}
            {pendingCount > 0 && (
              <div
                style={{ width: `${pPending}%` }}
                className="bg-amber-400 transition-all"
                title={`Menunggu: ${pendingCount}`}
              />
            )}
            {blockedCount > 0 && (
              <div
                style={{ width: `${pBlocked}%` }}
                className="bg-slate-800 transition-all"
                title={`Maintenance / Blokir: ${blockedCount}`}
              />
            )}
            {cancelledCount > 0 && (
              <div
                style={{ width: `${pCancelled}%` }}
                className="bg-slate-400 transition-all"
                title={`Dibatalkan: ${cancelledCount}`}
              />
            )}
            {rejectedCount > 0 && (
              <div
                style={{ width: `${pRejected}%` }}
                className="bg-rose-500 transition-all"
                title={`Ditolak: ${rejectedCount}`}
              />
            )}
          </div>

          {/* Compact Legend */}
          <div className="mt-4 grid grid-cols-2 gap-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Disetujui:</span>
              <span className="font-semibold text-slate-900">{approvedCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-slate-600">Menunggu:</span>
              <span className="font-semibold text-slate-900">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-800" />
              <span className="text-slate-600">Maintenance:</span>
              <span className="font-semibold text-slate-900">{blockedCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-slate-600">Dibatalkan:</span>
              <span className="font-semibold text-slate-900">{cancelledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Solid Enterprise Data Tables & Lists ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table: Pengajuan Terbaru */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                {isAdmin ? 'Pengajuan Terbaru Masuk' : 'Pengajuan Saya Terakhir'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Aktivitas reservasi laboratorium semester ini
              </p>
            </div>
            <Link
              href={isAdmin ? '/admin/bookings' : '/bookings'}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Lihat semua
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500">
                  <th className="px-5 py-2.5">Laboratorium</th>
                  <th className="px-4 py-2.5">Tanggal & Waktu</th>
                  {isAdmin && <th className="px-4 py-2.5">Pemohon</th>}
                  <th className="px-4 py-2.5">Tujuan</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/75 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        <Link href={`/bookings/${b.id}`} className="hover:text-blue-600">
                          {b.labName ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span className="font-medium text-slate-800">
                          {formatDate(b.bookingDate)}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formatTime(b.startTime)}–{formatTime(b.endTime)} WIB
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {b.userName ?? '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                        {b.purpose}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 5 : 4}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Belum ada data pengajuan peminjaman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Daftar Laboratorium */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                  Laboratorium Aktif
                </h2>
                <p className="text-[11px] text-slate-500">Kapasitas & lokasi ruangan</p>
              </div>
              <Link
                href="/labs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Katalog →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {labsPreview.map((lab) => (
                <div key={lab.id} className="p-4 hover:bg-slate-50/75 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/labs/${lab.id}`}
                        className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {lab.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lab.location}</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {lab.capacity} Kursi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 p-4 bg-slate-50/50">
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/admin/labs/new"
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Lab
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Hak Akses
                </Link>
              </div>
            ) : (
              <Link
                href="/bookings/new"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Ajukan Peminjaman Sekarang
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
