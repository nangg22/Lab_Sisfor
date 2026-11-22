'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X, PackageOpen, Layers, AlertCircle } from 'lucide-react'

export interface Facility {
  id: string
  facilityName: string
  quantity: number | null
  details: string | null
}

interface Props {
  laboratoryId: string
  initialFacilities: Facility[]
}

const INPUT = 'w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL = 'block text-[11px] font-black uppercase tracking-wide text-slate-700 mb-1'

export function LabFacilitiesEditor({ laboratoryId, initialFacilities }: Props) {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName]         = useState('')
  const [addQty, setAddQty]           = useState('')
  const [addDetails, setAddDetails]   = useState('')
  const [adding, setAdding]           = useState(false)
  const [addError, setAddError]       = useState<string | null>(null)

  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [editQty, setEditQty]       = useState('')
  const [editDetails, setEditDetails] = useState('')
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim()) { setAddError('Nama fasilitas tidak boleh kosong.'); return }
    setAdding(true); setAddError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: addName.trim(), quantity: addQty || null, details: addDetails.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Gagal menambahkan fasilitas.'); return }
      setFacilities((prev) => [...prev, data.facility])
      setAddName(''); setAddQty(''); setAddDetails(''); setShowAddForm(false)
      router.refresh()
    } catch { setAddError('Terjadi kesalahan jaringan.') }
    finally { setAdding(false) }
  }

  function startEdit(f: Facility) {
    setEditingId(f.id); setEditName(f.facilityName)
    setEditQty(f.quantity?.toString() ?? ''); setEditDetails(f.details ?? ''); setError(null)
  }
  function cancelEdit() { setEditingId(null); setError(null) }

  async function handleSaveEdit(facilityId: string) {
    if (!editName.trim()) { setError('Nama fasilitas tidak boleh kosong.'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities/${facilityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: editName.trim(), quantity: editQty || null, details: editDetails.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal menyimpan perubahan.'); return }
      setFacilities((prev) => prev.map((f) => f.id === facilityId ? data.facility : f))
      setEditingId(null); router.refresh()
    } catch { setError('Terjadi kesalahan jaringan.') }
    finally { setSaving(false) }
  }

  async function handleDelete(facilityId: string, name: string) {
    if (!confirm(`Hapus fasilitas "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeletingId(facilityId); setError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities/${facilityId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Gagal menghapus.'); return }
      setFacilities((prev) => prev.filter((f) => f.id !== facilityId)); router.refresh()
    } catch { setError('Terjadi kesalahan saat menghapus.') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="neo-card overflow-hidden bg-white">
      {/* Amber stripe */}
      <div aria-hidden="true" style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-900 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
            <Layers className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Daftar Fasilitas</h2>
            <p className="text-[11px] font-bold text-slate-500">Inventaris perlengkapan ruangan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="neo-badge bg-blue-100 text-slate-900 text-[10px]">{facilities.length} item</span>
          <button type="button" onClick={() => { setShowAddForm((v) => !v); setAddError(null) }} className="neo-btn neo-btn-primary px-3 py-1.5 text-xs font-black">
            <Plus className="h-3.5 w-3.5" />Tambah
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Global error */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{error}
          </div>
        )}

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="rounded-xl border-2 border-blue-600 bg-blue-50 shadow-[2px_2px_0px_0px_#2563eb] p-4 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">+ Fasilitas Baru</p>
            {addError && <p className="text-xs font-bold text-rose-600">{addError}</p>}
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className={LABEL}>Nama Fasilitas <span className="text-rose-500">*</span></label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Contoh: PC Core i7, Proyektor" required className={INPUT} />
              </div>
              <div className="sm:col-span-3">
                <label className={LABEL}>Jumlah Unit</label>
                <input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} placeholder="30" min="1" className={INPUT} />
              </div>
              <div className="sm:col-span-4">
                <label className={LABEL}>Spesifikasi</label>
                <input value={addDetails} onChange={(e) => setAddDetails(e.target.value)} placeholder="RAM 16GB, SSD 512GB" className={INPUT} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowAddForm(false); setAddError(null) }} className="neo-btn neo-btn-white px-4 py-1.5 text-xs font-black">Batal</button>
              <button type="submit" disabled={adding} className="neo-btn neo-btn-primary px-4 py-1.5 text-xs font-black disabled:opacity-60">
                {adding ? 'Menyimpan…' : 'Simpan Fasilitas'}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="space-y-2">
          {facilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <PackageOpen className="h-9 w-9 text-slate-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm font-black text-slate-500">Belum ada fasilitas terdaftar.</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Klik tombol &quot;Tambah&quot; untuk menambahkan.</p>
            </div>
          ) : (
            facilities.map((f) => {
              const isEditing  = editingId === f.id
              const isDeleting = deletingId === f.id

              return (
                <div
                  key={f.id}
                  className={`rounded-xl border-2 p-3 transition-all ${
                    isEditing ? 'border-blue-600 bg-blue-50 shadow-[2px_2px_0px_0px_#2563eb]' : 'border-slate-200 bg-white hover:border-slate-900'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <div className="grid gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <label className={LABEL + ' text-blue-700'}>Nama Fasilitas *</label>
                          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className={INPUT} />
                        </div>
                        <div className="sm:col-span-3">
                          <label className={LABEL + ' text-blue-700'}>Jumlah Unit</label>
                          <input type="number" min="1" value={editQty} onChange={(e) => setEditQty(e.target.value)} className={INPUT} />
                        </div>
                        <div className="sm:col-span-4">
                          <label className={LABEL + ' text-blue-700'}>Spesifikasi</label>
                          <input value={editDetails} onChange={(e) => setEditDetails(e.target.value)} className={INPUT} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={cancelEdit} className="neo-btn neo-btn-white px-3 py-1.5 text-xs font-black">
                          <X className="h-3 w-3" />Batal
                        </button>
                        <button type="button" disabled={saving} onClick={() => handleSaveEdit(f.id)} className="neo-btn neo-btn-primary px-3 py-1.5 text-xs font-black disabled:opacity-60">
                          <Check className="h-3 w-3" />{saving ? 'Menyimpan…' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">{f.facilityName}</span>
                          {f.quantity && (
                            <span className="neo-badge bg-amber-300 text-slate-950 text-[10px]">{f.quantity} unit</span>
                          )}
                        </div>
                        {f.details && <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">{f.details}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button type="button" onClick={() => startEdit(f)} className="neo-btn neo-btn-white px-2.5 py-1.5 text-xs font-black" title="Edit">
                          <Pencil className="h-3 w-3" /><span className="hidden sm:inline">Edit</span>
                        </button>
                        <button type="button" onClick={() => handleDelete(f.id, f.facilityName)} disabled={isDeleting} className="neo-btn px-2.5 py-1.5 text-xs font-black border-2 border-slate-900 bg-white text-rose-600 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-rose-50 disabled:opacity-50" title="Hapus">
                          <Trash2 className="h-3 w-3" /><span className="hidden sm:inline">{isDeleting ? '…' : 'Hapus'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
