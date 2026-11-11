import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import bcrypt from 'bcryptjs'

let connectionString = process.env.DATABASE_URL
if (!connectionString && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8')
  const match = content.match(/DATABASE_URL=["']?(.*?)["']?(\r?\n|$)/)
  if (match) connectionString = match[1].trim()
}

const sql = neon(connectionString)

async function checkAndCreateAdmin() {
  const users = await sql`SELECT id, full_name, email, role FROM users;`
  console.log('User saat ini:', users)

  const adminEmail = 'admin@sisfor.uisi.ac.id'
  const existingAdmin = users.find((u) => u.email === adminEmail)

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminLab123!', 10)
    await sql`
      INSERT INTO users (full_name, email, password_hash, role, institutional_id, is_active)
      VALUES ('Administrator Laboratorium', ${adminEmail}, ${passwordHash}, 'admin', 'ADM001', true);
    `
    console.log(`Akun admin dibuat: ${adminEmail} / AdminLab123!`)
  } else {
    // Pastikan rolenya admin
    await sql`UPDATE users SET role = 'admin', is_active = true WHERE email = ${adminEmail};`
    console.log(`Akun admin ${adminEmail} sudah aktif dengan role admin.`)
  }
}

checkAndCreateAdmin().catch(console.error)

