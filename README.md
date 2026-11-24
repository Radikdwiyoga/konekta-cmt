# Konekta MCT Center — Smart Document & Asset Hub (Modul 1 MVP)

Aplikasi web internal tim **Maintenance Computes** berbasis **Next.js (App Router)**, **Tailwind CSS**, **Prisma + PostgreSQL (Supabase)**, dan **Supabase Storage** — siap di-deploy 100% gratis di **Vercel**.

## Fitur Utama (Modul 1 MVP)

- **Sidebar Navigasi Responsif (Desktop & Mobile):** Dashboard, Document Hub, dan Asset & Host Directory.
- **Dashboard Operasional (`/`):** Ringkasan KPI dokumen, total perangkat compute/storage, status `Active` vs `Maintenance`, distribusi Data Center (`GTI Ragunan` & `ODC Sentul`), dan status sinkronisasi Google Drive.
- **Document Hub (`/documents`):** Pencarian real-time, filter kategori (`PM Report`, `Infrastruktur`, `Vendor/Logistik`, `Administrasi`), filter lokasi (`GTI Ragunan`, `ODC Sentul`), **Upload Dokumen Langsung** (tersimpan aman di private bucket Supabase Storage dengan Signed URL), panel preview ringkasan, serta dukungan link eksternal.
- **Asset & Host Directory (`/assets`):** Tabel interaktif dengan pencarian cepat (Nama Server/Perangkat, Cluster, WWN, Lokasi/Koordinat Rak, Serial Number, Status), copy cepat WWN/SN, tambah/edit manual, **Import CSV** (bulk upsert + template CSV), dan **Export CSV**.
- **Google Drive Sync API (`/api/sync-drive`):** Opsional, siap dihubungkan ke Google Drive API (`googleapis`) dengan Service Account atau OAuth2.

---

## Panduan Deploy Online Gratis (Vercel + Supabase)

### Langkah 1: Setup Database & File Storage di Supabase (Gratis, tanpa kartu kredit)
1. Daftar/login di https://supabase.com → klik **New Project** (pilih region **Singapore / ap-southeast-1** agar cepat dari Indonesia).
2. Buat bucket penyimpanan dokumen:
   - Masuk ke menu **Storage** → klik **New bucket**.
   - Beri nama: `mct-documents`
   - Biarkan **Public bucket = OFF (Private)** agar dokumen internal aman (diakses via Signed URL 5 menit).
3. Ambil 4 nilai Environment Variables berikut dari Supabase:
   - **Project Settings → Database → Connect (tab ORMs → Prisma)**:
     - `DATABASE_URL` (Transaction pooler, port `6543`)
     - `DIRECT_URL` (Session / Direct connection, port `5432`)
   - **Project Settings → API**:
     - `SUPABASE_URL` (Project URL)
     - `SUPABASE_SERVICE_ROLE_KEY` (`service_role` secret key)

### Langkah 2: Deploy di Vercel (Gratis)
1. Login di https://vercel.com menggunakan akun GitHub Anda.
2. Klik **Add New... → Project** → pilih repository `Radikdwiyoga/konekta-cmt`.
3. Buka bagian **Environment Variables** dan masukkan:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET` = `mct-documents`
4. Klik **Deploy**.

### Langkah 3: Buat Tabel & Isi Data Awal ke Supabase
Dari terminal lokal Anda (setelah mengisi `DATABASE_URL` dan `DIRECT_URL` di `.env`):
```bash
npm install
npm run db:push
npm run db:seed
```
Setelah selesai, buka `https://<domain-anda>.vercel.app/api/health` untuk memastikan status `database: "connected (postgresql)"` dan `supabaseStorage: "configured"`.
