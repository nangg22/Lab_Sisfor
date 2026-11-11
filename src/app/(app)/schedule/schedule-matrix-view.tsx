'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlockLabModal } from './block-lab-modal'
import { Calendar, Clock, CheckCircle, X, ArrowRight } from 'lucide-react'

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
            <Calendar className="h-4 w-4 text-slate-400" />
            Tanggal:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
        </div>

        {/* Legend Lengkap dengan Indikator Non-Warna (Color-blind friendly) */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm bg-slate-100 border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-500">○</span>
            <span className="text-slate-600 font-medium">Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm bg-amber-500 border border-amber-600 flex items-center justify-center text-[8px] font-bold text-white">▲</span>
            <span className="text-slate-700 font-medium">Mulai Jadwal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm bg-rose-500 border border-rose-600 flex items-center justify-center text-[8px] font-bold text-white">■</span>
            <span className="text-slate-700 font-medium">Terpakai Penuh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm bg-slate-900 border border-slate-950 flex items-center justify-center text-[8px] font-bold text-white">✕</span>
            <span className="text-slate-700 font-medium">Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm bg-emerald-600 border border-emerald-700 flex items-center justify-center text-[8px] font-bold text-white">✓</span>
            <span className="text-slate-700 font-medium">Dipilih</span>
          </div>
          {isAdmin && (
            <div className="ml-auto">
              <BlockLabModal labs={labs} defaultDate={selectedDate} />
            </div>
          )}
        </div>
      </div>

      {/* Skalabilitas & Horizontal Scroll Tabel Enterprise */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs w-full">
        <table className="min-w-[920px] w-full border-collapse text-xs text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 min-w-[190px] border-r border-slate-200 shadow-xs">
                Ruangan / Laboratorium
              </th>
              <th className="px-3 py-3 text-center min-w-[85px] border-r border-slate-200 whitespace-nowrap">
                Kapasitas
              </th>
              {TIME_HOURS.map((hr) => (
                <th
                  key={hr}
                  className="px-1.5 py-3 text-center min-w-[42px] border-r border-slate-200 font-semibold"
                >
                  {parseInt(hr, 10)}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {labs.map((lab, index) => {
              const isEven = index % 2 === 0
              return (
                <tr
                  key={lab.id}
                  className={`transition-colors hover:bg-slate-50/75 ${
                    isEven ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  {/* Lab info column */}
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-semibold text-slate-900 border-r border-slate-200 shadow-xs">
                    <Link
                      href={`/labs/${lab.id}`}
                      className="hover:text-blue-600 transition-colors block leading-snug"
                    >
                      {lab.name}
                    </Link>
                    <span className="text-[11px] text-slate-500 font-normal block truncate mt-0.5">
                      {lab.location}
                    </span>
                  </td>

                  {/* Capacity */}
                  <td className="px-3 py-3 text-center text-slate-600 font-medium border-r border-slate-200 whitespace-nowrap">
                    {lab.capacity} Kursi
                  </td>

                  {/* Time Matrix Slots */}
                  {TIME_HOURS.map((hr) => {
                    const booking = getSlotStatus(lab.id, hr)
                    const isSelected =
                      activeSlot?.labName === lab.name && activeSlot?.hour === hr

                    let cellBg = 'bg-slate-50/80 hover:bg-blue-50 cursor-pointer text-slate-400'
                    let marker = '○'

                    if (booking) {
                      if (booking.status === 'BLOCKED') {
                        cellBg = 'bg-slate-900 hover:bg-black text-white cursor-pointer'
                        marker = '✕'
                      } else {
                        const startHour = parseInt(booking.startTime.split(':')[0], 10)
                        const isFirstHour = parseInt(hr, 10) === startHour
                        cellBg = isFirstHour
                          ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                          : 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer'
                        marker = isFirstHour ? '▲' : '■'
                      }
                    }

                    if (isSelected) {
                      cellBg = 'bg-emerald-600 text-white ring-2 ring-emerald-700 ring-inset cursor-pointer font-extrabold'
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
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-lg max-w-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-slate-900 tracking-tight">Detail Slot Jadwal</span>
            </div>
            <button
              onClick={() => setActiveSlot(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-3 space-y-3">
            <div>
              <h4 className="text-base font-semibold text-slate-900">{activeSlot.labName}</h4>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">
                Pukul {activeSlot.hour}:00 – {parseInt(activeSlot.hour, 10) + 1}:00 WIB
              </p>
            </div>

            {activeSlot.booking ? (
              <div className="text-xs space-y-2 pt-1 text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-500">Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                      activeSlot.booking.status === 'BLOCKED'
                        ? 'bg-slate-900 text-white'
                        : 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/20'
                    }`}
                  >
                    {activeSlot.booking.status === 'BLOCKED'
                      ? 'DIBLOKIR / MAINTENANCE'
                      : 'Terjadwal (Disetujui)'}
                  </span>
                </div>
                <p>
                  <span className="font-medium text-slate-500">Rentang Waktu:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {activeSlot.booking.startTime.slice(0, 5)} – {activeSlot.booking.endTime.slice(0, 5)} WIB
                  </span>
                </p>
                <p>
                  <span className="font-medium text-slate-500">Keperluan:</span>{' '}
                  <span className="text-slate-800 font-medium">{activeSlot.booking.purpose}</span>
                </p>
                {activeSlot.booking.userName && activeSlot.booking.status !== 'BLOCKED' && (
                  <p>
                    <span className="font-medium text-slate-500">Pemohon:</span>{' '}
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
                      className="w-full rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Buka Blokir Jadwal Ini
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1 space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium bg-emerald-50 py-2 px-3 rounded-md ring-1 ring-emerald-600/20">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Slot waktu ini kosong dan tersedia untuk dipinjam.</span>
                </div>
                <Link
                  href={`/bookings/new?lab=${activeSlot.labId}&date=${selectedDate}&start=${activeSlot.hour.padStart(2, '0')}:00`}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
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
