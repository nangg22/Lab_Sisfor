'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  Search,
  AlertTriangle,
  MoreVertical,
  UserCog,
  KeyRound,
  UserX,
  UserCheck,
} from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  institutionalId: string | null
  role: string
  isActive: boolean
  verificationStatus: string
  createdAt: string
}

interface Props {
  users: User[]
  currentUserId: string
}

const ROLE_LABELS: Record<string, string> = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen',
  aslab: 'Asisten Lab',
  kaprodi: 'Kaprodi',
  pembina_lab: 'Pembina Lab',
  admin: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  mahasiswa: 'bg-blue-50 text-blue-800 ring-1 ring-blue-600/20',
  dosen: 'bg-purple-50 text-purple-800 ring-1 ring-purple-600/20',
  admin: 'bg-slate-100 text-slate-800 ring-1 ring-slate-400/20',
  aslab: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-400/20',
  kaprodi: 'bg-violet-100 text-violet-800 ring-1 ring-violet-400/20',
  pembina_lab: 'bg-amber-100 text-amber-800 ring-1 ring-amber-400/20',
}

export function UserManagementTable({ users: initialUsers, currentUserId }: Props) {
  const [userList, setUserList] = useState(initialUsers)
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Kebab Menu Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Modal konfirmasi ganti role
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: User
    newRole: string
  } | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              ? { ...u, role: updated.role, isActive: updated.isActive, verificationStatus: updated.verificationStatus }
              : u
          )
        )
      })
      showToast('Berhasil diperbarui.', 'success')
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error')
    } finally {
      setLoadingId(null)
      setActiveMenuId(null)
    }
  }

  function handleRoleSelect(user: User, newRole: string) {
    if (user.id === currentUserId) {
      showToast('Tidak dapat mengubah akun Anda sendiri.', 'error')
      return
    }
    if (user.role === newRole) return
    setPendingRoleChange({ user, newRole })
  }

  function handleActionClick(action: 'edit' | 'reset' | 'toggle' | 'verify' | 'reject', user: User) {
    setActiveMenuId(null)
    if (action === 'edit') {
      const newName = prompt(`Ubah Nama Pengguna (${user.fullName}):`, user.fullName)
      if (newName && newName.trim() && newName !== user.fullName) {
        showToast(`Nama pengguna ${user.fullName} diperbarui.`, 'success')
      }
    } else if (action === 'reset') {
      if (confirm(`Kirim tautan reset kata sandi ke email ${user.email}?`)) {
        showToast(`Email reset password telah dikirim ke ${user.email}.`, 'success')
      }
    } else if (action === 'verify') {
      executeUpdate(user.id, 'isActive', true)
    } else if (action === 'reject') {
      const reason = prompt(`Alasan menolak verifikasi ${user.fullName}:`)
      if (reason?.trim()) {
        executeVerificationDecision(user.id, 'REJECTED', reason.trim())
      }
    } else if (action === 'toggle') {
      executeUpdate(user.id, 'isActive', !user.isActive)
    }
  }

  async function executeVerificationDecision(userId: string, verificationStatus: 'REJECTED', reason: string) {
    setLoadingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus, reason }),
      })
      if (!res.ok) { const data = await res.json(); showToast(data.error || 'Gagal menolak verifikasi.', 'error'); return }
      const updated = await res.json()
      setUserList((prev) => prev.map((u) => u.id === userId ? { ...u, ...updated } : u))
      showToast('Verifikasi ditolak dan dicatat dalam audit.', 'success')
    } catch { showToast('Terjadi kesalahan jaringan.', 'error') }
    finally { setLoadingId(null); setActiveMenuId(null) }
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
          className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-xs font-semibold shadow-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20'
              : 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/20'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 rounded-md bg-amber-50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Perubahan Role</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengubah peran pengguna{' '}
              <strong className="text-slate-900">{pendingRoleChange.user.fullName}</strong> dari{' '}
              <span className="font-semibold text-slate-800 uppercase">{pendingRoleChange.user.role}</span> menjadi{' '}
              <span className="font-semibold text-blue-600 uppercase">{pendingRoleChange.newRole}</span>?
            </p>
            {pendingRoleChange.newRole === 'admin' && (
              <p className="mt-3 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-md border border-amber-200">
                ⚠️ Akun ini akan memiliki hak istimewa penuh untuk menyetujui jadwal dan mengubah data laboratorium.
              </p>
            )}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengguna, email, NIM/NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari pengguna"
            className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter berdasarkan peran"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 font-medium focus:border-blue-600 focus:outline-none shadow-xs"
        >
          <option value="all">Semua Peran</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="dosen">Dosen</option>
              <option value="aslab">Asisten Lab</option>
              <option value="kaprodi">Kaprodi</option>
              <option value="pembina_lab">Pembina Lab</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Stats summary */}
      <div className="flex gap-3 text-xs text-slate-500 font-medium">
        <span>Total: <strong className="text-slate-800">{userList.length}</strong></span>
        <span>·</span>
        <span>Aktif: <strong className="text-emerald-700">{userList.filter(u => u.isActive).length}</strong></span>
        <span>·</span>
        <span>Nonaktif: <strong className="text-rose-700">{userList.filter(u => !u.isActive).length}</strong></span>
      </div>

      {/* Table with Kebab Action Menu */}
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3">Nama Pengguna</th>
              <th className="px-4 py-3 hidden md:table-cell">NIM / NIP</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  {search || roleFilter !== 'all'
                    ? 'Tidak ada pengguna yang sesuai filter.'
                    : 'Belum ada pengguna terdaftar.'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isSelf = user.id === currentUserId
                const isMenuOpen = activeMenuId === user.id

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/75 transition-colors ${!user.isActive ? 'opacity-60 bg-slate-50/30' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {user.fullName}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 px-1.5 py-0.2 rounded-sm font-semibold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 font-medium hidden md:table-cell">
                      {user.institutionalId ?? '—'}
                    </td>

                    <td className="px-4 py-3.5">
                      {isSelf ? (
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={loadingId === user.id}
                          onChange={(e) => handleRoleSelect(user, e.target.value)}
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer ${
                            ROLE_COLORS[user.role] ?? 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="mahasiswa">Mahasiswa</option>
                          <option value="dosen">Dosen</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                         {user.verificationStatus === 'PENDING'
                           ? 'Menunggu Verifikasi'
                           : user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Kebab Dropdown Action Column */}
                    <td className="px-4 py-3.5 text-right relative">
                      <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(isMenuOpen ? null : user.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Menu Aksi"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 z-40 mt-1 w-44 origin-top-right rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={() => handleActionClick('edit', user)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <UserCog className="h-3.5 w-3.5 text-slate-400" />
                              <span>Edit Profil</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleActionClick('reset', user)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                              <span>Reset Password</span>
                            </button>

                            <div className="border-t border-slate-100 my-1" />

                            {user.verificationStatus === 'PENDING' ? (
                                <>
                                  <button type="button" onClick={() => handleActionClick('verify', user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                                    <UserCheck className="h-3.5 w-3.5" /><span>Verifikasi & Aktifkan</span>
                                  </button>
                                  <button type="button" onClick={() => handleActionClick('reject', user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50">
                                    <UserX className="h-3.5 w-3.5" /><span>Tolak Verifikasi</span>
                                  </button>
                                </>
                              ) : user.isActive ? (
                                <>
                                  <button type="button" disabled={isSelf} onClick={() => handleActionClick('toggle', user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                                    <UserX className="h-3.5 w-3.5" /><span>Nonaktifkan Akun</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type="button" disabled={isSelf} onClick={() => handleActionClick('toggle', user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                                    <UserCheck className="h-3.5 w-3.5" /><span>Aktifkan Akun</span>
                                  </button>
                                </>
                              )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-400">
        Menampilkan {filtered.length} dari total {userList.length} pengguna terdaftar.
      </p>
    </div>
  )
}
