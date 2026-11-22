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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

interface SidebarProps {
  userName: string
  userRole: RoleCode
  pendingCount?: number
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ userName, userRole, pendingCount, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'admin'
  const isStaff = ['admin', 'aslab', 'kaprodi', 'pembina_lab'].includes(userRole)
  const canAudit = hasPermission(userRole, 'audit:read')

  const staffNav = [
    { name: 'Dashboard',        href: '/dashboard',       icon: LayoutDashboard },
    { name: 'Jadwal Ruang',     href: '/schedule',        icon: CalendarDays },
    { name: 'Kelola Pengajuan', href: '/admin/bookings',  icon: ClipboardList, badge: pendingCount },
    ...(hasPermission(userRole, 'lab:manage')  ? [{ name: 'Manajemen Lab', href: '/admin/labs',   icon: Building2  }] : []),
    ...(hasPermission(userRole, 'user:manage') ? [{ name: 'Pengguna',      href: '/admin/users',  icon: Users      }] : []),
    ...(canAudit                               ? [{ name: 'Audit Log',     href: '/admin/audit',  icon: ShieldCheck }] : []),
  ]

  const userNav = [
    { name: 'Dashboard',          href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jadwal Ruang',       href: '/schedule',  icon: CalendarDays },
    { name: 'Laboratorium',       href: '/labs',       icon: FlaskConical },
    { name: 'Riwayat Pengajuan',  href: '/bookings',   icon: ClipboardList, badge: pendingCount },
  ]

  const navigation = isStaff ? staffNav : userNav

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <>
    <aside aria-label="Navigasi utama" className={`group/sidebar fixed inset-y-4 left-4 z-30 hidden flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.10),0_3px_10px_rgba(15,23,42,0.05)] transition-[width,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.14),0_5px_14px_rgba(15,23,42,0.06)] md:flex ${isOpen ? 'w-64' : 'w-16'}`}>
      {/* Brand Header */}
      <div className={`relative flex border-b border-slate-200 bg-amber-300 transition-[height,padding,gap] duration-500 ${isOpen ? 'h-20 items-center gap-3 px-5' : 'h-24 items-start justify-center px-2 pt-3'}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm shadow-[0_4px_10px_rgba(15,23,42,0.18)] ring-2 ring-white/60">
          SL
        </div>
        <div className={`min-w-0 overflow-hidden transition-[width,opacity] duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
          <span className="block text-sm font-black tracking-tight text-slate-950 leading-none truncate">
            SIP-Lab Sisfor
          </span>
          <span className="block text-[11px] font-bold text-slate-800 mt-1 truncate">
            UISI · Sistem Informasi
          </span>
        </div>
        <button type="button" onClick={onToggle} aria-label={isOpen ? 'Tutup sidebar' : 'Buka sidebar'} title={isOpen ? 'Tutup sidebar' : 'Buka sidebar'} className={`absolute flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900 transition-colors hover:bg-slate-900 hover:text-white focus-visible:outline-slate-900 ${isOpen ? 'top-3 right-3' : 'bottom-2 left-1/2 -translate-x-1/2'}`}>
          {isOpen ? <PanelLeftClose aria-hidden="true" className="h-4 w-4" /> : <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      {/* Main Nav Items */}
      <div className={`flex-1 overflow-y-auto py-5 transition-[padding] duration-500 ${isOpen ? 'px-3.5' : 'px-2'}`}>
        <div className={`overflow-hidden px-3 pb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 transition-[height,opacity] duration-300 ${isOpen ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}>
          {isStaff ? 'Menu Staf / Admin' : 'Menu Layanan Mahasiswa'}
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
                aria-current={isActive ? 'page' : undefined}
                title={isOpen ? undefined : item.name}
                className={`group flex items-center justify-between rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${isOpen ? 'px-3' : 'justify-center px-0'} ${
                  isActive
                    ? 'relative bg-slate-900 text-white shadow-[0_5px_12px_rgba(15,23,42,0.16)]'
                    : 'text-slate-600 hover:translate-x-0.5 hover:bg-amber-50 hover:text-slate-950'
                }`}
              >
                {isActive && <span className="sidebar-active-pill" aria-hidden="true" />}
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-600'
                    }`}
                    strokeWidth={2.2}
                  />
                  <span className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black border border-slate-200 ${
                        isActive
                          ? 'bg-amber-300 text-slate-950'
                          : 'bg-rose-500 text-white'
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
      <div className={`border-t border-slate-200 bg-slate-50/80 transition-[padding] duration-500 ${isOpen ? 'p-3.5' : 'p-2'}`}>
        <div className={`flex items-center justify-between p-1 ${isOpen ? '' : 'justify-center'}`}>
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
              {initials}
            </div>
            <div className={`min-w-0 flex-1 overflow-hidden transition-[width,opacity] duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
              <p className="text-[10px] font-bold text-slate-500 truncate capitalize">{userRole}</p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title="Keluar"
            aria-label="Keluar dari akun"
            className={`p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-slate-200 ${isOpen ? '' : 'hidden'}`}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  )
}
