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

  async function executeNameUpdate(user: User, newName: string) {
    setLoadingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newName }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal memperbarui nama pengguna.', 'error')
        return
      }
      setUserList((prev) => prev.map((u) => u.id === user.id ? { ...u, fullName: data.fullName } : u))
      showToast('Nama pengguna berhasil diperbarui.', 'success')
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  async function executePasswordReset(user: User) {
    setLoadingId(user.id)
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal membuat reset password.', 'error')
        return
      }
      showToast(data.resetUrl ? 'Link reset lokal berhasil dibuat.' : `Instruksi reset dikirim ke ${user.email}.`, 'success')
      if (data.resetUrl && navigator.clipboard) await navigator.clipboard.writeText(data.resetUrl)
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  function handleActionClick(action: 'edit' | 'reset' | 'toggle' | 'verify' | 'reject', user: User) {
    setActiveMenuId(null)
    if (action === 'edit') {
      const newName = prompt(`Ubah Nama Pengguna (${user.fullName}):`, user.fullName)
      if (newName && newName.trim() && newName !== user.fullName) {
        executeNameUpdate(user, newName.trim())
      }
    } else if (action === 'reset') {
      if (confirm(`Kirim tautan reset kata sandi ke email ${user.email}?`)) {
        executePasswordReset(user)
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
          className={`fixed top-4 right-4 z-50 rounded-xl border-2 border-slate-900 px-4 py-3 text-xs font-bold shadow-[3px_3px_0px_0px_#0f172a] transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-rose-50 text-rose-800'
          }`}
          role="status"
        >
          {toast.msg}
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="neo-card max-w-md w-full overflow-hidden shadow-[6px_6px_0px_0px_#0f172a]">
            <div
              aria-hidden="true"
              style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }}
            />
            <div className="px-5 py-4 border-b-2 border-slate-900 bg-slate-50 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] shrink-0">
                <AlertTriangle className="h-4 w-4 text-slate-900" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Konfirmasi Perubahan Role</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                Ubah peran <span className="font-black text-slate-900">{pendingRoleChange.user.fullName}</span> dari{' '}
                <span className="font-black text-slate-800 uppercase">{pendingRoleChange.user.role}</span> menjadi{' '}
                <span className="font-black text-blue-600 uppercase">{pendingRoleChange.newRole}</span>?
              </p>
              {pendingRoleChange.newRole === 'admin' && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-3.5 py-3 text-xs font-bold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  Akun ini akan memiliki hak penuh untuk menyetujui jadwal dan mengubah data laboratorium.
                </div>
              )}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setPendingRoleChange(null)} className="neo-btn neo-btn-white px-4 py-2 text-xs font-black">Batal</button>
                <button
                  type="button"
                  onClick={async () => {
                    const { user, newRole } = pendingRoleChange
                    setPendingRoleChange(null)
                    await executeUpdate(user.id, 'role', newRole)
                  }}
                  className="neo-btn neo-btn-primary px-4 py-2 text-xs font-black"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, email, NIM/NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari pengguna"
            className="w-full rounded-lg border-2 border-slate-900 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter berdasarkan peran"
          className="rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none cursor-pointer"
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
      <div className="flex gap-3 text-xs font-bold text-slate-500">
        <span>Total: <strong className="text-slate-800">{userList.length}</strong></span>
        <span>·</span>
        <span>Aktif: <strong className="text-emerald-700">{userList.filter(u => u.isActive).length}</strong></span>
        <span>·</span>
        <span>Nonaktif: <strong className="text-rose-700">{userList.filter(u => !u.isActive).length}</strong></span>
      </div>

      {/* Table */}
      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-amber-100 border-b-2 border-slate-900 text-[11px] font-black text-slate-900 uppercase tracking-wider">
              <th className="px-4 py-3">Nama Pengguna</th>
              <th className="px-4 py-3 hidden md:table-cell">NIM / NIP</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                  {search || roleFilter !== 'all' ? 'Tidak ada pengguna yang sesuai filter.' : 'Belum ada pengguna terdaftar.'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isSelf = user.id === currentUserId
                const isMenuOpen = activeMenuId === user.id

                return (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-300 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0f172a] text-slate-950 text-xs font-black">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate max-w-[180px]">
                            {user.fullName}
                            {isSelf && <span className="ml-1.5 text-[9px] bg-blue-600 text-white border border-slate-900 px-1.5 py-0.5 rounded-full font-black">Anda</span>}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-600 hidden md:table-cell">{user.institutionalId ?? '—'}</td>

                    <td className="px-4 py-3.5">
                      {isSelf ? (
                        <span className="neo-badge bg-amber-300 text-slate-950 text-[10px] uppercase">{ROLE_LABELS[user.role] ?? user.role}</span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={loadingId === user.id}
                          onChange={(e) => handleRoleSelect(user, e.target.value)}
                          className="rounded-md border-2 border-slate-900 bg-white px-2 py-1 text-[11px] font-black shadow-[1.5px_1.5px_0px_0px_#0f172a] focus:outline-none cursor-pointer"
                        >
                          <option value="mahasiswa">Mahasiswa</option>
                          <option value="dosen">Dosen</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={`neo-badge text-[10px] ${user.isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-slate-950' : 'bg-slate-500'}`} />
                        {user.verificationStatus === 'PENDING' ? 'Verifikasi' : user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right relative">
                      <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(isMenuOpen ? null : user.id)}
                          className="neo-btn neo-btn-white h-8 w-8 p-0 justify-center"
                          title="Menu Aksi"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 z-40 mt-1 w-48 origin-top-right neo-card overflow-hidden shadow-[4px_4px_0px_0px_#0f172a]">
                            <button type="button" onClick={() => handleActionClick('edit', user)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-50 transition-colors">
                              <UserCog className="h-3.5 w-3.5 text-slate-500" />Edit Profil
                            </button>
                            <button type="button" onClick={() => handleActionClick('reset', user)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-50 transition-colors">
                              <KeyRound className="h-3.5 w-3.5 text-slate-500" />Reset Password
                            </button>
                            <div className="border-t-2 border-slate-100" />
                            {user.verificationStatus === 'PENDING' ? (
                              <>
                                <button type="button" onClick={() => handleActionClick('verify', user)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition-colors">
                                  <UserCheck className="h-3.5 w-3.5" />Verifikasi & Aktifkan
                                </button>
                                <button type="button" onClick={() => handleActionClick('reject', user)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-50 transition-colors">
                                  <UserX className="h-3.5 w-3.5" />Tolak Verifikasi
                                </button>
                              </>
                            ) : user.isActive ? (
                              <button type="button" disabled={isSelf} onClick={() => handleActionClick('toggle', user)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40">
                                <UserX className="h-3.5 w-3.5" />Nonaktifkan Akun
                              </button>
                            ) : (
                              <button type="button" disabled={isSelf} onClick={() => handleActionClick('toggle', user)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40">
                                <UserCheck className="h-3.5 w-3.5" />Aktifkan Akun
                              </button>
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
      </div>

      <p className="text-[11px] font-bold text-slate-400">Menampilkan {filtered.length} dari {userList.length} pengguna.</p>
    </div>
  )
}
