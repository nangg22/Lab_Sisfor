'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, CheckCircle2, XCircle, FileText, Megaphone } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  isRead: boolean
  createdAt: string
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'APPROVED')    return <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2} />
  if (type === 'REJECTED')    return <XCircle      className="h-4 w-4 text-rose-500"    strokeWidth={2} />
  if (type === 'NEW_BOOKING') return <FileText     className="h-4 w-4 text-amber-500"   strokeWidth={2} />
  return <Megaphone className="h-4 w-4 text-blue-500" strokeWidth={2} />
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      console.error('Failed to load notifications:', e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, 30000)
    return () => clearInterval(timer)
  }, [])

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('Failed to mark read:', e)
    }
  }

  function handleToggle() {
    if (!open && unreadCount > 0) markAllAsRead()
    setOpen(!open)
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-blue-600 hover:scale-105 hover:shadow-md transition-all duration-150"
        title="Notifikasi"
      >
        <Bell className="h-4.5 w-4.5" strokeWidth={1.8} style={{ height: '18px', width: '18px' }} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-white animate-pulse leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/70">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
                <span className="font-semibold text-sm text-slate-900">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Tandai dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/60">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Bell className="h-8 w-8 text-slate-200" strokeWidth={1.5} />
                  <p className="text-xs text-slate-400">Belum ada notifikasi masuk.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const content = (
                    <div
                      className={`flex gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/50 ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                  )

                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="block"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
