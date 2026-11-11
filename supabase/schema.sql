-- =============================================================
-- SIP-Lab Sisfor — Database Schema
-- Jalankan di Supabase SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- 1. PROFILES
-- Extend tabel auth.users dari Supabase Auth
-- Role: mahasiswa | dosen | admin
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       VARCHAR(150) NOT NULL,
  institutional_id VARCHAR(50) UNIQUE,          -- NIM atau NIP
  role            VARCHAR(20)  NOT NULL DEFAULT 'mahasiswa'
                    CHECK (role IN ('mahasiswa', 'dosen', 'admin')),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------
-- 2. LABORATORIES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laboratories (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  location    VARCHAR(255) NOT NULL,
  capacity    INTEGER      NOT NULL CHECK (capacity > 0),
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT laboratories_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------
-- 3. LABORATORY FACILITIES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laboratory_facilities (
  id             UUID         NOT NULL DEFAULT gen_random_uuid(),
  laboratory_id  UUID         NOT NULL REFERENCES public.laboratories(id) ON DELETE CASCADE,
  facility_name  VARCHAR(120) NOT NULL,
  details        TEXT,
  quantity       INTEGER      CHECK (quantity > 0),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT laboratory_facilities_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------
-- 4. BOOKINGS
-- Status: PENDING | APPROVED | REJECTED | CANCELLED
-- [ASUMSI PROTOTIPE] Pending TIDAK mengunci slot
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.profiles(id),
  laboratory_id     UUID        NOT NULL REFERENCES public.laboratories(id),
  booking_date      DATE        NOT NULL,
  start_time        TIME        NOT NULL,
  end_time          TIME        NOT NULL CHECK (end_time > start_time),
  purpose           TEXT        NOT NULL,
  participant_count INTEGER     CHECK (participant_count > 0),
  notes             TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------
-- 5. BOOKING APPROVAL ACTIONS
-- Mencatat keputusan approve/reject oleh admin
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_approval_actions (
  id                UUID        NOT NULL DEFAULT gen_random_uuid(),
  booking_id        UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  approver_user_id  UUID        NOT NULL REFERENCES public.profiles(id),
  decision          VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  reason            TEXT,
  decided_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT booking_approval_actions_pkey PRIMARY KEY (id)
);

-- ---------------------------------------------------------------
-- 6. BOOKING STATUS HISTORY
-- Mencatat setiap perubahan status pengajuan
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
  booking_id           UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_status           VARCHAR(20) CHECK (old_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  new_status           VARCHAR(20) NOT NULL CHECK (new_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  changed_by_user_id   UUID        REFERENCES public.profiles(id),
  reason               TEXT,
  changed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT booking_status_history_pkey PRIMARY KEY (id)
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id         ON public.bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_lab_date        ON public.bookings(laboratory_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status          ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_approval_booking_id      ON public.booking_approval_actions(booking_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_booking   ON public.booking_status_history(booking_id, changed_at DESC);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_laboratories_updated_at
  BEFORE UPDATE ON public.laboratories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile setelah user registrasi via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    'mahasiswa'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history   ENABLE ROW LEVEL SECURITY;

-- profiles: user hanya bisa lihat/edit profil sendiri; admin bisa lihat semua
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- laboratories: semua user bisa lihat lab aktif; admin bisa kelola
CREATE POLICY "labs_select_all" ON public.laboratories
  FOR SELECT USING (is_active = TRUE OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  ));

CREATE POLICY "labs_insert_admin" ON public.laboratories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "labs_update_admin" ON public.laboratories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- laboratory_facilities: ikuti akses lab
CREATE POLICY "lab_facilities_select" ON public.laboratory_facilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.laboratories l
      WHERE l.id = laboratory_id AND (l.is_active = TRUE OR (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      ))
    )
  );

CREATE POLICY "lab_facilities_manage_admin" ON public.laboratory_facilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- bookings: peminjam lihat milik sendiri; admin lihat semua
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "bookings_insert_authenticated" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "bookings_update_own_pending" ON public.bookings
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'PENDING'
  );

CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- approval actions: hanya admin yang bisa insert; semua bisa baca milik booking mereka
CREATE POLICY "approval_insert_admin" ON public.booking_approval_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "approval_select_owner_or_admin" ON public.booking_approval_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (
        b.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

-- status history: peminjam lihat riwayat booking miliknya; admin lihat semua
CREATE POLICY "status_history_select" ON public.booking_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (
        b.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

CREATE POLICY "status_history_insert" ON public.booking_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- SEED DATA (Data contoh untuk prototipe)
-- =============================================================

-- Laboratorium contoh
INSERT INTO public.laboratories (name, location, capacity, description) VALUES
  ('Lab Komputer A', 'Gedung A Lantai 2', 30, 'Laboratorium komputer dengan 30 unit PC, dilengkapi proyektor dan AC.'),
  ('Lab Komputer B', 'Gedung A Lantai 3', 25, 'Laboratorium komputer dengan 25 unit PC. Tersedia untuk praktikum dan riset.'),
  ('Lab Jaringan', 'Gedung B Lantai 1', 20, 'Laboratorium jaringan komputer dengan perangkat switch, router, dan server.')
ON CONFLICT DO NOTHING;

-- Fasilitas lab
INSERT INTO public.laboratory_facilities (laboratory_id, facility_name, quantity, details)
SELECT l.id, 'Komputer PC', 30, 'Intel Core i5, RAM 8GB, SSD 256GB'
FROM public.laboratories l WHERE l.name = 'Lab Komputer A'
ON CONFLICT DO NOTHING;

INSERT INTO public.laboratory_facilities (laboratory_id, facility_name, quantity, details)
SELECT l.id, 'Proyektor', 1, 'Epson Full HD'
FROM public.laboratories l WHERE l.name = 'Lab Komputer A'
ON CONFLICT DO NOTHING;

INSERT INTO public.laboratory_facilities (laboratory_id, facility_name, quantity, details)
SELECT l.id, 'Komputer PC', 25, 'Intel Core i5, RAM 8GB, SSD 256GB'
FROM public.laboratories l WHERE l.name = 'Lab Komputer B'
ON CONFLICT DO NOTHING;

INSERT INTO public.laboratory_facilities (laboratory_id, facility_name, quantity, details)
SELECT l.id, 'Switch Cisco', 5, 'Cisco Catalyst 2960'
FROM public.laboratories l WHERE l.name = 'Lab Jaringan'
ON CONFLICT DO NOTHING;
