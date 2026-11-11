'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  labId: string
  initialActive: boolean
}

export function ToggleLabStatusButton({ labId, initialActive }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
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
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50 ${
        active
          ? 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-red-600'
          : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
      }`}
      title={active ? 'Klik untuk nonaktifkan lab' : 'Klik untuk aktifkan lab'}
    >
      {loading ? '...' : active ? 'Nonaktifkan' : 'Aktifkan'}
    </button>
  )
}

