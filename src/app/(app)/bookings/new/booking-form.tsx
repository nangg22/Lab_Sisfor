'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatTime } from '@/lib/utils'
import { AlertCircle, Clock, Calendar, Users, Info, CheckCircle2, Send } from 'lucide-react'

interface Lab { id: string; name: string; location: string; capacity: number }
interface Slot { id: string; startTime: string; endTime: string; purpose: string }
interface Props {
  labs: Lab[]
  defaultLabId?: string
  defaultDate?: string
  defaultStartTime?: string
  userId: string
}

const BOOKING_RULES = { operatingStart: '06:00', operatingEnd: '21:00' }

const INFORMAL_WORDS = [
  'gabut', 'nongkrong', 'main game', 'mabar', 'tidur', 'santai', 'pacaran', 'rebahan',
  'iseng', 'gajelas', 'capek', 'healing',
]

// Shared input class
const INPUT_CLS = 'w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL_CLS = 'block text-[11px] font-black uppercase tracking-wide text-slate-700 mb-1.5'

export function BookingForm({ labs, defaultLabId, defaultDate, defaultStartTime, userId }: Props) {
  const router = useRouter()
  const [labId, setLabId]                   = useState(defaultLabId ?? '')
  const [date, setDate]                     = useState(defaultDate ?? '')
  const [startTime, setStartTime]           = useState(defaultStartTime ?? '')
  const [endTime, setEndTime]               = useState(
    defaultStartTime
      ? `${(parseInt(defaultStartTime.split(':')[0], 10) + 1).toString().padStart(2, '0')}:00`
      : ''
  )
  const [purpose, setPurpose]               = useState('')
  const [participantCount, setParticipantCount] = useState('')
  const [notes, setNotes]                   = useState('')
  const [errors, setErrors]                 = useState<Record<string, string>>({})
  const [loading, setLoading]               = useState(false)
  const [serverError, setServerError]       = useState<string | null>(null)
  const [bookedSlots, setBookedSlots]       = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots]     = useState(false)

  const selectedLab = labs.find((l) => l.id === labId)

  useEffect(() => {
    if (!labId || !date) return
    let isMounted = true
    setLoadingSlots(true)
    fetch(`/api/bookings/slots?laboratoryId=${labId}&bookingDate=${date}`)
      .then((r) => r.json())
      .then((data) => { if (isMounted) { setBookedSlots(data.slots || []); setLoadingSlots(false) } })
      .catch(() => { if (isMounted) setLoadingSlots(false) })
    return () => { isMounted = false }
  }, [labId, date])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!labId) e.lab = 'Pilih laboratorium.'
    if (!date) e.date = 'Pilih tanggal peminjaman.'
    const todayStr = new Date().toISOString().split('T')[0]
    if (date && date < todayStr) e.date = 'Tanggal peminjaman tidak boleh di masa lalu.'
    if (!startTime) e.startTime = 'Isi waktu mulai.'
    if (!endTime) e.endTime = 'Isi waktu selesai.'
    if (startTime && endTime && endTime <= startTime) e.endTime = 'Waktu selesai harus setelah waktu mulai.'
    if (startTime && startTime < BOOKING_RULES.operatingStart) e.startTime = `Jam operasional dimulai pukul ${BOOKING_RULES.operatingStart} WIB.`
    if (endTime && endTime > BOOKING_RULES.operatingEnd) e.endTime = `Jam operasional berakhir pukul ${BOOKING_RULES.operatingEnd} WIB.`
    const trimmedPurpose = purpose.trim()
    if (!trimmedPurpose) {
      e.purpose = 'Isi tujuan peminjaman secara jelas.'
    } else if (trimmedPurpose.length < 15) {
      e.purpose = `Tujuan peminjaman minimal 15 karakter (${trimmedPurpose.length}/15).`
    } else if (trimmedPurpose.length > 250) {
      e.purpose = 'Tujuan peminjaman maksimal 250 karakter.'
    } else {
      const foundInformal = INFORMAL_WORDS.find((w) => trimmedPurpose.toLowerCase().includes(w))
      if (foundInformal) e.purpose = `Mohon gunakan kalimat akademik/formal (kata "${foundInformal}" tidak diizinkan).`
    }
    if (selectedLab && participantCount) {
      const pCount = parseInt(participantCount, 10)
      if (isNaN(pCount) || pCount <= 0) e.participantCount = 'Jumlah peserta harus lebih dari 0.'
      else if (pCount > selectedLab.capacity) e.participantCount = `⚠️ Jumlah peserta (${pCount}) melebihi daya tampung lab (${selectedLab.capacity} orang).`
    }
    setErrors(e)
    return Object.entries(e).filter(([k, v]) => !(k === 'participantCount' && v.startsWith('⚠️'))).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    setLoading(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, laboratoryId: labId, bookingDate: date, startTime, endTime, purpose: purpose.trim(), participantCount: participantCount ? parseInt(participantCount, 10) : null, notes: notes.trim() || null }),
    })
    const data = await res.json()
    if (!res.ok) { setServerError(data.error ?? 'Terjadi kesalahan sistem.'); setLoading(false); return }
    router.push(`/bookings/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Server error */}
      {serverError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{serverError}
        </div>
      )}

      {/* Lab selector */}
      <div>
        <label htmlFor="bf-lab" className={LABEL_CLS}>Pilih Laboratorium <span className="text-rose-500">*</span></label>
        <select id="bf-lab" value={labId} onChange={(e) => setLabId(e.target.value)} className={INPUT_CLS + ' cursor-pointer'}>
          <option value="">-- Pilih Laboratorium --</option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>{l.name} — {l.location} (Kapasitas: {l.capacity} orang)</option>
          ))}
        </select>
        {errors.lab && <p className="text-xs font-bold text-rose-600 mt-1">{errors.lab}</p>}
      </div>

      {/* Tanggal & Waktu */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="bf-date" className={LABEL_CLS}>
            <Calendar className="inline h-3 w-3 mr-1 mb-0.5" aria-hidden="true" />
            Tanggal <span className="text-rose-500">*</span>
          </label>
          <input id="bf-date" type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)} className={INPUT_CLS} />
          {errors.date && <p className="text-xs font-bold text-rose-600 mt-1">{errors.date}</p>}
        </div>
        <div>
          <label htmlFor="bf-start" className={LABEL_CLS}>
            <Clock className="inline h-3 w-3 mr-1 mb-0.5" aria-hidden="true" />
            Jam Mulai <span className="text-rose-500">*</span>
          </label>
          <input id="bf-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={INPUT_CLS} />
          {errors.startTime && <p className="text-xs font-bold text-rose-600 mt-1">{errors.startTime}</p>}
        </div>
        <div>
          <label htmlFor="bf-end" className={LABEL_CLS}>
            <Clock className="inline h-3 w-3 mr-1 mb-0.5" aria-hidden="true" />
            Jam Selesai <span className="text-rose-500">*</span>
          </label>
          <input id="bf-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={INPUT_CLS} />
          {errors.endTime && <p className="text-xs font-bold text-rose-600 mt-1">{errors.endTime}</p>}
        </div>
      </div>

      {/* Live slot info */}
      {labId && date && (
        <div className={`flex items-start gap-3 rounded-xl border-2 border-slate-900 px-4 py-3 shadow-[2px_2px_0px_0px_#0f172a] ${bookedSlots.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <Info className={`h-4 w-4 shrink-0 mt-0.5 ${bookedSlots.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} strokeWidth={2} />
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">Jadwal Terisi Hari Ini</p>
            {loadingSlots ? (
              <p className="text-xs font-bold text-slate-500 mt-0.5">Memeriksa ketersediaan...</p>
            ) : bookedSlots.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {bookedSlots.map((s) => (
                  <li key={s.id} className="text-xs font-bold text-slate-700">
                    <span className="font-black">{formatTime(s.startTime)}–{formatTime(s.endTime)}</span>: {s.purpose}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />Semua slot masih tersedia.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tujuan */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="bf-purpose" className={LABEL_CLS + ' mb-0'}>
            Tujuan / Keperluan Kegiatan <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] font-bold text-slate-400">{purpose.length}/250</span>
        </div>
        <textarea
          id="bf-purpose"
          rows={3}
          value={purpose}
          maxLength={250}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Contoh: Praktikum Mata Kuliah Pemrograman Web (Kelas SI-3A) bersama asisten lab."
          className={INPUT_CLS + ' resize-none'}
        />
        <p className="text-[10px] font-bold text-slate-400 mt-1">Gunakan bahasa formal akademik, min. 15 karakter.</p>
        {errors.purpose && <p className="text-xs font-bold text-rose-600 mt-1">{errors.purpose}</p>}
      </div>

      {/* Jumlah peserta */}
      <div>
        <label htmlFor="bf-participants" className={LABEL_CLS}>
          <Users className="inline h-3 w-3 mr-1 mb-0.5" aria-hidden="true" />
          Perkiraan Jumlah Peserta <span className="text-slate-400 font-bold normal-case tracking-normal">(Opsional)</span>
        </label>
        <input
          id="bf-participants"
          type="number"
          min="1"
          value={participantCount}
          onChange={(e) => setParticipantCount(e.target.value)}
          placeholder={selectedLab ? `Maks. ${selectedLab.capacity} orang` : 'Contoh: 30'}
          className={INPUT_CLS}
        />
        {errors.participantCount && (
          <p className={`text-xs font-bold mt-1 ${errors.participantCount.startsWith('⚠️') ? 'text-amber-700' : 'text-rose-600'}`}>
            {errors.participantCount}
          </p>
        )}
      </div>

      {/* Catatan */}
      <div>
        <label htmlFor="bf-notes" className={LABEL_CLS}>
          Catatan Tambahan <span className="text-slate-400 font-bold normal-case tracking-normal">(Opsional)</span>
        </label>
        <input
          id="bf-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Membutuhkan proyektor HDMI dan stopkontak tambahan"
          className={INPUT_CLS}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="neo-btn neo-btn-primary w-full py-3 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity={0.75} />
            </svg>
            Mengirim Pengajuan…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={2.5} />
            Kirim Pengajuan Peminjaman
          </>
        )}
      </button>
    </form>
  )
}
