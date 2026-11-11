'use client'

import { useState, useTransition } from 'react'
import type { RoleCode } from '@/db/schema'

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
  mahasiswa: 'bg-blue-100 text-blue-700',
  dosen: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

export function UserManagementTable({ users: initialUsers, currentUserId }: Props) {
  const [userList, setUserList] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleUpdate(userId: string, field: 'role' | 'isActive', value: string | boolean) {
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
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Cari nama, email, NIM/NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Semua Role</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="dosen">Dosen</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Stats summary */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>Total: <strong className="text-gray-800">{userList.length}</strong></span>
        <span>·</span>
        <span>Aktif: <strong className="text-green-700">{userList.filter(u => u.isActive).length}</strong></span>
        <span>·</span>
        <span>Nonaktif: <strong className="text-red-600">{userList.filter(u => !u.isActive).length}</strong></span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Nama</th>
              <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">NIM/NIP</th>
              <th className="px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-center">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right hidden sm:table-cell">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isSelf = user.id === currentUserId
                const isLoading = loadingId === user.id && isPending
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">
                            {user.fullName}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {user.institutionalId ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={loadingId === user.id}
                          onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                          className={`rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'
                          } border-transparent`}
                        >
                          <option value="mahasiswa">Mahasiswa</option>
                          <option value="dosen">Dosen</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelf ? (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Aktif
                        </span>
                      ) : (
                        <button
                          disabled={loadingId === user.id}
                          onClick={() => handleUpdate(user.id, 'isActive', !user.isActive)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {isLoading && (
                        <span className="text-xs text-gray-400 animate-pulse">Menyimpan...</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Menampilkan {filtered.length} dari {userList.length} pengguna. Perubahan role dan status disimpan otomatis.
      </p>
    </div>
  )
}

