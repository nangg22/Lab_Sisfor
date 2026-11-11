'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { formatTime } from '@/lib/utils'

interface Lab { id: string; name: string; location: string; capacity: number }
interface Slot { id: string; startTime: string; endTime: string; purpose: string }
interface Props {
  labs: Lab[]
  defaultLabId?: string
  defaultDate?: string
  defaultStartTime?: string
  userId: string
}

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
    if (!date) e.date = 'Pilih tanggal.'
    if (!startTime) e.startTime = 'Isi waktu mulai.'
    if (!endTime) e.endTime = 'Isi waktu selesai.'
    if (startTime && endTime && endTime <= startTime) e.endTime = 'Waktu selesai harus setelah waktu mulai.'
    if (!purpose.trim()) e.purpose = 'Isi tujuan peminjaman.'
    if (purpose.trim().length < 10) e.purpose = 'Tujuan minimal 10 karakter.'
    if (selectedLab && participantCount && parseInt(participantCount) > selectedLab.capacity) {
      e.participantCount = `⚠️ Jumlah peserta melebihi kapasitas lab (${selectedLab.capacity} orang).`
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
      body: JSON.stringify({ userId, laboratoryId: labId, bookingDate: date, startTime, endTime, purpose: purpose.trim(), participantCount: participantCount ? parseInt(participantCount) : null, notes: notes.trim() || null }),
    })

    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? 'Terjadi kesalahan.')
      setLoading(false)
      return
    }

    router.push(`/bookings/${data.id}`)
    router.refresh()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {serverError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverError}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Laboratorium <span className="text-red-500">*</span></label>
          <select value={labId} onChange={(e) => setLabId(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">— Pilih Laboratorium —</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name} ({lab.location}) — {lab.capacity} orang</option>
            ))}
          </select>
          {errors.lab && <p className="text-xs text-red-600">{errors.lab}</p>}
        </div>

        <Input label="Tanggal Peminjaman" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required error={errors.date} />

        {labId && date && (
          <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700">Ketersediaan Jadwal ({date}):</span>
              {loadingSlots && <span className="text-gray-400">Mengecek jadwal...</span>}
            </div>

            {bookedSlots.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-orange-700 font-medium">⚠️ Waktu yang sudah terisi (hindari jam ini):</p>
                <div className="flex flex-wrap gap-1.5">
                  {bookedSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-orange-800 font-medium"
                      title={slot.purpose}
                    >
                      🕒 {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      <span className="text-[10px] text-orange-600 font-normal truncate max-w-28">({slot.purpose})</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : !loadingSlots ? (
              <p className="text-green-700 flex items-center gap-1">
                <span>✅</span> Belum ada peminjaman yang disetujui pada tanggal ini. Semua slot waktu tersedia!
              </p>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Waktu Mulai" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required error={errors.startTime} />
          <Input label="Waktu Selesai" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required error={errors.endTime} />
        </div>

        <Textarea label="Tujuan Peminjaman" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Jelaskan kegiatan yang akan dilakukan..." required rows={3} error={errors.purpose} />

        <Input label="Jumlah Peserta" type="number" value={participantCount} onChange={(e) => setParticipantCount(e.target.value)} placeholder="Contoh: 25" min="1" error={errors.participantCount} hint={selectedLab ? `Kapasitas lab: ${selectedLab.capacity} orang` : undefined} />

        <Textarea label="Keterangan Tambahan" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informasi lain (opsional)..." rows={2} />

        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
          Pengajuan akan berstatus <strong>Menunggu Persetujuan</strong> dan diproses oleh Admin / Asisten Lab.
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Batal</Button>
          <Button type="submit" loading={loading} className="flex-1">Kirim Pengajuan</Button>
        </div>
      </form>
    </div>
  )
}
