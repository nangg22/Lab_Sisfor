'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Lock, X, AlertCircle } from 'lucide-react'

interface LabItem {
  id: string
  name: string
}

interface Props {
  labs: LabItem[]
  defaultDate: string
}

// ─── Modal content rendered via portal so it's completely outside
//     the schedule matrix DOM tree. This prevents any re-render of
//     the matrix (hover states, etc.) from touching the modal node.
function BlockModalContent({
  labs,
  date,
  setDate,
  labId,
  setLabId,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  reason,
  setReason,
  loading,
  error,
  onClose,
  onSubmit,
  firstInputRef,
}: {
  labs: LabItem[]
  date: string
  setDate: (v: string) => void
  labId: string
  setLabId: (v: string) => void
  startTime: string
  setStartTime: (v: string) => void
  endTime: string
  setEndTime: (v: string) => void
  reason: string
  setReason: (v: string) => void
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  firstInputRef: React.RefObject<HTMLSelectElement | null>
}) {
  return (
    // Backdrop — pointer-events on the full-screen div catch clicks outside panel
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(15,23,42,0.6)',
      }}
      onMouseDown={(e) => {
        // Close only when clicking the backdrop itself, not the panel
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Panel — stopPropagation so clicks inside don't reach backdrop */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          border: '2px solid #0f172a',
          borderRadius: '14px',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Amber stripe */}
        <div
          aria-hidden="true"
          style={{
            height: '5px',
            background:
              'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '2px solid #0f172a',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: '#0f172a',
                border: '2px solid #0f172a',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                flexShrink: 0,
              }}
            >
              <Lock style={{ width: '1rem', height: '1rem', color: '#fbbf24' }} strokeWidth={2.5} />
            </div>
            <div>
              <h2
                id="block-modal-title"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                Blokir Jadwal Lab
              </h2>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginTop: '1px' }}>
                Maintenance / Agenda Khusus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            style={{
              padding: '0.3rem',
              borderRadius: '0.4rem',
              border: '1px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 0,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#0f172a'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#0f172a'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.6rem 0.875rem',
                borderRadius: '0.6rem',
                background: '#fff1f2',
                border: '2px solid #0f172a',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                color: '#be123c',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} strokeWidth={2} />
              {error}
            </div>
          )}

          <form
            id="block-form"
            onSubmit={onSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            noValidate
          >
            {/* Lab */}
            <div>
              <label
                htmlFor="bl-lab"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Laboratorium <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <select
                id="bl-lab"
                ref={firstInputRef}
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                required
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '2px solid #0f172a',
                  background: '#ffffff',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div>
              <label
                htmlFor="bl-date"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Tanggal Pemblokiran <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                id="bl-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '2px solid #0f172a',
                  background: '#fef9c3',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Jam */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { id: 'bl-start', label: 'Jam Mulai', value: startTime, setter: setStartTime },
                { id: 'bl-end',   label: 'Jam Selesai', value: endTime,   setter: setEndTime },
              ].map(({ id, label, value, setter }) => (
                <div key={id}>
                  <label
                    htmlFor={id}
                    style={{
                      display: 'block',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#334155',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {label} <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    id={id}
                    type="time"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      borderRadius: '0.5rem',
                      border: '2px solid #0f172a',
                      background: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Alasan */}
            <div>
              <label
                htmlFor="bl-reason"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Alasan Pemblokiran <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                id="bl-reason"
                type="text"
                placeholder="Contoh: Maintenance Jaringan / Ujian Skripsi / Dies Natalis"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                maxLength={200}
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '2px solid #0f172a',
                  background: '#ffffff',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                  outline: 'none',
                }}
              />
              <p
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textAlign: 'right',
                  marginTop: '0.2rem',
                }}
              >
                {reason.length}/200
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderTop: '2px solid #0f172a',
            background: '#fffbeb',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 900,
              color: '#0f172a',
              background: '#ffffff',
              border: '2px solid #0f172a',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            form="block-form"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 900,
              color: '#ffffff',
              background: loading ? '#93c5fd' : '#2563eb',
              border: '2px solid #0f172a',
              borderRadius: '0.5rem',
              boxShadow: loading ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.08)',
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            {loading ? (
              <>
                <svg
                  style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 0.7s linear infinite' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity={0.75} />
                </svg>
                Menyimpan…
              </>
            ) : (
              <>
                <Lock style={{ width: '0.875rem', height: '0.875rem' }} strokeWidth={2.5} />
                Kunci Jadwal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main exported component ────────────────────────────────────────────────
export function BlockLabModal({ labs, defaultDate }: Props) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [labId, setLabId]         = useState(labs[0]?.id ?? '')
  const [date, setDate]           = useState(defaultDate)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime]     = useState('12:00')
  const [reason, setReason]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const firstInputRef             = useRef<HTMLSelectElement>(null)
  const [mounted]                 = useState(() => typeof document !== 'undefined')

  const handleClose = useCallback(() => {
    setOpen(false)
    setError(null)
  }, [])

  // Portal needs document — only available client-side
  // Auto-focus first input when opened
  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose, open])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (endTime <= startTime) {
      setError('Jam selesai harus setelah jam mulai.')
      return
    }
    if (!reason.trim()) {
      setError('Alasan pemblokiran wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/labs/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laboratoryId: labId,
          bookingDate:  date,
          startTime:    `${startTime}:00`,
          endTime:      `${endTime}:00`,
          reason:       reason.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Gagal memblokir jadwal.')
        setLoading(false)
        return
      }

      setReason('')
      setOpen(false)
      setError(null)
      router.refresh()
    } catch {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }, [labId, date, startTime, endTime, reason, router])

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="neo-btn neo-btn-primary px-3.5 py-2 text-xs font-black"
      >
        <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
        + Blokir Jadwal / Maintenance
      </button>

      {/* Portal — renders outside the schedule tree entirely */}
      {mounted && open && createPortal(
        <BlockModalContent
          labs={labs}
          date={date}
          setDate={setDate}
          labId={labId}
          setLabId={setLabId}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          reason={reason}
          setReason={setReason}
          loading={loading}
          error={error}
          onClose={handleClose}
          onSubmit={handleSubmit}
          firstInputRef={firstInputRef}
        />,
        document.body,
      )}
    </>
  )
}
