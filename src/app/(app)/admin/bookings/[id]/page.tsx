import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { bookings, laboratories, users, bookingApprovalActions, bookingStatusHistory } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { ApprovalActions } from './approval-actions'

interface Props { params: Promise<{ id: string }> }

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role, fullName: users.fullName }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const result = await db
    .select({
      id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime,
      endTime: bookings.endTime, purpose: bookings.purpose, participantCount: bookings.participantCount,
      notes: bookings.notes, status: bookings.status, createdAt: bookings.createdAt,
      laboratoryId: bookings.laboratoryId,
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

  // Cek konflik
  const conflictingBookings = await db
    .select({ id: bookings.id, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose, userName: users.fullName })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.laboratoryId, b.laboratoryId), eq(bookings.bookingDate, b.bookingDate), eq(bookings.status, 'APPROVED')))

  const hasConflict = conflictingBookings.some(
    (c) => b.startTime < c.endTime && b.endTime > c.startTime && c.id !== id
  )

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

  return (
    <div className="max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/bookings" className="hover:text-gray-700">Kelola Pengajuan</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Detail & Keputusan</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{b.labName}</h1>
          <p className="text-gray-500 mt-1">oleh {b.userName} · {b.userRole}</p>
        </div>
        <StatusBadge status={b.status} className="text-sm px-3 py-1" />
      </div>

      {hasConflict && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="font-semibold text-red-700 text-sm">⚠️ Konflik Jadwal Terdeteksi</p>
          <p className="text-sm text-red-600 mt-1">Ada peminjaman lain yang sudah disetujui pada waktu yang bertabrakan di lab ini.</p>
          {conflictingBookings.filter((c) => b.startTime < c.endTime && b.endTime > c.startTime && c.id !== id).map((c) => (
            <p key={c.id} className="text-xs text-red-500 mt-1">{formatTime(c.startTime)}–{formatTime(c.endTime)} · {c.purpose} · oleh {c.userName}</p>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        {[
          { label: 'Pemohon', value: `${b.userName} (${b.userInstitutionalId ?? '—'})` },
          { label: 'Laboratorium', value: `${b.labName} — ${b.labLocation}` },
          { label: 'Kapasitas Lab', value: `${b.labCapacity} orang` },
          { label: 'Tanggal', value: formatDate(b.bookingDate) },
          { label: 'Waktu', value: `${formatTime(b.startTime)} – ${formatTime(b.endTime)}` },
          { label: 'Tujuan', value: b.purpose },
          { label: 'Jumlah Peserta', value: b.participantCount ? `${b.participantCount} orang` : '—' },
          { label: 'Keterangan', value: b.notes ?? '—' },
          { label: 'Waktu Pengajuan', value: formatDateTime(b.createdAt.toISOString()) },
        ].map((item) => (
          <div key={item.label} className="grid grid-cols-3 px-6 py-3 text-sm gap-2">
            <span className="text-gray-500 font-medium">{item.label}</span>
            <span className="col-span-2 text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>

      {b.status === 'PENDING' && (
        <ApprovalActions bookingId={b.id} hasConflict={hasConflict} />
      )}

      {approvals.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Riwayat Keputusan</h2>
          <div className="space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className={`rounded-lg px-4 py-3 text-sm border ${a.decision === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-medium">{a.decision === 'APPROVED' ? '✅ Disetujui' : '❌ Ditolak'} oleh {a.approverName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(a.decidedAt.toISOString())}</p>
                {a.reason && <p className="text-gray-700 mt-1">Alasan: {a.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Riwayat Status</h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
            {history.map((h) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
                <p className="text-sm font-medium text-gray-900">{h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.changedAt.toISOString())}{h.changerName && ` · oleh ${h.changerName}`}</p>
                {h.reason && <p className="text-xs text-gray-500 mt-0.5">{h.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
