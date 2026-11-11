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

  // Dynamic Contextual Action Button logic
  function renderAction() {
    if (pathname.includes('/admin/users') || pathname === '/users') {
      return (
        <button
          onClick={() => alert('Fitur tambah pengguna baru (Admin) dapat dilakukan melalui pendaftaran atau integrasi SSO UISI.')}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
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
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
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
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <FileDown className="h-3.5 w-3.5 text-slate-500" />
          <span>Ekspor Laporan</span>
        </Link>
      )
    }

    if (pathname.includes('/schedule')) {
      return null // Hide completely as per UX requirement
    }

    // Default for students/lecturers on other pages
    if (!isAdmin) {
      return (
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Ajukan Pinjam</span>
        </Link>
      )
    }

    return null
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
          Beranda
        </Link>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          const href = '/' + segments.slice(0, idx + 1).join('/')
          const label = BREADCRUMB_MAP[seg] || seg

          return (
            <span key={seg} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              {isLast ? (
                <span className="font-semibold text-slate-900 capitalize">{label}</span>
              ) : (
                <Link href={href} className="hover:text-slate-900 transition-colors capitalize">
                  {label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      {/* Right Controls: Date/Time + Notifications + Contextual Action */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-xs font-medium text-slate-500">
          {currentDate}
        </div>

        <NotificationBell />

        {renderAction()}
      </div>
    </header>
  )
}
