'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, AlertCircle, ChevronLeft, Check, X } from 'lucide-react'

interface Props { bookingId: string; hasConflict: boolean }

export function ApprovalActions({ bookingId, hasConflict }: Props) {
  const router = useRouter()
  const [action, setAction]   = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleDecision() {
    if (!action) return
    if (action === 'REJECTED' && !reason.trim()) {
      setError('Alasan penolakan wajib diisi.')
      return
    }
    setError(null)
    setLoading(true)

    const res = await fetch(`/api/admin/bookings/${bookingId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: action, reason: reason.trim() || null }),
    })

    const data = await res.json()
    if (!res.ok) {
      const isConflict = res.status === 409
      setConflict(isConflict)
      setError(isConflict ? 'Booking baru saja diproses admin lain. Status telah berubah.' : data.error ?? 'Gagal memproses keputusan.')
      setLoading(false)
      if (isConflict) window.setTimeout(() => router.refresh(), 900)
      return
    }

    setCompleted(true)
    window.setTimeout(() => {
      router.refresh()
      setAction(null)
      setReason('')
      setCompleted(false)
      setLoading(false)
    }, 650)
  }

  return (
    <div className={`neo-card overflow-hidden ${conflict ? 'approval-conflict-pulse' : ''}`}>
      {/* Stripe header */}
      <div
        aria-hidden="true"
        style={{
          height: '5px',
          background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)',
        }}
      />

      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-200 shadow-sm shrink-0">
          <CheckCircle className="h-4 w-4 text-amber-300" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Ambil Keputusan</h2>
          <p className="text-[11px] font-bold text-slate-500">Setujui atau tolak pengajuan ini</p>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* Conflict warning */}
        {hasConflict && (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-slate-200 shadow-sm px-4 py-3">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-xs font-black text-rose-700 uppercase tracking-wide">Konflik Jadwal</p>
              <p className="text-xs font-bold text-rose-600 mt-0.5">Ada peminjaman lain yang sudah disetujui pada waktu bertabrakan. Persetujuan tidak dapat dilakukan.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-slate-200 shadow-sm px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" strokeWidth={2} />
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {/* Step 1 — pilih aksi */}
        {!action && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAction('APPROVED')}
              disabled={hasConflict}
              className="neo-btn neo-btn-primary py-3 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              Setujui
            </button>
            <button
              onClick={() => setAction('REJECTED')}
              className="neo-btn py-3 text-sm font-black bg-rose-600 text-white border border-slate-200 shadow-sm hover:bg-rose-700 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-sm"
            >
              <X className="h-4 w-4" strokeWidth={3} />
              Tolak
            </button>
          </div>
        )}

        {/* Step 2 — konfirmasi */}
        {action && (
          <div className="space-y-4">
            {/* Indicator pill */}
            <div
              className={`flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm ${
                action === 'APPROVED' ? 'bg-emerald-100' : 'bg-rose-100'
              }`}
            >
              {action === 'APPROVED'
                ? <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={2.5} />
                : <XCircle    className="h-4 w-4 text-rose-700    shrink-0" strokeWidth={2.5} />}
              <span className={`text-xs font-black uppercase tracking-wide ${action === 'APPROVED' ? 'text-emerald-800' : 'text-rose-800'}`}>
                {action === 'APPROVED' ? 'Menyetujui pengajuan ini' : 'Menolak pengajuan ini'}
              </span>
            </div>

            {/* Textarea alasan */}
            <div className="space-y-1.5">
              <label htmlFor="ap-reason" className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                {action === 'REJECTED' ? 'Alasan Penolakan' : 'Catatan (Opsional)'}
                {action === 'REJECTED' && <span className="text-rose-500 ml-1">*</span>}
              </label>
              <textarea
                id="ap-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  action === 'REJECTED'
                    ? 'Jelaskan alasan penolakan...'
                    : 'Tambahkan catatan jika diperlukan...'
                }
                required={action === 'REJECTED'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 placeholder:font-normal resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setAction(null); setReason(''); setError(null) }}
                className="neo-btn neo-btn-white py-2.5 text-xs font-black"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                Kembali
              </button>
              <button
                type="button"
                onClick={handleDecision}
                disabled={loading}
                className={`approval-submit-button neo-btn py-2.5 text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 ${completed ? 'approval-submit-button--completed' : ''} ${
                  action === 'APPROVED'
                    ? 'neo-btn-primary'
                    : 'bg-rose-600 text-white border border-slate-200 shadow-sm hover:bg-rose-700 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-sm'
                }`}
              >
                {completed ? (
                  <>
                    <CheckCircle className="approval-checkmark h-4 w-4" strokeWidth={3} aria-hidden="true" />
                    Berhasil
                  </>
                ) : loading ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity={0.75} />
                    </svg>
                    Memproses…
                  </>
                ) : (
                  <>
                    {action === 'APPROVED'
                      ? <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      : <X     className="h-3.5 w-3.5" strokeWidth={3} />}
                    Konfirmasi {action === 'APPROVED' ? 'Persetujuan' : 'Penolakan'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
