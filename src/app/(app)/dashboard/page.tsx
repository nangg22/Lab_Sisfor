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
  UserCheck,
  CalendarDays,
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
    .select({ id: laboratories.id, name: laboratories.name, location: laboratories.location, capacity: laboratories.capacity })
    .from(laboratories)
    .where(eq(laboratories.isActive, true))

  const labsPreview = activeLabs.slice(0, 4)

  const [userCountRow] = await db.select({ total: count() }).from(users)
  const totalUsersCount = userCountRow?.total ?? 0

  const recentBookings = isAdmin
    ? await db
        .select({ id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, status: bookings.status, createdAt: bookings.createdAt, labName: laboratories.name, userName: users.fullName })
        .from(bookings)
        .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .orderBy(desc(bookings.createdAt))
        .limit(6)
    : await db
        .select({ id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, status: bookings.status, createdAt: bookings.createdAt, labName: laboratories.name, userName: users.fullName })
        .from(bookings)
        .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.userId, session.user.id))
        .orderBy(desc(bookings.createdAt))
        .limit(6)

  const allBookingsForStats = isAdmin
    ? await db.select({ status: bookings.status }).from(bookings)
    : await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.userId, session.user.id))

  const totalBookings  = allBookingsForStats.length
  const pendingCount   = allBookingsForStats.filter((b) => b.status === 'PENDING').length
  const approvedCount  = allBookingsForStats.filter((b) => b.status === 'APPROVED').length
  const rejectedCount  = allBookingsForStats.filter((b) => b.status === 'REJECTED').length
  const cancelledCount = allBookingsForStats.filter((b) => b.status === 'CANCELLED').length
  const blockedCount   = allBookingsForStats.filter((b) => b.status === 'BLOCKED').length

  const pct = (v: number) => totalBookings > 0 ? ((v / totalBookings) * 100).toFixed(1) : '0'
  const pApproved  = pct(approvedCount)
  const pPending   = pct(pendingCount)
  const pBlocked   = pct(blockedCount)
  const pCancelled = pct(cancelledCount)
  const pRejected  = pct(rejectedCount)

  const firstName = currentUser.fullName.split(' ')[0]

  return (
    <div className="space-y-4 md:space-y-6">

      {/* ── 1. Hero Banner ── */}
      <div className="neo-card p-4 sm:p-6 bg-white overflow-hidden">
        <div className="flex flex-col gap-3">
          <div className="inline-flex self-start items-center gap-1.5 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-black text-slate-950 uppercase tracking-wide border border-slate-200 shadow-sm">
            <Sparkles className="h-3 w-3" />
            <span>Sistem Informasi Laboratorium UISI</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900">
              Halo, {firstName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-bold leading-relaxed">
              Pantau jadwal penggunaan laboratorium, ketersediaan fasilitas komputer, dan pengajuan perizinan secara terpadu.
            </p>
          </div>
          {/* Buttons: full-width stacked on mobile, inline on sm+ */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-2.5">
            <Link href="/schedule" className="neo-btn neo-btn-white py-2.5 text-xs font-black justify-center">
              <CalendarDays className="h-4 w-4" />
              <span>Jadwal Ruang</span>
            </Link>
            {isAdmin ? (
              <Link href="/admin/labs/new" className="neo-btn neo-btn-primary py-2.5 text-xs font-black justify-center">
                <Plus className="h-4 w-4" strokeWidth={2.5} /><span>Tambah Lab</span>
              </Link>
            ) : (
              <Link href="/bookings/new" className="neo-btn neo-btn-primary py-2.5 text-xs font-black justify-center">
                <Plus className="h-4 w-4" strokeWidth={2.5} /><span>Ajukan Pinjam</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Stat Cards: 1-col mobile → 2-col sm → 4-col lg ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">

        {/* Card 1 — amber */}
        <div className="neo-card-yellow p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-950 leading-tight">
              {isAdmin ? 'Pengajuan Masuk' : 'Pengajuan Saya'}
            </span>
            <div className="p-1.5 rounded-md bg-slate-950 text-white shrink-0">
              <Eye className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-950">{totalBookings}</span>
            <span className="text-xs font-bold text-slate-950">Permohonan</span>
          </div>
          <p className="text-[11px] font-black text-slate-900 flex items-center gap-1">
            <span>●</span>{pendingCount} menunggu evaluasi
          </p>
        </div>

        {/* Card 2 — white/blue */}
        <div className="neo-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-900 leading-tight">
              Laboratorium Aktif
            </span>
            <div className="p-1.5 rounded-md bg-blue-600 text-white shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{activeLabs.length}</span>
            <span className="text-xs font-bold text-slate-600">Ruangan</span>
          </div>
          <p className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
            <span>●</span>Fasilitas siap operasional
          </p>
        </div>

        {/* Card 3 — white/green */}
        <div className="neo-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-900 leading-tight">
              {isAdmin ? 'Total Pengguna' : 'Slot Terjadwal'}
            </span>
            <div className="p-1.5 rounded-md bg-emerald-600 text-white shrink-0">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{isAdmin ? totalUsersCount : approvedCount}</span>
            <span className="text-xs font-bold text-slate-600">{isAdmin ? 'Civitas' : 'Disetujui'}</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <span>●</span>{isAdmin ? 'Mahasiswa & Dosen' : 'Siap dipergunakan'}
          </p>
        </div>

        {/* Card 4 — distribusi */}
        <div className="neo-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-900 leading-tight">
              Distribusi Status
            </span>
            <span className="neo-badge bg-slate-100 text-slate-900 text-[10px]">{totalBookings} Total</span>
          </div>
          <div
            role="img"
            aria-label={`Distribusi status: ${approvedCount} disetujui, ${pendingCount} menunggu, ${blockedCount} maintenance, ${cancelledCount} dibatalkan, ${rejectedCount} ditolak`}
            className="flex h-3 w-full overflow-hidden rounded border border-slate-200 bg-slate-100"
          >
            {approvedCount  > 0 && <div style={{ width: `${pApproved}%`  }} className="bg-emerald-400" />}
            {pendingCount   > 0 && <div style={{ width: `${pPending}%`   }} className="bg-amber-300" />}
            {blockedCount   > 0 && <div style={{ width: `${pBlocked}%`   }} className="bg-slate-900" />}
            {cancelledCount > 0 && <div style={{ width: `${pCancelled}%` }} className="bg-slate-400" />}
            {rejectedCount  > 0 && <div style={{ width: `${pRejected}%`  }} className="bg-rose-500" />}
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-slate-700"><span className="h-2 w-2 rounded-sm bg-emerald-400 border border-slate-200 shrink-0" />Disetujui: {approvedCount}</span>
            <span className="flex items-center gap-1 text-slate-700"><span className="h-2 w-2 rounded-sm bg-amber-300  border border-slate-200 shrink-0" />Menunggu: {pendingCount}</span>
            <span className="flex items-center gap-1 text-slate-700"><span className="h-2 w-2 rounded-sm bg-slate-900 border border-slate-200 shrink-0" />Maint.: {blockedCount}</span>
            <span className="flex items-center gap-1 text-slate-700"><span className="h-2 w-2 rounded-sm bg-slate-400 border border-slate-200 shrink-0" />Batal: {cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Table + Side Panel ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Tabel Pengajuan */}
        <div className="neo-card lg:col-span-2 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
            <div>
              <h2 className="text-xs font-black tracking-tight text-slate-950 uppercase">
                {isAdmin ? 'Pengajuan Masuk Terbaru' : 'Pengajuan Saya Terakhir'}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Reservasi ruangan semester ini</p>
            </div>
            <Link href={isAdmin ? '/admin/bookings' : '/bookings'} className="neo-btn neo-btn-white px-2.5 py-1.5 text-[11px] font-black shrink-0">
              <span>Lihat Semua</span><ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Mobile: card list */}
          <div className="block sm:hidden divide-y divide-slate-200">
            {recentBookings.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs font-bold text-slate-500">Belum ada aktivitas peminjaman.</p>
            ) : (
              recentBookings.map((b) => (
                <Link key={b.id} href={`/bookings/${b.id}`} className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-black text-slate-900 leading-tight">{b.labName ?? '—'}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-600">
                    {formatDate(b.bookingDate)} · {formatTime(b.startTime)}–{formatTime(b.endTime)} WIB
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{b.purpose}</p>
                  {isAdmin && b.userName && (
                    <p className="text-[10px] font-black text-slate-700 mt-0.5">👤 {b.userName}</p>
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Daftar pengajuan peminjaman terbaru</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-amber-100 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">Laboratorium</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jadwal</th>
                  {isAdmin && <th className="px-4 py-3 whitespace-nowrap">Pemohon</th>}
                  <th className="px-4 py-3 whitespace-nowrap">Tujuan</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/bookings/${b.id}`} className="font-bold text-slate-900 hover:text-blue-600">{b.labName ?? '—'}</Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{formatDate(b.bookingDate)}</span>
                        <span className="text-[11px] font-bold text-slate-500">{formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                      </td>
                      {isAdmin && <td className="px-4 py-3 whitespace-nowrap font-black text-slate-900">{b.userName ?? '—'}</td>}
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{b.purpose}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-slate-500 font-bold">
                      Belum ada aktivitas peminjaman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t-2 border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500">Sistem Informasi Peminjaman Lab Terverifikasi UISI</span>
          </div>
        </div>

        {/* Side: Lab list */}
        <div className="neo-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
            <div>
              <h2 className="text-xs font-black tracking-tight text-slate-950 uppercase">Lab Aktif</h2>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Ruangan siap operasional</p>
            </div>
            <Link href="/labs" className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 shrink-0">
              Katalog <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-200 flex-1">
            {labsPreview.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs font-bold text-slate-500">Belum ada laboratorium aktif.</p>
            ) : labsPreview.map((lab) => (
              <div key={lab.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/labs/${lab.id}`} className="text-xs font-black text-slate-950 hover:text-blue-600 block truncate">
                      {lab.name}
                    </Link>
                    <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">{lab.location}</p>
                  </div>
                  <span className="neo-badge bg-blue-100 text-slate-950 text-[10px] shrink-0">{lab.capacity} Kursi</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-slate-200 p-3 bg-amber-50">
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/labs/new" className="neo-btn neo-btn-white py-2 text-[11px] font-black justify-center">
                  <Plus className="h-3.5 w-3.5" />Tambah Lab
                </Link>
                <Link href="/admin/users" className="neo-btn neo-btn-white py-2 text-[11px] font-black justify-center">
                  <UsersIcon className="h-3.5 w-3.5" />Pengguna
                </Link>
              </div>
            ) : (
              <Link href="/bookings/new" className="neo-btn neo-btn-primary w-full py-2.5 text-xs font-black justify-center">
                <Plus className="h-4 w-4" strokeWidth={2.5} />Ajukan Peminjaman
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
