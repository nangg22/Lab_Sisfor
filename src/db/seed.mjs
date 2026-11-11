import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

let connectionString = process.env.DATABASE_URL
if (!connectionString && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8')
  const match = content.match(/DATABASE_URL=["']?(.*?)["']?(\r?\n|$)/)
  if (match) connectionString = match[1].trim()
}

if (!connectionString) {
  console.error('DATABASE_URL belum dikonfigurasi di .env.local')
  process.exit(1)
}

const sql = neon(connectionString)

async function seed() {
  console.log('Seeding initial data to Neon database...')

  // Check if laboratories already exist
  const existingLabs = await sql`SELECT id, name FROM laboratories;`

  let labAId
  let labBId
  let labJaringanId

  if (existingLabs.length === 0) {
    console.log('Inserting laboratories...')
    const [labA] = await sql`
      INSERT INTO laboratories (name, location, capacity, description, is_active)
      VALUES (
        'Lab Komputer A',
        'Gedung A Lantai 2',
        30,
        'Laboratorium komputer multimedia dan pemrograman dengan spesifikasi tinggi.',
        true
      )
      RETURNING id;
    `

    const [labB] = await sql`
      INSERT INTO laboratories (name, location, capacity, description, is_active)
      VALUES (
        'Lab Komputer B',
        'Gedung A Lantai 3',
        25,
        'Laboratorium komputer untuk praktikum basis data dan komputasi dasar.',
        true
      )
      RETURNING id;
    `

    const [labJaringan] = await sql`
      INSERT INTO laboratories (name, location, capacity, description, is_active)
      VALUES (
        'Lab Jaringan & IoT',
        'Gedung B Lantai 1',
        20,
        'Laboratorium jaringan komputer dilengkapi rak server, switch, router, dan kit IoT.',
        true
      )
      RETURNING id;
    `

    labAId = labA.id
    labBId = labB.id
    labJaringanId = labJaringan.id
  } else {
    console.log(`Laboratories already exist (${existingLabs.length} found).`)
    labAId = existingLabs.find((l) => l.name.includes('Komputer A'))?.id ?? existingLabs[0].id
    labBId = existingLabs.find((l) => l.name.includes('Komputer B'))?.id ?? existingLabs[1]?.id ?? existingLabs[0].id
    labJaringanId = existingLabs.find((l) => l.name.includes('Jaringan'))?.id ?? existingLabs[2]?.id ?? existingLabs[0].id
  }

  // Check if facilities already exist
  const existingFacilities = await sql`SELECT id FROM laboratory_facilities;`
  if (existingFacilities.length === 0) {
    console.log('Inserting laboratory facilities...')
    await sql`
      INSERT INTO laboratory_facilities (laboratory_id, facility_name, quantity, details)
      VALUES
        (${labAId}, 'PC Core i7 / 16GB RAM', 30, 'Unit PC All-in-One lengkap dengan keyboard & mouse'),
        (${labAId}, 'Proyektor & Layar Lebar', 1, 'Koneksi HDMI & Wireless Display'),
        (${labAId}, 'AC Split 2 PK', 2, 'Pendingin ruangan utama'),
        (${labBId}, 'PC Core i5 / 8GB RAM', 25, 'PC workstation untuk praktikum basis data'),
        (${labBId}, 'Proyektor InFocus', 1, 'Koneksi VGA & HDMI'),
        (${labJaringanId}, 'Rak Server & Router Cisco', 4, 'Cisco 2900 Series Router & Catalyst Switches'),
        (${labJaringanId}, 'PC Workstation Jaringan', 20, 'Dual NIC Ethernet Port untuk simulasi topologi jaringan');
    `
    console.log('Facilities seeded successfully!')
  } else {
    console.log(`Facilities already exist (${existingFacilities.length} found).`)
  }

  console.log('Seeding completed successfully!')
}

seed().catch((err) => {
  console.error('Seeding error:', err)
  process.exit(1)
})

