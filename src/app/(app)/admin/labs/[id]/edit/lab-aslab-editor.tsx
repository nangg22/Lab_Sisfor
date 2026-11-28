'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, Trash2, Plus, AlertCircle, Users } from 'lucide-react'

interface AssignedUser {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  role: string | null
}

interface AslabCandidate {
  id: string
  fullName: string
  email: string
}

interface Props {
  laboratoryId: string
  initialAssignments: AssignedUser[]
  aslabCandidates: AslabCandidate[]
}

export function LabAslabEditor({ laboratoryId, initialAssignments, aslabCandidates }: Props) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<AssignedUser[]>(initialAssignments)
  const [selectedId, setSelectedId]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [removingId, setRemovingId]   = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  // Filter out already-assigned from candidates
  const assignedUserIds = new Set(assignments.map((a) => a.userId))
  const available = aslabCandidates.filter((c) => !assignedUserIds.has(c.id))

  async function handleAssign() {
    if (!selectedId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal menugaskan aslab.'); return }

      // Find candidate data to append optimistically
      const added = aslabCandidates.find((c) => c.id === selectedId)
      if (added) {
        setAssignments((prev) => [...prev, { id: data.id, userId: added.id, fullName: added.fullName, email: added.email, role: 'aslab' }])
      }
      setSelectedId('')
      router.refresh()
    } catch { setError('Terjadi kesalahan jaringan.') }
    finally { setLoading(false) }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Hapus penugasan aslab ini?')) return
    setRemovingId(userId); setError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Gagal menghapus.'); return }
      setAssignments((prev) => prev.filter((a) => a.userId !== userId))
      router.refresh()
    } catch { setError('Terjadi kesalahan jaringan.') }
    finally { setRemovingId(null) }
  }

  return (
    <div className="neo-card overflow-hidden bg-white">
      {/* Amber stripe */}
      <div aria-hidden="true" style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-900 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
            <Users className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Asisten Lab Ditugaskan</h2>
            <p className="text-[11px] font-bold text-slate-500">Aslab yang bertanggung jawab di ruangan ini</p>
          </div>
        </div>
        <span className="neo-badge bg-emerald-100 text-slate-900 text-[10px]">{assignments.length} aslab</span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{error}
          </div>
        )}

        {/* Assign form */}
        {available.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none cursor-pointer"
            >
              <option value="">-- Pilih Aslab --</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedId || loading}
              className="neo-btn neo-btn-primary min-h-11 justify-center px-3 py-2 text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed sm:shrink-0"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              {loading ? 'Menugaskan…' : 'Tugaskan'}
            </button>
          </div>
        ) : (
          <p className="text-xs font-bold text-slate-400">
            {aslabCandidates.length === 0
              ? 'Belum ada user dengan role aslab terdaftar.'
              : 'Semua aslab sudah ditugaskan ke lab ini.'}
          </p>
        )}

        {/* Assignment list */}
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <UserCheck className="h-8 w-8 text-slate-300 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-black text-slate-500">Belum ada aslab ditugaskan.</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Pilih aslab di atas untuk menugaskan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-900 bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#0f172a]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-300 border-2 border-slate-900 text-slate-950 text-xs font-black">
                    {(a.fullName ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{a.fullName ?? '—'}</p>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{a.email ?? '—'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(a.userId)}
                  disabled={removingId === a.userId}
                  className="neo-btn min-h-11 min-w-11 justify-center px-2.5 py-1.5 text-[11px] font-black border-2 border-slate-900 bg-white text-rose-600 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-rose-50 disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />{removingId === a.userId ? '…' : 'Hapus'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
