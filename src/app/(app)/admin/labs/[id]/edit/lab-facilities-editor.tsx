'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  PackageOpen,
  Layers,
} from 'lucide-react'

export interface Facility {
  id: string
  facilityName: string
  category: string
  brandModel: string | null
  quantity: number | null
  condition: string
  isBorrowable: boolean
  details: string | null
}

interface Props {
  laboratoryId: string
  initialFacilities: Facility[]
}

const CATEGORIES = [
  'Komputer',
  'Display / TV',
  'Proyektor',
  'Jaringan',
  'Audio / Visual',
  'Furnitur',
  'Lainnya',
]

const CONDITIONS = ['Baik', 'Perlu Perawatan', 'Rusak']

function conditionBadgeClass(condition: string) {
  if (condition === 'Rusak') return 'bg-rose-100 border-rose-400 text-rose-800'
  if (condition === 'Perlu Perawatan') return 'bg-amber-100 border-amber-400 text-amber-800'
  return 'bg-emerald-100 border-emerald-400 text-emerald-800'
}

export function LabFacilitiesEditor({ laboratoryId, initialFacilities }: Props) {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities)

  // — Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addCategory, setAddCategory] = useState('Komputer')
  const [addBrand, setAddBrand] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addCondition, setAddCondition] = useState('Baik')
  const [addBorrowable, setAddBorrowable] = useState(true)
  const [addDetails, setAddDetails] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // — Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('Lainnya')
  const [editBrand, setEditBrand] = useState('')
  const [editQty, setEditQty] = useState('')
  const [editCondition, setEditCondition] = useState('Baik')
  const [editBorrowable, setEditBorrowable] = useState(true)
  const [editDetails, setEditDetails] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim()) { setAddError('Nama inventaris/alat tidak boleh kosong.'); return }
    setAdding(true); setAddError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: addName.trim(),
          category: addCategory,
          brandModel: addBrand.trim() || null,
          quantity: addQty || null,
          condition: addCondition,
          isBorrowable: addBorrowable,
          details: addDetails.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Gagal menambahkan inventaris.'); return }
      setFacilities(prev => [...prev, data.facility])
      setAddName(''); setAddCategory('Komputer'); setAddBrand(''); setAddQty('')
      setAddCondition('Baik'); setAddBorrowable(true); setAddDetails(''); setShowAddForm(false)
      router.refresh()
    } catch { setAddError('Terjadi kesalahan jaringan.') }
    finally { setAdding(false) }
  }

  function startEdit(f: Facility) {
    setEditingId(f.id)
    setEditName(f.facilityName)
    setEditCategory(f.category || 'Lainnya')
    setEditBrand(f.brandModel ?? '')
    setEditQty(f.quantity?.toString() ?? '')
    setEditCondition(f.condition || 'Baik')
    setEditBorrowable(f.isBorrowable ?? true)
    setEditDetails(f.details ?? '')
    setError(null)
  }

  function cancelEdit() { setEditingId(null); setError(null) }

  async function handleSaveEdit(facilityId: string) {
    if (!editName.trim()) { setError('Nama inventaris/alat tidak boleh kosong.'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities/${facilityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: editName.trim(),
          category: editCategory,
          brandModel: editBrand.trim() || null,
          quantity: editQty || null,
          condition: editCondition,
          isBorrowable: editBorrowable,
          details: editDetails.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal menyimpan perubahan.'); return }
      setFacilities(prev => prev.map(f => f.id === facilityId ? data.facility : f))
      setEditingId(null)
      router.refresh()
    } catch { setError('Terjadi kesalahan jaringan.') }
    finally { setSaving(false) }
  }

  async function handleDelete(facilityId: string, name: string) {
    if (!confirm(`Hapus inventaris "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeletingId(facilityId); setError(null)
    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities/${facilityId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Gagal menghapus.'); return }
      setFacilities(prev => prev.filter(f => f.id !== facilityId))
      router.refresh()
    } catch { setError('Terjadi kesalahan saat menghapus.') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="neo-card bg-white p-6 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
            <Layers className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Inventaris &amp; Spesifikasi Alat Lab</h2>
            <p className="text-xs font-bold text-slate-500">
              Catat seluruh alat, merek/tipe, jumlah, kondisi, serta spesifikasi detail (TV, PC, Proyektor, dll.)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
            {facilities.length} item
          </span>
          <button
            type="button"
            onClick={() => { setShowAddForm(v => !v); setAddError(null) }}
            className="neo-btn neo-btn-primary px-3 py-1.5 text-xs font-black"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Inventaris</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-400 px-4 py-2.5 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="mb-5 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-4 space-y-3"
        >
          <p className="text-xs font-black text-blue-700 uppercase tracking-wider">+ Tambah Inventaris Lab</p>
          {addError && <p className="text-xs font-bold text-red-600">{addError}</p>}

          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="block text-xs font-black text-slate-700 mb-1">Nama Alat / Inventaris *</label>
              <input
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Contoh: Smart TV, PC Workstation, Proyektor"
                required
                className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[2px_2px_0px_0px_#0f172a]"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-black text-slate-700 mb-1">Kategori</label>
              <select
                value={addCategory}
                onChange={e => setAddCategory(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[2px_2px_0px_0px_#0f172a]"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-black text-slate-700 mb-1">Jumlah Unit</label>
              <input
                type="number"
                value={addQty}
                onChange={e => setAddQty(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[2px_2px_0px_0px_#0f172a]"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-black text-slate-700 mb-1">Merek / Tipe / Model</label>
              <input
                value={addBrand}
                onChange={e => setAddBrand(e.target.value)}
                placeholder="Contoh: Samsung Crystal UHD 65&quot; / Dell OptiPlex 7090"
                className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[2px_2px_0px_0px_#0f172a]"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-black text-slate-700 mb-1">Kondisi</label>
              <select
                value={addCondition}
                onChange={e => setAddCondition(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[2px_2px_0px_0px_#0f172a]"
              >
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4 flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-slate-900 bg-white px-3 py-2 w-full shadow-[2px_2px_0px_0px_#0f172a]">
                <input
                  type="checkbox"
                  checked={addBorrowable}
                  onChange={e => setAddBorrowable(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-400 text-blue-600"
                />
                <span className="text-xs font-black text-slate-800">Bisa Dipinjam Khusus</span>
              </label>
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-black text-slate-700 mb-1">Spesifikasi Teknis Lengkap</label>
              <textarea
                rows={2}
                value={addDetails}
                onChange={e => setAddDetails(e.target.value)}
                placeholder="Contoh TV: Layar 65 inch 4K UHD, 3x Port HDMI, Smart OS, Support Screen Mirroring & Kabel HDMI 5m.&#10;Contoh PC: Intel Core i7-12700, RAM 16GB DDR4, SSD 512GB NVMe, Monitor Dell 24&quot;."
                className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[2px_2px_0px_0px_#0f172a] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddError(null) }}
              className="px-4 py-1.5 text-xs font-black rounded-lg border-2 border-slate-900 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={adding}
              className="neo-btn neo-btn-primary px-4 py-1.5 text-xs font-black disabled:opacity-60"
            >
              {adding ? 'Menyimpan...' : 'Simpan Inventaris'}
            </button>
          </div>
        </form>
      )}

      {/* Facilities list */}
      <div className="space-y-2.5">
        {facilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <PackageOpen className="h-9 w-9 text-slate-300 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-black text-slate-500">Belum ada inventaris terdaftar.</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Klik &ldquo;Tambah Inventaris&rdquo; untuk mencatat alat &amp; spesifikasinya.</p>
          </div>
        ) : (
          facilities.map(f => {
            const isEditing = editingId === f.id
            const isDeleting = deletingId === f.id

            return (
              <div
                key={f.id}
                className={`rounded-xl border-2 transition-all ${
                  isEditing
                    ? 'border-blue-500 bg-blue-50 shadow-[2px_2px_0px_0px_theme(colors.blue.500)]'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                } p-3.5`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid gap-2.5 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-black text-blue-700 mb-1">Nama Alat *</label>
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-black text-blue-700 mb-1">Kategori</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="w-full rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-black text-blue-700 mb-1">Jumlah Unit</label>
                        <input
                          type="number"
                          min="1"
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                          className="w-full rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-black text-blue-700 mb-1">Merek / Tipe</label>
                        <input
                          value={editBrand}
                          onChange={e => setEditBrand(e.target.value)}
                          placeholder="Merek & model alat"
                          className="w-full rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-black text-blue-700 mb-1">Kondisi</label>
                        <select
                          value={editCondition}
                          onChange={e => setEditCondition(e.target.value)}
                          className="w-full rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none"
                        >
                          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-4 flex items-end pb-0.5">
                        <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 w-full">
                          <input
                            type="checkbox"
                            checked={editBorrowable}
                            onChange={e => setEditBorrowable(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-400 text-blue-600"
                          />
                          <span className="text-xs font-black text-slate-800">Bisa Dipinjam Khusus</span>
                        </label>
                      </div>

                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-black text-blue-700 mb-1">Spesifikasi Teknis Lengkap</label>
                        <textarea
                          rows={2}
                          value={editDetails}
                          onChange={e => setEditDetails(e.target.value)}
                          placeholder="Jelaskan spesifikasi detail (ukuran layar, port, prosesor, RAM, dll.)"
                          className="w-full rounded-lg border-2 border-blue-500 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg border-2 border-slate-900 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-3 w-3" /> Batal
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveEdit(f.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg border-2 border-blue-700 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-[2px_2px_0px_0px_#1e3a8a] disabled:opacity-60"
                      >
                        <Check className="h-3 w-3" /> {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-slate-900">{f.facilityName}</span>
                        {f.brandModel && (
                          <span className="text-xs font-bold text-slate-600">({f.brandModel})</span>
                        )}
                        <span className="rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-black text-slate-700">
                          {f.category || 'Lainnya'}
                        </span>
                        {f.quantity && (
                          <span className="rounded-full bg-amber-100 border border-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-800">
                            {f.quantity} unit
                          </span>
                        )}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${conditionBadgeClass(f.condition)}`}>
                          {f.condition || 'Baik'}
                        </span>
                        {f.isBorrowable && (
                          <span className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-black text-blue-800">
                            Bisa Dipinjam Khusus
                          </span>
                        )}
                      </div>
                      {f.details && (
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">{f.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(f)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-black rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                        title="Edit inventaris"
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id, f.facilityName)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-black rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-500 transition-colors disabled:opacity-50"
                        title="Hapus inventaris"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">{isDeleting ? '...' : 'Hapus'}</span>
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
  )
}
