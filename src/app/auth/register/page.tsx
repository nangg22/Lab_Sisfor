'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Role = 'mahasiswa' | 'dosen'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [institutionalId, setInstitutionalId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('mahasiswa')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Kata sandi minimal 8 karakter.'); return }
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, institutionalId, email, password, role }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Registrasi gagal.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Akun dibuat. Silakan login manual.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-sm">
            L
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SIP-Lab Sisfor</h1>
          <p className="mt-1 text-sm text-gray-500">Buat akun baru</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Daftar Akun</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              label="Nama Lengkap"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Peran <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {(['mahasiswa', 'dosen'] as Role[]).map((r) => (
                  <label
                    key={r}
                    className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                      role === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                    <span>{r === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label={role === 'mahasiswa' ? 'NIM' : 'NIP'}
              type="text"
              value={institutionalId}
              onChange={(e) => setInstitutionalId(e.target.value)}
              hint="Opsional"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              hint="Minimal 8 karakter"
            />
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Daftar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
