'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatTime } from '@/lib/utils'
import {
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Info,
  CheckCircle2,
  Send,
  Building2,
  Monitor,
  PackageCheck,
  Plus,
  X,
} from 'lucide-react'

interface Lab { id: string; name: string; location: string; capacity: number }
interface Slot { id: string; startTime: string; endTime: string; purpose: string }
interface LabFacility {
  id: string
  facilityName: string
  category: string
  brandModel: string | null
  details: string | null
  quantity: number | null
  condition: string
  isBorrowable: boolean
}
interface IncludedItem {
  facilityId?: string
  name: string
  quantity: number | null
  details: string | null
}

interface Props {
  labs: Lab[]
  defaultLabId?: string
  defaultDate?: string
  defaultStartTime?: string
  defaultBookingType?: 'ROOM' | 'EQUIPMENT'
  userId: string
}

const BOOKING_RULES = { operatingStart: '06:00', operatingEnd: '21:00' }

const INFORMAL_WORDS = [
  'gabut', 'nongkrong', 'main game', 'mabar', 'tidur', 'santai', 'pacaran', 'rebahan',
  'iseng', 'gajelas', 'capek', 'healing',
]

const INPUT_CLS = 'w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL_CLS = 'block text-[11px] font-black uppercase tracking-wide text-slate-700 mb-1.5'

export function BookingForm({
  labs,
  defaultLabId,
  defaultDate,
  defaultStartTime,
  defaultBookingType = 'ROOM',
  userId,
}: Props) {
  const router = useRouter()
  const [bookingType, setBookingType]         = useState<'ROOM' | 'EQUIPMENT'>(defaultBookingType)
  const [labId, setLabId]                     = useState(defaultLabId ?? (labs.length === 1 ? labs[0].id : ''))
  const [date, setDate]                       = useState(defaultDate ?? '')
  const [startTime, setStartTime]             = useState(defaultStartTime ?? '')
  const [endTime, setEndTime]                 = useState(
    defaultStartTime
      ? `${(parseInt(defaultStartTime.split(':')[0], 10) + 1).toString().padStart(2, '0')}:00`
      : ''
  )
  const [purpose, setPurpose]                 = useState('')
  const [participantCount, setParticipantCount] = useState('')
  const [notes, setNotes]                     = useState('')
  const [errors, setErrors]                   = useState<Record<string, string>>({})
  const [loading, setLoading]                 = useState(false)
  const [serverError, setServerError]         = useState<string | null>(null)
  const [bookedSlots, setBookedSlots]         = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots]       = useState(false)

  // Inventaris & Include Peminjaman state
  const [labFacilities, setLabFacilities]     = useState<LabFacility[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [includedItems, setIncludedItems]     = useState<IncludedItem[]>([])
  const [customItemName, setCustomItemName]   = useState('')
  const [customItemQty, setCustomItemQty]     = useState('1')

  const selectedLab = labs.find((l) => l.id === labId)

  // Fetch booked slots when labId + date change
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

  // Fetch lab inventory/facilities when labId changes
  useEffect(() => {
    if (!labId) {
      setLabFacilities([])
      setIncludedItems([])
      return
    }
    let isMounted = true
    setLoadingFacilities(true)
    fetch(`/api/labs/${labId}/facilities`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return
        const list: LabFacility[] = data.facilities || []
        setLabFacilities(list)
        // If ROOM mode, auto-select good-condition items so user sees what's included by default
        if (bookingType === 'ROOM') {
          setIncludedItems(
            list
              .filter((f) => f.condition !== 'Rusak')
              .map((f) => ({
                facilityId: f.id,
                name: f.brandModel ? `${f.facilityName} (${f.brandModel})` : f.facilityName,
                quantity: f.quantity ?? 1,
                details: f.details,
              }))
          )
        } else {
          setIncludedItems([])
        }
        setLoadingFacilities(false)
      })
      .catch(() => { if (isMounted) setLoadingFacilities(false) })
    return () => { isMounted = false }
  }, [labId])

  // When switching bookingType, adjust default included items sensibly
  function handleBookingTypeChange(nextType: 'ROOM' | 'EQUIPMENT') {
    setBookingType(nextType)
    if (nextType === 'ROOM' && labFacilities.length > 0 && includedItems.length === 0) {
      setIncludedItems(
        labFacilities
          .filter((f) => f.condition !== 'Rusak')
          .map((f) => ({
            facilityId: f.id,
            name: f.brandModel ? `${f.facilityName} (${f.brandModel})` : f.facilityName,
            quantity: f.quantity ?? 1,
            details: f.details,
          }))
      )
    }
    if (nextType === 'EQUIPMENT') {
      // Clear room-wide defaults so user picks specific equipment (e.g. Komputer)
      setIncludedItems([])
    }
  }

  function toggleFacilityItem(f: LabFacility) {
    const exists = includedItems.some((item) => item.facilityId === f.id)
    if (exists) {
      setIncludedItems((prev) => prev.filter((item) => item.facilityId !== f.id))
    } else {
      const displayName = f.brandModel ? `${f.facilityName} (${f.brandModel})` : f.facilityName
      setIncludedItems((prev) => [
        ...prev,
        {
          facilityId: f.id,
          name: displayName,
          quantity: bookingType === 'EQUIPMENT' ? 1 : (f.quantity ?? 1),
          details: f.details,
        },
      ])
    }
  }

  function updateItemQuantity(facilityId: string | undefined, name: string, qty: number) {
    setIncludedItems((prev) =>
      prev.map((item) =>
        (facilityId ? item.facilityId === facilityId : item.name === name)
          ? { ...item, quantity: Math.max(1, qty) }
          : item
      )
    )
  }

  function handleAddCustomItem() {
    const trimmed = customItemName.trim()
    if (!trimmed) return
    const qty = Math.max(1, parseInt(customItemQty, 10) || 1)
    setIncludedItems((prev) => [
      ...prev,
      { name: trimmed, quantity: qty, details: 'Permintaan item khusus' },
    ])
    setCustomItemName('')
    setCustomItemQty('1')
  }

  function removeIncludedItem(index: number) {
    setIncludedItems((prev) => prev.filter((_, i) => i !== index))
  }

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

    if (bookingType === 'EQUIPMENT' && includedItems.length === 0) {
      e.includedItems = 'Pilih minimal 1 alat/inventaris khusus (misal: Komputer/PC, TV, Proyektor) yang ingin dipinjam.'
    }

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
      body: JSON.stringify({
        userId,
        laboratoryId: labId,
        bookingType,
        includedItems,
        bookingDate: date,
        startTime,
        endTime,
        purpose: purpose.trim(),
        participantCount: participantCount ? parseInt(participantCount, 10) : null,
        notes: notes.trim() || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setServerError(data.error ?? 'Terjadi kesalahan sistem.'); setLoading(false); return }
    router.push(`/bookings/${data.id}`)
  }

  const displayedFacilities = bookingType === 'EQUIPMENT'
    ? labFacilities.filter((f) => f.isBorrowable && f.condition !== 'Rusak')
    : labFacilities

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {serverError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{serverError}
        </div>
      )}

      {/* Jenis Peminjaman */}
      <div>
        <span className={LABEL_CLS}>Jenis Peminjaman <span className="text-rose-500">*</span></span>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleBookingTypeChange('ROOM')}
            className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
              bookingType === 'ROOM'
                ? 'border-slate-900 bg-amber-100 shadow-[3px_3px_0px_0px_#0f172a]'
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 ${
              bookingType === 'ROOM' ? 'bg-amber-300 text-slate-950' : 'bg-slate-100 text-slate-600'
            }`}>
              <Building2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Peminjaman Ruangan Lab</p>
              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                Menggunakan ruangan lab penuh beserta fasilitas di dalamnya.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleBookingTypeChange('EQUIPMENT')}
            className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
              bookingType === 'EQUIPMENT'
                ? 'border-slate-900 bg-blue-50 shadow-[3px_3px_0px_0px_#0f172a]'
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 ${
              bookingType === 'EQUIPMENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Monitor className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Peminjaman Khusus / Alat</p>
              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                Pinjam unit tertentu (seperti Komputer/PC, Smart TV, Proyektor, dll.).
              </p>
            </div>
          </button>
        </div>
      </div>

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

      {/* Include Peminjaman / Inventaris Checklist */}
      {labId && (
        <div className="rounded-xl border-2 border-slate-900 bg-slate-50 p-4 space-y-3 shadow-[2px_2px_0px_0px_#0f172a]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                  {bookingType === 'EQUIPMENT'
                    ? 'Pilih Alat Khusus yang Dipinjam *'
                    : 'Include Peminjaman (Fasilitas & Inventaris)'}
                </p>
                <p className="text-[11px] font-bold text-slate-500">
                  {bookingType === 'EQUIPMENT'
                    ? 'Centang alat yang ingin dipinjam khusus (misal: Komputer, Smart TV, Proyektor) dan tentukan jumlahnya.'
                    : 'Centang fasilitas/inventaris lab yang ikut digunakan agar jelas saat verifikasi.'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white border border-slate-300 px-2.5 py-0.5 text-[10px] font-black text-slate-700">
              {includedItems.length} item dipilih
            </span>
          </div>

          {loadingFacilities ? (
            <p className="text-xs font-bold text-slate-500 py-2">Memuat daftar inventaris lab...</p>
          ) : displayedFacilities.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {displayedFacilities.map((f) => {
                const selectedItem = includedItems.find((item) => item.facilityId === f.id)
                const isSelected = Boolean(selectedItem)
                return (
                  <div
                    key={f.id}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-white shadow-[2px_2px_0px_0px_#2563eb]'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFacilityItem(f)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-400 text-blue-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-black text-slate-900 leading-snug">
                            {f.facilityName}
                          </span>
                          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {f.category}
                          </span>
                        </div>
                        {f.brandModel && (
                          <p className="text-[11px] font-bold text-slate-700">{f.brandModel}</p>
                        )}
                        {f.details && (
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5 line-clamp-2">{f.details}</p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                          Tersedia: {f.quantity ?? '—'} unit · Kondisi: {f.condition}
                        </p>
                      </div>
                    </label>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 pl-6">
                        <span className="text-[10px] font-black text-blue-700 uppercase">Jumlah Dipakai:</span>
                        <input
                          type="number"
                          min={1}
                          max={f.quantity ?? 100}
                          value={selectedItem?.quantity ?? 1}
                          onChange={(e) => updateItemQuantity(f.id, f.facilityName, parseInt(e.target.value, 10) || 1)}
                          className="w-20 rounded-md border border-slate-300 px-2 py-0.5 text-xs font-black text-slate-900 text-center"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-500 bg-white rounded-lg border border-dashed border-slate-300 p-3 text-center">
              Belum ada data inventaris tercatat di lab ini. Anda dapat menuliskan item secara manual di bawah.
            </p>
          )}

          {/* Tambah Item Tambahan Manual */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-600 mb-1.5">
              Tambah Item Khusus / Kebutuhan Lainnya (Opsional)
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Misal: Komputer PC #5, Kabel HDMI, Terminal Listrik"
                className="flex-1 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 placeholder:text-slate-400"
              />
              <input
                type="number"
                min={1}
                value={customItemQty}
                onChange={(e) => setCustomItemQty(e.target.value)}
                className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900 text-center"
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-amber-300 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>
          </div>

          {/* Ringkasan Include Peminjaman */}
          {includedItems.length > 0 && (
            <div className="rounded-lg bg-white border border-slate-200 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Ringkasan Include Peminjaman:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {includedItems.map((item, idx) => (
                  <span
                    key={`${item.facilityId ?? item.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-900"
                  >
                    <span>
                      {item.name}
                      {item.quantity ? ` (${item.quantity} unit)` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIncludedItem(idx)}
                      className="text-blue-600 hover:text-rose-600"
                      aria-label={`Hapus ${item.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {errors.includedItems && <p className="text-xs font-bold text-rose-600">{errors.includedItems}</p>}
        </div>
      )}

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
          placeholder={
            bookingType === 'EQUIPMENT'
              ? 'Contoh: Peminjaman 2 unit PC Workstation untuk pengerjaan tugas akhir/skripsi analisis data.'
              : 'Contoh: Praktikum Mata Kuliah Pemrograman Web (Kelas SI-3A) bersama asisten lab.'
          }
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
          placeholder="Contoh: Membutuhkan akses software tertentu atau bantuan instalasi"
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
            {bookingType === 'EQUIPMENT' ? 'Kirim Pengajuan Peminjaman Khusus' : 'Kirim Pengajuan Peminjaman'}
          </>
        )}
      </button>
    </form>
  )
}
