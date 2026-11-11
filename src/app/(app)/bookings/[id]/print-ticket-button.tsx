'use client'

interface Props {
  booking: {
    id: string
    bookingDate: string
    startTime: string
    endTime: string
    purpose: string
    participantCount: number | null
    notes: string | null
    status: string
    createdAt: string
    labName: string | null
    labLocation: string | null
    userName: string | null
    userRole: string | null
    userInstitutionalId: string | null
  }
}

export function PrintTicketButton({ booking }: Props) {
  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={handlePrint}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Cetak Bukti / Tiket Peminjaman
      </button>

      {/* Area khusus cetak / Print Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ticket,
          #printable-ticket * {
            visibility: visible;
          }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          header,
          nav,
          button {
            display: none !important;
          }
        }
      `}</style>

      {/* Hidden container for print template */}
      <div id="printable-ticket" className="hidden print:block">
        <div className="border-b-2 border-gray-900 pb-4 text-center">
          <h2 className="text-xl font-bold tracking-tight uppercase">
            Surat Bukti Peminjaman Laboratorium
          </h2>
          <p className="text-sm font-medium text-gray-700">
            Sistem Informasi Laboratorium Sistem Informasi (SIP-Lab Sisfor) - UISI
          </p>
        </div>

        <div className="my-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Nomor Registrasi / ID:</span>
            <span className="font-mono text-gray-900 font-bold">{booking.id}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Nama Pemohon:</span>
            <span className="text-gray-900 font-medium">
              {booking.userName} ({booking.userInstitutionalId || '—'})
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Status Akun:</span>
            <span className="text-gray-900 capitalize font-medium">{booking.userRole}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Laboratorium:</span>
            <span className="text-gray-900 font-bold">
              {booking.labName} ({booking.labLocation})
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Tanggal Penggunaan:</span>
            <span className="text-gray-900 font-bold">{booking.bookingDate}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Waktu / Sesi:</span>
            <span className="text-gray-900 font-bold">
              {booking.startTime} - {booking.endTime} WIB
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Keperluan:</span>
            <span className="text-gray-900">{booking.purpose}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Perkiraan Peserta:</span>
            <span className="text-gray-900">{booking.participantCount || '—'} orang</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-700">Status Persetujuan:</span>
            <span className="text-green-700 font-bold uppercase tracking-wider">
              [ {booking.status} ]
            </span>
          </div>
        </div>

        <div className="mt-8 rounded border border-gray-300 p-3 text-xs text-gray-600 space-y-1">
          <p className="font-bold text-gray-800">Catatan & Ketentuan:</p>
          <p>1. Tunjukkan lembar bukti ini beserta identitas fisik resmi saat pengambilan kunci laboratorium.</p>
          <p>2. Kunci fisik harus dikembalikan paling lambat 15 menit setelah waktu penggunaan selesai.</p>
          <p>3. Dilarang meninggalkan sampah atau merusak inventaris lab selama masa peminjaman.</p>
        </div>

        <div className="mt-10 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-gray-500 mb-14">Pemohon,</p>
            <p className="font-bold underline">{booking.userName}</p>
            <p className="text-gray-600">{booking.userInstitutionalId || 'NIM/NIP'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-14">Petugas / Asisten Lab,</p>
            <p className="font-bold underline">(...................................)</p>
            <p className="text-gray-600">Staf Pengelola Lab</p>
          </div>
        </div>
      </div>
    </div>
  )
}

