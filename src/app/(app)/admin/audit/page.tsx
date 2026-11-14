import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { auditLogs, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { hasPermission } from '@/lib/permissions'

const ACTION_LABELS: Record<string, string> = {
  USER_VERIFIED: 'Akun diverifikasi',
  USER_VERIFICATION_REJECTED: 'Verifikasi akun ditolak',
  USER_ROLE_CHANGED: 'Role pengguna diubah',
  USER_STATUS_CHANGED: 'Status akun diubah',
  BOOKING_APPROVED: 'Pengajuan disetujui',
  BOOKING_REJECTED: 'Pengajuan ditolak',
  BOOKING_CREATED: 'Pengajuan dibuat',
  BOOKING_CANCELLED: 'Pengajuan dibatalkan',
}

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!currentUser?.isActive || !hasPermission(currentUser.role, 'audit:read')) redirect('/dashboard')

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      reason: auditLogs.reason,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.fullName,
      actorRole: users.role,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">Riwayat tindakan penting dalam sistem.</p>
      </div>
      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-amber-100 text-[11px] font-black uppercase tracking-wider text-slate-900">
              <th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Pelaku</th><th className="px-4 py-3">Tindakan</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Alasan / Metadata</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200">
              {logs.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center font-bold text-slate-400">Belum ada aktivitas audit.</td></tr> : logs.map((log) => (
                <tr key={log.id} className="align-top hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500">{log.createdAt.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3"><p className="font-black text-slate-900">{log.actorName ?? 'Sistem'}</p><p className="text-[10px] font-bold uppercase text-slate-400">{log.actorRole ?? 'system'}</p></td>
                  <td className="px-4 py-3 font-black text-slate-800">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-slate-600"><p className="font-bold">{log.targetType}</p><p className="max-w-[180px] truncate text-[10px] text-slate-400">{log.targetId ?? '—'}</p></td>
                  <td className="max-w-[300px] px-4 py-3 text-slate-600">{log.reason && <p className="font-semibold">{log.reason}</p>}{log.metadata ? <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] text-slate-400">{JSON.stringify(log.metadata)}</pre> : null}{!log.reason && !log.metadata && '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
