'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { formatTime } from '@/lib/utils'
import { AlertCircle, Clock, Calendar, Users, Info } from 'lucide-react'

interface Lab { id: string; name: string; location: string; capacity: number }
interface Slot { id: string; startTime: string; endTime: string; purpose: string }
interface Props {
  labs: Lab[]
  defaultLabId?: string
  defaultDate?: string
  defaultStartTime?: string
  userId: string
}

// Filter kata informal atau tidak pantas untuk keperluan akademik
const INFORMAL_WORDS = [
  'gabut', 'nongkrong', 'main game', 'mabar', 'tidur', 'santai', 'pacaran', 'rebahan',
  'iseng', 'gajelas', 'capek', 'healing'
]

export function BookingForm({ labs, defaultLabId, defaultDate, defaultStartTime, userId }: Props) {
  const router = useRouter()
  const [labId, setLabId] = useState(defaultLabId ?? '')
  const [date, setDate] = useState(defaultDate ?? '')
  const [startTime, setStartTime] = useState(defaultStartTime ?? '')
  const [endTime, setEndTime] = useState(
    defaultStartTime
      ? `${(parseInt(defaultStartTime.split(':')[0], 10) + 1).toString().padStart(2, '0')}:00`
      : ''
  )
  const [purpose, setPurpose] = useState('')
  const [participantCount, setParticipantCount] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Booked slots state
  const [bookedSlots, setBookedSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const selectedLab = labs.find((l) => l.id === labId)

  useEffect(() => {
    if (!labId || !date) {
      setBookedSlots([])
      return
    }

    let isMounted = true
    setLoadingSlots(true)

    fetch(`/api/bookings/slots?laboratoryId=${labId}&bookingDate=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setBookedSlots(data.slots || [])
          setLoadingSlots(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSlots(false)
      })

    return () => {
      isMounted = false
    }
  }, [labId, date])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!labId) e.lab = 'Pilih laboratorium.'
    if (!date) e.date = 'Pilih tanggal peminjaman.'
    
    const todayStr = new Date().toISOString().split('T')[0]
    if (date && date < todayStr) {
      e.date = 'Tanggal peminjaman tidak boleh di masa lalu.'
    }

    if (!startTime) e.startTime = 'Isi waktu mulai.'
    if (!endTime) e.endTime = 'Isi waktu selesai.'
    if (startTime && endTime && endTime <= startTime) {
      e.endTime = 'Waktu selesai harus setelah waktu mulai.'
    }

    // Validasi Tujuan ketat
    const trimmedPurpose = purpose.trim()
    if (!trimmedPurpose) {
      e.purpose = 'Isi tujuan peminjaman secara jelas.'
    } else if (trimmedPurpose.length < 15) {
      e.purpose = `Tujuan peminjaman minimal 15 karakter (${trimmedPurpose.length}/15).`
    } else if (trimmedPurpose.length > 250) {
      e.purpose = `Tujuan peminjaman maksimal 250 karakter.`
    } else {
      // Cek kata informal
      const lower = trimmedPurpose.toLowerCase()
      const foundInformal = INFORMAL_WORDS.find((word) => lower.includes(word))
      if (foundInformal) {
        e.purpose = `Mohon gunakan kalimat akademik/formal resmi (kata "${foundInformal}" tidak diizinkan).`
      }
    }

    if (selectedLab && participantCount) {
      const pCount = parseInt(participantCount, 10)
      if (isNaN(pCount) || pCount <= 0) {
        e.participantCount = 'Jumlah peserta harus lebih dari 0.'
      } else if (pCount > selectedLab.capacity) {
        e.participantCount = `⚠️ Perhatian: Jumlah peserta (${pCount}) melebihi daya tampung lab (${selectedLab.capacity} orang).`
      }
    }

    setErrors(e)
    const blocking = Object.entries(e).filter(([k, v]) => !(k === 'participantCount' && v.startsWith('⚠️')))
    return blocking.length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    setLoading(true)

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        laboratoryId: labId,
        bookingDate: date,
        startTime,
        endTime,
        purpose: purpose.trim(),
        participantCount: participantCount ? parseInt(participantCount, 10) : null,
        notes: notes.trim() || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? 'Terjadi kesalahan sistem saat menyimpan pengajuan.')
      setLoading(false)
      return
    }

    router.push(`/bookings/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2} />
          <span>{serverError}</span>
        </div>
      )}

      {/* Lab Selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          Pilih Laboratorium <span className="text-rose-600">*</span>
        </label>
        <select
          value={labId}
          onChange={(e) => setLabId(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">-- Pilih Laboratorium --</option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.location} (Kapasitas: {l.capacity} orang)
            </option>
          ))}
        </select>
        {errors.lab && <p className="text-xs font-semibold text-rose-600">{errors.lab}</p>}
      </div>

      {/* Tanggal & Waktu */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-500" />
            Tanggal <span className="text-rose-600">*</span>
          </label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.date && <p className="text-xs font-semibold text-rose-600">{errors.date}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" />
            Jam Mulai <span className="text-rose-600">*</span>
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.startTime && <p className="text-xs font-semibold text-rose-600">{errors.startTime}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" />
            Jam Selesai <span className="text-rose-600">*</span>
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.endTime && <p className="text-xs font-semibold text-rose-600">{errors.endTime}</p>}
        </div>
      </div>

      {/* Live slot status info */}
      {labId && date && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="h-4 w-4 text-blue-600" />
            <span>Jadwal Terisi pada Tanggal Ini:</span>
          </div>
          {loadingSlots ? (
            <p className="text-slate-500 font-medium animate-pulse">Memeriksa ketersediaan slot...</p>
          ) : bookedSlots.length > 0 ? (
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-medium">
              {bookedSlots.map((s) => (
                <li key={s.id}>
                  <strong>{formatTime(s.startTime)} – {formatTime(s.endTime)}</strong>: {s.purpose}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-700 font-semibold">Seluruh slot waktu masih tersedia untuk dipinjam.</p>
          )}
        </div>
      )}

      {/* Tujuan Peminjaman */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800">
            Tujuan / Keperluan Kegiatan <span className="text-rose-600">*</span>
          </label>
          <span className="text-xs font-semibold text-slate-500">
            {purpose.length}/250 karakter
          </span>
        </div>
        <textarea
          rows={3}
          value={purpose}
          maxLength={250}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Contoh: Praktikum Mata Kuliah Pemrograman Web lanjut (Kelas SI-3A) bersama asisten lab."
          className="w-full rounded-xl border border-slate-300 bg-white/80 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium leading-relaxed"
        />
        <p className="text-[11px] text-slate-500 font-medium">
          Gunakan bahasa formal akademik minimal 15 karakter. Hindari istilah informal.
        </p>
        {errors.purpose && <p className="text-xs font-semibold text-rose-600">{errors.purpose}</p>}
      </div>

      {/* Jumlah Peserta */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-500" />
          Perkiraan Jumlah Peserta
        </label>
        <input
          type="number"
          min="1"
          value={participantCount}
          onChange={(e) => setParticipantCount(e.target.value)}
          placeholder={selectedLab ? `Maksimal daya tampung: ${selectedLab.capacity} orang` : 'Contoh: 30'}
          className="w-full rounded-xl border border-slate-300 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {errors.participantCount && (
          <p className={`text-xs font-semibold ${errors.participantCount.startsWith('⚠️') ? 'text-amber-700' : 'text-rose-600'}`}>
            {errors.participantCount}
          </p>
        )}
      </div>

      {/* Catatan Tambahan */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          Catatan Tambahan (Opsional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Membutuhkan proyektor kabel HDMI dan akses stopkontak tambahan"
          className="w-full rounded-xl border border-slate-300 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Action Submit */}
      <div className="pt-2">
        <Button type="submit" loading={loading} className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/25">
          Kirim Pengajuan Peminjaman
        </Button>
      </div>
    </form>
  )
}
