'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils'
import { ExportCsvButton } from './export-csv-button'
import { Search, Calendar, ClipboardList, ArrowRight, RotateCcw, FlaskConical, User, ArrowDownUp, ChevronLeft, ChevronRight } from 'lucide-react'

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
  canApprove: boolean
  viewerRole: string
  pagination?: { currentPage: number; totalPages: number; totalCount: number }
}

const STATUS_FILTERS = [
  { value: 'ALL',       label: 'Semua' },
  { value: 'PENDING',   label: 'Menunggu' },
  { value: 'APPROVED',  label: 'Disetujui' },
  { value: 'REJECTED',  label: 'Ditolak' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'BLOCKED',   label: 'Diblokir' },
]

const ROLE_LABELS: Record<string, string> = {
  aslab: 'Asisten Lab',
  kaprodi: 'Kaprodi',
  pembina_lab: 'Pembina Lab',
  admin: 'Admin',
}

export function BookingsManagementView({ bookings, currentFilter, pendingCount, canApprove, viewerRole, pagination }: Props) {
  const router = useRouter()
  const [search, setSearch]         = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy]         = useState<'newest' | 'date'>('newest')

  const filteredBookings = bookings.filter((b) => {
    const q = search.toLowerCase()
    const matchQuery = !q || (b.userName && b.userName.toLowerCase().includes(q)) || (b.labName && b.labName.toLowerCase().includes(q)) || (b.purpose && b.purpose.toLowerCase().includes(q))
    const matchDate  = !dateFilter || b.bookingDate === dateFilter
    return matchQuery && matchDate
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  function handleResetFilters() { setSearch(''); setDateFilter('') }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Kelola Pengajuan</h1>
          <p className="text-sm font-bold text-slate-500 mt-0.5">Evaluasi dan proses izin peminjaman laboratorium.</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            Akses Anda: {ROLE_LABELS[viewerRole] ?? viewerRole}
            {!canApprove && ' · mode pengawasan (tanpa keputusan)'}
          </p>
        </div>
        <ExportCsvButton bookings={filteredBookings} currentFilter={currentFilter} />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 pb-1">
        {STATUS_FILTERS.map((f) => {
          const isActive = (f.value === 'ALL' && !currentFilter) || currentFilter === f.value
          return (
            <Link
              key={f.value}
              href={f.value === 'ALL' ? '/admin/bookings' : `/admin/bookings?status=${f.value}`}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black border transition-all ${
                isActive
                  ? 'bg-amber-300 border-slate-200 text-slate-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-200'
              }`}
            >
              {f.label}
              {f.value === 'PENDING' && pendingCount > 0 && (
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black leading-none border ${isActive ? 'bg-slate-900 text-white border-slate-200' : 'bg-rose-500 text-white border-rose-700'}`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Search & date filter */}
      <div className="neo-card-flat p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama pemohon, lab, atau tujuan..." className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" title="Filter Tanggal" />
          </div>
          <label className="relative flex-1 sm:w-44">
            <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'date')}
              aria-label="Urutkan pengajuan"
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="newest">Pengajuan terbaru</option>
              <option value="date">Jadwal terdekat</option>
            </select>
          </label>
          {(search || dateFilter) && (
            <button onClick={handleResetFilters} className="neo-btn neo-btn-white px-3 py-2 text-xs font-black whitespace-nowrap">
              <RotateCcw className="h-3.5 w-3.5" />Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          Menampilkan <span className="font-semibold text-slate-700">{filteredBookings.length}</span> pengajuan
        </p>
        {currentFilter && <p className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">Filter: {STATUS_FILTERS.find((f) => f.value === currentFilter)?.label ?? currentFilter}</p>}
      </div>

      {filteredBookings.length > 0 ? (
        <>
          {/* Mobile card list */}
          <div className="block sm:hidden space-y-3">
            {filteredBookings.map((b) => (
              <div key={b.id} className="neo-card p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-200 shadow-sm">
                      <User className="h-4 w-4 text-amber-300" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{b.userName ?? '—'}</p>
                      <p className="text-[10px] font-bold text-slate-500 capitalize">{b.userRole ?? 'Pengguna'}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <FlaskConical className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span className="truncate">{b.labName ?? '—'}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-600">
                  {formatDate(b.bookingDate)} · {formatTime(b.startTime)}–{formatTime(b.endTime)} WIB
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{b.purpose}</p>
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className={`neo-btn w-full py-2 text-xs font-black justify-center ${b.status === 'PENDING' && canApprove ? 'neo-btn-primary' : 'neo-btn-white'}`}
                >
                  {b.status === 'PENDING' && canApprove ? 'Proses Sekarang' : 'Lihat Detail'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block neo-card overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="min-w-[800px] w-full text-left text-xs">
                <thead>
                  <tr className="bg-amber-100 border-b border-slate-200 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="px-4 py-3">Pemohon</th>
                    <th className="px-4 py-3">Laboratorium</th>
                    <th className="px-4 py-3">Jadwal</th>
                    <th className="px-4 py-3">Tujuan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Diajukan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-black text-slate-900">{b.userName ?? '—'}</p>
                        <p className="text-[10px] font-bold text-slate-500 capitalize">{b.userRole ?? 'Pengguna'}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 whitespace-nowrap">{b.labName ?? '—'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-black text-slate-900">{formatDate(b.bookingDate)}</p>
                        <p className="text-[10px] font-bold text-slate-500">{formatTime(b.startTime)}–{formatTime(b.endTime)} WIB</p>
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px] text-slate-600">
                        <p className="line-clamp-2">{b.purpose}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[10px] font-bold">{formatDateTime(b.createdAt.toISOString())}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className={`neo-btn px-2.5 py-1.5 text-[11px] font-black ${b.status === 'PENDING' && canApprove ? 'neo-btn-primary' : 'neo-btn-white'}`}
                        >
                          {b.status === 'PENDING' && canApprove ? 'Proses' : 'Detail'}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="neo-card px-6 py-14 text-center">
          <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm font-bold text-slate-700">Tidak ada pengajuan yang sesuai.</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            Coba ubah kata kunci, tanggal, atau status filter untuk melihat pengajuan lainnya.
          </p>
          {(search || dateFilter) && (
            <button onClick={handleResetFilters} className="mt-3 text-xs font-black text-blue-600 hover:underline">Reset semua filter</button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">
            Halaman <span className="text-slate-900">{pagination.currentPage}</span> dari{' '}
            <span className="text-slate-900">{pagination.totalPages}</span>
            {' '}·{' '}
            <span className="text-slate-900">{pagination.totalCount}</span> total pengajuan
          </p>

          <div className="flex items-center gap-2">
            {pagination.currentPage > 1 && (
              <Link
                href={`/admin/bookings?${currentFilter && currentFilter !== 'ALL' ? `status=${currentFilter}&` : ''}page=${pagination.currentPage - 1}`}
                className="neo-btn neo-btn-white px-3 py-2 text-xs font-black"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                Sebelumnya
              </Link>
            )}

            {/* Page number pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-xs font-bold text-slate-400">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={`/admin/bookings?${currentFilter && currentFilter !== 'ALL' ? `status=${currentFilter}&` : ''}page=${p}`}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 text-xs font-black transition-all ${
                        p === pagination.currentPage
                          ? 'bg-amber-300 border-slate-900 text-slate-950 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-900'
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
            </div>

            {pagination.currentPage < pagination.totalPages && (
              <Link
                href={`/admin/bookings?${currentFilter && currentFilter !== 'ALL' ? `status=${currentFilter}&` : ''}page=${pagination.currentPage + 1}`}
                className="neo-btn neo-btn-white px-3 py-2 text-xs font-black"
              >
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
