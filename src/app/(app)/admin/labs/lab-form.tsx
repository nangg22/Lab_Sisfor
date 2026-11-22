'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, MapPin, Users, AlignLeft, Save, ArrowLeft, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'

interface Lab { id: string; name: string; location: string; capacity: number; description: string | null; isActive: boolean }
interface Props { mode: 'create' | 'edit'; lab?: Lab }

const INPUT = 'w-full rounded-lg border-2 border-slate-900 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL = 'flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-700 mb-1.5'
const ERR   = 'mt-1 text-xs font-bold text-rose-600'

export function LabForm({ mode, lab }: Props) {
  const router = useRouter()
  const [name, setName]               = useState(lab?.name ?? '')
  const [location, setLocation]       = useState(lab?.location ?? '')
  const [capacity, setCapacity]       = useState(lab?.capacity?.toString() ?? '')
  const [description, setDescription] = useState(lab?.description ?? '')
  const [isActive, setIsActive]       = useState(lab?.isActive ?? true)
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [loading, setLoading]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved]             = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim())             e.name     = 'Nama laboratorium wajib diisi.'
    if (!location.trim())         e.location = 'Lokasi wajib diisi.'
    if (!capacity || parseInt(capacity) < 1) e.capacity = 'Kapasitas harus minimal 1 orang.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setServerError(null); setSaved(false)

    const url    = mode === 'create' ? '/api/admin/labs' : `/api/admin/labs/${lab?.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), location: location.trim(), capacity: parseInt(capacity), description: description.trim() || null, isActive }),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error ?? 'Terjadi kesalahan saat menyimpan.'); return }

      if (mode === 'create') {
        router.push('/admin/labs'); router.refresh()
      } else {
        setSaved(true); router.refresh()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setServerError('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="neo-card overflow-hidden bg-white">
      {/* Amber stripe */}
      <div aria-hidden="true" style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-slate-900 bg-slate-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
          <FlaskConical className="h-4.5 w-4.5 text-slate-900" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
            {mode === 'create' ? 'Informasi Laboratorium Baru' : 'Edit Informasi Laboratorium'}
          </h2>
          <p className="text-[11px] font-bold text-slate-500">
            {mode === 'create' ? 'Isi detail ruangan untuk mendaftarkan lab baru.' : 'Perbarui detail dan pengaturan ruangan.'}
          </p>
        </div>
      </div>

      <div className="p-5">
        {/* Alerts */}
        {serverError && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{serverError}
          </div>
        )}
        {saved && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-emerald-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-emerald-700" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />Perubahan berhasil disimpan!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={LABEL}>
              <FlaskConical className="h-3.5 w-3.5 text-slate-500" />
              Nama Laboratorium <span className="text-rose-500">*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Lab Komputer Sisfor A" className={INPUT + (errors.name ? ' border-rose-600 shadow-[2px_2px_0px_0px_#e11d48]' : '')} />
            {errors.name && <p className={ERR}>{errors.name}</p>}
          </div>

          {/* Location */}
          <div>
            <label className={LABEL}>
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              Lokasi / Gedung <span className="text-rose-500">*</span>
            </label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Gedung A Lantai 2, Kampus UISI" className={INPUT + (errors.location ? ' border-rose-600 shadow-[2px_2px_0px_0px_#e11d48]' : '')} />
            {errors.location && <p className={ERR}>{errors.location}</p>}
          </div>

          {/* Capacity */}
          <div>
            <label className={LABEL}>
              <Users className="h-3.5 w-3.5 text-slate-500" />
              Kapasitas Maksimum <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input type="number" min="1" max="300" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="30" className={INPUT + ' w-28' + (errors.capacity ? ' border-rose-600 shadow-[2px_2px_0px_0px_#e11d48]' : '')} />
              <span className="text-sm font-black text-slate-600">orang / kursi</span>
            </div>
            {errors.capacity && <p className={ERR}>{errors.capacity}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>
              <AlignLeft className="h-3.5 w-3.5 text-slate-500" />
              Deskripsi Ruangan
              <span className="ml-1 text-[10px] font-bold text-slate-400 normal-case tracking-normal">(opsional)</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan fungsi utama lab, peralatan utama, aturan penggunaan..."
              className={INPUT + ' resize-none'}
            />
            <p className="mt-1 text-[10px] font-bold text-slate-400 text-right">{description.length}/500</p>
          </div>

          {/* Status Toggle */}
          <div className={`flex items-center justify-between rounded-xl border-2 border-slate-900 p-4 shadow-[2px_2px_0px_0px_#0f172a] ${isActive ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Status Lab</p>
              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                {isActive
                  ? '✓ Aktif — mahasiswa dapat mengajukan peminjaman'
                  : '⚠ Nonaktif — tidak dapat menerima pengajuan baru'}
              </p>
            </div>
            <button type="button" onClick={() => setIsActive((v) => !v)} className="ml-4 shrink-0" aria-label="Toggle status lab">
              {isActive
                ? <ToggleRight className="h-9 w-9 text-emerald-600" strokeWidth={1.5} />
                : <ToggleLeft  className="h-9 w-9 text-amber-600"   strokeWidth={1.5} />}
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={() => router.back()} className="neo-btn neo-btn-white py-2.5 text-sm font-black justify-center">
              <ArrowLeft className="h-4 w-4" />Kembali
            </button>
            <button type="submit" disabled={loading} className="neo-btn neo-btn-primary py-2.5 text-sm font-black justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0">
              <Save className="h-4 w-4" />
              {loading ? 'Menyimpan…' : mode === 'create' ? 'Tambah Lab' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
