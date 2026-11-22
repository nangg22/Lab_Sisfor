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

  const isStaff = ['admin', 'aslab', 'kaprodi', 'pembina_lab'].includes(userRole)

  const navItems = [
    { href: '/dashboard', label: 'Beranda', icon: Home },
    { href: '/schedule',  label: 'Jadwal',  icon: CalendarDays },
    {
      href:  isStaff ? '/admin/bookings' : '/bookings',
      label: isStaff ? 'Kelola' : 'Riwayat',
      badge: pendingCount,
      icon:  ClipboardList,
    },
    ...(isStaff
      ? [{ href: '/admin/labs', label: 'Lab', icon: LayoutGrid, badge: undefined }]
      : []),
    { href: '/profile', label: 'Profil', icon: User, badge: undefined },
  ]

  // Batasi penggunaan navigasi bawah ini khusus untuk layar seluler (Mobile View: md:hidden)
  // Dilengkapi container solid, border tegas 2px, dan bayangan offset agar tidak transparan/bug
  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 pointer-events-auto md:hidden">
      <nav aria-label="Navigasi seluler" className="mobile-dock-solid flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm -translate-y-0.5'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="relative">
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-black text-white shadow-sm ring-1 ring-slate-900">
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
