# AMS Integrated System — PT Anugrahmitra Selaras

Sistem Informasi Manajemen Terintegrasi Perusahaan Alat Kesehatan Indonesia berbasis standar **CDAKB** (Cara Distribusi Alat Kesehatan yang Baik), **CPAKB** (Cara Pembuatan Alat Kesehatan yang Baik), **SDAK**, dan **ISO 13485:2016** Kementerian Kesehatan Republik Indonesia.

---

## 🌟 Tentang Aplikasi

**AMS Integrated System** adalah platform Enterprise Resource Planning (ERP) dan Manajemen Kepatuhan spesifik industri alat kesehatan (Alkes) yang dikembangkan untuk **PT Anugrahmitra Selaras (AMS)**. Sistem ini menghubungkan seluruh divisi operasional perusahaan dari hulu (manufaktur dan regulasi) hingga hilir (distribusi, e-Katalog LKPP, purna jual, dan post-market surveillance).

---

## 🏛️ Divisi & Modul Utama Terintegrasi

Aplikasi ini mencakup **13 Modul Fungsional Utama**:

1. **Dashboard Dewan Direksi (Executive Overview)**
   - Cockpit real-time bagi Direksi untuk memantau performa perusahaan secara langsung.
   - Grafik analitik interaktif (Line Chart) untuk tren pendapatan, fluktuasi suhu *cold chain*, dan skor kepatuhan mutu.
   - Laporan ringkasan kinerja 7 divisi utama.
2. **Regulatory Affairs (RA) & Penanggung Jawab Teknis (PJT)**
   - Manajemen Nomor Izin Edar (NIE), pemantauan masa berlaku perpanjangan, dan lisensi PJT sesuai Permenkes.
3. **Quality Assurance (QA) & ISO 13485:2016**
   - Manajemen Catatan Perbaikan & Pencegahan (CAPA), dokumen mutu, dan audit internal terakreditasi KAN.
4. **Quality Control (QC)**
   - Inspeksi kedatangan barang (*inbound inspection*) dan keputusan rilis batch alkes.
5. **Warehouse & Logistics (WMS / CDAKB)**
   - Manajemen gudang CDAKB 12 tab (penyimpanan suhu 2–8°C *cold chain*, alokasi FEFO sadar-kunci, *cycle count*, *recall*, dan integrasi SatuSehat/LKPP).
6. **After-Sales Service**
   - Layanan pemeliharaan alat elektromedik, perbaikan garansi, dan kalibrasi berkala ber-BA.
7. **Manufacture (CPAKB)**
   - Batch Manufacturing Record (BMR), pemantauan *cleanroom*, dan kontrol *yield* produksi.
8. **Purchasing & Procurement**
   - Pengadaan Purchase Order (PO) prinsipal alkes dan kalkulator *Landed Cost*.
9. **CRM Marketing & Sales (e-Katalog LKPP)**
   - Manajemen CRM & Prospek, Tender LPSE / e-Katalog LKPP, Otomasi Sales Force (SFA), Manajemen Order Penjualan, Kampanye & Promo, serta integrasi Newsletter/Mailing List (*listmonk*).
10. **Post-Market Surveillance (PMS) / Vigilance**
    - Pelaporan Kasus KTD (Kecelakaan Yang Tidak Diharapkan) ke e-Watch Alkes Kemenkes dan eksekusi penarikan produk (*recall*).
11. **Human Resources (HRD / HRIS)**
    - Manajemen data karyawan multi-site, jadwal shift, absensi, slip gaji, rekrutmen ATS, matriks kompetensi, KPI, dan HSE/K3.
12. **Finance & Accounting**
    - Buku besar ganda (*double-entry ledger*), Chart of Accounts, kalkulasi PPN 11%, dan transaksi keuangan.
13. **IT & Traceability Hub**
    - Jejak audit ALCOA+ SHA-256 untuk ketelusuran penuh dan API Gateway.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons.
- **Backend**: Express.js (`server.ts`), PocketBase (Offline-First LocalStorage Caching & Real-Time Sync).
- **Build Tools**: Esbuild, TypeScript Compiler (`tsc`), Vite.

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- Node.js >=22; gunakan versi LTS yang masih didukung.
- npm (Node Package Manager).
- PostgreSQL 16 untuk setup lokal berikut.

### Instalasi & Menjalankan Development Server

1. Pasang dependensi dengan `npm ci`.
2. Untuk Windows, unduh [binary PostgreSQL dari EDB](https://www.enterprisedb.com/download-postgresql-binaries), lalu ekstrak sehingga tersedia `data/postgres/pgsql/bin/initdb.exe`. Binary 16.16 dipakai untuk setup ini. Jika binary berada di lokasi lain, tetapkan environment `POSTGRES_BIN` ke direktori `bin` sebelum menjalankan perintah berikut.
3. Inisialisasi instance lokal terisolasi:
   ```bash
   npm run db:local:init
   npm run db:check
   npm run test:db
   ```
   Skrip membuat cluster khusus proyek pada `127.0.0.1:5433`, database `ams_local`, schema kosong `ams`, dan akun runtime `ams_app` tanpa hak superuser/DDL. Password acak disimpan di `.env`; kredensial pemilik cluster hanya di `data/postgres/credentials.json`. Keduanya diabaikan Git: jangan unggah, kirim lewat chat, atau pakai sebagai secret frontend. Batasi akses folder pada akun lokal Anda. Tidak ada service Windows atau firewall global yang diubah.

   Jangan menyalin `.env.example` sebelum bootstrap otomatis ini: skrip tidak menimpa `.env` existing yang berbeda. Bila sudah memakai PostgreSQL sendiri, gunakan `.env.example` sebagai referensi konfigurasi dan siapkan database/schema serta akun terbatas secara terpisah. Skrip lokal tidak menghapus atau mereset database.
4. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3002`. `GET /api/health` memeriksa proses Express; `GET /api/ready` memeriksa koneksi PostgreSQL sungguhan dan mengembalikan 503 ketika koneksi gagal. Keduanya tidak membuktikan kesiapan produksi.

Setelah komputer di-restart, jalankan `npm run db:local:start` lalu `npm run dev`. `db:local:status` memeriksa cluster proyek, sedangkan `db:local:stop` menghentikan cluster tersebut dengan membatalkan transaksi yang belum selesai. Jangan menjalankan stop saat ada pekerjaan database yang ingin dipertahankan.

**Batas implementasi:** setup ini baru fondasi koneksi Express–PostgreSQL dan hak akses database, bukan autentikasi pengguna atau migrasi ERP. Data formulir tetap localStorage; tidak ada tabel bisnis/seed yang dibuat. `docs/erd-postgresql.sql` masih blueprint dan tidak dijalankan otomatis. `npm run test:db` hanya membuat tabel uji bernama acak, memverifikasi transaksi/izin, lalu membersihkan tabel miliknya sendiri.

---

## 📜 Perintah Script Tersedia (`package.json`)

- `npm run dev` — Menjalankan server pengembangan (Vite + Express).
- `npm run build` — Melakukan build produksi (frontend bundler + backend server bundle).
- `npm run start` — Menjalankan hasil build (`node server.js`); tetapkan `NODE_ENV=production` melalui environment sebelum memulai agar Vite development tidak ikut berjalan.
- `npm run db:check` — Memeriksa koneksi PostgreSQL, schema, dan batas hak akun runtime.
- `npm run test:db` — Menguji CRUD/transaksi berparameter dan penolakan DDL pada cluster lokal terisolasi.
- `npm run lint` — Memeriksa tipe TypeScript secara ketat (`tsc --noEmit`).

---

## 🔒 Keamanan & Konfigurasi Publikasi Situs

- `PUT /api/website/published` (terbitkan snapshot situs dari CMS) **ditolak secara bawaan** sampai `AMS_ADMIN_TOKEN` diset di environment server. Tanpa token: `503` dan UI menampilkan fallback unduh `website-published.json`. Dengan token: kirim header `x-ams-admin-token: <AMS_ADMIN_TOKEN>` (30 percobaan / 15 menit per IP, selebihnya `429`). Contoh publikasi manual:

  ```powershell
  curl.exe -X PUT -H "Content-Type: application/json" -H "x-ams-admin-token: $env:AMS_ADMIN_TOKEN" -d "@website-published.json" http://127.0.0.1:3001/api/website/published
  ```

- Proxy `/api/ams-pb/*` hanya meneruskan `GET /api/health`, `GET /api/realtime` (SSE), dan `GET /api/collections/<nama>/records`. Admin UI, superuser, pengaturan, serta tulis/hapus PocketBase dijawab `403`.
- `server.ts` membaca `.env` melalui dotenv tanpa menimpa environment proses. `DATABASE_URL` wajib; `HOST` default `127.0.0.1`, `PORT` default 3000, dan `NODE_ENV` default development. Bootstrap lokal mengatur port 3002. `DATABASE_POOL_MAX` membatasi koneksi dan `DATABASE_TIMEOUT_MS` membatasi waktu koneksi/query; database remote wajib TLS terverifikasi melalui `DATABASE_SSL=verify-full`. Jangan menaruh credential atau token di variabel `VITE_*`. Untuk VPS, injeksikan secret melalui service dan tetapkan `NODE_ENV=production` secara eksplisit.

## Developer Notes

Setiap modul aplikasi memuat catatan **Developer Notes** (ikon Info di bagian atas modul, kuning) — pernyataan jujur tentang apa yang nyata di modul itu (diuji/terpasang/tersimpan) dan apa yang masih benih contoh, antrean, atau pratinjau tanpa koneksi nyata. Frontend tidak mengklaim kepatuhan/ketersediaan yang belum diukur. Rujukan lengkap: [`docs/developer-notes.md`](docs/developer-notes.md) dan [`docs/production-list.md`](docs/production-list.md).

---

## 📄 Lisensi & Kepatuhan
Hak Cipta © 2026 PT Anugrahmitra Selaras (AMS). Seluruh sistem dikembangkan sesuai regulasi dan standar Kementerian Kesehatan Republik Indonesia. Coded by Langgo Bramandityo