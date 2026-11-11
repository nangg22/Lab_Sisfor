'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { RoleCode } from '@/db/schema'
import {
  Home,
  CalendarDays,
  ClipboardList,
  User,
  LayoutGrid,
} from 'lucide-react'

interface Props {
  userRole: RoleCode
  pendingCount?: number
}

export function ColorOSDock({ userRole, pendingCount }: Props) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Beranda',
      icon: Home,
    },
    {
      href: '/schedule',
      label: 'Jadwal',
      icon: CalendarDays,
    },
    {
      href: userRole === 'admin' ? '/admin/bookings' : '/bookings',
      label: userRole === 'admin' ? 'Kelola' : 'Riwayat',
      badge: pendingCount,
      icon: ClipboardList,
    },
    ...(userRole === 'admin'
      ? [{ href: '/admin/labs', label: 'Lab', icon: LayoutGrid, badge: undefined }]
      : []),
    {
      href: '/profile',
      label: 'Profil',
      icon: User,
      badge: undefined,
    },
  ]

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <nav className="luminous-dock flex items-center gap-1 px-2.5 py-2 rounded-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full text-[11px] font-semibold tracking-tight transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white shadow-sm ring-2 ring-white/80">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
