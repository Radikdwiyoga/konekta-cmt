# Konekta MCT Center — Smart Document & Asset Hub (Modul 1 MVP)

Aplikasi web internal tim **Maintenance Computes** yang dibangun dengan **Next.js (App Router)**, **Tailwind CSS**, **Prisma + SQLite**, dan **Google Drive API (`googleapis`)**.

## Fitur Utama (Modul 1 MVP)

- **Sidebar Navigasi Responsif (Desktop & Mobile):** Dashboard, Document Hub, dan Asset & Host Directory.
- **Dashboard Operasional (`/`):** Ringkasan KPI dokumen, total perangkat compute/storage, status `Active` vs `Maintenance`, distribusi Data Center (`GTI Ragunan` & `ODC Sentul`), dan status sinkronisasi Google Drive.
- **Document Hub (`/documents`):** Pencarian real-time berdasarkan kata kunci, filter kategori (`PM Report`, `Infrastruktur`, `Vendor/Logistik`, `Administrasi`), filter lokasi (`GTI Ragunan`, `ODC Sentul`), panel preview ringkasan & cuplikan isi dokumen, tombol buka link eksternal, serta tambah dokumen manual.
- **Asset & Host Directory (`/assets`):** Tabel interaktif dengan pencarian cepat (Nama Server/Perangkat, Cluster, WWN, Lokasi/Koordinat Rak, Serial Number, Status), fitur copy cepat WWN/SN, tambah/edit manual, **Import CSV** (bulk upsert + template CSV), dan **Export CSV**.
- **Google Drive Sync API (`/api/sync-drive`):** Endpoint berbasis `googleapis` yang mendukung **Service Account** maupun **OAuth2** untuk membaca metadata dan cuplikan isi file dari folder Drive tertentu.

## Menjalankan Secara Lokal

```bash
git clone https://github.com/Radikdwiyoga/konekta-cmt.git
cd konekta-cmt

# 1. Salin konfigurasi environment
cp .env.example .env

# 2. Instal dependensi & inisialisasi database SQLite
npm install
npx prisma generate
npm run db:push
npm run db:seed

# 3. Jalankan server development (default port 3001)
npm run dev
```

Buka aplikasi pada port `3001` setelah server berjalan.

## Konfigurasi Google Drive API

Lengkapi variabel di file `.env` (referensi di `.env.example`) menggunakan salah satu mode berikut:

- **Service Account (`GOOGLE_AUTH_MODE="service_account"`):**
  - `GOOGLE_DRIVE_FOLDER_ID`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL` & `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (atau `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`)
- **OAuth2 (`GOOGLE_AUTH_MODE="oauth2"`):**
  - `GOOGLE_DRIVE_FOLDER_ID`
  - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`
