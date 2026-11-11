'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, PowerOff, Loader2 } from 'lucide-react'

interface Props {
  labId: string
  initialActive: boolean
}

export function ToggleLabStatusButton({ labId, initialActive }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const confirmMsg = active
      ? 'Apakah Anda yakin ingin menonaktifkan laboratorium ini? Mahasiswa tidak akan dapat mengajukan peminjaman ke lab ini.'
      : 'Aktifkan kembali laboratorium ini agar dapat dipinjam?'

    if (!confirm(confirmMsg)) return

    setLoading(true)
    const nextState = !active

    try {
      const res = await fetch(`/api/admin/labs/${labId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      })

      if (res.ok) {
        setActive(nextState)
        router.refresh()
      } else {
        alert('Gagal mengubah status laboratorium.')
      }
    } catch {
      alert('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border transition-all disabled:opacity-50 shadow-xs ${
        active
          ? 'border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
      }`}
      title={active ? 'Nonaktifkan laboratorium' : 'Aktifkan laboratorium'}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : active ? (
        <PowerOff className="h-3.5 w-3.5 text-rose-600" strokeWidth={2.2} />
      ) : (
        <Power className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.2} />
      )}
      <span>{active ? 'Nonaktifkan' : 'Aktifkan'}</span>
    </button>
  )
}
