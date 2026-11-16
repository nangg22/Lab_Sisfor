export const BOOKING_RULES = {
  timezone: 'Asia/Jakarta',
  operatingStart: '07:00',
  operatingEnd: '21:00',
  minimumLeadMinutes: 120,
} as const

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function jakartaNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_RULES.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

export function validateBookingTiming(bookingDate: string, startTime: string, endTime: string) {
  const startMinutes = toMinutes(startTime)
  const endMinutes = toMinutes(endTime)
  const openingMinutes = toMinutes(BOOKING_RULES.operatingStart)
  const closingMinutes = toMinutes(BOOKING_RULES.operatingEnd)

  if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
    return `Jam operasional lab adalah ${BOOKING_RULES.operatingStart}–${BOOKING_RULES.operatingEnd} WIB.`
  }

  const now = jakartaNowParts()
  const [year, month, day] = bookingDate.split('-').map(Number)
  const requested = Date.UTC(year, month - 1, day, Math.floor(startMinutes / 60), startMinutes % 60)
  const current = Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute)

  if (requested - current < BOOKING_RULES.minimumLeadMinutes * 60 * 1000) {
    return 'Pengajuan harus dilakukan minimal 2 jam sebelum waktu mulai.'
  }

  return null
}
