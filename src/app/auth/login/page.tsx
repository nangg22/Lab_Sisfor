'use client'

import '../auth.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { FlaskConical, LogIn, AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // rAF ensures the class is added after first paint so transition fires
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

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
    <div className="auth-page">
      {/* Subtle decorative blobs */}
      <div className="auth-bg-blob auth-bg-blob-1" aria-hidden="true" />
      <div className="auth-bg-blob auth-bg-blob-2" aria-hidden="true" />
      <div className="auth-bg-blob auth-bg-blob-3" aria-hidden="true" />
      <div className="auth-bg-grid"              aria-hidden="true" />

      <div className={`auth-wrap ${mounted ? 'auth-wrap--in' : ''}`}>

        {/* ── Logo ── */}
        <div className="auth-logo" aria-label="SIP-Lab Sisfor">
          <div className="auth-logo-icon" aria-hidden="true">
            <FlaskConical className="h-7 w-7 text-slate-900" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="auth-logo-title">SIP-Lab Sisfor</p>
            <p className="auth-logo-sub">Sistem Informasi Peminjaman Laboratorium</p>
            <span className="auth-logo-badge">Prodi Sistem Informasi · UISI</span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="auth-card">
          <div className="auth-card-stripe" aria-hidden="true" />

          <div className="auth-card-body">
            <h1 className="auth-card-heading">Masuk ke Akun</h1>
            <p className="auth-card-description">
              Kelola pengajuan dan jadwal peminjaman laboratorium Anda.
            </p>

            {error && (
              <div id="login-error" className="auth-error" role="alert" aria-live="polite">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form" noValidate>
              {/* Email */}
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">
                  Email <span className="auth-required" aria-hidden="true">*</span>
                </label>
                <div className="auth-input-wrap">
                  <Mail className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                    className="auth-input"
                    aria-required="true"
                    aria-describedby={error ? 'login-error' : undefined}
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="password" className="auth-label">
                  Kata Sandi <span className="auth-required" aria-hidden="true">*</span>
                </label>
                <div className="auth-input-wrap">
                  <Lock className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="auth-input auth-input--password"
                    aria-required="true"
                    aria-describedby={error ? 'login-error' : undefined}
                    aria-invalid={Boolean(error)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="auth-eye-btn"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye    className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="auth-submit-wrap">
                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? (
                    <>
                      <span className="auth-spinner" aria-hidden="true" />
                      Memproses…
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Masuk
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="auth-card-footer">
            <div>
              Belum punya akun?{' '}
              <Link href="/auth/register" className="auth-link">Daftar di sini</Link>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
              <Link href="/auth/forgot-password" className="auth-link">
                Lupa kata sandi?
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
