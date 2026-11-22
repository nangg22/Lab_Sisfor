'use client'

import '../auth.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FlaskConical, Mail, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [devUrl, setDevUrl]     = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res  = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Terjadi kesalahan.')
      setLoading(false)
      return
    }

    setSuccess(true)
    // Development only: tampilkan link langsung
    if (data.resetUrl) setDevUrl(data.resetUrl)
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob-1" aria-hidden="true" />
      <div className="auth-bg-blob auth-bg-blob-2" aria-hidden="true" />
      <div className="auth-bg-grid"              aria-hidden="true" />

      <div className={`auth-wrap ${mounted ? 'auth-wrap--in' : ''}`}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon" aria-hidden="true">
            <FlaskConical className="h-7 w-7 text-slate-900" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="auth-logo-title">SIP-Lab Sisfor</p>
            <p className="auth-logo-sub">Reset Kata Sandi</p>
            <span className="auth-logo-badge">Prodi Sistem Informasi · UISI</span>
          </div>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-stripe" aria-hidden="true" />
          <div className="auth-card-body">
            {success ? (
              <div className="space-y-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="auth-card-heading" style={{ textAlign: 'center' }}>Instruksi Dikirim</h2>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    Jika email terdaftar di sistem, instruksi reset telah disiapkan.
                  </p>
                </div>

                {/* Dev mode: tampilkan link langsung */}
                {devUrl && (
                  <div className="rounded-xl bg-amber-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] p-3 text-left">
                    <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 mb-1">
                      Development — Link Reset:
                    </p>
                    <a
                      href={devUrl}
                      className="text-[11px] font-bold text-blue-600 break-all hover:underline"
                    >
                      {devUrl}
                    </a>
                  </div>
                )}

                <Link href="/auth/login" className="auth-link text-xs">
                  ← Kembali ke halaman login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="auth-card-heading">Lupa Kata Sandi?</h2>
                <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed">
                  Masukkan email akun kamu. Kami akan menyiapkan link reset kata sandi.
                </p>

                {error && (
                  <div className="auth-error" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  <div className="auth-field">
                    <label htmlFor="email" className="auth-label">
                      Email <span className="auth-required">*</span>
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
                      />
                    </div>
                  </div>

                  <div className="auth-submit-wrap">
                    <button type="submit" disabled={loading} className="auth-submit">
                      {loading ? (
                        <><span className="auth-spinner" aria-hidden="true" />Mengirim…</>
                      ) : (
                        <><Send className="h-4 w-4" aria-hidden="true" />Kirim Link Reset</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="auth-card-footer">
            <Link href="/auth/login" className="auth-link flex items-center justify-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
