import Link from 'next/link'
import { db } from '@/db'
import { laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function LabsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.toLowerCase().trim() || ''

  // Tanggal hari ini format YYYY-MM-DD untuk query
  const todayStr = new Date().toLocaleDateString('sv-SE') // sv-SE = ISO date format YYYY-MM-DD

  const labs = await db
    .select()
    .from(laboratories)
    .where(eq(laboratories.isActive, true))
    .orderBy(laboratories.name)

  const allFacilities = await db.select().from(laboratoryFacilities)

  // Hitung booking APPROVED hari ini per lab
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratorium</h1>
          <p className="mt-1 text-gray-500">Pilih laboratorium yang ingin Anda pinjam.</p>
        </div>

        <form method="GET" action="/labs" className="relative w-full sm:w-72">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cari lab atau lokasi..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-xl font-bold">
                    {lab.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-gray-400 font-medium">{lab.capacity} orang</span>
                    {/* Badge ketersediaan hari ini */}
                    {hasBookingsToday ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {lab.todaySlots} slot terisi hari ini
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Tersedia hari ini
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {lab.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {lab.location}
                </p>

                {lab.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{lab.description}</p>
                )}

                {lab.facilities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {lab.facilities.slice(0, 3).map((f, i) => (
                      <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                        {f.facilityName}{f.quantity ? ` (${f.quantity})` : ''}
                      </span>
                    ))}
                    {lab.facilities.length > 3 && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                        +{lab.facilities.length - 3} lainnya
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  Lihat detail &amp; ajukan →
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          {query ? (
            <>
              <p className="text-gray-500 mb-2">
                Tidak ditemukan laboratorium yang cocok dengan kata kunci &ldquo;<span className="font-semibold">{q}</span>&rdquo;.
              </p>
              <Link href="/labs" className="text-sm font-medium text-blue-600 hover:underline">
                Reset pencarian
              </Link>
            </>
          ) : (
            <p className="text-gray-400">Belum ada data laboratorium aktif.</p>
          )}
        </div>
      )}
    </div>
  )
}
