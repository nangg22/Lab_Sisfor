import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'SIP-Lab Sisfor — Sistem Informasi Peminjaman Laboratorium',
  description:
    'Sistem Informasi Peminjaman Laboratorium Program Studi Sistem Informasi UISI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
