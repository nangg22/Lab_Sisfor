# SIP-Lab Sisfor

Sistem Informasi Peminjaman Laboratorium — Prodi Sistem Informasi, Universitas Internasional Semen Indonesia (UISI).

## Tech Stack

- **Next.js 16** (App Router, Turbopack, Proxy) + TypeScript
- **Neon** (Serverless PostgreSQL)
- **Drizzle ORM** (Schema-driven migrations & type-safe queries)
- **NextAuth.js v5 (Auth.js)** (Credentials authentication with bcryptjs)
- **Tailwind CSS v4**
- **Vercel** (Production deployment)

## Setup & Instalasi Lokal

### 1. Buat Database di Neon
1. Masuk ke [neon.tech](https://neon.tech) → Create New Project (misal: `sip-lab`).
2. Salin PostgreSQL **Connection String** yang disediakan di dashboard.

### 2. Konfigurasi Environment Variables
Buat atau edit file `.env.local` di folder `sip-lab/`:

```env
# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require

# NextAuth Secret & App URL
NEXTAUTH_SECRET=generate_dengan_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Tips generate secret:** Jalankan `openssl rand -base64 32` di terminal / git bash.

### 3. Sinkronisasi Skema Database & Seeding
Jalankan push skema Drizzle ke Neon:

```bash
npm run db:push
npm run db:seed
```

### 4. Menjalankan Server Development

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 5. Membuat / Mengubah Akun Menjadi Admin
1. Buka [http://localhost:3000/auth/register](http://localhost:3000/auth/register) dan lakukan registrasi akun.
2. Buka **Neon SQL Editor** pada dashboard Neon, lalu jalankan query:

```sql
UPDATE users SET role = 'admin' WHERE email = 'email_anda@xxx.com';
```

3. Logout dan login kembali untuk me-refresh session token.

---

## Struktur Halaman & Hak Akses

| URL | Hak Akses | Deskripsi |
|-----|-----------|-----------|
| `/` | Publik | Landing page sistem |
| `/auth/login` | Publik | Halaman masuk |
| `/auth/register` | Publik | Registrasi akun baru (Mahasiswa / Dosen) |
| `/dashboard` | Login | Ringkasan statistik & aktivitas pengajuan |
| `/labs` | Login | Katalog laboratorium & fasilitas |
| `/labs/[id]` | Login | Detail lab & kalender jadwal terisi bulan ini |
| `/bookings` | Login | Riwayat pengajuan peminjaman pribadi |
| `/bookings/new` | Login | Formulir pengajuan peminjaman laboratorium |
| `/bookings/[id]` | Login / Admin | Detail status pengajuan, riwayat, & pembatalan |
| `/admin/bookings` | Admin | Kelola & filter seluruh pengajuan peminjam |
| `/admin/bookings/[id]` | Admin | Tindakan persetujuan (*Approve*) atau penolakan (*Reject*) |
| `/admin/labs` | Admin | Manajemen data master & fasilitas lab |
| `/profile` | Login | Pengelolaan profil pengguna |

---

## Aturan Bisnis & Logika Sistem

- **Multi-Role**: Mahasiswa, Dosen, dan Admin.
- **Persetujuan Satu Pintu**: Pengajuan diverifikasi dan disetujui langsung oleh Admin / Asisten Lab.
- **Deteksi Bentrok Jadwal Otomatis**: Sistem secara otomatis mengecek tumpang tindih waktu (*overlap*) pada tanggal dan lab yang sama saat Admin menyetujui peminjaman.
- **Audit Trail**: Setiap perubahan status pengajuan dicatat di tabel `booking_status_history` dan `booking_approval_actions`.
- **Kapasitas Melebihi**: Memberikan peringatan (*warning*) jika jumlah peserta melebihi kapasitas lab, namun tidak memblokir pengajuan secara sepihak.
- **SOP Serah-Terima Kunci**: Mengingatkan peminjam untuk mengambil kunci fisik secara langsung ke Asisten Lab setelah status berubah menjadi *Approved*.
