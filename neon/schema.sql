-- =============================================================
-- SIP-Lab Sisfor — Neon DB Schema
-- Jalankan di Neon SQL Editor atau via drizzle-kit push
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  institutional_id VARCHAR(50) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa', 'dosen', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboratory_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
  facility_name VARCHAR(120) NOT NULL,
  details TEXT,
  quantity INTEGER CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  laboratory_id UUID NOT NULL REFERENCES laboratories(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL CHECK (end_time > start_time),
  purpose TEXT NOT NULL,
  participant_count INTEGER CHECK (participant_count > 0),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  approver_user_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  reason TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by_user_id UUID REFERENCES users(id),
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_lab_date ON bookings(laboratory_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Seed data laboratorium contoh
INSERT INTO laboratories (name, location, capacity, description) VALUES
  ('Lab Komputer A', 'Gedung A Lantai 2', 30, 'Lab komputer dengan 30 unit PC, proyektor, dan AC.'),
  ('Lab Komputer B', 'Gedung A Lantai 3', 25, 'Lab komputer dengan 25 unit PC.'),
  ('Lab Jaringan', 'Gedung B Lantai 1', 20, 'Lab jaringan dengan switch, router, dan server.')
ON CONFLICT DO NOTHING;
