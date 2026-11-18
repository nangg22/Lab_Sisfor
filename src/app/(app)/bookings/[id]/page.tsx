import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users, bookingApprovalActions, bookingStatusHistory } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { CancelBookingButton } from './cancel-button'
import { PrintTicketButton } from './print-ticket-button'
import { KeyRound, CheckCircle2, XCircle, ArrowLeft, Clock, ExternalLink } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)

  const result = await db
    .select({ id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, participantCount: bookings.participantCount, notes: bookings.notes, status: bookings.status, createdAt: bookings.createdAt, userId: bookings.userId, labName: laboratories.name, labLocation: laboratories.location, labCapacity: laboratories.capacity, userName: users.fullName, userRole: users.role, userInstitutionalId: users.institutionalId })
    .from(bookings).leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id)).leftJoin(users, eq(bookings.userId, users.id)).where(eq(bookings.id, id)).limit(1)

  if (!result[0]) notFound()
  const b = result[0]

  if (b.userId !== session.user.id && currentUser?.role !== 'admin') notFound()

  const approvals = await db.select({ id: bookingApprovalActions.id, decision: bookingApprovalActions.decision, reason: bookingApprovalActions.reason, decidedAt: bookingApprovalActions.decidedAt, approverName: users.fullName }).from(bookingApprovalActions).leftJoin(users, eq(bookingApprovalActions.approverUserId, users.id)).where(eq(bookingApprovalActions.bookingId, id)).orderBy(asc(bookingApprovalActions.decidedAt))
  const history = await db.select({ id: bookingStatusHistory.id, oldStatus: bookingStatusHistory.oldStatus, newStatus: bookingStatusHistory.newStatus, reason: bookingStatusHistory.reason, changedAt: bookingStatusHistory.changedAt, changerName: users.fullName }).from(bookingStatusHistory).leftJoin(users, eq(bookingStatusHistory.changedByUserId, users.id)).where(eq(bookingStatusHistory.bookingId, id)).orderBy(asc(bookingStatusHistory.changedAt))

  const isAdmin = currentUser?.role === 'admin'
  const canCancel = b.status === 'PENDING' && b.userId === session.user.id

  const rows = [
    { label: 'Tanggal Peminjaman', value: formatDate(b.bookingDate) },
    { label: 'Waktu Pelaksanaan',  value: `${formatTime(b.startTime)} – ${formatTime(b.endTime)} WIB` },
    { label: 'Tujuan Kegiatan',    value: b.purpose },
    { label: 'Jumlah Peserta',     value: b.participantCount ? `${b.participantCount} orang (Kapasitas: ${b.labCapacity} orang)` : '—' },
    { label: 'Catatan Tambahan',   value: b.notes ?? '—' },
    { label: 'Waktu Diajukan',     value: formatDateTime(b.createdAt.toISOString()) },
  ]

  const lastApproval = approvals[approvals.length - 1]

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <Link href="/bookings" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Pengajuan Saya
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-black">Detail</span>
      </nav>

      {/* Hero */}
      <div className="neo-card booking-detail-hero p-4 sm:p-5 bg-white" style={{ viewTransitionName: `booking-card-${b.id}` }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{b.labName}</h1>
            <p className="text-xs font-bold text-slate-500 mt-1">{b.labLocation}</p>
          </div>
          <StatusBadge status={b.status} className="text-xs px-3 py-1.5 self-start shrink-0" />
        </div>
      </div>

      {/* Detail rows */}
      <div className="neo-card overflow-hidden">
        <div className="bg-amber-100 border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Rincian Peminjaman</h2>
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

      {/* Last decision */}
      {lastApproval && (
        <div className={`flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 shadow-sm ${lastApproval.decision === 'APPROVED' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {lastApproval.decision === 'APPROVED'
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
            : <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" strokeWidth={2.5} />}
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-900">
              {lastApproval.decision === 'APPROVED' ? 'Pengajuan Disetujui' : 'Pengajuan Ditolak'}
            </p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
              oleh {lastApproval.approverName ?? 'Admin'} · {formatDateTime(lastApproval.decidedAt.toISOString())}
            </p>
            {lastApproval.reason && (
              <p className="text-xs font-bold text-slate-700 mt-1.5 border-t border-slate-200 pt-1.5">{lastApproval.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* SOP & print for approved */}
      {b.status === 'APPROVED' && (
        <div className="space-y-4">
          <div className="neo-card overflow-hidden">
            <div className="bg-amber-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-900" strokeWidth={2.2} />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">SOP Pengambilan Kunci Lab</h2>
            </div>
            <div className="p-4 space-y-2 text-xs font-bold text-slate-700">
              <p>Silakan mengambil kunci fisik di <span className="font-black text-slate-900">Ruang Pengelola / Asisten Lab</span> sebelum jadwal dimulai dengan menunjukkan KTM/KTP atau cetak tiket.</p>
              <ul className="space-y-1 list-none">
                <li className="flex items-start gap-1.5"><span className="text-amber-500 font-black mt-0.5">●</span>Pastikan ruangan terkunci kembali setelah selesai.</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 font-black mt-0.5">●</span>Kembalikan kunci maksimal 15 menit setelah waktu selesai.</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-500 font-black mt-0.5">●</span>Matikan proyektor, PC, lampu, dan AC sebelum meninggalkan lab.</li>
              </ul>
            </div>
          </div>
          <PrintTicketButton booking={{ id: b.id, bookingDate: formatDate(b.bookingDate), startTime: formatTime(b.startTime), endTime: formatTime(b.endTime), purpose: b.purpose, participantCount: b.participantCount, notes: b.notes, status: b.status, createdAt: formatDateTime(b.createdAt.toISOString()), labName: b.labName, labLocation: b.labLocation, userName: b.userName, userRole: b.userRole, userInstitutionalId: b.userInstitutionalId }} />
        </div>
      )}

      {/* Status history */}
      {history.length > 0 && (
        <div className="neo-card overflow-hidden">
          <div className="bg-amber-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-700" strokeWidth={2} />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Riwayat Status</h2>
          </div>
          <div className="p-4">
            <div className="relative pl-7 space-y-5">
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-900" aria-hidden="true" />
              {history.map((h) => (
                <div key={h.id} className="relative flex items-start gap-3">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-amber-300 border border-slate-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900">{h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}</p>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{formatDateTime(h.changedAt.toISOString())}{h.changerName && ` · oleh ${h.changerName}`}</p>
                    {h.reason && <p className="text-xs font-bold text-slate-600 mt-0.5 italic">{h.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {canCancel && <CancelBookingButton bookingId={b.id} />}

      {isAdmin && (
        <div className="neo-card-yellow p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-black text-slate-900">Anda membuka ini sebagai Administrator.</span>
          <Link href={`/admin/bookings/${b.id}`} className="neo-btn neo-btn-primary px-3.5 py-2 text-xs font-black">
            Form Keputusan Admin <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
