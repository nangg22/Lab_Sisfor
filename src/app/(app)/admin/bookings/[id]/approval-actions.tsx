'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

interface Props { bookingId: string; hasConflict: boolean }

export function ApprovalActions({ bookingId, hasConflict }: Props) {
  const router = useRouter()
  const [action, setAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDecision() {
    if (!action) return
    if (action === 'REJECTED' && !reason.trim()) { setError('Alasan penolakan wajib diisi.'); return }
    setError(null)
    setLoading(true)

    const res = await fetch(`/api/admin/bookings/${bookingId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: action, reason: reason.trim() || null }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Gagal memproses keputusan.')
      setLoading(false)
      return
    }

    router.refresh()
    setAction(null)
    setReason('')
    setLoading(false)
  }

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Ambil Keputusan</h2>

      {hasConflict && (
        <div className="rounded-lg bg-red-100 border border-red-200 px-4 py-2 text-sm text-red-700">
          ⚠️ Ada konflik jadwal. Menyetujui pengajuan ini tidak diizinkan.
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!action && (
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setAction('APPROVED')} disabled={hasConflict} className="flex-1" size="lg">✅ Setujui</Button>
          <Button variant="danger" onClick={() => setAction('REJECTED')} className="flex-1" size="lg">❌ Tolak</Button>
        </div>
      )}

      {action && (
        <div className="space-y-4">
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${action === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {action === 'APPROVED' ? '✅ Menyetujui pengajuan ini' : '❌ Menolak pengajuan ini'}
          </div>
          <Textarea
            label={action === 'REJECTED' ? 'Alasan Penolakan' : 'Catatan (opsional)'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={action === 'REJECTED' ? 'Jelaskan alasan penolakan...' : 'Tambahkan catatan jika diperlukan...'}
            required={action === 'REJECTED'}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setAction(null); setReason(''); setError(null) }} className="flex-1">Kembali</Button>
            <Button variant={action === 'APPROVED' ? 'primary' : 'danger'} onClick={handleDecision} loading={loading} className="flex-1">
              Konfirmasi {action === 'APPROVED' ? 'Persetujuan' : 'Penolakan'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
