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

  useEffect(() => {
    if (!open) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

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
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-amber-300 hover:text-slate-900 transition-colors duration-150"
        title="Notifikasi"
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell style={{ height: '18px', width: '18px' }} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-black text-white border border-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-dialog-title"
            className="fixed inset-x-4 top-1/2 z-40 mx-auto flex max-h-[min(80vh,640px)] w-auto max-w-lg -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:inset-x-6"
          >
            {/* Amber stripe */}
            <div
              aria-hidden="true"
              style={{
                height: '4px',
                background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 10px,#0f172a 10px,#0f172a 12px)',
              }}
            />
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-700" strokeWidth={2} />
                <span id="notification-dialog-title" className="font-black text-sm text-slate-900 uppercase tracking-tight">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white border border-slate-200 shadow-sm">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Tandai dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="min-h-0 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Bell className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                  <p className="text-xs font-bold text-slate-400">Belum ada notifikasi masuk.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const content = (
                    <div
                      className={`flex gap-3 px-4 py-3.5 text-left transition-colors hover:bg-amber-50 ${
                        !n.isRead ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-black text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500 border border-slate-200" />
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
