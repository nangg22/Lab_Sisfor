import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import {
  FlaskConical,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  Clock,
} from 'lucide-react'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/70">
        <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" style={{ height: '60px' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-md shadow-blue-500/30">
              <FlaskConical className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-slate-900">
                SIP-Lab Sisfor
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">
                UISI · Prodi Sistem Informasi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white hover:text-blue-600 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={2} />
              Masuk
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all"
            >
              Daftar
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="mx-auto max-w-5xl px-4 py-20 sm:py-28 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.2} />
          Sistem Informasi Peminjaman Laboratorium · UISI
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-[1.15]">
          Peminjaman Laboratorium{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
            Jadi Lebih Mudah &amp; Cepat
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
          Ajukan jadwal peminjaman, pantau ketersediaan slot real-time, dan peroleh persetujuan resmi lab tanpa antre manual.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-102 transition-all duration-150"
          >
            Mulai Sekarang
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl glass-card px-7 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-all duration-150"
          >
            Sudah Punya Akun
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid gap-5 sm:grid-cols-3 w-full text-left">
          {[
            {
              icon: CalendarDays,
              title: 'Jadwal Live Matrix',
              desc: 'Lihat matriks ketersediaan jam operasional per laboratorium secara interaktif seperti RuangUISI.',
              gradient: 'from-blue-500 to-indigo-600',
            },
            {
              icon: Clock,
              title: 'Pengajuan & Notifikasi',
              desc: 'Pilih slot kosong, kirim pengajuan, dan dapatkan notifikasi langsung saat disetujui admin.',
              gradient: 'from-amber-400 to-orange-500',
            },
            {
              icon: ShieldCheck,
              title: 'SOP & Tiket Digital',
              desc: 'Unduh atau cetak tiket peminjaman resmi ber-barcode untuk verifikasi serah terima kunci lab.',
              gradient: 'from-emerald-400 to-teal-500',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-sm shadow-blue-500/20`}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-slate-900 text-base tracking-tight">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/60 py-6 text-center text-xs text-slate-400">
        SIP-Lab Sisfor · Sistem Informasi UISI · Kampus B UISI Gresik
      </footer>
    </div>
  )
}
