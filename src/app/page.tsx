import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold text-blue-600 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">L</div>
            SIP-Lab Sisfor
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">Masuk</Link>
            <Link href="/auth/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Daftar</Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
          Program Studi Sistem Informasi · UISI
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl max-w-3xl">
          Peminjaman Laboratorium <span className="text-blue-600">Jadi Lebih Mudah</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
          Ajukan, pantau, dan kelola peminjaman laboratorium secara digital. Tidak perlu lagi cari Admin secara langsung.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">Mulai Sekarang</Link>
          <Link href="/auth/login" className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Sudah Punya Akun</Link>
        </div>
      </main>

      <section className="border-t border-gray-200 bg-white py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">Semua yang Anda butuhkan</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: '🏫', title: 'Katalog Laboratorium', desc: 'Lihat informasi lengkap setiap lab: lokasi, kapasitas, dan fasilitas.' },
              { icon: '📋', title: 'Pengajuan Online', desc: 'Isi form peminjaman kapan saja. Status langsung dapat dipantau secara real-time.' },
              { icon: '✅', title: 'Proses Terstruktur', desc: 'Admin memproses, menyetujui, atau menolak dengan alasan yang tercatat.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6 text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        SIP-Lab Sisfor · Prototipe Akademik · Prodi Sistem Informasi UISI
      </footer>
    </div>
  )
}
