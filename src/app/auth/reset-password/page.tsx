'use client'

import '../auth.css'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FlaskConical, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]               = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [loading, setLoading]               = useState(false)
  const [success, setSuccess]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    const res  = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Gagal mereset kata sandi.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 2500)
  }

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mx-auto">
          <AlertCircle className="h-7 w-7 text-rose-600" strokeWidth={2.5} />
        </div>
        <h2 className="auth-card-heading" style={{ textAlign: 'center' }}>Link Tidak Valid</h2>
        <p className="text-xs font-bold text-slate-500">Link reset tidak ditemukan atau sudah kedaluwarsa.</p>
        <Link href="/auth/forgot-password" className="auth-link text-xs block">
          Minta link reset baru →
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mx-auto">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h2 className="auth-card-heading" style={{ textAlign: 'center' }}>Kata Sandi Diubah!</h2>
        <p className="text-xs font-bold text-slate-500">Kata sandi berhasil diperbarui. Mengarahkan ke halaman login…</p>
      </div>
    )
  }

  return (
    <>
      <h2 className="auth-card-heading">Buat Kata Sandi Baru</h2>

      {error && (
        <div className="auth-error" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Password baru */}
        <div className="auth-field">
          <label htmlFor="new-pw" className="auth-label">
            Kata Sandi Baru <span className="auth-required">*</span>
          </label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" aria-hidden="true" />
            <input
              id="new-pw"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              autoComplete="new-password"
              className="auth-input auth-input--password"
            />
            <button type="button" onClick={() => setShowNew((v) => !v)} className="auth-eye-btn" aria-label={showNew ? 'Sembunyikan' : 'Tampilkan'}>
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="auth-field-hint">Minimal 8 karakter</p>
        </div>

        {/* Konfirmasi */}
        <div className="auth-field">
          <label htmlFor="confirm-pw" className="auth-label">
            Konfirmasi Kata Sandi <span className="auth-required">*</span>
          </label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" aria-hidden="true" />
            <input
              id="confirm-pw"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              required
              autoComplete="new-password"
              className="auth-input auth-input--password"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="auth-eye-btn" aria-label={showConfirm ? 'Sembunyikan' : 'Tampilkan'}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="auth-submit-wrap">
          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? (
              <><span className="auth-spinner" aria-hidden="true" />Menyimpan…</>
            ) : (
              <><Lock className="h-4 w-4" aria-hidden="true" />Simpan Kata Sandi Baru</>
            )}
          </button>
        </div>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob-1" aria-hidden="true" />
      <div className="auth-bg-blob auth-bg-blob-2" aria-hidden="true" />
      <div className="auth-bg-grid"              aria-hidden="true" />

      <div className={`auth-wrap ${mounted ? 'auth-wrap--in' : ''}`}>
        <div className="auth-logo">
          <div className="auth-logo-icon" aria-hidden="true">
            <FlaskConical className="h-7 w-7 text-slate-900" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="auth-logo-title">SIP-Lab Sisfor</p>
            <p className="auth-logo-sub">Buat Kata Sandi Baru</p>
            <span className="auth-logo-badge">Prodi Sistem Informasi · UISI</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-stripe" aria-hidden="true" />
          <div className="auth-card-body">
            <Suspense fallback={<p className="text-xs font-bold text-slate-500">Memuat…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
          <div className="auth-card-footer">
            Ingat kata sandi?{' '}
            <Link href="/auth/login" className="auth-link">Masuk di sini</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
