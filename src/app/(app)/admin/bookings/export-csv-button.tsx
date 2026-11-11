'use client'

import { Button } from '@/components/ui/button'

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

    const headers = [
      'ID Booking',
      'Nama Peminjam',
      'Role',
      'Laboratorium',
      'Tanggal Peminjaman',
      'Jam Mulai',
      'Jam Selesai',
      'Tujuan Peminjaman',
      'Status',
      'Tanggal Dibuat',
    ]

    const escapeCsv = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = bookings.map((b) => [
      escapeCsv(b.id),
      escapeCsv(b.userName),
      escapeCsv(b.userRole),
      escapeCsv(b.labName),
      escapeCsv(b.bookingDate),
      escapeCsv(b.startTime.slice(0, 5)),
      escapeCsv(b.endTime.slice(0, 5)),
      escapeCsv(b.purpose),
      escapeCsv(b.status),
      escapeCsv(new Date(b.createdAt).toLocaleString('id-ID')),
    ])

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const today = new Date().toISOString().split('T')[0]
    const filterTag = currentFilter && currentFilter !== 'ALL' ? `-${currentFilter.toLowerCase()}` : ''

    link.setAttribute('href', url)
    link.setAttribute('download', `rekap-peminjaman-lab${filterTag}-${today}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900 border-gray-300"
    >
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Ekspor CSV
    </Button>
  )
}

