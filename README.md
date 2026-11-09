# AMS Integrated System — PT Anugrah Mitra Selaras

Sistem Informasi Manajemen Terintegrasi Perusahaan Alat Kesehatan Indonesia berbasis standar **CDAKB** (Cara Distribusi Alat Kesehatan yang Baik), **CPAKB** (Cara Pembuatan Alat Kesehatan yang Baik), **SDAK**, dan **ISO 13485:2016** Kementerian Kesehatan Republik Indonesia.

---

## 🌟 Tentang Aplikasi

**AMS Integrated System** adalah platform Enterprise Resource Planning (ERP) dan Manajemen Kepatuhan spesifik industri alat kesehatan (Alkes) yang dikembangkan untuk **PT Anugrah Mitra Selaras (AMS)**. Sistem ini menghubungkan seluruh divisi operasional perusahaan dari hulu (manufaktur dan regulasi) hingga hilir (distribusi, e-Katalog LKPP, purna jual, dan post-market surveillance).

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
- Node.js versi 18 atau 22 (disarankan Node 22).
- npm (Node Package Manager).

### Instalasi & Menjalankan Development Server

1. Install dependensi:
   ```bash
   npm install
   ```

2. Jalankan server pengembangan (Development Server di port 3000):
   ```bash
   npm run dev
   ```

3. Buka browser dan akses: `http://localhost:3000`

---

## 📜 Perintah Script Tersedia (`package.json`)

- `npm run dev` — Menjalankan server pengembangan (Vite + Express).
- `npm run build` — Melakukan build produksi (frontend bundler + backend server bundle).
- `npm run start` — Menjalankan server pada mode produksi (`node server.js`).
- `npm run lint` — Memeriksa tipe TypeScript secara ketat (`tsc --noEmit`).

---

## 🔒 Keamanan & Konfigurasi Publikasi Situs

- `PUT /api/website/published` (terbitkan snapshot situs dari CMS) **ditolak secara bawaan** sampai `AMS_ADMIN_TOKEN` diset di environment server. Tanpa token: `503` dan UI menampilkan fallback unduh `website-published.json`. Dengan token: kirim header `x-ams-admin-token: <AMS_ADMIN_TOKEN>` (30 percobaan / 15 menit per IP, selebihnya `429`). Contoh publikasi manual:

  ```powershell
  curl.exe -X PUT -H "Content-Type: application/json" -H "x-ams-admin-token: $env:AMS_ADMIN_TOKEN" -d "@website-published.json" http://127.0.0.1:3001/api/website/published
  ```

- Proxy `/api/ams-pb/*` hanya meneruskan `GET /api/health`, `GET /api/realtime` (SSE), dan `GET /api/collections/<nama>/records`. Admin UI, superuser, pengaturan, serta tulis/hapus PocketBase dijawab `403`.
- `server.ts` **tidak membaca `.env`** — `PORT`, `NODE_ENV`, `AMS_ADMIN_TOKEN` diset lewat environment (NSSM/Caddy/PowerShell).

## Developer Notes

Setiap modul aplikasi memuat catatan **Developer Notes** (ikon Info di bagian atas modul, kuning) — pernyataan jujur tentang apa yang nyata di modul itu (diuji/terpasang/tersimpan) dan apa yang masih benih contoh, antrean, atau pratinjau tanpa koneksi nyata. Frontend tidak mengklaim kepatuhan/ketersediaan yang belum diukur. Rujukan lengkap: [`docs/developer-notes.md`](docs/developer-notes.md) dan [`docs/production-list.md`](docs/production-list.md).

---

## 📄 Lisensi & Kepatuhan
Hak Cipta © 2026 PT Anugrah Mitra Selaras (AMS). Seluruh sistem dikembangkan sesuai regulasi dan standar Kementerian Kesehatan Republik Indonesia. Coded by Langgo Bramandityo