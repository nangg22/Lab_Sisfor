import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/notifications — Ambil daftar notifikasi pengguna
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20)

  const unreadCount = userNotifications.filter((n) => !n.isRead).length

  return NextResponse.json({
    notifications: userNotifications,
    unreadCount,
  })
}

// PATCH /api/notifications — Tandai semua notifikasi sudah dibaca
export async function PATCH() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, session.user.id))

  return NextResponse.json({ success: true })
}
