'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'
import '../auth.css'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      window.setTimeout(() => setStatus('error'), 0)
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((response) => setStatus(response.ok ? 'success' : 'error')).catch(() => setStatus('error'))
  }, [])

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" aria-hidden="true" />
      <div className="auth-wrap auth-wrap--in">
        <div className="auth-card">
          <div className="auth-card-stripe" aria-hidden="true" />
          <div className="auth-card-body text-center">
            {status === 'loading' && <LoaderCircle className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />}
            {status === 'success' && <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-600" aria-hidden="true" />}
            {status === 'error' && <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rose-600" aria-hidden="true" />}
            <h1 className="auth-card-heading">{status === 'loading' ? 'Memverifikasi email' : status === 'success' ? 'Email terverifikasi' : 'Verifikasi gagal'}</h1>
            <p className="auth-card-description">
              {status === 'loading' ? 'Mohon tunggu sebentar.' : status === 'success' ? 'Akun Anda sudah aktif dan dapat digunakan untuk masuk.' : 'Link verifikasi tidak valid atau sudah kedaluwarsa.'}
            </p>
            {status !== 'loading' && <Link href="/auth/login" className="auth-submit">Kembali ke Login</Link>}
          </div>
        </div>
      </div>
    </div>
  )
}
