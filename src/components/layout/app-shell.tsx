'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { ColorOSDock } from './coloros-dock'
import type { RoleCode } from '@/db/schema'

interface Props {
  children: React.ReactNode
  userName: string
  userRole: RoleCode
  pendingCount: number
}

export function AppShell({ children, userName, userRole, pendingCount }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isAdmin = userRole === 'admin'
  const isStaff = ['admin', 'aslab', 'kaprodi', 'pembina_lab'].includes(userRole)

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main-content" className="skip-link">Langsung ke konten utama</a>
      <Sidebar
        userName={userName}
        userRole={userRole}
        pendingCount={pendingCount}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />

      <div className={`flex flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarOpen ? 'md:pl-72' : 'md:pl-24'}`}>
        <Header isAdmin={isAdmin} isStaff={isStaff} />
        <main id="main-content" tabIndex={-1} className="flex-1 p-3 pb-36 outline-none sm:p-4 sm:pb-32 md:p-8 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <ColorOSDock userRole={userRole} pendingCount={pendingCount} />
    </div>
  )
}
