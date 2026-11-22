'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, XCircle } from 'lucide-react'

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

  if (error) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
        <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{error}
      </div>
    )
  }

  if (confirm) {
    return (
      <div className="neo-card-red p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <p className="text-xs font-black">Yakin ingin membatalkan pengajuan ini? Tindakan tidak dapat diurungkan.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="neo-btn flex-1 sm:flex-none py-2 px-4 text-xs font-black bg-rose-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-rose-700 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#0f172a] disabled:opacity-50"
          >
            {loading ? 'Membatalkan…' : 'Ya, Batalkan'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="neo-btn neo-btn-white flex-1 sm:flex-none py-2 px-4 text-xs font-black"
          >
            Tidak
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="neo-btn py-2.5 px-4 text-xs font-black border-2 border-rose-600 text-rose-600 bg-white shadow-[2px_2px_0px_0px_#be123c] hover:bg-rose-50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#be123c]"
    >
      <XCircle className="h-4 w-4" strokeWidth={2} />
      Batalkan Pengajuan
    </button>
  )
}
