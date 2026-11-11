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
  Building2,
  Users as UsersIcon,
  Sparkles,
  Eye,
  Clock,
  UserCheck,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  ExternalLink,
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

  const [userCountRow] = await db.select({ total: count() }).from(users)
  const totalUsersCount = userCountRow?.total ?? 0

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
      {/* ── 1. Hero Banner: Pop Neo-Brutal Aesthetic (Image 1 inspired) ── */}
      <div className="neo-card-dark p-6 sm:p-7 relative overflow-hidden">
        {/* Background accent badge */}
        <div className="absolute right-4 -top-6 w-40 h-40 bg-amber-300 rounded-full blur-2xl opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-black text-slate-950 uppercase tracking-wide border border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0f172a] mb-2.5">
              <Sparkles className="h-3 w-3" />
              <span>Sistem Informasi Laboratorium UISI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Halo, {firstName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
              Pantau jadwal penggunaan laboratorium, ketersediaan fasilitas komputer, dan pengajuan perizinan secara terpadu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/schedule"
              className="neo-btn neo-btn-white px-4 py-2.5 text-xs font-black"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Jadwal Ruang</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/labs/new"
                className="neo-btn neo-btn-primary px-4 py-2.5 text-xs font-black"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                <span>Tambah Lab</span>
              </Link>
            ) : (
              <Link
                href="/bookings/new"
                className="neo-btn neo-btn-primary px-4 py-2.5 text-xs font-black"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                <span>Ajukan Pinjam</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Stat Cards Row: Pop Color Accent Cards (Image 1 & 2 hybrid) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Total Pengajuan (Yellow Neo) */}
        <div className="neo-card-yellow p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-950">
              {isAdmin ? 'Pengajuan Masuk' : 'Pengajuan Saya'}
            </span>
            <div className="p-1.5 rounded-md bg-slate-950 text-white">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              {totalBookings}
            </span>
            <span className="text-xs font-bold text-slate-800 ml-1.5">Permohonan</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-800 flex items-center gap-1">
            <span>●</span> {pendingCount} menunggu evaluasi
          </p>
        </div>

        {/* Card 2: Lab Aktif (Blue Neo) */}
        <div className="neo-card-blue p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Laboratorium Aktif
            </span>
            <div className="p-1.5 rounded-md bg-white text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {activeLabs.length}
            </span>
            <span className="text-xs font-bold text-blue-100 ml-1.5">Ruangan</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-blue-100 flex items-center gap-1">
            <span>●</span> Fasilitas siap operasional
          </p>
        </div>

        {/* Card 3: Total Pengguna / Terjadwal (Green Neo) */}
        <div className="neo-card-green p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {isAdmin ? 'Total Pengguna' : 'Slot Terjadwal'}
            </span>
            <div className="p-1.5 rounded-md bg-white text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {isAdmin ? totalUsersCount : approvedCount}
            </span>
            <span className="text-xs font-bold text-emerald-100 ml-1.5">
              {isAdmin ? 'Civitas' : 'Disetujui'}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-emerald-100 flex items-center gap-1">
            <span>●</span> {isAdmin ? 'Mahasiswa & Dosen' : 'Siap dipergunakan'}
          </p>
        </div>

        {/* Card 4: Status Breakdown Progress (Clean Neo Card) */}
        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Distribusi Status
            </span>
            <span className="neo-badge bg-slate-100 text-slate-900">
              {totalBookings} Total
            </span>
          </div>

          {/* Segmented Bar with crisp 1.5px border */}
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-md border-2 border-slate-900 bg-slate-100">
            {approvedCount > 0 && (
              <div
                style={{ width: `${pApproved}%` }}
                className="bg-emerald-400 border-r border-slate-900"
                title={`Disetujui: ${approvedCount}`}
              />
            )}
            {pendingCount > 0 && (
              <div
                style={{ width: `${pPending}%` }}
                className="bg-amber-300 border-r border-slate-900"
                title={`Menunggu: ${pendingCount}`}
              />
            )}
            {blockedCount > 0 && (
              <div
                style={{ width: `${pBlocked}%` }}
                className="bg-slate-900 border-r border-slate-900"
                title={`Maintenance: ${blockedCount}`}
              />
            )}
            {cancelledCount > 0 && (
              <div
                style={{ width: `${pCancelled}%` }}
                className="bg-slate-400 border-r border-slate-900"
                title={`Dibatalkan: ${cancelledCount}`}
              />
            )}
            {rejectedCount > 0 && (
              <div
                style={{ width: `${pRejected}%` }}
                className="bg-rose-500"
                title={`Ditolak: ${rejectedCount}`}
              />
            )}
          </div>

          {/* Legend Grid */}
          <div className="mt-3 grid grid-cols-2 gap-y-1 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-emerald-400 border border-slate-900" />
              <span className="text-slate-600">Disetujui:</span>
              <span className="text-slate-950 font-black">{approvedCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-amber-300 border border-slate-900" />
              <span className="text-slate-600">Menunggu:</span>
              <span className="text-slate-950 font-black">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-slate-900" />
              <span className="text-slate-600">Maintenance:</span>
              <span className="text-slate-950 font-black">{blockedCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-slate-400 border border-slate-900" />
              <span className="text-slate-600">Dibatalkan:</span>
              <span className="text-slate-950 font-black">{cancelledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Content Section: Data Table + Side Activity Panel ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table: Pengajuan Terbaru */}
        <div className="neo-card lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-900 px-5 py-4 bg-slate-50">
              <div>
                <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase">
                  {isAdmin ? 'Pengajuan Masuk Terbaru' : 'Pengajuan Saya Terakhir'}
                </h2>
                <p className="text-[11px] font-bold text-slate-500">
                  Daftar reservasi ruangan semester ini
                </p>
              </div>
              <Link
                href={isAdmin ? '/admin/bookings' : '/bookings'}
                className="neo-btn neo-btn-white px-3 py-1.5 text-xs font-black"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-amber-100 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="px-5 py-3">Laboratorium</th>
                    <th className="px-4 py-3">Jadwal Penggunaan</th>
                    {isAdmin && <th className="px-4 py-3">Pemohon</th>}
                    <th className="px-4 py-3">Tujuan Kegiatan</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b border-slate-200">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/bookings/${b.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600"
                          >
                            {b.labName ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">
                            {formatDate(b.bookingDate)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {formatTime(b.startTime)}–{formatTime(b.endTime)} WIB
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3.5 text-slate-800 whitespace-nowrap font-bold">
                            {b.userName ?? '—'}
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate">
                          {b.purpose}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={isAdmin ? 5 : 4}
                        className="px-5 py-12 text-center text-slate-500 font-bold"
                      >
                        Belum ada aktivitas peminjaman.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500">
              Sistem Informasi Peminjaman Laboratorium Terverifikasi UISI
            </span>
          </div>
        </div>

        {/* Side Panel: Daftar Laboratorium */}
        <div className="neo-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-900 px-5 py-4 bg-slate-50">
              <div>
                <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase">
                  Laboratorium Aktif
                </h2>
                <p className="text-[11px] font-bold text-slate-500">
                  Daftar ruangan siap operasional
                </p>
              </div>
              <Link
                href="/labs"
                className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
              >
                Katalog <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-200">
              {labsPreview.map((lab) => (
                <div key={lab.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/labs/${lab.id}`}
                        className="text-xs font-black text-slate-950 hover:text-blue-600 transition-colors"
                      >
                        {lab.name}
                      </Link>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {lab.location}
                      </p>
                    </div>
                    <span className="neo-badge bg-blue-100 text-slate-950 text-[10px]">
                      {lab.capacity} Kursi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-slate-900 p-4 bg-amber-50">
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/admin/labs/new"
                  className="neo-btn neo-btn-white py-2 text-xs font-black"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Lab
                </Link>
                <Link
                  href="/admin/users"
                  className="neo-btn neo-btn-white py-2 text-xs font-black"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Pengguna
                </Link>
              </div>
            ) : (
              <Link
                href="/bookings/new"
                className="neo-btn neo-btn-primary w-full py-2.5 text-xs font-black"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Ajukan Peminjaman Sekarang
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
