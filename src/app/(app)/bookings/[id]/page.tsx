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
import { KeyRound, ShieldCheck, CheckCircle2, XCircle, ArrowLeft, Clock } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)

  const result = await db
    .select({
      id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime,
      endTime: bookings.endTime, purpose: bookings.purpose, participantCount: bookings.participantCount,
      notes: bookings.notes, status: bookings.status, createdAt: bookings.createdAt,
      userId: bookings.userId,
      labName: laboratories.name, labLocation: laboratories.location, labCapacity: laboratories.capacity,
      userName: users.fullName, userRole: users.role, userInstitutionalId: users.institutionalId,
    })
    .from(bookings)
    .leftJoin(laboratories, eq(bookings.laboratoryId, laboratories.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, id))
    .limit(1)

  if (!result[0]) notFound()
  const b = result[0]

  // Hanya pemilik atau admin yang bisa lihat
  if (b.userId !== session.user.id && currentUser?.role !== 'admin') notFound()

  const approvals = await db
    .select({ id: bookingApprovalActions.id, decision: bookingApprovalActions.decision, reason: bookingApprovalActions.reason, decidedAt: bookingApprovalActions.decidedAt, approverName: users.fullName })
    .from(bookingApprovalActions)
    .leftJoin(users, eq(bookingApprovalActions.approverUserId, users.id))
    .where(eq(bookingApprovalActions.bookingId, id))
    .orderBy(asc(bookingApprovalActions.decidedAt))

  const history = await db
    .select({ id: bookingStatusHistory.id, oldStatus: bookingStatusHistory.oldStatus, newStatus: bookingStatusHistory.newStatus, reason: bookingStatusHistory.reason, changedAt: bookingStatusHistory.changedAt, changerName: users.fullName })
    .from(bookingStatusHistory)
    .leftJoin(users, eq(bookingStatusHistory.changedByUserId, users.id))
    .where(eq(bookingStatusHistory.bookingId, id))
    .orderBy(asc(bookingStatusHistory.changedAt))

  const isAdmin = currentUser?.role === 'admin'
  const canCancel = b.status === 'PENDING' && b.userId === session.user.id

  return (
    <div className="max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/bookings" className="hover:text-blue-700 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Pengajuan Saya
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Detail Pengajuan</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title text-slate-900">{b.labName}</h1>
          <p className="page-subtitle text-slate-600 font-medium">{b.labLocation}</p>
        </div>
        <StatusBadge status={b.status} className="text-sm px-3.5 py-1.5" />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-100">
        {[
          { label: 'Tanggal Peminjaman', value: formatDate(b.bookingDate) },
          { label: 'Waktu Pelaksanaan', value: `${formatTime(b.startTime)} – ${formatTime(b.endTime)} WIB` },
          { label: 'Tujuan Kegiatan', value: b.purpose },
          { label: 'Jumlah Peserta', value: b.participantCount ? `${b.participantCount} orang (Kapasitas: ${b.labCapacity} orang)` : '—' },
          { label: 'Catatan Tambahan', value: b.notes ?? '—' },
          { label: 'Waktu Diajukan', value: formatDateTime(b.createdAt.toISOString()) },
        ].map((item) => (
          <div key={item.label} className="grid grid-cols-3 px-6 py-3.5 text-sm gap-2">
            <span className="text-slate-600 font-semibold">{item.label}</span>
            <span className="col-span-2 text-slate-900 font-medium leading-relaxed">{item.value}</span>
          </div>
        ))}
      </div>

      {approvals.length > 0 && (
        <div className={`rounded-2xl border p-5 shadow-sm ${approvals[approvals.length-1].decision === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}`}>
          <div className="flex items-center gap-2 font-bold text-sm mb-1 text-slate-900">
            {approvals[approvals.length-1].decision === 'APPROVED' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-800">Pengajuan Telah Disetujui</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-rose-600" />
                <span className="text-rose-800">Pengajuan Ditolak</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-700 font-medium">
            Diproses oleh <span className="font-bold text-slate-900">{approvals[approvals.length-1].approverName ?? 'Admin'}</span>
            {' '}· {formatDateTime(approvals[approvals.length-1].decidedAt.toISOString())}
          </p>
          {approvals[approvals.length-1].reason && (
            <p className="mt-2 text-xs text-slate-800 bg-white/70 p-2.5 rounded-xl border border-slate-200 font-medium">
              <span className="font-bold">Alasan / Catatan Admin:</span> {approvals[approvals.length-1].reason}
            </p>
          )}
        </div>
      )}

      {b.status === 'APPROVED' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-5 shadow-sm text-sm text-blue-950 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
              <KeyRound className="h-5 w-5 text-blue-700" strokeWidth={2.2} />
              SOP Pengambilan Kunci Fisik Laboratorium
            </div>
            <p className="text-xs text-blue-900 leading-relaxed font-medium">
              Pengajuan Anda telah disetujui secara digital. Silakan mengambil kunci fisik ruangan laboratorium di <strong>Ruang Pengelola / Asisten Lab</strong> sebelum jadwal peminjaman dimulai dengan menunjukkan kartu identitas (KTM/KTP/NIP) atau bukti cetak tiket di bawah.
            </p>
            <ul className="text-xs text-blue-800 list-disc list-inside space-y-1 pt-1 font-medium">
              <li>Harap pastikan ruangan terkunci kembali setelah selesai digunakan.</li>
              <li>Kembalikan kunci fisik ke Asisten Lab maksimal 15 menit setelah waktu peminjaman berakhir.</li>
              <li>Matikan seluruh proyektor, PC, lampu, dan pendingin ruangan (AC) sebelum meninggalkan lab.</li>
            </ul>
          </div>

          <PrintTicketButton
            booking={{
              id: b.id,
              bookingDate: formatDate(b.bookingDate),
              startTime: formatTime(b.startTime),
              endTime: formatTime(b.endTime),
              purpose: b.purpose,
              participantCount: b.participantCount,
              notes: b.notes,
              status: b.status,
              createdAt: formatDateTime(b.createdAt.toISOString()),
              labName: b.labName,
              labLocation: b.labLocation,
              userName: b.userName,
              userRole: b.userRole,
              userInstitutionalId: b.userInstitutionalId,
            }}
          />
        </div>
      )}

      {history.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-600" />
            Riwayat Status Pengajuan
          </h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-1.5 bottom-1.5 w-0.5 bg-slate-200" />
            {history.map((h) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <p className="text-xs font-bold text-slate-900">
                  {h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {formatDateTime(h.changedAt.toISOString())}
                  {h.changerName && ` · oleh ${h.changerName}`}
                </p>
                {h.reason && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 font-medium">
                    {h.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {canCancel && <CancelBookingButton bookingId={b.id} />}

      {isAdmin && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>Anda membuka pengajuan ini dengan hak akses Administrator.</span>
          <Link href={`/admin/bookings/${b.id}`} className="font-bold text-blue-700 hover:underline">
            Buka Form Keputusan Admin →
          </Link>
        </div>
      )}
    </div>
  )
}
