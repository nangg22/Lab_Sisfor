'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (!window.confirm('Anda akan keluar dari akun ini. Lanjutkan?')) return
    setLoading(true)
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {loading ? 'Keluar...' : 'Keluar dari Akun'}
    </button>
  )
}
