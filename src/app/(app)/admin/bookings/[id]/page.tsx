import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users, bookingApprovalActions, bookingStatusHistory, laboratoryAssignments } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { ApprovalActions } from './approval-actions'
import { hasPermission } from '@/lib/permissions'
import { AlertTriangle, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role, fullName: users.fullName, isActive: users.isActive }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!currentUser?.isActive || !hasPermission(currentUser.role, 'booking:read_all')) redirect('/dashboard')

  const result = await db
    .select({ id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, participantCount: bookings.participantCount, notes: bookings.notes, status: bookings.status, createdAt: bookings.createdAt, laboratoryId: bookings.laboratoryId, labName: laboratories.name, labLocation: laboratories.location, labCapacity: laboratories.capacity, userName: users.fullName, userRole: users.role, userInstitutionalId: users.institutionalId })
    .from(bookings).leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id)).leftJoin(users, eq(bookings.userId, users.id)).where(eq(bookings.id, id)).limit(1)

  if (!result[0]) notFound()
  const b = result[0]

  if (currentUser.role === 'aslab') {
    const [assignment] = await db.select({ id: laboratoryAssignments.id }).from(laboratoryAssignments).where(and(eq(laboratoryAssignments.userId, session.user.id), eq(laboratoryAssignments.laboratoryId, b.laboratoryId))).limit(1)
    if (!assignment) redirect('/admin/bookings')
  }

  const conflictingBookings = await db.select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, userName: users.fullName }).from(bookings).leftJoin(users, eq(bookings.userId, users.id)).where(and(eq(bookings.laboratoryId, b.laboratoryId), eq(bookings.bookingDate, b.bookingDate), eq(bookings.status, 'APPROVED')))
  const hasConflict = conflictingBookings.some((c) => b.startTime < c.endTime && b.endTime > c.startTime && c.id !== id)

  const approvals = await db.select({ id: bookingApprovalActions.id, decision: bookingApprovalActions.decision, reason: bookingApprovalActions.reason, decidedAt: bookingApprovalActions.decidedAt, approverName: users.fullName }).from(bookingApprovalActions).leftJoin(users, eq(bookingApprovalActions.approverUserId, users.id)).where(eq(bookingApprovalActions.bookingId, id)).orderBy(asc(bookingApprovalActions.decidedAt))
  const history = await db.select({ id: bookingStatusHistory.id, oldStatus: bookingStatusHistory.oldStatus, newStatus: bookingStatusHistory.newStatus, reason: bookingStatusHistory.reason, changedAt: bookingStatusHistory.changedAt, changerName: users.fullName }).from(bookingStatusHistory).leftJoin(users, eq(bookingStatusHistory.changedByUserId, users.id)).where(eq(bookingStatusHistory.bookingId, id)).orderBy(asc(bookingStatusHistory.changedAt))

  const rows = [
    { label: 'Pemohon',         value: `${b.userName} (${b.userInstitutionalId ?? '—'})` },
    { label: 'Laboratorium',    value: `${b.labName} — ${b.labLocation}` },
    { label: 'Kapasitas Lab',   value: `${b.labCapacity} orang` },
    { label: 'Tanggal',         value: formatDate(b.bookingDate) },
    { label: 'Waktu',           value: `${formatTime(b.startTime)} – ${formatTime(b.endTime)}` },
    { label: 'Tujuan',          value: b.purpose },
    { label: 'Jumlah Peserta',  value: b.participantCount ? `${b.participantCount} orang` : '—' },
    { label: 'Keterangan',      value: b.notes ?? '—' },
    { label: 'Waktu Pengajuan', value: formatDateTime(b.createdAt.toISOString()) },
  ]

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 flex-wrap">
        <Link href="/admin/bookings" className="hover:text-blue-600 transition-colors">Kelola Pengajuan</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2.5} />
        <span className="text-slate-900 font-black">Detail &amp; Keputusan</span>
      </nav>

      {/* Hero */}
      <div className="neo-card p-4 sm:p-5 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{b.labName}</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              oleh <span className="text-slate-800">{b.userName}</span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="capitalize">{b.userRole}</span>
            </p>
          </div>
          <StatusBadge status={b.status} className="text-xs px-3 py-1.5 self-start shrink-0" />
        </div>
      </div>

      {/* Conflict */}
      {hasConflict && (
        <div className="neo-card-red p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <p className="text-xs font-black uppercase tracking-wide">Konflik Jadwal Terdeteksi</p>
            <p className="text-xs font-bold mt-1 opacity-90">Ada peminjaman lain yang sudah disetujui pada waktu bertabrakan.</p>
            {conflictingBookings.filter((c) => b.startTime < c.endTime && b.endTime > c.startTime && c.id !== id).map((c) => (
              <p key={c.id} className="text-[11px] font-bold mt-1 opacity-80">{formatTime(c.startTime)}–{formatTime(c.endTime)} · {c.purpose} · oleh {c.userName}</p>
            ))}
          </div>
        </div>
      )}

      {/* Detail rows */}
      <div className="neo-card overflow-hidden">
        <div className="bg-amber-100 border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Detail Pengajuan</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <div key={row.label} className={`px-4 py-3 flex flex-col gap-0.5 sm:grid sm:grid-cols-5 sm:gap-3 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 sm:col-span-2 sm:flex sm:items-center">{row.label}</span>
              <span className="text-sm font-bold text-slate-900 sm:col-span-3 break-words">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Approval actions */}
      {b.status === 'PENDING' && hasPermission(currentUser.role, 'booking:approve') && <ApprovalActions bookingId={b.id} hasConflict={hasConflict} />}

      {/* Decision history */}
      {approvals.length > 0 && (
        <div className="neo-card overflow-hidden">
          <div className="bg-amber-100 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Riwayat Keputusan</h2>
          </div>
          <div className="p-4 space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className={`flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 shadow-sm ${a.decision === 'APPROVED' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {a.decision === 'APPROVED' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} /> : <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" strokeWidth={2.5} />}
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-900">{a.decision === 'APPROVED' ? 'Disetujui' : 'Ditolak'} oleh {a.approverName}</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">{formatDateTime(a.decidedAt.toISOString())}</p>
                  {a.reason && <p className="text-xs font-bold text-slate-700 mt-1 border-t border-slate-200 pt-1">{a.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status history */}
      {history.length > 0 && (
        <div className="neo-card overflow-hidden">
          <div className="bg-amber-100 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Riwayat Status</h2>
          </div>
          <div className="p-4">
            <div className="relative pl-7 space-y-5">
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-900" aria-hidden="true" />
              {history.map((h) => (
                <div key={h.id} className="relative flex items-start gap-3">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-amber-300 border border-slate-200 shrink-0" />
                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {h.oldStatus ? <>{h.oldStatus} <span className="text-slate-400">→</span> {h.newStatus}</> : h.newStatus}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{formatDateTime(h.changedAt.toISOString())}{h.changerName && <> · oleh <span className="text-slate-700">{h.changerName}</span></>}</p>
                    {h.reason && <p className="text-[11px] font-bold text-slate-600 mt-0.5 italic">{h.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
