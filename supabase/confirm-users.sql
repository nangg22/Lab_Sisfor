-- Jalankan di Supabase SQL Editor untuk konfirmasi semua akun yang belum confirmed
-- Gunakan ini hanya untuk prototipe/development

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
