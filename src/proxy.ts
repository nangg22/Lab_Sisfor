import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Role yang boleh mengakses area /admin/*
const STAFF_ROLES = ['admin', 'aslab', 'kaprodi', 'pembina_lab']

export async function proxy(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  const isAuthRoute   = pathname.startsWith('/auth/')
  const isPublicRoot  = pathname === '/'
  const isApiAuth     = pathname.startsWith('/api/auth')
  const isAdminRoute  = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  // 1. Belum login → redirect ke login (kecuali halaman publik)
  if (!session && !isAuthRoute && !isPublicRoot && !isApiAuth) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Sudah login tapi coba akses /auth/* → redirect ke dashboard
  if (session && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. User biasa (mahasiswa/dosen) coba akses /admin/* → redirect ke dashboard
  if (session && isAdminRoute && !STAFF_ROLES.includes(session.user.role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
