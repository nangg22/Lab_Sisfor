import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="neo-card max-w-md w-full overflow-hidden text-center">
        {/* Amber stripe */}
        <div
          aria-hidden="true"
          style={{
            height: '5px',
            background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)',
          }}
        />

        <div className="p-8 space-y-5">
          {/* Big 404 */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-300 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] mx-auto">
            <SearchX className="h-10 w-10 text-slate-900" strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-6xl font-black text-slate-900 tracking-tight leading-none">404</p>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 mt-2">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">
              Halaman yang kamu cari tidak ada atau sudah dipindahkan.
              Pastikan URL yang kamu ketik sudah benar.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="neo-btn neo-btn-primary w-full py-3 text-sm font-black justify-center"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
            Kembali ke Dashboard
          </Link>

          <Link
            href="/auth/login"
            className="block text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            Atau masuk ke akun kamu →
          </Link>
        </div>
      </div>
    </div>
  )
}
