import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { laboratories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { BookingForm } from './booking-form'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Props { searchParams: Promise<{ lab?: string; date?: string; start?: string; type?: string }> }

export default async function NewBookingPage({ searchParams }: Props) {
  const { lab: labId, date: defaultDate, start: defaultStart, type: defaultType } = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const labs = await db
    .select({ id: laboratories.id, name: laboratories.name, location: laboratories.location, capacity: laboratories.capacity })
    .from(laboratories)
    .where(eq(laboratories.isActive, true))
    .orderBy(laboratories.name)

  return (
    <div className="max-w-2xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <Link href="/bookings" className="hover:text-blue-600 transition-colors">Pengajuan Saya</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
        <span className="text-slate-900 font-black">Ajukan Baru</span>
      </nav>

      <div className="neo-card overflow-hidden">
        <div
          aria-hidden="true"
          style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }}
        />
        <div className="px-5 py-4 border-b-2 border-slate-900 bg-slate-50">
          <h1 className="text-sm font-black uppercase tracking-tight text-slate-900">Ajukan Peminjaman Lab</h1>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5">Isi form berikut untuk mengajukan peminjaman laboratorium.</p>
        </div>
        <div className="p-5">
          <BookingForm
            labs={labs}
            defaultLabId={labId}
            defaultDate={defaultDate}
            defaultStartTime={defaultStart}
            defaultBookingType={defaultType === 'EQUIPMENT' ? 'EQUIPMENT' : 'ROOM'}
            userId={session.user.id}
          />
        </div>
      </div>
    </div>
  )
}
