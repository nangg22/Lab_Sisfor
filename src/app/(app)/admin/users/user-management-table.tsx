'use client'

import { useState, useTransition } from 'react'
import type { RoleCode } from '@/db/schema'
import { Search, AlertTriangle, ShieldCheck, Check, X } from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  institutionalId: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface Props {
  users: User[]
  currentUserId: string
}

const ROLE_LABELS: Record<string, string> = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen',
  admin: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  mahasiswa: 'bg-blue-50 text-blue-800 border-blue-200',
  dosen: 'bg-purple-50 text-purple-800 border-purple-200',
  admin: 'bg-orange-50 text-orange-800 border-orange-200',
}

export function UserManagementTable({ users: initialUsers, currentUserId }: Props) {
  const [userList, setUserList] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // State untuk modal konfirmasi ganti role
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: User
    newRole: string
  } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function executeUpdate(userId: string, field: 'role' | 'isActive', value: string | boolean) {
    if (userId === currentUserId) {
      showToast('Tidak dapat mengubah akun Anda sendiri.', 'error')
      return
    }
    setLoadingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Gagal memperbarui.', 'error')
        return
      }
      const updated = await res.json()
      startTransition(() => {
        setUserList((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, role: updated.role, isActive: updated.isActive }
              : u
          )
        )
      })
      showToast('Berhasil diperbarui.', 'success')
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  function handleRoleSelect(user: User, newRole: string) {
    if (user.id === currentUserId) {
      showToast('Tidak dapat mengubah akun Anda sendiri.', 'error')
      return
    }
    if (user.role === newRole) return
    // Buka modal konfirmasi
    setPendingRoleChange({ user, newRole })
  }

  const filtered = userList.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.institutionalId?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 rounded-xl bg-amber-100">
                <AlertTriangle className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Perubahan Hak Akses</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengubah peran pengguna{' '}
              <strong className="text-slate-900">{pendingRoleChange.user.fullName}</strong> dari{' '}
              <span className="font-semibold text-slate-800 uppercase text-xs">{pendingRoleChange.user.role}</span> menjadi{' '}
              <span className="font-semibold text-blue-700 uppercase text-xs">{pendingRoleChange.newRole}</span>?
            </p>
            {pendingRoleChange.newRole === 'admin' && (
              <p className="mt-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Peran Admin memiliki akses penuh terhadap manajemen laboratorium, persetujuan jadwal, dan hak pengguna.
              </p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { user, newRole } = pendingRoleChange
                  setPendingRoleChange(null)
                  await executeUpdate(user.id, 'role', newRole)
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Ya, Ubah Peran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" strokeWidth={2} />
          <input
            type="text"
            placeholder="Cari nama, email, NIM/NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white/70 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Semua Role</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="dosen">Dosen</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Stats summary */}
      <div className="flex gap-3 text-xs text-slate-600 font-medium">
        <span>Total: <strong className="text-slate-900">{userList.length}</strong></span>
        <span>·</span>
        <span>Aktif: <strong className="text-emerald-700">{userList.filter(u => u.isActive).length}</strong></span>
        <span>·</span>
        <span>Nonaktif: <strong className="text-rose-700">{userList.filter(u => !u.isActive).length}</strong></span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl glass-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-700">Nama</th>
              <th className="px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">NIM/NIP</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-center">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-right hidden sm:table-cell">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isSelf = user.id === currentUserId
                const isLoading = loadingId === user.id && isPending
                return (
                  <tr key={user.id} className={`hover:bg-white/50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                            {user.fullName}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-600 truncate max-w-[180px] font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium hidden md:table-cell">
                      {user.institutionalId ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold border ${ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={loadingId === user.id}
                          onChange={(e) => handleRoleSelect(user, e.target.value)}
                          className={`rounded-xl border px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                            ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="mahasiswa">Mahasiswa</option>
                          <option value="dosen">Dosen</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelf ? (
                        <span className="inline-block rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                          Aktif
                        </span>
                      ) : (
                        <button
                          disabled={loadingId === user.id}
                          onClick={() => executeUpdate(user.id, 'isActive', !user.isActive)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 border ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {isLoading && (
                        <span className="text-xs text-slate-500 font-medium animate-pulse">Menyimpan...</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 font-medium">
        Menampilkan {filtered.length} dari {userList.length} pengguna. Perubahan role memerlukan konfirmasi admin.
      </p>
    </div>
  )
}
