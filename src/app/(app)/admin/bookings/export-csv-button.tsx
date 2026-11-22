'use client'

import { FileDown } from 'lucide-react'

interface ExportBooking {
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
  bookings: ExportBooking[]
  currentFilter?: string
}

export function ExportCsvButton({ bookings, currentFilter }: Props) {
  function handleExport() {
    if (bookings.length === 0) {
      alert('Tidak ada data peminjaman untuk diekspor.')
      return
    }

    const headers = ['ID Booking','Nama Peminjam','Role','Laboratorium','Tanggal Peminjaman','Jam Mulai','Jam Selesai','Tujuan Peminjaman','Status','Tanggal Dibuat']
    const esc = (v: string | null | undefined) => { const s = String(v ?? '').replace(/"/g, '""'); return `"${s}"` }

    const rows = bookings.map((b) => [
      esc(b.id), esc(b.userName), esc(b.userRole), esc(b.labName),
      esc(b.bookingDate), esc(b.startTime.slice(0, 5)), esc(b.endTime.slice(0, 5)),
      esc(b.purpose), esc(b.status), esc(new Date(b.createdAt).toLocaleString('id-ID')),
    ])

    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const tag  = currentFilter && currentFilter !== 'ALL' ? `-${currentFilter.toLowerCase()}` : ''
    const date = new Date().toISOString().split('T')[0]

    a.href = url
    a.download = `rekap-peminjaman-lab${tag}-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="neo-btn neo-btn-white px-3.5 py-2 text-xs font-black"
    >
      <FileDown className="h-4 w-4" strokeWidth={2} />
      Ekspor CSV
    </button>
  )
}
