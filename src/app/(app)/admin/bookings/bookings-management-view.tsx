'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { ExportCsvButton } from './export-csv-button'
import {
  Search,
  Calendar,
  ClipboardList,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'

interface BookingItem {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  purpose: string
  status: string
  createdAt: Date
  labName: string | null
  userName: string | null
  userRole: string | null
}

interface Props {
  bookings: BookingItem[]
  currentFilter?: string
  pendingCount: number
}

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'BLOCKED', label: 'Diblokir / Maint.' },
]

export function BookingsManagementView({ bookings, currentFilter, pendingCount }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Client-side instant query filtering
  const filteredBookings = bookings.filter((b) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      (b.userName && b.userName.toLowerCase().includes(q)) ||
      (b.labName && b.labName.toLowerCase().includes(q)) ||
      (b.purpose && b.purpose.toLowerCase().includes(q))

    const matchDate = !dateFilter || b.bookingDate === dateFilter

    return matchQuery && matchDate
  })

  function handleResetFilters() {
    setSearch('')
    setDateFilter('')
  }

  return (
    <div className="space-y-4">
      {/* 1. Header with Export CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Kelola Pengajuan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluasi dan proses izin peminjaman laboratorium mahasiswa &amp; dosen.
          </p>
        </div>
        <ExportCsvButton bookings={filteredBookings} currentFilter={currentFilter} />
      </div>

      {/* 2. Status Pill Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        {STATUS_FILTERS.map((f) => {
          const isActive = (f.value === 'ALL' && !currentFilter) || currentFilter === f.value
          return (
            <Link
              key={f.value}
              href={f.value === 'ALL' ? '/admin/bookings' : `/admin/bookings?status=${f.value}`}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{f.label}</span>
              {f.value === 'PENDING' && pendingCount > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* 3. Utility Bar: Search Bar + Date Range Picker */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {/* Search Input with Magnifying Glass */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pemohon atau tujuan peminjaman..."
            className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Date Picker Button / Input with Calendar Icon */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-44">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-700 font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              title="Filter Tanggal Kegiatan"
            />
          </div>

          {(search || dateFilter) && (
            <button
              onClick={handleResetFilters}
              title="Reset Filter"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Enterprise Data Table */}
      {filteredBookings.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[820px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Pemohon</th>
                  <th className="px-4 py-3">Laboratorium</th>
                  <th className="px-4 py-3">Jadwal Penggunaan</th>
                  <th className="px-4 py-3">Tujuan Kegiatan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Diajukan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{b.userName ?? '—'}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{b.userRole ?? 'Pengguna'}</p>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{b.labName ?? '—'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{formatDate(b.bookingDate)}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {formatTime(b.startTime)}–{formatTime(b.endTime)} WIB
                      </p>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs text-slate-600">
                      <p className="line-clamp-2 leading-relaxed">{b.purpose}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDateTime(b.createdAt.toISOString())}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          b.status === 'PENDING'
                            ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                            : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {b.status === 'PENDING' ? 'Proses' : 'Detail'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
          <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-600 text-sm font-medium">
            Tidak ada permohonan yang sesuai dengan filter pencarian.
          </p>
          {(search || dateFilter) && (
            <button
              onClick={handleResetFilters}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset semua filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}

