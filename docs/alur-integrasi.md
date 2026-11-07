# Alur Integrasi Sistem — Katalog Website Publik & Modul Operasional Internal

**Klasifikasi:** Enterprise Architecture & Regulatory Integration Specification  
**Standar Kepatuhan:** CDAKB Permenkes RI 4/2014, ISO 13485:2016, Etika Promosi Alat Kesehatan Kemenkes RI, ALCOA+ Data Integrity.  
**Sasaran Dokumen:** Menjelaskan secara mendalam alur integrasi antara Katalog Website Publik (`/web`) dengan modul-modul operasional internal (Gudang/WMS, Sales & CRM, Regulatory Affairs, dan QA).
Coded by Langgo Bramandityo

---

## 1. Desain Arsitektur Integrasi: Decoupled Regulatory Snapshot

Katalog website dirancang menggunakan arsitektur Headless/Decoupled Snapshot (`/api/website/published` dan `src/utils/website.ts`).

### Alasan Regulasi Medis (CDAKB & Kemenkes RI):
Pada industri alat kesehatan berizin edar resmi, informasi publik tidak boleh langsung terhubung tanpa gerbang (*gatekeeping*). Setiap klaim spesifikasi, status izin edar, dan ketersediaan barang harus dapat diaudit (*traceable*) serta disetujui oleh Penanggung Jawab Teknis (PJT) dan Admin IT sebelum tayang ke publik guna mencegah pelanggaran etika promosi alkes.

---

## 2. Integrasi Pengecekan Stok Produk

Di modul website, setiap kartu produk dihubungkan dengan data riil dari 3 modul aplikasi internal:
```
┌─────────────────────────────────┐
│ Modul Regulatory Affairs (RA)   │ ──► Nomor Izin Edar (NIE AKL/AKD), Kelas Risiko, Status
├─────────────────────────────────┤
│ Modul Sales (Product Knowledge) │ ──► Spesifikasi, Poin Jual, Brosur PDF, Video Demo
├─────────────────────────────────┤
│ Modul Gudang / WMS (CDAKB)      │ ──► Agregasi Stok Kartu Gudang (Filter FEFO)
└─────────────────────────────────┘
                │
                ▼
   Fungsi `bangunProduk()` di `src/utils/website.ts`
                │
                ▼
   Katalog Website Publik (`SeksiProduk` di `SiteSections.tsx`)
```

### Alur Pengecekan Stok:
1. **Perhitungan Stok Berbasis FEFO:**
   Di dalam kode `src/utils/website.ts` baris 97–100:
   ```ts
   const unitStok = sumber.stok
     .filter((s) => s.nomorIzinEdar === ie.nomorIzinEdar && s.statusFEFO !== 'Kedaluwarsa')
     .reduce((total, s) => total + s.jumlahStok, 0);
   ```
   Sistem menyaring seluruh bets alkes di kartu stok gudang:
   - Bets yang berstatus Kedaluwarsa (*Expired*) atau dikunci untuk karantina otomatis dikeluarkan dari hitungan.
   - Hanya stok yang aman edar (*salable stock*) yang dijumlahkan.

2. **Tampilan ke Calon Klien:**
   Pada kartu katalog produk di `/web`, calon klien dapat melihat badge:
   - Stok Gudang: Misalnya 54 Unit (atau satuan terkait seperti Box, Pcs).
   - Status Izin Edar: Aktif (berwarna hijau).
   - Spesifikasi & Brosur: Tombol unduh brosur teknis langsung dari digital catalog.

3. **Mekanisme Pembaruan Data:**
   - Ketika ada pergerakan stok (*inbound* penerimaan barang, *outbound* pengiriman surat jalan, atau penyesuaian opname), operator / PJT cukup menekan tombol "Sinkron dari Data Aplikasi" di menu Website CMS.
   - Sistem akan mengompilasi ulang data stok dan NIE terbaru, mencatat audit trail perbedaan angka (*diff oldValue vs newValue*), lalu tombol "Terbitkan" memperbarui snapshot server `/api/website/published`.

---

## 3. Integrasi Alur RFQ (Request for Quotation)

Ketika calon klien (RS, Dinkes, Puskesmas, atau Klinik Swasta) tertarik dengan suatu produk dan ingin meminta penawaran harga resmi (RFQ):

### A. Di Sisi Pengunjung Website Publik (`/web`):
1. Calon klien mengklik tombol "Request for Quotation" di Hero banner, tombol Header, atau tombol "Ajukan Penawaran" di kartu spesifik produk.
2. Pengunjung diarahkan ke seksi formulir penawaran terintegrasi (`SeksiKontak` di `SiteSections.tsx`).
3. Sistem menyediakan dua kanal terarah:
   - **Surel Resmi Berformat:** Tombol Kirim lewat Surel secara otomatis menyiapkan subjek dan draf rincian kebutuhan (nama instansi, jenis alat, volume/jumlah unit, target pemasangan).
   - **WhatsApp Business Gateway:** Tautan otomatis menuju tim sales rayon terkait dengan format pesan pembuka resmi.

### B. Di Sisi Modul Internal Aplikasi:
Setelah permintaan RFQ masuk dari website, tim internal memprosesnya melalui rantai modul komersial & operasional:
1. **Modul CRM & Pipeline Prospek (`CrmProspekModule.tsx`):**
   - RFQ dicatat sebagai Prospek Baru dengan nomor tiket prospek (misal: `PR-2026-001`).
   - Status pipeline dimulai dari tahap: *Kualifikasi Kebutuhan ➔ Presentasi Teknis / Demo Unit ➔ Penawaran Resmi (Quotation) ➔ Negosiasi ➔ Menang / PO Terbit*.
2. **Modul Sales Force Automation (SFA) & Teritorial (`SalesForceModule.tsx`):**
   - Prospek dialokasikan ke Medical Representative (MedRep) yang bertanggung jawab atas rayon fasyankes tersebut berdasarkan pemetaan wilayah di `sales_teritorial`.
3. **Modul Multi-Level Pricing & Skema Diskon (`SalesOrderModule.tsx`):**
   - Harga penawaran dihitung otomatis menyesuaikan tipe fasyankes (RS Pemerintah / RS Swasta / Distributor Daerah) dan batas kredit / TOP (*Terms of Payment*).
4. **Validasi Kepatuhan PJT (CDAKB & Etika Promosi):**
   - Sebelum dokumen penawaran fisik/digital dikirimkan kembali ke klien, status verifikasi NIE dan etika promosi alkes diverifikasi di sistem untuk menjamin legalitas tender atau e-Katalog LKPP.
5. **Modul Outbound & Cadangan Stok (Gudang FEFO):**
   - Setelah RFQ disetujui menjadi Purchase Order (PO), kuota stok di gudang dikunci (`qtyDipesan`) sehingga tidak terjadi *overselling* kepada calon klien lainnya.

---

## 4. Stack Teknologi Integrasi Website & Operasional
- **Frontend Publik & CMS**: React SPA, Tailwind CSS v4, MedanEditor & SectionsEditor UI (`WebsiteModule.tsx`).
- **Engine Kompilasi Snapshot**: `src/utils/website.ts` (`bangunProduk()`, filter FEFO `statusFEFO !== 'Kedaluwarsa'`).
- **Backend & Data Storage**: PocketBase CMS Collections (`website_sections`, `katalog_alkes`) & Express middleware (`server.ts`).
- **Komunikasi RFQ**: HTML Mailto Protocol & WhatsApp Business API Link Generator.

---
*Dokumen alur integrasi ini merupakan bagian integral dari spesifikasi teknis AMS Integrated System (REMEDI).*
