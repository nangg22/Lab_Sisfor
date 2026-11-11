import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/db'
import { laboratories, laboratoryFacilities, bookings } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { formatDate, formatTime } from '@/lib/utils'

interface Props { params: Promise<{ id: string }> }

export default async function LabDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [lab] = await db.select().from(laboratories).where(eq(laboratories.id, id)).limit(1)
  if (!lab) notFound()

  const facilities = await db.select().from(laboratoryFacilities).where(eq(laboratoryFacilities.laboratoryId, id))

  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const approvedBookings = await db
    .select({ id: bookings.id, bookingDate: bookings.bookingDate, startTime: bookings.startTime, endTime: bookings.endTime, purpose: bookings.purpose })
    .from(bookings)
    .where(and(eq(bookings.laboratoryId, id), eq(bookings.status, 'APPROVED'), gte(bookings.bookingDate, firstDay), lte(bookings.bookingDate, lastDay)))
    .orderBy(bookings.bookingDate)

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/labs" className="hover:text-gray-700">Laboratorium</Link>
        <span>/</span>
        <span className="text-gray-900">{lab.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-2xl font-bold">
                {lab.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{lab.name}</h1>
                <p className="text-gray-500 mt-1">{lab.location}</p>
                <p className="text-gray-500 text-sm mt-0.5">Kapasitas: <span className="font-medium">{lab.capacity} orang</span></p>
              </div>
            </div>
            {lab.description && <p className="mt-4 text-gray-600 text-sm leading-relaxed">{lab.description}</p>}
          </div>

          {facilities.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Fasilitas</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {facilities.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3">
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {f.facilityName}
                        {f.quantity && <span className="ml-1 text-gray-400">({f.quantity} unit)</span>}
                      </p>
                      {f.details && <p className="text-xs text-gray-500 mt-0.5">{f.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">
              Jadwal Terisi — {today.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
            </h2>
            {approvedBookings.length > 0 ? (
              <div className="space-y-2">
                {approvedBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg bg-orange-50 border border-orange-100 px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-orange-800">{formatDate(b.bookingDate)}</span>
                      <span className="text-orange-600 ml-2">{formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                    </div>
                    <span className="text-xs text-orange-500 truncate max-w-32">{b.purpose}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Tidak ada jadwal yang terisi bulan ini. Lab tersedia!</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1">Ingin meminjam?</h3>
            <p className="text-sm text-gray-500 mb-4">Ajukan peminjaman lab ini. Status akan diperbarui setelah Admin memproses permohonan.</p>
            <Link href={`/bookings/new?lab=${lab.id}`} className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Ajukan Peminjaman
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">Informasi</p>
            <p>• Pengajuan akan diproses oleh Admin / Asisten Lab.</p>
            <p>• Periksa jadwal sebelum mengajukan untuk menghindari bentrok.</p>
            <p>• Persetujuan digital tidak berarti kunci telah diserahkan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
