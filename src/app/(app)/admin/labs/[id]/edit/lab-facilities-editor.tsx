'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

export function LabFacilitiesEditor({ laboratoryId, initialFacilities }: Props) {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities)
  const [facilityName, setFacilityName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAddFacility(e: React.FormEvent) {
    e.preventDefault()
    if (!facilityName.trim()) {
      setError('Nama fasilitas tidak boleh kosong.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: facilityName.trim(),
          quantity: quantity ? parseInt(quantity) : null,
          details: details.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal menambahkan fasilitas.')
        setLoading(false)
        return
      }

      setFacilities((prev) => [...prev, data.facility])
      setFacilityName('')
      setQuantity('')
      setDetails('')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteFacility(facilityId: string) {
    setDeletingId(facilityId)
    setError(null)

    try {
      const res = await fetch(`/api/admin/labs/${laboratoryId}/facilities/${facilityId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Gagal menghapus fasilitas.')
        setDeletingId(null)
        return
      }

      setFacilities((prev) => prev.filter((f) => f.id !== facilityId))
      router.refresh()
    } catch {
      setError('Terjadi kesalahan saat menghapus.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Daftar Fasilitas Laboratorium</h2>
          <p className="text-sm text-gray-500">Kelola inventaris dan perlengkapan di dalam ruangan ini.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
          {facilities.length} Fasilitas
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List existing facilities */}
      <div className="space-y-2 mb-6">
        {facilities.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-3 text-center border border-dashed rounded-lg">
            Belum ada fasilitas yang ditambahkan untuk lab ini.
          </p>
        ) : (
          facilities.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 p-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{f.facilityName}</span>
                  {f.quantity && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                      {f.quantity} unit
                    </span>
                  )}
                </div>
                {f.details && <p className="text-xs text-gray-500 mt-0.5">{f.details}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFacility(f.id)}
                disabled={deletingId === f.id}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-50"
              >
                {deletingId === f.id ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add new facility form */}
      <form onSubmit={handleAddFacility} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">+ Tambah Fasilitas Baru</h3>
        <div className="grid gap-3 sm:grid-cols-12 items-end">
          <div className="sm:col-span-5">
            <Input
              label="Nama Fasilitas"
              placeholder="Contoh: PC Core i7, Proyektor"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <Input
              label="Jumlah (opsional)"
              type="number"
              placeholder="30"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>
          <div className="sm:col-span-4">
            <Input
              label="Keterangan (opsional)"
              placeholder="RAM 16GB, SSD 512GB"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Menyimpan...' : 'Simpan Fasilitas'}
          </Button>
        </div>
      </form>
    </div>
  )
}

