# Protokol & Checklist Peluncuran Produksi (Production Readiness Checklist A-Z)

Dokumen ini adalah **Protokol Resmi Peluncuran Produksi (*Production Deployment Protocol*)** untuk **AMS Integrated System (PT Anugrah Mitra Selaras)**, termasuk panduan dan *checklist* migrasi data / input data asli (*real data seeding*) untuk setiap modul fungsional.
Coded by Langgo Bramandityo

---

## 📌 Aturan Protokol Peluncuran (Deployment Rules)
1. **Wajib Berurutan (Step-by-Step)**: Ketika pengembang (*developer*) memutuskan untuk melakukan *publish* (merilis aplikasi ke lingkungan *production*), protokol ini **wajib** dijalankan secara bertahap dari huruf **A hingga Z**.
2. **Zero-Skip Policy**: Tidak ada satupun *checklist* yang boleh dilewati (*skipped*) tanpa verifikasi atau pengecualian tertulis dari Lead Developer / PJT.
3. **Sign-off Wajib**: Setiap fase harus ditandai centang (`[x]`) setelah melalui pengujian dan verifikasi berhasil.

---

## 📋 A-Z Production Readiness Checklist

### A — Architecture & Infrastructure Readiness
- [ ] **A1**: Memilih layanan cloud server produksi (Google Cloud Run, AWS EC2, atau VPS mandiri dengan minimum 2 vCPU / 4GB RAM).
- [ ] **A2**: Menyiapkan arsitektur *high availability* untuk mengantisipasi lonjakan akses fasyankes dan rumah sakit.
- **Rekomendasi**: Gunakan Google Cloud Run atau Docker container di VPS dengan manajemen auto-scaling untuk efisiensi biaya dan keandalan uptime.

### B — Build & Compilation Verification
- [ ] **B1**: Menjalankan *type-checking* TypeScript tanpa error (`npm run lint`).
- [ ] **B2**: Melakukan build produksi penuh (`npm run build`) tanpa peringatan kritis.
- [ ] **B3**: Memastikan *bundle size* frontend teroptimasi dan server Express (`server.js`) berjalan stabil.
- **Rekomendasi**: Selalu jalankan `npm run lint` dan `npm run build` di dalam *staging environment* sebelum di-push ke branch produksi.

### C — Configuration & Environment Variables
- [ ] **C1**: Menyusun file `.env.production` terisolasi dari lingkungan lokal.
- [ ] **C2**: Memastikan tidak ada *hardcoded API keys* atau rahasia di dalam kode sumber.
- [ ] **C3**: Mengonfigurasi variabel `APP_URL`, `PORT=3000`, and `NODE_ENV=production`.
- **Rekomendasi**: Gunakan layanan *Secret Manager* (seperti Google Secret Manager atau AWS Secrets Manager) untuk menyuntikkan env vars secara aman.

### D — Database & Migration Setup
- [ ] **D1**: Memprovisi basis data produksi permanen (Managed PocketBase atau PostgreSQL Cloud SQL).
- [ ] **D2**: Menjalankan migrasi skema basis data terbaru.
- [ ] **D3**: Mengonfigurasi pencadangan otomatis (*automated daily backup*) dan *point-in-time recovery*.
- **Rekomendasi**: Uji coba skema *restore* database di lingkungan *staging* untuk memastikan skrip *backup* berfungsi normal.

### E — Domain Name & SSL / TLS Security
- [ ] **E1**: Mendaftarkan domain resmi perusahaan (misal: `https://app.anugrahmitraselaras.co.id`).
- [ ] **E2**: Mengaktifkan sertifikat SSL/TLS (HTTPS) yang valid (Let's Encrypt / Cloudflare).
- [ ] **E3**: Mengonfigurasi pengalihan otomatis dari HTTP ke HTTPS.
- **Rekomendasi**: Gunakan Cloudflare untuk proteksi SSL, CDN, dan mitigasi serangan DDoS lapis pertama.

### F — Firewall, CORS & Rate Limiting
- [ ] **F1**: Membatasi aturan *Cross-Origin Resource Sharing* (CORS) hanya untuk domain resmi perusahaan.
- [ ] **F2**: Menerapkan *Rate Limiting* pada endpoint API untuk mencegah *brute-force* pada halaman login.
- [ ] **F3**: Mengonfigurasi *Security Headers* (HSTS, X-Frame-Options, Content-Security-Policy).
- **Rekomendasi**: Terapkan batas maksimum 100 request per 15 menit per IP untuk endpoint autentikasi.

### G — Gateway & Interoperability (SatuSehat & LKPP)
- [ ] **G1**: Mengonfigurasi kredensial API gateway produksi untuk integrasi SatuSehat Kemenkes.
- [ ] **G2**: Menghubungkan modul tender ke sistem LPSE/LKPP live.
- [ ] **G3**: Mengonfigurasi gateway WhatsApp/SMS untuk notifikasi darurat PJT dan *recall*.
- **Rekomendasi**: Lakukan uji koneksi (*ping test*) pada *sandbox environment* pemerintah sebelum mengaktifkan mode *live*.

### H — Hardening Authentication & RBAC
- [ ] **H1**: Memastikan token JWT menggunakan *secret key* yang panjang dan dirotasi secara berkala.
- [ ] **H2**: Mengonfigurasi *cookie flags* (`HttpOnly`, `Secure`, `SameSite=Strict`).
- [ ] **H3**: Melakukan audit ulang matriks hak akses peran (*Role-Based Access Control* / RBAC) untuk PJT, QA, QC, Gudang, dan Direksi.
- **Rekomendasi**: Terapkan kebijakan *password policy* yang kuat bagi seluruh akun staf internal.

### I — Integrity & Compliance Audit (CDAKB, CPAKB, ISO 13485)
- [ ] **I1**: Memverifikasi bahwa mekanisme *Audit Trail* ALCOA+ SHA-256 aktif dan mencatat seluruh perubahan data.
- [ ] **I2**: Memastikan dokumen prosedur operasional standar (SOP) dan sertifikat mutu terlampir di sistem.
- [ ] **I3**: Memperoleh persetujuan (*sign-off*) dari Penanggung Jawab Teknis (PJT).
- **Rekomendasi**: Simpan salinan *log audit* terenkripsi di penyimpanan terpisah (*immutable storage*).

### J — Logging, Monitoring & Error Tracking
- [ ] **J1**: Mengaktifkan alat pelacak *error* produksi (seperti Sentry).
- [ ] **J2**: Mengonfigurasi pemantauan kesehatan server (*uptime monitoring*).
- [ ] **J3**: Mengaktifkan alarm darurat untuk sensor suhu *cold chain* jika terjadi deviasi di luar rentang 2°C–8°C.
- **Rekomendasi**: Hubungkan alarm suhu cold chain langsung ke perangkat seluler Tim Gudang & PJT via webhook.

### K — Key-Rotation & Backup Disaster Recovery Drill
- [ ] **K1**: Melakukan uji simulasi pemulihan bencana (*Disaster Recovery Drill*) dengan merestore database dari *backup*.
- [ ] **K2**: Memastikan seluruh kunci enkripsi dan API keys dapat dirotasi tanpa *downtime*.
- **Rekomendasi**: Jadwalkan simulasi pemulihan darurat setiap 6 bulan sekali.

### L — Launch & Go-Live Execution
- [ ] **L1**: Mengarahkan DNS domain produksi ke server utama (*DNS propagation*).
- [ ] **L2**: Melakukan pengujian fungsionalitas akhir (*Smoke Testing*) pada semua 13 modul.
- [ ] **L3**: Mengumumkan kepada seluruh manajemen dan divisi bahwa sistem resmi beroperasi penuh di *production*.
- **Rekomendasi**: Lakukan peluncuran pada jam operasional rendah (malam hari atau akhir pekan) untuk meminimalkan dampak jika terjadi penyesuaian kecil.

---

## 📦 Checklist Migrasi & Input Data Asli (*Real Data Seeding*) per Modul

Sebelum sistem dibuka untuk operasional penuh (*Go-Live*), data master dan data operasional asli (*real data*) wajib diimigrasikan ke dalam sistem dengan urutan dan checklist sebagai berikut:

### 1. Modul Human Resources (HRIS & Karyawan)
- [ ] **HR-1**: Import master data seluruh karyawan aktif (Nama, NIK, Jabatan, Divisi, Lokasi Kerja, Grade).
- [ ] **HR-2**: Input data sertifikasi profesi staf (*STR Teknisi*, *Sertifikat PJT*, pelatihan CDAKB).
- [ ] **HR-3**: Setup jadwal shift kerja awal dan parameter komponen penggajian (*payroll* & PPh 21).

### 2. Modul Regulatory Affairs & PJT
- [ ] **RA-1**: Input daftar resmi Nomor Izin Edar (NIE) aktif beserta kelas risiko (A, B, C, D) dan tanggal kedaluwarsa.
- [ ] **RA-2**: Upload dokumen Sertifikat Distribusi Alat Kesehatan (SDAK) dan surat penunjukan PJT yang sah.
- [ ] **RA-3**: Setel matriks *reminder* otomatis perpanjangan izin edar.

### 3. Modul Warehouse & Logistics (CDAKB WMS)
- [ ] **WH-1**: Setup struktur fisik gudang (Zona Utama, Zona Karantina, Rak, dan Bin Location).
- [ ] **WH-2**: Input data master stok awal *real-time* per batch (Nomor Batch, Tanggal Kedaluwarsa, Jumlah Fisik, dan Kondisi Suhu).
- [ ] **WH-3**: Kalibrasi dan sinkronisasi sensor suhu ruang *cold chain* (2°C–8°C) dan kalibrasi alat ukur.

### 4. Modul Quality Assurance & QC (ISO 13485)
- [ ] **QA-1**: Upload dokumen Prosedur Operasional Standar (SOP) dan manual mutu ISO 13485.
- [ ] **QA-2**: Input data catatan CAPA aktif yang belum selesai (jika ada dari audit sebelumnya).
- [ ] **QC-1**: Setup parameter uji inspeksi kedatangan (*inbound*) untuk tiap jenis alat kesehatan.

### 5. Modul Manufacture (CPAKB)
- [ ] **MFG-1**: Input *Bill of Materials* (BOM) untuk produk alat kesehatan yang diproduksi sendiri.
- [ ] **MFG-2**: Setup parameter standar *cleanroom* (tekanan udara, suhu, kelembaban) dan master resep Batch Manufacturing Record (BMR).

### 6. Modul Purchasing & Pemasok
- [ ] **PUR-1**: Input master data prinsipal / pemasok luar negeri dan distributor lokal resmi.
- [ ] **PUR-2**: Input daftar harga beli standar (*purchase price*) dan estimasi *landed cost*.

### 7. Modul CRM Marketing & Sales (e-Katalog LKPP)
- [ ] **CRM-1**: Import master data pelanggan B2B (Rumah Sakit Pemerintah/Swasta, Klinik, Dinas Kesehatan, Pagu Kredit, dan TOP).
- [ ] **CRM-2**: Input daftar kontrak harga e-Katalog LKPP dan nomor pengumuman tender aktif.
- [ ] **CRM-3**: Import data subscriber newsletter (*listmonk*) untuk komunikasi pemasaran fasyankes.

### 8. Modul After-Sales Service & Purna Jual
- [ ] **SRV-1**: Input data unit alat kesehatan yang telah terpasang di fasyankes beserta masa garansi aktif.
- [ ] **SRV-2**: Setup jadwal kalibrasi berkala tahunan untuk alat elektromedik di fasyankes.

### 9. Modul Post-Market Surveillance (PMS)
- [ ] **PMS-1**: Setup eskalasi pelaporan KTD dan SOP investigasi penarikan produk (*recall*).

### 10. Modul Finance & Accounting
- [ ] **FIN-1**: Input *Chart of Accounts* (CoA) perusahaan sesuai standar akuntansi alkes.
- [ ] **FIN-2**: Input saldo awal (*opening balance*) buku besar, piutang (*AR*), dan hutang (*AP*).
- [ ] **FIN-3**: Konfigurasi tarif pajak PPN 11% dan PPh potong pungut.

### 11. Modul IT & Traceability Hub
- [ ] **IT-1**: Verifikasi bahwa seluruh tabel database memiliki integritas *hash* SHA-256 (ALCOA+).
- [ ] **IT-2**: Uji coba *endpoint* API Gateway dan integrasi SatuSehat / LKPP.

---

## 🧭 Panduan untuk Pengembang (*Developer Guide*)
1. **Sebelum Merilis**: Pastikan seluruh kotak centang di atas telah diperiksa satu per satu bersama tim penjamin mutu (QA) dan PJT.
2. **Jika Terjadi Kendala**: Hentikan proses *deployment*, lakukan *rollback* ke versi stabil sebelumnya, dan evaluasi log error melalui Sentry atau terminal server.
3. **Dokumentasikan Perubahan**: Setiap penyesuaian konfigurasi produksi wajib dicatat dalam log pembaharuan sistem.
