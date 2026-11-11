import Link from 'next/link'
import { db } from '@/db'
import { laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { Search, MapPin, Users, CheckCircle2, Clock, ArrowRight } from 'lucide-react'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function LabsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.toLowerCase().trim() || ''

  const todayStr = new Date().toLocaleDateString('sv-SE')

  const labs = await db
    .select()
    .from(laboratories)
    .where(eq(laboratories.isActive, true))
    .orderBy(laboratories.name)

  const allFacilities = await db.select().from(laboratoryFacilities)

  const todayBookings = await db
    .select({ laboratoryId: bookings.laboratoryId, count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingDate, todayStr),
        eq(bookings.status, 'APPROVED')
      )
    )
    .groupBy(bookings.laboratoryId)

  const todayBookingMap = new Map(todayBookings.map((b) => [b.laboratoryId, b.count]))

  const filteredLabs = query
    ? labs.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.location.toLowerCase().includes(query) ||
          (l.description && l.description.toLowerCase().includes(query))
      )
    : labs

  const labsWithDetails = filteredLabs.map((lab) => ({
    ...lab,
    facilities: allFacilities.filter((f) => f.laboratoryId === lab.id),
    todaySlots: todayBookingMap.get(lab.id) ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Katalog Laboratorium</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daftar seluruh laboratorium aktif dan spesifikasi fasilitas.</p>
        </div>

        <form method="GET" action="/labs" className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cari nama atau lokasi lab..."
            className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all shadow-xs"
          />
        </form>
      </div>

      {labsWithDetails.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labsWithDetails.map((lab) => {
            const hasBookingsToday = lab.todaySlots > 0
            return (
              <Link
                key={lab.id}
                href={`/labs/${lab.id}`}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm">
                      {lab.name.charAt(0)}
                    </div>

                    {hasBookingsToday ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-600/20">
                        <Clock className="h-3 w-3" />
                        {lab.todaySlots} slot terisi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-600/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Tersedia hari ini
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {lab.name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {lab.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {lab.capacity} Kursi
                      </span>
                    </div>

                    {lab.description && (
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {lab.description}
                      </p>
                    )}
                  </div>

                  {/* Facilities */}
                  {lab.facilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {lab.facilities.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {f.facilityName}{f.quantity ? ` (${f.quantity})` : ''}
                        </span>
                      ))}
                      {lab.facilities.length > 3 && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          +{lab.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Lihat detail &amp; ajukan</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
          {query ? (
            <>
              <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-slate-600 text-sm mb-1">
                Tidak ditemukan laboratorium yang cocok dengan{' '}
                <span className="font-semibold">&ldquo;{q}&rdquo;</span>.
              </p>
              <Link href="/labs" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Reset pencarian
              </Link>
            </>
          ) : (
            <p className="text-slate-500 text-sm">Belum ada data laboratorium aktif.</p>
          )}
        </div>
      )}
    </div>
  )
}
