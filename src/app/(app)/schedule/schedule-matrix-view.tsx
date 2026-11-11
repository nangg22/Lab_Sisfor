'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlockLabModal } from './block-lab-modal'

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

  // Cek apakah di jam tertentu lab terisi booking APPROVED
  function getSlotStatus(labId: string, hourStr: string) {
    const hourNum = parseInt(hourStr, 10)
    // format string perbandingan: "08:00:00"
    const currentHourTime = `${hourStr.padStart(2, '0')}:00:00`
    const nextHourTime = `${(hourNum + 1).toString().padStart(2, '0')}:00:00`

    const matched = bookings.find((b) => {
      if (b.laboratoryId !== labId) return false
      // Slot bertabrakan jika: b.startTime < nextHourTime && b.endTime > currentHourTime
      return b.startTime < nextHourTime && b.endTime > currentHourTime
    })

    return matched
  }

  return (
    <div className="space-y-4">
      {/* Date filter & Legend bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Pilih Tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-gray-100 border border-gray-200"></span>
            <span className="text-gray-600">Kosong / Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-amber-500"></span>
            <span className="text-gray-700 font-medium">Terjadwal (Kuliah/Rapat)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-rose-500"></span>
            <span className="text-gray-700 font-medium">Terpakai Penuh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-slate-800"></span>
            <span className="text-gray-700 font-medium">Diblokir / Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-emerald-500"></span>
            <span className="text-gray-700 font-medium">Dipilih</span>
          </div>
          {isAdmin && (
            <div className="ml-auto">
              <BlockLabModal labs={labs} defaultDate={selectedDate} />
            </div>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-300 bg-white shadow-sm">
        <table className="w-full border-collapse text-xs text-left">
          <thead>
            <tr className="bg-slate-700 text-white font-medium">
              <th className="sticky left-0 z-20 bg-slate-700 px-4 py-3 min-w-[180px] border-r border-slate-600">
                Ruangan / Laboratorium
              </th>
              <th className="px-3 py-3 text-center min-w-[90px] border-r border-slate-600">
                Kapasitas
              </th>
              {TIME_HOURS.map((hr) => (
                <th
                  key={hr}
                  className="px-2 py-3 text-center min-w-[42px] border-r border-slate-600 font-semibold"
                >
                  {parseInt(hr, 10)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {labs.map((lab, index) => {
              const isEven = index % 2 === 0
              return (
                <tr
                  key={lab.id}
                  className={`transition-colors hover:bg-blue-50/40 ${
                    isEven ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  {/* Lab info column */}
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">
                    <Link
                      href={`/labs/${lab.id}`}
                      className="hover:text-blue-600 hover:underline block"
                    >
                      {lab.name}
                    </Link>
                    <span className="text-[11px] text-gray-400 font-normal block truncate">
                      {lab.location}
                    </span>
                  </td>

                  {/* Capacity */}
                  <td className="px-3 py-3 text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    {lab.capacity} Kursi
                  </td>

                  {/* Time Matrix Slots */}
                  {TIME_HOURS.map((hr) => {
                    const booking = getSlotStatus(lab.id, hr)
                    const isSelected =
                      activeSlot?.labName === lab.name && activeSlot?.hour === hr

                    let cellBg = 'bg-gray-100 hover:bg-blue-100 cursor-pointer'
                    let cellText = ''

                    if (booking) {
                      if (booking.status === 'BLOCKED') {
                        cellBg = 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
                      } else {
                        // Jika jam pertama booking pakai warna amber, jika berlanjut pakai rose
                        const startHour = parseInt(booking.startTime.split(':')[0], 10)
                        const isFirstHour = parseInt(hr, 10) === startHour
                        cellBg = isFirstHour
                          ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                          : 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer'
                      }
                    }

                    if (isSelected) {
                      cellBg = 'bg-emerald-500 text-white ring-2 ring-emerald-600 ring-inset cursor-pointer'
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
                        className={`p-1 text-center border-r border-gray-200 transition-all ${cellBg}`}
                        title={
                          booking
                            ? `${lab.name} [${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}]: ${booking.purpose}`
                            : `${lab.name} - Jam ${hr}:00 Tersedia`
                        }
                      >
                        <div className="h-7 w-full flex items-center justify-center font-bold text-[10px]">
                          {booking ? '●' : ''}
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

      {/* Detail Slot Floating / Bottom Drawer Info (seperti di screenshot RuangUISI) */}
      {activeSlot && (
        <div className="rounded-xl border border-teal-200 bg-white shadow-lg overflow-hidden max-w-md animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-teal-600 px-4 py-2.5 text-white flex items-center justify-between">
            <span className="font-bold text-sm tracking-wide">Detail Slot</span>
            <button
              onClick={() => setActiveSlot(null)}
              className="text-teal-100 hover:text-white text-xs font-semibold"
            >
              ✕ Tutup
            </button>
          </div>
          <div className="p-4 space-y-2">
            <div className="text-center pb-2 border-b border-gray-100">
              <h4 className="text-lg font-bold text-gray-900">{activeSlot.labName}</h4>
              <p className="text-sm font-semibold text-teal-700">
                Pukul {activeSlot.hour}:00 - {parseInt(activeSlot.hour, 10) + 1}:00 WIB
              </p>
            </div>

            {activeSlot.booking ? (
              <div className="text-xs space-y-1 pt-1 text-gray-700">
                <p>
                  <span className="font-semibold text-gray-500">Status:</span>{' '}
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      activeSlot.booking.status === 'BLOCKED'
                        ? 'bg-slate-800 text-white'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {activeSlot.booking.status === 'BLOCKED'
                      ? 'DIBLOKIR / MAINTENANCE'
                      : 'Terisi (Disetujui)'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-500">Rentang Waktu:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {activeSlot.booking.startTime.slice(0, 5)} - {activeSlot.booking.endTime.slice(0, 5)} WIB
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-500">Keperluan / Alasan:</span>{' '}
                  <span className="text-gray-900 font-medium">{activeSlot.booking.purpose}</span>
                </p>
                {activeSlot.booking.userName && activeSlot.booking.status !== 'BLOCKED' && (
                  <p>
                    <span className="font-semibold text-gray-500">Pemohon:</span>{' '}
                    <span className="text-gray-900">{activeSlot.booking.userName}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-2 text-center space-y-3">
                <p className="text-xs text-green-700 font-medium bg-green-50 py-1.5 px-2 rounded-lg border border-green-200">
                  ✅ Slot waktu ini masih kosong dan tersedia untuk dipinjam!
                </p>
                <Link
                  href={`/bookings/new?lab=${activeSlot.labId}&date=${selectedDate}&start=${activeSlot.hour.padStart(2, '0')}:00`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  + Ajukan Peminjaman Sekarang
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

