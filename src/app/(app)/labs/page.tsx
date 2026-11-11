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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Laboratorium</h1>
          <p className="page-subtitle">Pilih laboratorium yang ingin Anda pinjam.</p>
        </div>

        <form method="GET" action="/labs" className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cari lab atau lokasi..."
            className="w-full rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/15 transition-all"
          />
        </form>
      </div>

      {labsWithDetails.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {labsWithDetails.map((lab) => {
            const hasBookingsToday = lab.todaySlots > 0
            return (
              <Link
                key={lab.id}
                href={`/labs/${lab.id}`}
                className="group glass-card rounded-2xl p-5 flex flex-col gap-4"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/30">
                    <span className="text-white font-bold text-base">
                      {lab.name.charAt(0)}
                    </span>
                  </div>

                  {hasBookingsToday ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 leading-none">
                      <Clock className="h-3 w-3" strokeWidth={2.2} />
                      {lab.todaySlots} slot terisi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 leading-none">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.2} />
                      Tersedia
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-[15px] leading-snug group-hover:text-blue-700 transition-colors">
                    {lab.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {lab.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {lab.capacity} orang
                    </span>
                  </div>

                  {lab.description && (
                    <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {lab.description}
                    </p>
                  )}
                </div>

                {/* Facilities */}
                {lab.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {lab.facilities.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                      >
                        {f.facilityName}{f.quantity ? ` (${f.quantity})` : ''}
                      </span>
                    ))}
                    {lab.facilities.length > 3 && (
                      <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs text-slate-400">
                        +{lab.facilities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                  Lihat detail &amp; ajukan
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl px-6 py-16 text-center">
          {query ? (
            <>
              <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-500 text-sm mb-2">
                Tidak ditemukan laboratorium yang cocok dengan{' '}
                <span className="font-semibold">&ldquo;{q}&rdquo;</span>.
              </p>
              <Link href="/labs" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Reset pencarian
              </Link>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Belum ada data laboratorium aktif.</p>
          )}
        </div>
      )}
    </div>
  )
}
