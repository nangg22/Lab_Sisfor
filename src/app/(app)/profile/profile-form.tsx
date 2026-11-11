'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props { userId: string; initialFullName: string; initialInstitutionalId: string; role: string }

export function ProfileForm({ userId, initialFullName, initialInstitutionalId, role }: Props) {
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
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✅ Profil berhasil diperbarui.</div>}
      <Input label="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input
        label={role === 'mahasiswa' ? 'NIM' : role === 'dosen' ? 'NIP' : 'ID Institusi'}
        value={institutionalId}
        onChange={(e) => setInstitutionalId(e.target.value)}
        hint="Opsional"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Peran</label>
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 capitalize">
          {role === 'mahasiswa' ? 'Mahasiswa' : role === 'dosen' ? 'Dosen' : 'Admin / Asisten Lab'}
          <span className="ml-2 text-xs text-gray-400">(tidak dapat diubah sendiri)</span>
        </p>
      </div>
      <Button type="submit" loading={loading} className="w-full">Simpan Perubahan</Button>
    </form>
  )
}
