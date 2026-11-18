import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import bcrypt from 'bcryptjs'

const env = { ...process.env }

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/)
    if (match && !env[match[1]]) env[match[1]] = match[2]
  }
}

const connectionString = env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL env var wajib diisi.')
}

const sql = neon(connectionString)

async function checkAndCreateAdmin() {
  const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    throw new Error(
      'ADMIN_EMAIL dan ADMIN_PASSWORD env var wajib diisi. Tambahkan ke .env.local sebelum menjalankan script ini.'
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL harus berupa alamat email yang valid.')
  }
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD harus memiliki minimal 12 karakter.')
  }

  const institutionalId = env.ADMIN_INSTITUTIONAL_ID?.trim() || 'ADM001'

  const [existingAdmin] = await sql`
    SELECT id, email
    FROM users
    WHERE LOWER(email) = ${adminEmail}
    LIMIT 1;
  `

  if (!existingAdmin) {
    const [institutionalIdOwner] = await sql`
      SELECT email
      FROM users
      WHERE institutional_id = ${institutionalId}
      LIMIT 1;
    `
    if (institutionalIdOwner) {
      throw new Error(
        `ADMIN_INSTITUTIONAL_ID ${institutionalId} sudah digunakan oleh akun lain. ` +
        'Gunakan nilai yang berbeda.'
      )
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await sql`
      INSERT INTO users (full_name, email, password_hash, role, institutional_id, verification_status, is_active)
      VALUES ('Administrator Laboratorium', ${adminEmail}, ${passwordHash}, 'admin', ${institutionalId}, 'ACTIVE', true);
    `
    console.log(`Akun admin dibuat: ${adminEmail}`)
  } else {
    // Pastikan role, status verifikasi, status aktif, dan password Admin diperbarui.
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await sql`
      UPDATE users
      SET role = 'admin',
          password_hash = ${passwordHash},
          verification_status = 'ACTIVE',
          is_active = true,
          updated_at = NOW()
      WHERE email = ${adminEmail};
    `
    console.log(`Akun admin ${adminEmail} aktif dan password berhasil diperbarui.`)
  }
}

checkAndCreateAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

