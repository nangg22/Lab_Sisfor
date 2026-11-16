'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Props { userId: string; initialFullName: string; initialInstitutionalId: string; role: string }

export function ProfileForm({ initialFullName, initialInstitutionalId, role }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [institutionalId, setInstitutionalId] = useState(initialInstitutionalId)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Nama tidak boleh kosong.'); return }
    setLoading(true); setError(null); setSuccess(false)

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fullName.trim(), institutionalId: institutionalId.trim() || null }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Gagal menyimpan.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-slate-200 shadow-sm px-4 py-3 text-xs font-bold text-rose-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-slate-200 shadow-sm px-4 py-3 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />Profil berhasil diperbarui.
        </div>
      )}
      <Input label="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input
        label={role === 'mahasiswa' ? 'NIM' : role === 'dosen' ? 'NIP' : 'ID Institusi'}
        value={institutionalId}
        onChange={(e) => setInstitutionalId(e.target.value)}
        hint="Opsional"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-black uppercase tracking-wide text-slate-700">Peran</label>
        <p className="text-sm font-bold text-slate-700 bg-slate-100 rounded-lg px-3 py-2 border border-slate-200 capitalize">
          {role === 'mahasiswa' ? 'Mahasiswa' : role === 'dosen' ? 'Dosen' : 'Admin / Asisten Lab'}
          <span className="ml-2 text-xs font-bold text-slate-400">(tidak dapat diubah sendiri)</span>
        </p>
      </div>
      <Button type="submit" loading={loading} className="w-full">Simpan Perubahan</Button>
    </form>
  )
}
