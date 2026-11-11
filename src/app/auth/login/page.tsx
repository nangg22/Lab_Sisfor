'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FlaskConical, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email atau kata sandi tidak valid.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo + Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
            <FlaskConical className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SIP-Lab Sisfor
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Sistem Informasi Peminjaman Laboratorium
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Prodi Sistem Informasi · UISI
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="mb-6 text-[17px] font-semibold text-slate-900 tracking-tight">
            Masuk ke akun Anda
          </h2>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              autoComplete="email"
            />
            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              <LogIn className="h-4 w-4 mr-2" strokeWidth={2} />
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
