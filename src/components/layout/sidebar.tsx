'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import type { RoleCode } from '@/db/schema'
import {
  LayoutDashboard,
  CalendarDays,
  FlaskConical,
  ClipboardList,
  Users,
  LogOut,
  Building2,
} from 'lucide-react'

interface SidebarProps {
  userName: string
  userEmail: string
  userRole: RoleCode
  pendingCount?: number
}

export function Sidebar({ userName, userEmail, userRole, pendingCount }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'admin'

  // STRICT Role-Based Navigation Routing Logic:
  // - Admin: Dashboard, Jadwal Ruang, Kelola Pengajuan, Manajemen Lab, Pengguna
  // - Mahasiswa / Dosen: Dashboard, Jadwal Ruang, Laboratorium (untuk pinjam), Riwayat Pengajuan
  const adminNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jadwal Ruang', href: '/schedule', icon: CalendarDays },
    {
      name: 'Kelola Pengajuan',
      href: '/admin/bookings',
      icon: ClipboardList,
      badge: pendingCount,
    },
    { name: 'Manajemen Lab', href: '/admin/labs', icon: Building2 },
    { name: 'Pengguna', href: '/admin/users', icon: Users },
  ]

  const userNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jadwal Ruang', href: '/schedule', icon: CalendarDays },
    { name: 'Laboratorium', href: '/labs', icon: FlaskConical },
    {
      name: 'Riwayat Pengajuan',
      href: '/bookings',
      icon: ClipboardList,
      badge: pendingCount,
    },
  ]

  const navigation = isAdmin ? adminNav : userNav

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-sm shadow-xs">
          SL
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight text-slate-900 leading-none truncate">
            SIP-Lab Sisfor
          </span>
          <span className="block text-[11px] font-medium text-slate-500 mt-1 truncate">
            UISI · Sistem Informasi
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Menu Administrator' : 'Menu Layanan Mahasiswa'}
        </div>
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isAdmin ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile Section at Bottom */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition-colors">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{userRole}</p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
