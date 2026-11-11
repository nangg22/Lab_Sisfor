'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Gagal membatalkan.')
      setLoading(false)
      return
    }
    router.refresh()
    setConfirm(false)
    setLoading(false)
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>

  if (confirm) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 w-full">
        <p className="text-sm text-red-700 flex-1">Batalkan pengajuan ini?</p>
        <Button variant="danger" size="sm" loading={loading} onClick={handleCancel}>Ya, Batalkan</Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Tidak</Button>
      </div>
    )
  }

  return (
    <Button variant="outline" onClick={() => setConfirm(true)} className="border-red-300 text-red-600 hover:bg-red-50">
      Batalkan Pengajuan
    </Button>
  )
}
