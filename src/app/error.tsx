'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Root Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="neo-card max-w-md w-full overflow-hidden">
        <div
          aria-hidden="true"
          style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#ef4444 0px,#ef4444 12px,#0f172a 12px,#0f172a 14px)' }}
        />
        <div className="p-6 space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mx-auto">
            <AlertTriangle className="h-7 w-7 text-rose-600" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Terjadi Kesalahan</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Sistem mengalami error yang tidak terduga. Coba muat ulang halaman.
            </p>
            {error.digest && (
              <p className="text-[11px] font-bold text-slate-400 mt-2">ID: {error.digest}</p>
            )}
          </div>
          <button
            onClick={reset}
            className="neo-btn neo-btn-primary w-full py-2.5 text-sm font-black justify-center"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  )
}
