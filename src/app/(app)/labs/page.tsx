import Link from 'next/link'
import { db } from '@/db'
import { laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { Search, MapPin, Users, CheckCircle2, Clock, ArrowRight } from 'lucide-react'

interface Props { searchParams: Promise<{ q?: string }> }

export default async function LabsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.toLowerCase().trim() || ''
  const todayStr = new Date().toLocaleDateString('sv-SE')

  const labs = await db.select().from(laboratories).where(eq(laboratories.isActive, true)).orderBy(laboratories.name)
  const allFacilities = await db.select().from(laboratoryFacilities)
  const todayBookings = await db
    .select({ laboratoryId: bookings.laboratoryId, count: sql<number>`count(*)::int` })
    .from(bookings).where(and(eq(bookings.bookingDate, todayStr), eq(bookings.status, 'APPROVED'))).groupBy(bookings.laboratoryId)

  const todayBookingMap = new Map(todayBookings.map((b) => [b.laboratoryId, b.count]))
  const filteredLabs = query ? labs.filter((l) => l.name.toLowerCase().includes(query) || l.location.toLowerCase().includes(query) || (l.description && l.description.toLowerCase().includes(query))) : labs
  const labsWithDetails = filteredLabs.map((lab) => ({ ...lab, facilities: allFacilities.filter((f) => f.laboratoryId === lab.id), todaySlots: todayBookingMap.get(lab.id) ?? 0 }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Katalog Laboratorium</h1>
          <p className="text-sm font-bold text-slate-500 mt-0.5">Daftar seluruh laboratorium aktif dan spesifikasi fasilitas.</p>
        </div>
        <form method="GET" action="/labs" className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={2} />
          <input type="text" name="q" defaultValue={q ?? ''} placeholder="Cari nama atau lokasi lab..." className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </form>
      </div>

      {labsWithDetails.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labsWithDetails.map((lab) => (
            <Link key={lab.id} href={`/labs/${lab.id}`} className="neo-card flex flex-col justify-between p-4 hover:shadow-sm transition-shadow group">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 border border-slate-200 text-slate-950 font-black text-sm shadow-sm">
                    {lab.name.charAt(0)}
                  </div>
                  {lab.todaySlots > 0 ? (
                    <span className="neo-badge bg-amber-100 text-slate-900 text-[10px]"><Clock className="h-3 w-3" />{lab.todaySlots} slot terisi</span>
                  ) : (
                    <span className="neo-badge bg-emerald-100 text-emerald-800 text-[10px]"><CheckCircle2 className="h-3 w-3" />Tersedia</span>
                  )}
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{lab.name}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{lab.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 shrink-0" />{lab.capacity} Kursi</span>
                </div>
                {lab.description && <p className="mt-2 text-xs font-medium text-slate-600 line-clamp-2">{lab.description}</p>}
                {lab.facilities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {lab.facilities.slice(0, 3).map((f, i) => (
                      <span key={i} className="neo-badge bg-slate-100 text-slate-700 text-[10px]">{f.facilityName}{f.quantity ? ` (${f.quantity})` : ''}</span>
                    ))}
                    {lab.facilities.length > 3 && <span className="neo-badge bg-slate-100 text-slate-500 text-[10px]">+{lab.facilities.length - 3}</span>}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between text-xs font-black text-blue-600 group-hover:text-blue-700">
                <span>Lihat detail &amp; ajukan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="neo-card px-6 py-14 text-center">
          {query ? (
            <>
              <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-bold text-slate-600 mb-1">Tidak ditemukan lab yang cocok dengan <span className="font-black">&ldquo;{q}&rdquo;</span>.</p>
              <Link href="/labs" className="text-xs font-black text-blue-600 hover:underline">Reset pencarian</Link>
            </>
          ) : (
            <p className="text-sm font-bold text-slate-500">Belum ada data laboratorium aktif.</p>
          )}
        </div>
      )}
    </div>
  )
}
