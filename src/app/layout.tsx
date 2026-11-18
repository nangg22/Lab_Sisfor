import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SIP-Lab Sisfor — Sistem Informasi Peminjaman Laboratorium',
  description:
    'Sistem Informasi Peminjaman Laboratorium Program Studi Sistem Informasi UISI',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
