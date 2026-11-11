'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FlaskConical, UserPlus, AlertCircle, GraduationCap, Briefcase } from 'lucide-react'

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
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }
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
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo + Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
            <FlaskConical className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SIP-Lab Sisfor
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Daftar akun baru peminjaman lab
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Prodi Sistem Informasi · UISI
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="mb-6 text-[17px] font-semibold text-slate-900 tracking-tight">
            Buat Akun Anda
          </h2>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              label="Nama Lengkap"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Danang Praja"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Peran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'mahasiswa', label: 'Mahasiswa', icon: GraduationCap },
                  { id: 'dosen', label: 'Dosen', icon: Briefcase },
                ].map((item) => {
                  const Icon = item.icon
                  const isChecked = role === item.id
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm'
                          : 'border-white/80 bg-white/50 text-slate-600 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={item.id}
                        checked={isChecked}
                        onChange={() => setRole(item.id as Role)}
                        className="sr-only"
                      />
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <span>{item.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Input
              label={role === 'mahasiswa' ? 'NIM' : 'NIP'}
              type="text"
              value={institutionalId}
              onChange={(e) => setInstitutionalId(e.target.value)}
              placeholder={role === 'mahasiswa' ? 'Contoh: 3012110001' : 'Contoh: 19800101...'}
              hint="Opsional"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@uisi.ac.id"
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
              <UserPlus className="h-4 w-4 mr-2" strokeWidth={2} />
              Daftar Sekarang
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
