import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { LabForm } from '../lab-form'
import { ArrowLeft, FlaskConical } from 'lucide-react'

export default async function NewLabPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (u?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="max-w-2xl space-y-5">
      {/* Back Link */}
      <Link
        href="/admin/labs"
        className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Manajemen Lab
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 border border-slate-200 shadow-sm">
          <FlaskConical className="h-6 w-6 text-slate-900" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Tambah Laboratorium Baru</h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">Daftarkan ruangan baru ke dalam sistem SIP-Lab</p>
        </div>
      </div>

      {/* Form */}
      <LabForm mode="create" />
    </div>
  )
}
