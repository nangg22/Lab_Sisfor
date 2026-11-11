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
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/bookings" className="hover:text-gray-700">Pengajuan Saya</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Detail Pengajuan</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{b.labName}</h1>
          <p className="text-gray-500 mt-1">{b.labLocation}</p>
        </div>
        <StatusBadge status={b.status} className="text-sm px-3 py-1" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        {[
          { label: 'Tanggal', value: formatDate(b.bookingDate) },
          { label: 'Waktu', value: `${formatTime(b.startTime)} – ${formatTime(b.endTime)}` },
          { label: 'Tujuan', value: b.purpose },
          { label: 'Jumlah Peserta', value: b.participantCount ? `${b.participantCount} orang` : '—' },
          { label: 'Keterangan', value: b.notes ?? '—' },
          { label: 'Diajukan', value: formatDateTime(b.createdAt.toISOString()) },
        ].map((item) => (
          <div key={item.label} className="grid grid-cols-3 px-6 py-3 text-sm gap-2">
            <span className="text-gray-500 font-medium">{item.label}</span>
            <span className="col-span-2 text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>

      {approvals.length > 0 && (
        <div className={`rounded-xl border p-5 shadow-sm ${approvals[approvals.length-1].decision === 'APPROVED' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <p className="font-semibold text-sm mb-1">
            {approvals[approvals.length-1].decision === 'APPROVED' ? '✅ Pengajuan Disetujui' : '❌ Pengajuan Ditolak'}
          </p>
          <p className="text-sm text-gray-600">
            oleh <span className="font-medium">{approvals[approvals.length-1].approverName ?? '—'}</span>
            {' '}· {formatDateTime(approvals[approvals.length-1].decidedAt.toISOString())}
          </p>
          {approvals[approvals.length-1].reason && (
            <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Alasan:</span> {approvals[approvals.length-1].reason}</p>
          )}
        </div>
      )}

      {b.status === 'APPROVED' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm text-sm text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-800">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              SOP Pengambilan Kunci Fisik Laboratorium
            </div>
            <p className="text-blue-800 leading-relaxed">
              Pengajuan Anda telah disetujui secara digital. Silakan mengambil kunci fisik ruangan laboratorium di <strong>Ruang Pengelola / Asisten Lab</strong> sebelum jadwal peminjaman dimulai dengan menunjukkan identitas (KTM/KTP/NIP) atau bukti cetak peminjaman di bawah ini.
            </p>
            <ul className="text-xs text-blue-700 list-disc list-inside space-y-0.5 pt-1">
              <li>Harap pastikan ruangan terkunci kembali setelah selesai digunakan.</li>
              <li>Kembalikan kunci fisik ke Asisten Lab maksimal 15 menit setelah waktu peminjaman berakhir.</li>
              <li>Matikan seluruh proyektor, PC, dan pendingin ruangan (AC) sebelum meninggalkan lab.</li>
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

      {canCancel && <CancelBookingButton bookingId={b.id} />}

      {isAdmin && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
          Untuk memproses keputusan, buka halaman{' '}
          <Link href={`/admin/bookings/${b.id}`} className="font-medium underline">Kelola Pengajuan → Detail</Link>
        </div>
      )}
    </div>
  )
}
