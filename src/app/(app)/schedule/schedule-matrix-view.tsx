'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlockLabModal } from './block-lab-modal'
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  User,
  Info,
  Building2,
  CalendarDays,
  ListFilter,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface LabItem {
  id: string
  name: string
  location: string
  capacity: number
}

interface BookingSlot {
  id: string
  laboratoryId: string
  bookingDate: string
  startTime: string // "08:00:00"
  endTime: string   // "10:00:00"
  purpose: string
  status: string
  userName: string | null
}

interface Props {
  labs: LabItem[]
  bookings: BookingSlot[]
  selectedDate: string
  isAdmin?: boolean
}

// Time intervals from 06:00 to 21:00
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // [6, 7, ..., 21]

// Vibrant Google Calendar Category Colors
const EVENT_COLORS = [
  'bg-blue-600 text-white border-blue-800',
  'bg-emerald-600 text-white border-emerald-800',
  'bg-amber-500 text-slate-950 border-amber-700',
  'bg-purple-600 text-white border-purple-800',
  'bg-rose-600 text-white border-rose-800',
  'bg-teal-600 text-white border-teal-800',
]

export function ScheduleMatrixView({ labs, bookings, selectedDate, isAdmin }: Props) {
  const router = useRouter()
  const [selectedLabId, setSelectedLabId] = useState<string>('ALL')
  const [activeEvent, setActiveEvent] = useState<{
    booking: BookingSlot
    labName: string
    labLocation: string
  } | null>(null)

  // Navigate Date
  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    const newDateStr = d.toLocaleDateString('sv-SE')
    router.push(`/schedule?date=${newDateStr}`)
  }

  function handleDirectDate(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/schedule?date=${e.target.value}`)
  }

  // Filter labs
  const displayedLabs = selectedLabId === 'ALL'
    ? labs
    : labs.filter((l) => l.id === selectedLabId)

  // Filter bookings for selected lab
  const currentBookings = selectedLabId === 'ALL'
    ? bookings
    : bookings.filter((b) => b.laboratoryId === selectedLabId)

  return (
    <div className="space-y-5">
      {/* ── 1. Google Calendar Style Navigation & Control Toolbar ── */}
      <div className="neo-card p-4 sm:p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector & Prev/Next */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => changeDate(-1)}
              title="Hari Sebelumnya"
              className="min-h-11 min-w-11 p-2 hover:bg-slate-100 transition-colors border-r border-slate-200"
            >
              <ChevronLeft className="h-4 w-4 text-slate-900" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => {
                const today = new Date().toLocaleDateString('sv-SE')
                router.push(`/schedule?date=${today}`)
              }}
              className="px-3.5 py-1.5 text-xs font-black text-slate-900 hover:bg-slate-100 transition-colors uppercase tracking-wider"
            >
              Hari Ini
            </button>
            <button
              onClick={() => changeDate(1)}
              title="Hari Berikutnya"
              className="min-h-11 min-w-11 p-2 hover:bg-slate-100 transition-colors border-l border-slate-200"
            >
              <ChevronRight className="h-4 w-4 text-slate-900" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDirectDate}
              className="rounded-lg border border-slate-200 bg-amber-200 px-3 py-1.5 text-xs font-black text-slate-950 shadow-sm focus:outline-none"
            />
            <span className="hidden sm:inline text-xs font-black text-slate-800">
              {formatDate(selectedDate)}
            </span>
          </div>
        </div>

        {/* Lab Filter Dropdown & Admin Block Modal */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-600" />
            <select
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              aria-label="Filter laboratorium"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-sm focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Laboratorium ({labs.length})</option>
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.location})
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <BlockLabModal labs={labs} defaultDate={selectedDate} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-600">
        <span className="sm:hidden text-slate-500">Geser tabel ke samping untuk melihat semua laboratorium.</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Slot tersedia</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Disetujui</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-700" />Diblokir</span>
      </div>

      {/* ── 2. Google Calendar Weekly / Day Timetable Matrix ── */}
      <div className="neo-card bg-white overflow-hidden">
        {/* Matrix Header info bar */}
        <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-black tracking-wide uppercase">
              Kalender Penggunaan Ruangan · {formatDate(selectedDate)}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-300">
            {currentBookings.length} Agenda Terjadwal
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <div className="sticky top-0 z-10 min-w-[900px] flex border-b border-slate-200 bg-amber-50 text-[11px] font-black text-slate-900 uppercase">
            {/* Time gutter header */}
            <div className="sticky left-0 z-20 w-20 shrink-0 p-3 border-r border-slate-200 bg-amber-50 text-center">
              Waktu
            </div>
            {/* Lab column headers */}
            {displayedLabs.map((lab) => (
              <div
                key={lab.id}
                className="flex-1 p-3 border-r border-slate-200 last:border-r-0 flex flex-col justify-center text-center"
              >
                <span className="text-xs font-black text-slate-950 truncate">{lab.name}</span>
                <span className="text-[10px] text-slate-600 font-bold truncate">
                  {lab.location} · {lab.capacity} Kursi
                </span>
              </div>
            ))}
          </div>

          {/* Timetable Body (Rows per Hour) */}
          <div className="min-w-[900px] divide-y divide-slate-200">
            {HOURS.map((hour) => {
              const hourStr = hour.toString().padStart(2, '0')
              const hourTime = `${hourStr}:00:00`
              const nextHourTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`

              return (
                <div key={hour} className="flex min-h-[64px]">
                  {/* Time label column */}
                  <div className="sticky left-0 z-10 w-20 shrink-0 p-2.5 border-r border-slate-200 text-center bg-slate-50 flex items-start justify-center">
                    <span className="text-[11px] font-black text-slate-700">
                      {hourStr}:00
                    </span>
                  </div>

                  {/* Lab columns for this hour */}
                  {displayedLabs.map((lab, labIdx) => {
                    // Cek apakah ada booking yang aktif pada jam ini
                    const matchedBookings = currentBookings.filter((b) => {
                      if (b.laboratoryId !== lab.id) return false
                      return b.startTime < nextHourTime && b.endTime > hourTime
                    })

                    return (
                      <div
                        key={lab.id}
                        className="flex-1 p-1 border-r border-slate-200 last:border-r-0 relative hover:bg-blue-50 transition-colors group"
                      >
                        {matchedBookings.length > 0 ? (
                          matchedBookings.map((b, idx) => {
                            const isBlocked = b.status === 'BLOCKED'
                            const colorClass = isBlocked
                              ? 'bg-slate-900 text-white border-slate-950'
                              : EVENT_COLORS[(labIdx + idx) % EVENT_COLORS.length]

                            const isStartHour = parseInt(b.startTime.split(':')[0], 10) === hour

                            return (
                              <div
                                key={b.id}
                                onClick={() =>
                                  setActiveEvent({
                                    booking: b,
                                    labName: lab.name,
                                    labLocation: lab.location,
                                  })
                                }
                                className={`w-full rounded-md border px-2.5 py-1.5 shadow-sm cursor-pointer transition-colors ${colorClass}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black truncate">
                                    {isBlocked ? 'MAINTENANCE / DIBLOKIR' : b.purpose}
                                  </span>
                                  <span className="text-[9px] font-extrabold opacity-90 shrink-0">
                                    {b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}
                                  </span>
                                </div>
                                {isStartHour && !isBlocked && b.userName && (
                                  <p className="text-[10px] font-bold opacity-90 truncate mt-0.5">
                                    Oleh: {b.userName}
                                  </p>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          // Slot Kosong (Bisa di-klik untuk ajukan peminjaman)
                          <Link
                            href={`/bookings/new?lab=${lab.id}&date=${selectedDate}&start=${hourStr}:00`}
                            className="w-full h-full min-h-[50px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-emerald-50 border border-dashed border-emerald-500 text-[10px] font-bold text-emerald-700"
                            title={`Klik untuk pinjam ${lab.name} jam ${hourStr}:00`}
                          >
                            + Pinjam Slot Ini
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Google Calendar Event Detail Modal / Slide-in ── */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="neo-card max-w-md w-full bg-white p-6 shadow-sm border border-slate-200 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-300 border border-slate-200 shadow-sm">
                  <CalendarIcon className="h-4 w-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Detail Pemakaian Laboratorium</h3>
                  <span className="text-[11px] font-bold text-slate-500">Google Calendar View</span>
                </div>
              </div>
              <button
                onClick={() => setActiveEvent(null)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="pt-4 space-y-3.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Nama Kegiatan / Agenda:
                </span>
                <p className="text-sm font-black text-slate-950 mt-0.5 leading-snug">
                  {activeEvent.booking.purpose}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Ruangan Lab:
                  </span>
                  <p className="text-xs font-black text-slate-900 mt-0.5">
                    {activeEvent.labName}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {activeEvent.labLocation}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Jam Pelaksanaan:
                  </span>
                  <p className="text-xs font-black text-blue-700 mt-0.5">
                    {activeEvent.booking.startTime.slice(0, 5)} – {activeEvent.booking.endTime.slice(0, 5)} WIB
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {formatDate(activeEvent.booking.bookingDate)}
                  </p>
                </div>
              </div>

              {activeEvent.booking.userName && activeEvent.booking.status !== 'BLOCKED' && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-300 bg-white">
                  <User className="h-4 w-4 text-slate-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500">Pemohon / Penanggung Jawab:</span>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {activeEvent.booking.userName}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Pill */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-600">Status Agenda:</span>
                <span
                  className={`neo-badge ${
                    activeEvent.booking.status === 'BLOCKED'
                      ? 'bg-slate-900 text-white'
                      : 'bg-emerald-400 text-slate-950'
                  }`}
                >
                  {activeEvent.booking.status === 'BLOCKED'
                    ? 'MAINTENANCE / BLOKIR'
                    : 'DISETUJUI / RESMI'}
                </span>
              </div>

              {/* Admin Unblock Button */}
              {isAdmin && activeEvent.booking.status === 'BLOCKED' && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      if (confirm('Buka kembali slot pemblokiran jadwal laboratorium ini?')) {
                        const res = await fetch(`/api/admin/labs/block/${activeEvent.booking.id}`, {
                          method: 'DELETE',
                        })
                        if (res.ok) {
                          setActiveEvent(null)
                          router.refresh()
                        }
                      }
                    }}
                    className="w-full neo-btn bg-rose-600 text-white py-2 text-xs font-black"
                  >
                    Buka Blokir Jadwal Ini
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
