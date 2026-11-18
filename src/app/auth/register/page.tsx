'use client'

import '../auth.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FlaskConical, UserPlus, AlertCircle,
  GraduationCap, Briefcase, Eye, EyeOff,
  Mail, Lock, User, Hash,
} from 'lucide-react'

type Role = 'mahasiswa' | 'dosen'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName]             = useState('')
  const [institutionalId, setInstitutionalId] = useState('')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [role, setRole]                     = useState<Role>('mahasiswa')
  const [error, setError]                   = useState<string | null>(null)
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)
  const [mounted, setMounted]               = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

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

    if (data.verificationUrl) {
      setVerificationUrl(data.verificationUrl)
      setLoading(false)
      return
    }
    router.push('/auth/login?registered=pending')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob-1" aria-hidden="true" />
      <div className="auth-bg-blob auth-bg-blob-2" aria-hidden="true" />
      <div className="auth-bg-blob auth-bg-blob-3" aria-hidden="true" />
      <div className="auth-bg-grid"              aria-hidden="true" />

      <div className={`auth-wrap ${mounted ? 'auth-wrap--in' : ''}`} style={{ maxWidth: '440px' }}>

        {/* ── Logo ── */}
        <div className="auth-logo">
          <div className="auth-logo-icon" aria-hidden="true">
            <FlaskConical className="h-7 w-7 text-slate-900" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="auth-logo-title">SIP-Lab Sisfor</p>
            <p className="auth-logo-sub">Daftar akun baru peminjaman lab</p>
            <span className="auth-logo-badge">Prodi Sistem Informasi · UISI</span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="auth-card">
          <div className="auth-card-stripe" aria-hidden="true" />

          <div className="auth-card-body">
            <h1 className="auth-card-heading">Buat Akun</h1>

            {verificationUrl && (
              <div className="auth-error" role="status" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Akun dibuat. Untuk pengujian lokal, buka <Link href={verificationUrl} className="auth-link">link verifikasi ini</Link>.</span>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="auth-form" noValidate>

              {/* Nama Lengkap */}
              <div className="auth-field">
                <label htmlFor="fullName" className="auth-label">
                  Nama Lengkap <span className="auth-required" aria-hidden="true">*</span>
                </label>
                <div className="auth-input-wrap">
                  <User className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Danang Praja"
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="auth-field">
                <span className="auth-label" id="role-label">
                  Peran <span className="auth-required" aria-hidden="true">*</span>
                </span>
                <div className="auth-role-grid" role="radiogroup" aria-labelledby="role-label">
                  {([
                    { id: 'mahasiswa', label: 'Mahasiswa', Icon: GraduationCap },
                    { id: 'dosen',     label: 'Dosen',      Icon: Briefcase },
                  ] as const).map(({ id, label, Icon }) => (
                    <label
                      key={id}
                      className={`auth-role-option${role === id ? ' auth-role-option--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={id}
                        checked={role === id}
                        onChange={() => setRole(id)}
                        className="sr-only"
                      />
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* NIM / NIP */}
              <div className="auth-field">
                <label htmlFor="instId" className="auth-label">
                  {role === 'mahasiswa' ? 'NIM' : 'NIP'}
                  <span style={{ marginLeft: '4px', fontWeight: 600, fontSize: '0.68rem', color: '#64748b', textTransform: 'none' }}>
                    (Wajib)
                  </span>
                </label>
                <div className="auth-input-wrap">
                  <Hash className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="instId"
                    type="text"
                    value={institutionalId}
                    onChange={(e) => setInstitutionalId(e.target.value)}
                    placeholder={role === 'mahasiswa' ? '3012110001' : '19800101…'}
                    className="auth-input"
                  />
                </div>
              </div>

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
                    placeholder="nama@uisi.ac.id"
                    required
                    autoComplete="email"
                    className="auth-input"
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
                    placeholder="Minimal 8 karakter"
                    required
                    autoComplete="new-password"
                    className="auth-input auth-input--password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="auth-eye-btn"
                    aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye    className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                <p className="auth-field-hint">Minimal 8 karakter</p>
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
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      Daftar Sekarang
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="auth-card-footer">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="auth-link">
              Masuk di sini
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
