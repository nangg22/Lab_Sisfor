'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, ChevronRight, FileDown } from 'lucide-react'
import { NotificationBell } from './notification-bell'

interface HeaderProps {
  isAdmin?: boolean
}

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  schedule: 'Jadwal Ruang',
  labs: 'Laboratorium',
  bookings: 'Pengajuan',
  new: 'Ajukan Baru',
  admin: 'Admin',
  users: 'Pengguna',
  profile: 'Profil',
}

export function Header({ isAdmin }: HeaderProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  function renderAction() {
    if (pathname.includes('/admin/users') || pathname === '/users') {
      return (
        <button
          onClick={() => alert('Fitur tambah pengguna baru (Admin) dapat dilakukan melalui registrasi akun atau integrasi SSO UISI.')}
          className="neo-btn neo-btn-primary px-3.5 py-1.5 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Tambah Pengguna</span>
        </button>
      )
    }

    if (pathname.includes('/admin/labs') && !pathname.includes('/new') && !pathname.includes('/edit')) {
      return (
        <Link
          href="/admin/labs/new"
          className="neo-btn neo-btn-primary px-3.5 py-1.5 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Tambah Lab</span>
        </Link>
      )
    }

    if (pathname.includes('/admin/bookings')) {
      return (
        <Link
          href="/admin/bookings?status=ALL"
          className="neo-btn neo-btn-white px-3.5 py-1.5 text-xs font-bold"
        >
          <FileDown className="h-3.5 w-3.5 text-slate-700" />
          <span>Ekspor Laporan</span>
        </Link>
      )
    }

    if (pathname.includes('/schedule')) {
      return null
    }

    if (!isAdmin) {
      return (
        <Link
          href="/bookings/new"
          className="neo-btn neo-btn-primary px-3.5 py-1.5 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Ajukan Pinjam</span>
        </Link>
      )
    }

    return null
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 w-full items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)] md:px-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600 font-bold">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Beranda
        </Link>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          const href = '/' + segments.slice(0, idx + 1).join('/')
          const label = BREADCRUMB_MAP[seg] || seg

          return (
            <span key={seg} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
              {isLast ? (
                <span className="max-w-[12rem] truncate font-black text-slate-900 capitalize">{label}</span>
              ) : (
                <Link href={href} className="hover:text-blue-600 transition-colors capitalize">
                  {label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      {/* Right Controls: Date/Time + Notifications + Action Button */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden sm:block text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 shadow-sm">
          {currentDate}
        </div>

        <NotificationBell />

        {renderAction()}
      </div>
    </header>
  )
}
