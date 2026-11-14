'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FlaskConical,
  MapPin,
  Users,
  AlignLeft,
  ToggleLeft,
  ToggleRight,
  Save,
  ArrowLeft,
} from 'lucide-react'

interface Lab {
  id: string
  name: string
  location: string
  capacity: number
  description: string | null
  isActive: boolean
}

interface Props {
  mode: 'create' | 'edit'
  lab?: Lab
}

export function LabForm({ mode, lab }: Props) {
  const router = useRouter()
  const [name, setName] = useState(lab?.name ?? '')
  const [location, setLocation] = useState(lab?.location ?? '')
  const [capacity, setCapacity] = useState(lab?.capacity?.toString() ?? '')
  const [description, setDescription] = useState(lab?.description ?? '')
  const [isActive, setIsActive] = useState(lab?.isActive ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nama laboratorium wajib diisi.'
    if (!location.trim()) e.location = 'Lokasi wajib diisi.'
    if (!capacity || parseInt(capacity) < 1) e.capacity = 'Kapasitas harus minimal 1 orang.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    setSaved(false)

    const url = mode === 'create' ? '/api/admin/labs' : `/api/admin/labs/${lab?.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'
    const payload = {
      name: name.trim(),
      location: location.trim(),
      capacity: parseInt(capacity),
      description: description.trim() || null,
      isActive,
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? 'Terjadi kesalahan saat menyimpan.')
        setLoading(false)
        return
      }

      if (mode === 'create') {
        router.push('/admin/labs')
        router.refresh()
      } else {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setServerError('Terjadi kesalahan jaringan. Periksa koneksi Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="neo-card bg-white p-6">
      {/* Card Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 border border-slate-200 shadow-sm">
          <FlaskConical className="h-5 w-5 text-slate-900" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900">
            {mode === 'create' ? 'Informasi Laboratorium Baru' : 'Edit Informasi Laboratorium'}
          </h2>
          <p className="text-xs font-bold text-slate-500">
            {mode === 'create' ? 'Isi detail ruangan untuk mendaftarkan lab baru.' : 'Perbarui detail dan pengaturan ruangan.'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {serverError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-400 px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
          ⚠ {serverError}
        </div>
      )}
      {saved && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-500 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm">
          ✓ Perubahan berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 mb-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-slate-500" />
            Nama Laboratorium <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Contoh: Lab Komputer Sisfor A"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all ${
              errors.name ? 'border-red-500 shadow-sm' : 'border-slate-200'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs font-bold text-red-600">{errors.name}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 mb-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            Lokasi / Gedung <span className="text-red-500">*</span>
          </label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Contoh: Gedung A Lantai 2, Kampus UISI"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all ${
              errors.location ? 'border-red-500 shadow-sm' : 'border-slate-200'
            }`}
          />
          {errors.location && <p className="mt-1 text-xs font-bold text-red-600">{errors.location}</p>}
        </div>

        {/* Capacity */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 mb-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            Kapasitas Maksimum <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="300"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder="30"
              className={`w-32 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all ${
                errors.capacity ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            <span className="text-sm font-black text-slate-600">orang / kursi</span>
          </div>
          {errors.capacity && <p className="mt-1 text-xs font-bold text-red-600">{errors.capacity}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 mb-1.5">
            <AlignLeft className="h-3.5 w-3.5 text-slate-500" />
            Deskripsi Ruangan
            <span className="ml-1 text-[10px] font-bold text-slate-400">(opsional)</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Deskripsikan fungsi utama lab, peralatan utama, aturan penggunaan, atau catatan khusus untuk peminjam..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none transition-all"
          />
          <p className="mt-1 text-xs font-bold text-slate-400">{description.length} / 500 karakter</p>
        </div>

        {/* Status Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          isActive
            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
            : 'border-amber-500 bg-amber-50 shadow-sm'
        }`}>
          <div>
            <p className="text-sm font-black text-slate-900">Status Lab</p>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {isActive
                ? '✓ Lab aktif — mahasiswa dapat mengajukan peminjaman'
                : '⚠ Lab nonaktif — tidak dapat menerima pengajuan baru'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(v => !v)}
            className="ml-4 shrink-0 transition-transform hover:scale-105"
          >
            {isActive ? (
              <ToggleRight className="h-9 w-9 text-emerald-600" strokeWidth={1.5} />
            ) : (
              <ToggleLeft className="h-9 w-9 text-amber-600" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 neo-btn neo-btn-primary py-2.5 text-sm font-black disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Lab' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
