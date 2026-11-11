'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { RoleBadge } from '@/components/ui/badge'
import type { RoleCode } from '@/db/schema'

interface NavbarProps {
  userName: string
  userRole: RoleCode
  pendingCount?: number
}

export function Navbar({ userName, userRole, pendingCount }: NavbarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await signOut({ callbackUrl: '/auth/login' })
  }

  const userLinks = [
    { href: '/dashboard', label: 'Beranda' },
    { href: '/schedule', label: 'Jadwal Lab' },
    { href: '/labs', label: 'Laboratorium' },
    { href: '/bookings', label: 'Pengajuan Saya' },
  ]

  const adminLinks = [
    { href: '/dashboard', label: 'Beranda' },
    { href: '/schedule', label: 'Jadwal Lab' },
    { href: '/labs', label: 'Laboratorium' },
    { href: '/admin/bookings', label: 'Kelola Pengajuan' },
    { href: '/admin/labs', label: 'Kelola Lab' },
    { href: '/admin/users', label: 'Pengguna' },
  ]

  const links = userRole === 'admin' ? adminLinks : userLinks

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">L</div>
          <span className="hidden sm:block text-gray-900">SIP-Lab Sisfor</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            const isBookingTab = link.href === '/admin/bookings' || link.href === '/bookings'
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{link.label}</span>
                {isBookingTab && pendingCount !== undefined && pendingCount > 0 && (
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      userRole === 'admin'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block font-medium max-w-32 truncate">{userName}</span>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                  <RoleBadge role={userRole} className="mt-1" />
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil Saya
                </Link>
                <button onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {loggingOut ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <nav className="md:hidden border-t border-gray-100 flex overflow-x-auto px-4 py-2 gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          const isBookingTab = link.href === '/admin/bookings' || link.href === '/bookings'
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{link.label}</span>
              {isBookingTab && pendingCount !== undefined && pendingCount > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    userRole === 'admin' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
