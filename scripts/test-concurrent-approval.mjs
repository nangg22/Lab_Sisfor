import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'

const sql = neon(process.env.DATABASE_URL)
const testDate = '2099-12-31'
const testStart = '09:00:00'
const testEnd = '10:00:00'
const bookingIds = [randomUUID(), randomUUID()]

const [user] = await sql.query(`SELECT id FROM users ORDER BY created_at LIMIT 1`)
const [lab] = await sql.query(`SELECT id FROM laboratories ORDER BY created_at LIMIT 1`)

if (!user || !lab) {
  throw new Error('Membutuhkan minimal satu user dan satu laboratorium untuk pengujian.')
}

try {
  await sql.query(
    `INSERT INTO bookings (id, user_id, laboratory_id, booking_date, start_time, end_time, purpose, participant_count, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING'),
            ($9, $2, $3, $4, $5, $6, $7, $8, 'PENDING')`,
    [bookingIds[0], user.id, lab.id, testDate, testStart, testEnd, 'Concurrent approval test', 1, bookingIds[1]]
  )

  const results = await Promise.allSettled(
    bookingIds.map((id) => sql.query(
      `UPDATE bookings SET status = 'APPROVED' WHERE id = $1 AND status = 'PENDING'`,
      [id]
    ))
  )

  const fulfilled = results.filter((result) => result.status === 'fulfilled').length
  const rejected = results.filter((result) => result.status === 'rejected')
  const conflictRejected = rejected.filter(
    (result) => result.reason?.code === '23P01'
  ).length

  if (fulfilled !== 1 || conflictRejected !== 1) {
    throw new Error(`Hasil tidak sesuai: fulfilled=${fulfilled}, conflictRejected=${conflictRejected}`)
  }

  console.log(JSON.stringify({ passed: true, approved: 1, rejectedByConflict: 1 }))
} finally {
  await sql.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [bookingIds])
}
