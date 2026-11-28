import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import { FlaskConical, CalendarDays, ShieldCheck, Sparkles, ArrowRight, LogIn, Clock } from 'lucide-react'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-900 shadow-[0_2px_0px_0px_#0f172a]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              <FlaskConical className="h-5 w-5 text-slate-900" strokeWidth={2.5} />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-slate-900">SIP-Lab Sisfor</span>
              <span className="block text-[10px] font-bold text-slate-500">UISI · Prodi Sistem Informasi</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="neo-btn neo-btn-white px-3.5 py-2 text-xs font-black">
              <LogIn className="h-3.5 w-3.5" strokeWidth={2.5} />Masuk
            </Link>
            <Link href="/auth/register" className="neo-btn neo-btn-primary px-3.5 py-2 text-xs font-black">
              Daftar<ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-1.5 text-xs font-black text-slate-900 uppercase tracking-wide mb-8">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
          Sistem Informasi Peminjaman Laboratorium · UISI
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-3xl leading-tight">
          Peminjaman Lab{' '}
          <span className="relative inline-block">
            <span className="relative z-10">Lebih Mudah</span>
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-300 z-0 -skew-x-2" aria-hidden="true" />
          </span>
          {' '}&amp; Cepat
        </h1>

        <p className="mt-6 text-base sm:text-lg font-bold text-slate-600 max-w-xl leading-relaxed">
          Ajukan jadwal peminjaman, pantau ketersediaan slot real-time, dan peroleh persetujuan resmi tanpa antre manual.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/auth/register" className="neo-btn neo-btn-primary w-full sm:w-auto px-8 py-3.5 text-sm font-black justify-center">
            Mulai Sekarang<ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link href="/auth/login" className="neo-btn neo-btn-white w-full sm:w-auto px-8 py-3.5 text-sm font-black justify-center">
            Sudah Punya Akun
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid gap-5 sm:grid-cols-3 w-full max-w-4xl text-left">
          {[
            { Icon: CalendarDays, title: 'Jadwal Live Matrix',      desc: 'Lihat matriks ketersediaan jam operasional per laboratorium secara interaktif.', card: 'neo-card-blue' },
            { Icon: Clock,        title: 'Pengajuan & Notifikasi',  desc: 'Pilih slot kosong, kirim pengajuan, dan dapatkan notifikasi saat disetujui admin.', card: 'neo-card-yellow' },
            { Icon: ShieldCheck,  title: 'SOP & Tiket Digital',     desc: 'Cetak tiket peminjaman resmi untuk verifikasi serah terima kunci laboratorium.', card: 'neo-card-dark' },
          ].map((item) => (
            <div key={item.title} className={`${item.card} p-5 flex flex-col gap-3`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/30 bg-white/20">
                <item.Icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <h3 className="font-black text-sm tracking-tight">{item.title}</h3>
              <p className="text-sm font-semibold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-slate-900 py-5 text-center text-xs font-bold text-slate-500 bg-white">
        SIP-Lab Sisfor · Sistem Informasi UISI · Kampus B UISI Gresik
      </footer>
    </div>
  )
}
