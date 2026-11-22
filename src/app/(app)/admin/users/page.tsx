import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, bookings } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import { UserManagementTable } from './user-management-table'
import { Users, GraduationCap, Briefcase, ShieldCheck } from 'lucide-react'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const allUsers = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, institutionalId: users.institutionalId, role: users.role, isActive: users.isActive, verificationStatus: users.verificationStatus, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.createdAt)

  const bookingCounts = await db.select({ userId: bookings.userId, total: count() }).from(bookings).groupBy(bookings.userId)
  const bookingMap = new Map(bookingCounts.map((b) => [b.userId, b.total]))

  const usersWithStats = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    bookingCount: bookingMap.get(u.id) ?? 0,
  }))

  const totalUsers     = allUsers.length
  const totalAdmin     = allUsers.filter((u) => u.role === 'admin').length
  const totalDosen     = allUsers.filter((u) => u.role === 'dosen').length
  const totalMahasiswa = allUsers.filter((u) => u.role === 'mahasiswa').length

  const statCards = [
    { label: 'Total Pengguna', value: totalUsers,     Icon: Users,         card: 'neo-card' },
    { label: 'Mahasiswa',      value: totalMahasiswa, Icon: GraduationCap, card: 'neo-card-blue' },
    { label: 'Dosen',          value: totalDosen,     Icon: Briefcase,     card: 'neo-card-dark' },
    { label: 'Admin',          value: totalAdmin,     Icon: ShieldCheck,   card: 'neo-card-yellow' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Manajemen Pengguna</h1>
        <p className="text-sm font-bold text-slate-500 mt-0.5">Kelola role dan status akun pengguna terdaftar.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.card} p-4 flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wide leading-tight opacity-80">{s.label}</span>
              <s.Icon className="h-4 w-4 opacity-70 shrink-0" strokeWidth={2.5} />
            </div>
            <span className="text-3xl font-black tracking-tight">{s.value}</span>
          </div>
        ))}
      </div>

      <UserManagementTable users={usersWithStats} currentUserId={session.user.id} />
    </div>
  )
}
