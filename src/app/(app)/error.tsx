'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="neo-card max-w-md w-full overflow-hidden">
        <div
          aria-hidden="true"
          style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#ef4444 0px,#ef4444 12px,#0f172a 12px,#0f172a 14px)' }}
        />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              <AlertTriangle className="h-5 w-5 text-rose-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Halaman Error</h2>
              <p className="text-[11px] font-bold text-slate-500">Konten tidak dapat dimuat</p>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            Terjadi kesalahan saat memuat halaman ini. Ini mungkin disebabkan oleh koneksi database yang terputus atau error sementara.
          </p>

          {error.digest && (
            <p className="text-[10px] font-bold text-slate-400 font-mono">Error ID: {error.digest}</p>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button onClick={reset} className="neo-btn neo-btn-primary py-2.5 text-xs font-black justify-center">
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />Coba Lagi
            </button>
            <Link href="/dashboard" className="neo-btn neo-btn-white py-2.5 text-xs font-black justify-center">
              <Home className="h-3.5 w-3.5" strokeWidth={2.5} />Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
