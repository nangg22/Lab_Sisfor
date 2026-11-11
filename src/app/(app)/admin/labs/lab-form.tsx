'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'

interface Lab { id: string; name: string; location: string; capacity: number; description: string | null; isActive: boolean }
interface Props { mode: 'create' | 'edit'; lab?: Lab }

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

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nama laboratorium wajib diisi.'
    if (!location.trim()) e.location = 'Lokasi wajib diisi.'
    if (!capacity || parseInt(capacity) < 1) e.capacity = 'Kapasitas harus lebih dari 0.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    const url = mode === 'create' ? '/api/admin/labs' : `/api/admin/labs/${lab?.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'
    const payload = { name: name.trim(), location: location.trim(), capacity: parseInt(capacity), description: description.trim() || null, isActive }

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()

    if (!res.ok) {
      setServerError(data.error ?? 'Terjadi kesalahan.')
      setLoading(false)
      return
    }

    router.push('/admin/labs')
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {serverError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverError}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nama Laboratorium" value={name} onChange={(e) => setName(e.target.value)} required error={errors.name} />
        <Input label="Lokasi" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Gedung A Lantai 2" required error={errors.location} />
        <Input label="Kapasitas (orang)" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required error={errors.capacity} />
        <Textarea label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Informasi tambahan..." rows={3} />
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Lab aktif (dapat dipinjam)</label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Batal</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {mode === 'create' ? 'Tambah Lab' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
