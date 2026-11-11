'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlockLabModal } from './block-lab-modal'
import { Calendar, Clock, CheckCircle, AlertOctagon, X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react'

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

// Jam operasional: 06:00 sampai 21:00
const TIME_HOURS = [
  '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'
]

export function ScheduleMatrixView({ labs, bookings, selectedDate, isAdmin }: Props) {
  const router = useRouter()
  const [activeSlot, setActiveSlot] = useState<{
    labId: string
    labName: string
    hour: string
    booking?: BookingSlot
  } | null>(null)

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    router.push(`/schedule?date=${newDate}`)
  }

  // Cek apakah di jam tertentu lab terisi booking APPROVED atau BLOCKED
  function getSlotStatus(labId: string, hourStr: string) {
    const hourNum = parseInt(hourStr, 10)
    const currentHourTime = `${hourStr.padStart(2, '0')}:00:00`
    const nextHourTime = `${(hourNum + 1).toString().padStart(2, '0')}:00:00`

    const matched = bookings.find((b) => {
      if (b.laboratoryId !== labId) return false
      return b.startTime < nextHourTime && b.endTime > currentHourTime
    })

    return matched
  }

  return (
    <div className="space-y-4">
      {/* Date filter & Legend bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <Calendar className="h-4 w-4 text-slate-600" />
            Pilih Tanggal:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="rounded-xl border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Legend Lengkap dengan Indikator Non-Warna (Color-blind friendly) */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-500">○</span>
            <span className="text-slate-700 font-medium">Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-amber-500 border border-amber-600 flex items-center justify-center text-[8px] font-bold text-white shadow-xs">▲</span>
            <span className="text-slate-800 font-semibold">Mulai Jadwal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-rose-500 border border-rose-600 flex items-center justify-center text-[8px] font-bold text-white shadow-xs">■</span>
            <span className="text-slate-800 font-semibold">Terpakai Penuh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-slate-900 border border-slate-950 flex items-center justify-center text-[8px] font-bold text-white shadow-xs">✕</span>
            <span className="text-slate-800 font-semibold">Diblokir / Maint.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-emerald-500 border border-emerald-600 flex items-center justify-center text-[8px] font-bold text-white shadow-xs">✓</span>
            <span className="text-slate-800 font-semibold">Dipilih</span>
          </div>
          {isAdmin && (
            <div className="ml-auto">
              <BlockLabModal labs={labs} defaultDate={selectedDate} />
            </div>
          )}
        </div>
      </div>

      {/* Skalabilitas & Horizontal Scroll Tabel: min-w-[850px] dengan container overflow-x-auto */}
      <div className="overflow-x-auto rounded-2xl glass-card shadow-sm w-full border border-slate-200">
        <table className="min-w-[920px] w-full border-collapse text-xs text-left">
          <thead>
            <tr className="bg-slate-800 text-white font-bold">
              <th className="sticky left-0 z-20 bg-slate-800 px-4 py-3 min-w-[190px] border-r border-slate-700 shadow-xs">
                Ruangan / Laboratorium
              </th>
              <th className="px-3 py-3 text-center min-w-[85px] border-r border-slate-700 whitespace-nowrap">
                Kapasitas
              </th>
              {TIME_HOURS.map((hr) => (
                <th
                  key={hr}
                  className="px-1.5 py-3 text-center min-w-[42px] border-r border-slate-700 font-bold"
                >
                  {parseInt(hr, 10)}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {labs.map((lab, index) => {
              const isEven = index % 2 === 0
              return (
                <tr
                  key={lab.id}
                  className={`transition-colors hover:bg-blue-50/50 ${
                    isEven ? 'bg-white/90' : 'bg-slate-50/70'
                  }`}
                >
                  {/* Lab info column */}
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-900 border-r border-slate-200 shadow-xs">
                    <Link
                      href={`/labs/${lab.id}`}
                      className="hover:text-blue-700 transition-colors block leading-snug"
                    >
                      {lab.name}
                    </Link>
                    <span className="text-[11px] text-slate-600 font-medium block truncate mt-0.5">
                      {lab.location}
                    </span>
                  </td>

                  {/* Capacity */}
                  <td className="px-3 py-3 text-center text-slate-700 font-semibold border-r border-slate-200 whitespace-nowrap">
                    {lab.capacity} Kursi
                  </td>

                  {/* Time Matrix Slots */}
                  {TIME_HOURS.map((hr) => {
                    const booking = getSlotStatus(lab.id, hr)
                    const isSelected =
                      activeSlot?.labName === lab.name && activeSlot?.hour === hr

                    let cellBg = 'bg-slate-100/70 hover:bg-blue-100/80 cursor-pointer text-slate-400'
                    let marker = '○'

                    if (booking) {
                      if (booking.status === 'BLOCKED') {
                        cellBg = 'bg-slate-900 hover:bg-black text-white cursor-pointer shadow-xs'
                        marker = '✕'
                      } else {
                        const startHour = parseInt(booking.startTime.split(':')[0], 10)
                        const isFirstHour = parseInt(hr, 10) === startHour
                        cellBg = isFirstHour
                          ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-xs'
                          : 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer shadow-xs'
                        marker = isFirstHour ? '▲' : '■'
                      }
                    }

                    if (isSelected) {
                      cellBg = 'bg-emerald-500 text-white ring-2 ring-emerald-700 ring-inset cursor-pointer font-extrabold shadow-sm'
                      marker = '✓'
                    }

                    return (
                      <td
                        key={hr}
                        onClick={() =>
                          setActiveSlot({
                            labId: lab.id,
                            labName: lab.name,
                            hour: hr,
                            booking: booking || undefined,
                          })
                        }
                        className={`p-1 text-center border-r border-slate-200 transition-all select-none ${cellBg}`}
                        title={
                          booking
                            ? `${lab.name} [${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)} WIB]: ${booking.purpose}`
                            : `${lab.name} — Jam ${hr}:00 WIB Tersedia (Klik untuk pinjam)`
                        }
                      >
                        <div className="h-7 w-full flex items-center justify-center font-bold text-[11px]">
                          {marker}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Slot Floating Card */}
      {activeSlot && (
        <div className="rounded-2xl glass-card border border-blue-200 p-5 shadow-xl max-w-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-sm text-slate-900 tracking-tight">Detail Slot Jadwal</span>
            </div>
            <button
              onClick={() => setActiveSlot(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-3 space-y-3">
            <div>
              <h4 className="text-base font-bold text-slate-900">{activeSlot.labName}</h4>
              <p className="text-xs font-bold text-blue-700 mt-0.5">
                Pukul {activeSlot.hour}:00 – {parseInt(activeSlot.hour, 10) + 1}:00 WIB
              </p>
            </div>

            {activeSlot.booking ? (
              <div className="text-xs space-y-2 pt-1 text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                      activeSlot.booking.status === 'BLOCKED'
                        ? 'bg-slate-900 text-white'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {activeSlot.booking.status === 'BLOCKED'
                      ? 'DIBLOKIR / MAINTENANCE'
                      : 'Terjadwal (Disetujui)'}
                  </span>
                </div>
                <p>
                  <span className="font-semibold text-slate-500">Rentang Waktu:</span>{' '}
                  <span className="font-bold text-slate-900">
                    {activeSlot.booking.startTime.slice(0, 5)} – {activeSlot.booking.endTime.slice(0, 5)} WIB
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-500">Keperluan:</span>{' '}
                  <span className="text-slate-800 font-semibold">{activeSlot.booking.purpose}</span>
                </p>
                {activeSlot.booking.userName && activeSlot.booking.status !== 'BLOCKED' && (
                  <p>
                    <span className="font-semibold text-slate-500">Pemohon:</span>{' '}
                    <span className="text-slate-800 font-medium">{activeSlot.booking.userName}</span>
                  </p>
                )}
                {isAdmin && activeSlot.booking.status === 'BLOCKED' && (
                  <div className="pt-2">
                    <button
                      onClick={async () => {
                        if (confirm('Buka kembali slot pemblokiran laboratorium ini?')) {
                          const res = await fetch(`/api/admin/labs/block/${activeSlot.booking?.id}`, {
                            method: 'DELETE',
                          })
                          if (res.ok) {
                            setActiveSlot(null)
                            router.refresh()
                          }
                        }
                      }}
                      className="w-full rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Buka Blokir Jadwal Ini
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1 space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Slot waktu ini kosong dan tersedia untuk dipinjam.</span>
                </div>
                <Link
                  href={`/bookings/new?lab=${activeSlot.labId}&date=${selectedDate}&start=${activeSlot.hour.padStart(2, '0')}:00`}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/25"
                >
                  Ajukan Peminjaman Slot Ini
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
