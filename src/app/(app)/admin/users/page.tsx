import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, bookings } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import { UserManagementTable } from './user-management-table'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const allUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      institutionalId: users.institutionalId,
      role: users.role,
      isActive: users.isActive,
      verificationStatus: users.verificationStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt)

  // Hitung total booking per user
  const bookingCounts = await db
    .select({ userId: bookings.userId, total: count() })
    .from(bookings)
    .groupBy(bookings.userId)

  const bookingMap = new Map(bookingCounts.map((b) => [b.userId, b.total]))

  const usersWithStats = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    bookingCount: bookingMap.get(u.id) ?? 0,
  }))

  const totalUsers = allUsers.length
  const totalAdmin = allUsers.filter((u) => u.role === 'admin').length
  const totalDosen = allUsers.filter((u) => u.role === 'dosen').length
  const totalMahasiswa = allUsers.filter((u) => u.role === 'mahasiswa').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="mt-1 text-gray-500">Kelola role dan status akun pengguna terdaftar.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Pengguna', value: totalUsers, color: 'text-blue-700 bg-blue-50' },
          { label: 'Mahasiswa', value: totalMahasiswa, color: 'text-indigo-700 bg-indigo-50' },
          { label: 'Dosen', value: totalDosen, color: 'text-purple-700 bg-purple-50' },
          { label: 'Admin', value: totalAdmin, color: 'text-red-700 bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color} rounded-lg px-2 py-0.5 inline-block`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <UserManagementTable users={usersWithStats} currentUserId={session.user.id} />
    </div>
  )
}

