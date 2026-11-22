'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [success, setSuccess]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(false)
    if (newPassword.length < 8) { setError('Kata sandi baru minimal 8 karakter.'); return }
    if (newPassword !== confirmPassword) { setError('Konfirmasi kata sandi baru tidak cocok.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal mengubah kata sandi.'); return }
      setSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-rose-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] px-4 py-3 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />Kata sandi berhasil diperbarui.
        </div>
      )}
      <Input label="Kata Sandi Saat Ini" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      <Input label="Kata Sandi Baru" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="Minimal 8 karakter" required />
      <Input label="Konfirmasi Kata Sandi Baru" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      <Button type="submit" loading={loading} variant="outline" className="w-full">Ubah Kata Sandi</Button>
    </form>
  )
}
