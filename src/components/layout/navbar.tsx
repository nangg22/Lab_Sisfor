'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { RoleBadge } from '@/components/ui/badge'
import { NotificationBell } from './notification-bell'
import type { RoleCode } from '@/db/schema'
import {
  Home,
  CalendarDays,
  FlaskConical,
  ClipboardList,
  Users,
  LayoutGrid,
  Plus,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react'

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
    { href: '/dashboard',  label: 'Beranda',        icon: Home },
    { href: '/schedule',   label: 'Jadwal Lab',     icon: CalendarDays },
    { href: '/labs',       label: 'Laboratorium',   icon: FlaskConical },
    { href: '/bookings',   label: 'Pengajuan Saya', icon: ClipboardList },
  ]

  const adminLinks = [
    { href: '/dashboard',       label: 'Beranda',          icon: Home },
    { href: '/schedule',        label: 'Jadwal Lab',       icon: CalendarDays },
    { href: '/labs',            label: 'Laboratorium',     icon: FlaskConical },
    { href: '/admin/bookings',  label: 'Kelola Pengajuan', icon: ClipboardList },
    { href: '/admin/labs',      label: 'Kelola Lab',       icon: LayoutGrid },
    { href: '/admin/users',     label: 'Pengguna',         icon: Users },
  ]

  const links = userRole === 'admin' ? adminLinks : userLinks
  const initials = userName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/70">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" style={{ height: '60px' }}>

        {/* ── Logo ── */}
        <Link href="/dashboard" className="flex items-center gap-2.5 select-none shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-md shadow-blue-500/30">
            <FlaskConical className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="block text-[13px] font-700 tracking-tight text-slate-900 font-bold">
              SIP-Lab Sisfor
            </span>
            <span className="block text-[11px] text-slate-400 font-medium tracking-wide">
              UISI · Prodi Sisfor
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-0.5">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            const isBookingTab = link.href === '/admin/bookings' || link.href === '/bookings'
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{link.label}</span>
                {isBookingTab && pendingCount !== undefined && pendingCount > 0 && (
                  <span className="ml-0.5 inline-flex h-4.5 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white leading-none">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* Quick Add */}
          <Link
            href="/bookings/new"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-blue-600 hover:scale-105 hover:shadow-md transition-all duration-150"
            title="Ajukan Peminjaman"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.2} style={{ height: '18px', width: '18px' }} />
          </Link>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 pl-1.5 pr-2.5 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-white hover:shadow-md transition-all duration-150"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-white font-bold text-xs shadow-sm">
                {initials}
              </div>
              <span className="hidden sm:block font-semibold max-w-[120px] truncate text-[13px]">
                {userName.split(' ')[0]}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} strokeWidth={2.2} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl glass-panel shadow-xl py-1.5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100/70">
                    <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                    <RoleBadge role={userRole} className="mt-1" />
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-white/60 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                      Profil Saya
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/60 disabled:opacity-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.8} />
                      {loggingOut ? 'Keluar...' : 'Keluar'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Nav (scrollable tab strip) ── */}
      <nav className="md:hidden border-t border-slate-100/60 flex overflow-x-auto px-3 py-1.5 gap-0.5 scrollbar-hide">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          const isBookingTab = link.href === '/admin/bookings' || link.href === '/bookings'
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{link.label}</span>
              {isBookingTab && pendingCount !== undefined && pendingCount > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
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
