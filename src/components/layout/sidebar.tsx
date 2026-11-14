'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import type { RoleCode } from '@/db/schema'
import { hasPermission } from '@/lib/permissions'
import {
  LayoutDashboard,
  CalendarDays,
  FlaskConical,
  ClipboardList,
  Users,
  LogOut,
  Building2,
  ShieldCheck,
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
  const canAudit = hasPermission(userRole, 'audit:read')

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
    ...(canAudit ? [{ name: 'Audit Log', href: '/admin/audit', icon: ShieldCheck }] : []),
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

  const navigation = isAdmin
    ? adminNav
    : canAudit
      ? [
          ...userNav,
          { name: 'Pengawasan Booking', href: '/admin/bookings', icon: ClipboardList },
          { name: 'Audit Log', href: '/admin/audit', icon: ShieldCheck },
        ]
      : userNav

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-slate-200 bg-white md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 bg-amber-300">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-black text-sm border border-slate-200 shadow-sm">
          SL
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-black tracking-tight text-slate-900 leading-none truncate">
            SIP-Lab Sisfor
          </span>
          <span className="block text-[11px] font-bold text-slate-800 mt-1 truncate">
            UISI · Sistem Informasi
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="px-2 pb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
          {isAdmin ? 'Menu Administrator' : 'Menu Layanan Mahasiswa'}
        </div>
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border border-slate-200 shadow-sm translate-x-0.5'
                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                    }`}
                    strokeWidth={2.2}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black border border-slate-200 ${
                      isActive
                        ? 'bg-amber-300 text-slate-950 shadow-sm'
                        : 'bg-rose-500 text-white shadow-sm'
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
      <div className="border-t-2 border-slate-200 p-3.5 bg-slate-50">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-300 border border-slate-200 text-slate-950 text-xs font-black">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
              <p className="text-[10px] font-bold text-slate-500 truncate capitalize">{userRole}</p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title="Keluar"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
