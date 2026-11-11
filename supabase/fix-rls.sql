-- Fix RLS policies untuk profiles
-- Jalankan di Supabase SQL Editor

-- Hapus semua policy lama yang mungkin konflik
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Buat ulang dengan policy yang benar
-- User bisa SELECT profil sendiri
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- User bisa UPDATE profil sendiri
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User bisa INSERT profil sendiri (untuk fallback upsert di layout)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin bisa SELECT semua profil
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Verifikasi: cek apakah data profiles ada
SELECT id, full_name, role, created_at FROM public.profiles;
