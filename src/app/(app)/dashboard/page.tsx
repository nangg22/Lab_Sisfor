import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, laboratories, bookings } from '@/db/schema'
import { eq, desc, count, and } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Users,
  ArrowRight,
  Plus,
  Trophy,
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

  const labs = activeLabs.slice(0, 3)

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

  const allBookingsForStats = isAdmin
    ? await db.select({ status: bookings.status }).from(bookings)
    : await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.userId, session.user.id))

  const stats = {
    total: allBookingsForStats.length,
    pending: allBookingsForStats.filter((b) => b.status === 'PENDING').length,
    approved: allBookingsForStats.filter((b) => b.status === 'APPROVED').length,
    rejected: allBookingsForStats.filter((b) => b.status === 'REJECTED').length,
  }

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

  const statCards = [
    {
      label: isAdmin ? 'Total Pengajuan' : 'Pengajuan Saya',
      value: stats.total,
      icon: ClipboardList,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      label: 'Menunggu',
      value: stats.pending,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
    {
      label: 'Disetujui',
      value: stats.approved,
      icon: CheckCircle2,
      gradient: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    {
      label: 'Ditolak',
      value: stats.rejected,
      icon: XCircle,
      gradient: 'from-rose-400 to-pink-500',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
    },
    ...(isAdmin
      ? [
          {
            label: 'Lab Aktif',
            value: activeLabs.length,
            icon: FlaskConical,
            gradient: 'from-cyan-400 to-sky-500',
            bg: 'bg-cyan-50',
            text: 'text-cyan-700',
          },
          {
            label: 'Pengguna',
            value: totalUsers,
            icon: Users,
            gradient: 'from-violet-400 to-purple-600',
            bg: 'bg-violet-50',
            text: 'text-violet-700',
          },
        ]
      : []),
  ]

  const firstName = currentUser.fullName.split(' ')[0]

  return (
    <div className="space-y-8">
      {/* ── Greeting ── */}
      <div>
        <h1 className="page-title">
          Selamat datang, {firstName}!
        </h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Pantau dan kelola pengajuan peminjaman laboratorium.'
            : 'Ajukan peminjaman laboratorium dengan mudah.'}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className={`grid grid-cols-2 gap-4 ${isAdmin ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-4'}`}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 leading-tight">{stat.label}</p>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                  <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                </div>
              </div>
              <p className={`text-3xl font-bold tracking-tight ${stat.text}`}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Main Content ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/70">
            <h2 className="font-semibold text-slate-900 tracking-tight">
              {isAdmin ? 'Pengajuan Terbaru' : 'Pengajuan Saya Terbaru'}
            </h2>
            <Link
              href={isAdmin ? '/admin/bookings' : '/bookings'}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat semua
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100/60">
            {recentBookings.length > 0 ? (
              recentBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-white/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{b.labName ?? '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(b.bookingDate)} · {formatTime(b.startTime)}–{formatTime(b.endTime)}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-slate-400 mt-0.5">oleh {b.userName ?? '—'}</p>
                    )}
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <ClipboardList className="h-8 w-8 text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-slate-400">Belum ada pengajuan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Lab Terpopuler (admin) */}
          {isAdmin && topLabs.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/70">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" strokeWidth={2} />
                  <h2 className="font-semibold text-slate-900 tracking-tight text-sm">Lab Terpopuler</h2>
                </div>
                <Link href="/admin/labs" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Kelola
                  <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
                </Link>
              </div>
              <div className="divide-y divide-slate-100/60">
                {topLabs.map((lab, idx) => (
                  <div key={lab.labId ?? idx} className="flex items-center gap-3 px-5 py-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-slate-100 text-slate-500' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-800 truncate flex-1">{lab.labName ?? '—'}</p>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                      {lab.total}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Shortcut */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/70">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-blue-500" strokeWidth={2} />
                <h2 className="font-semibold text-slate-900 tracking-tight text-sm">Laboratorium</h2>
              </div>
              <Link href="/labs" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                Lihat semua
                <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100/60">
              {labs.length > 0 ? (
                labs.map((lab) => (
                  <Link
                    key={lab.id}
                    href={`/labs/${lab.id}`}
                    className="block px-5 py-3.5 hover:bg-white/40 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900">{lab.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{lab.location}</p>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  Belum ada data laboratorium.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100/70 px-5 py-4">
              {isAdmin ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/admin/labs/new"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Tambah Lab
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" strokeWidth={2} />
                    Pengguna
                  </Link>
                </div>
              ) : (
                <Link
                  href="/bookings/new"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Ajukan Peminjaman
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
