# Glosarium Istilah Serapan Inggris–Indonesia (Acuan PJT)

Dokumen ini disusun sebagai acuan resmi **Penanggung Jawab Teknis (PJT)** dalam meninjau, menyetujui, dan menyeragamkan penggunaan istilah serapan bahasa Inggris–Indonesia di seluruh modul aplikasi manajemen alat kesehatan (alkes).

> **Contoh Acuan Cepat:** `Cold Chain` = **Rantai Dingin**; `Adverse Event` = **Kejadian Tidak Diinginkan (KTD)**; `Write-Off` = **Penghapusbukuan Persediaan**; `Blind Count` = **Hitung Buta Opname**; `Take Home Pay (THP)` = **Gaji Bersih Diterima**.

---

## Pedoman Keputusan PJT dalam Memilih Istilah

Gunakan tiga prinsip berikut saat PJT meninjau SOP, formulir mutu, dokumen tender/e-Katalog, surat jalan, faktur, maupun publikasi katalog:

1. **Dokumen Resmi Regulasi RI, Kontrak, Pajak, & Surat Dinas** *(Kemenkes, OSS-RBA, LKPP, DJP/Coretax, Disnaker, Fasyankes)*
   - **Utamakan istilah baku bahasa Indonesia**, dan cantumkan padanan Inggris dalam tanda kurung pada penyebutan pertama bila istilah Inggrisnya lazim di audit.
   - Contoh: *"Rantai Dingin (Cold Chain) 2°C–8°C"*, *"Kejadian Tidak Diinginkan (KTD / Adverse Event)"*, *"Penarikan Produk (Recall) Kelas II"*.
2. **Dokumen Teknis Sistem Mutu & Standar Internasional** *(ISO 13485:2016, HL7 FHIR, ALCOA+, e-Watch)*
   - **Pertahankan singkatan atau istilah teknis internasional yang tidak boleh berubah makna**, disertai penjelasan Indonesia.
   - Contoh: **CAPA**, **FEFO**, **SOP**, **CoA**, **CoO**, **LoA**, **BMR**, **HL7 FHIR**, **LTIFR**, **OEE**.
3. **Antarmuka Sistem, Ledger, & Integrasi Eksternal** *(Akuntansi, RBAC, Newsletter Engine, CMS)*
   - Gunakan label Indonesia untuk pengguna operasional, tetapi **jaga konsistensi kode status/protokol sistem** (seperti `AVAILABLE`, `QUARANTINE`, `EXPIRED_LOCK`, `Posted`, `Void`, `Enabled`, `Blocked`) pada log audit agar tidak memutus ketertelusuran.

---

## 1. Regulasi Kemenkes RI, Izin Edar & Sistem Manajemen Mutu (RA, QA, QC)

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Regulatory Affairs (RA)** | Urusan Regulasi / Kepatuhan Regulasi | Divisi pengelola perizinan edar Kemenkes dan sertifikasi penyalur | Gunakan **RA & PJT** pada struktur internal; **Urusan Regulasi** di surat resmi |
| **Technical Person in Charge** | Penanggung Jawab Teknis (**PJT**) | Personel bersertifikat (Apoteker/Elektromedis) penjamin mutu CDAKB | Wajib gunakan **PJT** atau **Penanggung Jawab Teknis** |
| **Quality Assurance (QA)** | Pemastian Mutu / Penjaminan Mutu | Sistem pencegahan cacat, kendali dokumen, audit, dan CAPA | Gunakan **QA (Pemastian Mutu)** |
| **Quality Control (QC)** | Pengawasan Mutu / Kendali Mutu | Inspeksi fisik barang datang, produk jadi, dan pra-kirim | Gunakan **QC (Pengawasan Mutu)** |
| **Medical Device Marketing Authorization** | Nomor Izin Edar (**NIE** — AKD / AKL) | Izin edar resmi Kemenkes RI (Alkes Dalam Negeri / Luar Negeri) | Wajib gunakan **Nomor Izin Edar (NIE)** |
| **Standard Distribution Certificate** | Sertifikat Distribusi Alat Kesehatan (**SDAK** / eks-IPAK) | Izin penyalur alkes melalui OSS-RBA Kemenkes | Gunakan **SDAK** (sebut eks-IPAK hanya untuk arsip lama) |
| **Good Distribution Practice (GDPMD / CDAKB)** | Cara Distribusi Alat Kesehatan yang Baik (**CDAKB**) | Permenkes RI No. 4 Tahun 2014 | Gunakan **CDAKB** di dalam negeri; **GDPMD** saat korespondensi prinsipal asing |
| **Good Manufacturing Practice (CPAKB)** | Cara Pembuatan Alat Kesehatan yang Baik (**CPAKB**) | Permenkes RI No. 20 Tahun 2017 | Gunakan **CPAKB** |
| **Risk Class (Class A/B/C/D)** | Kelas Risiko (`Kelas A`–`Kelas D`) | Klasifikasi risiko klinis alkes Kemenkes | Gunakan **Kelas Risiko A/B/C/D** |
| **In Vitro Diagnostics (IVD)** | Diagnostik In Vitro | Reagen dan instrumen uji laboratorium di luar tubuh | Gunakan **Diagnostik In Vitro (IVD)** |
| **Standard Operating Procedure (SOP)** | Prosedur Operasional Standar (**SOP**) | Dokumen mutu tingkat 2 di bawah Pedoman Mutu | Boleh gunakan **SOP** secara baku |
| **Quality Manual** | Pedoman Mutu | Dokumen induk sistem manajemen mutu ISO 13485 | Gunakan **Pedoman Mutu** |
| **Work Instruction (WI)** | Instruksi Kerja (**IK**) | Panduan teknis langkah kerja spesifik | Gunakan **Instruksi Kerja** |
| **Certificate of Analysis (CoA)** | Sertifikat Analisis | Bukti uji mutu per batch/lot dari pabrikan | Gunakan **CoA (Sertifikat Analisis)** |
| **Certificate of Origin (CoO)** | Surat Keterangan Asal (**SKA**) | Dokumen kepabeanan negara asal produsen | Gunakan **CoO / Surat Keterangan Asal** |
| **Letter of Authorization (LoA)** | Surat Kuasa / Penunjukan Prinsipal | Penunjukan distributor tunggal/resmi dari pabrikan luar negeri | Gunakan **LoA (Surat Penunjukan Prinsipal)** |
| **Corrective and Preventive Action (CAPA)** | Tindakan Korektif dan Preventif | Penanganan akar masalah penyimpangan agar tidak berulang | Pertahankan **CAPA** disertai uraian **Tindakan Korektif & Preventif** |
| **Root Cause Analysis (RCA)** | Analisis Akar Penyebab / Akar Masalah | Penyelidikan penyebab utama temuan audit/KTD/suhu | Gunakan **Akar Penyebab (RCA)** |
| **Non-Conformity (NC — Major / Minor)** | Ketidaksesuaian (`Major NC` / `Minor NC`) | Klasifikasi temuan audit internal ISO 13485 | Gunakan **Ketidaksesuaian Mayor / Minor (Major/Minor NC)** |
| **Opportunity for Improvement (OFI)** | Peluang Peningkatan | Rekomendasi perbaikan non-temuan pada laporan audit | Gunakan **Peluang Peningkatan (OFI)** |
| **Compliant** | Sesuai / Patuh | Status hasil evaluasi klausul & kelengkapan dokumen | Gunakan **Sesuai** |
| **Released / Hold / Rejected** | `Lolos (Released)` / `Karantina (Hold)` / `Tolak (Rejected)` | Keputusan inspeksi QC atas batch barang | Pertahankan format gabungan **`Lolos (Released)`** agar jelas bagi gudang & auditor |
| **Returned Goods / Quarantine** | Produk Kembalian (Retur) & Karantina | Alkes retur fasyankes yang menunggu inspeksi QA | Gunakan **Produk Kembalian (Retur)** |
| **Effective Date / Review Date / Obsolete** | Tanggal Efektif / Tanggal Tinjau Ulang / `Usang` | Siklus pengendalian dokumen mutu (Klausul 4.2.4) | Gunakan **Tanggal Efektif**, **Tinjau Ulang**, dan **Usang** |
| **Surveillance Audit** | Audit Pengawasan | Audit berkala lembaga akreditasi (KAN) setelah sertifikasi | Gunakan **Audit Pengawasan** |

---

## 2. Gudang, Rantai Dingin, FEFO & Logistik Alat Kesehatan

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Cold Chain** | **Rantai Dingin** (`2°C - 8°C`) | Pengelolaan suhu terkendali untuk reagen IVD dan produk labil suhu | Wajib gunakan **Rantai Dingin (Cold Chain)** di SOP; **Rantai Dingin** di dokumen Indonesia |
| **Cold Room / Chiller** | Ruang Dingin / Lemari Pendingin Tervalidasi | Fasilitas penyimpanan suhu 2°C–8°C | Gunakan **Ruang Dingin (Cold Room)** |
| **Ambient / Cool Room** | Suhu Kamar (`< 30°C`) / Ruang Sejuk AC (`15°C - 25°C`) | Zona suhu penyimpanan non-rantai dingin | Gunakan **Ruang Sejuk AC** dan **Suhu Kamar** |
| **Temperature Excursion** | Penyimpangan / Eskursi Suhu (`Excursion`) | Suhu keluar dari ambang batas selama durasi toleransi | Gunakan **Penyimpangan Suhu (Excursion)** |
| **Relative Humidity (RH)** | Kelembaban Relatif (`% RH`) | Parameter lingkungan ruang penyimpanan alkes | Gunakan **Kelembaban (% RH)** |
| **First Expired First Out (FEFO)** | Pengeluaran Berdasarkan Kedaluwarsa Terdekat (**FEFO**) | Aturan wajib distribusi alkes CDAKB | Pertahankan akronim **FEFO** secara konsisten |
| **Dual-Track Inventory (Batch vs Serial)** | Inventaris Trek Jamak (Jalur A: Batch / Jalur B: Serial) | Pemisahan alkes habis pakai (per batch) dan alat berat (per nomor seri) | Gunakan **Jalur Batch (Habis Pakai)** dan **Jalur Serial (Alat Berat)** |
| **Stock Keeping Unit (SKU)** | Kode Barang / **Kode SKU** | Identitas unik katalog produk di gudang | Gunakan **Kode SKU** |
| **Batch / Lot Number** | Nomor Batch / Nomor Bets / Nomor Lot | Identitas kelompok produksi untuk ketertelusuran recall | Gunakan **Nomor Batch** (atau **Nomor Bets** di produksi) |
| **Expiry Date (ED) / Shelf Life** | Tanggal Kedaluwarsa / Umur Simpan | Batas waktu aman penggunaan alkes | Gunakan **Tanggal Kedaluwarsa (ED)** dan **Umur Simpan** |
| **Available Stock** | `AVAILABLE` — Bebas Dialokasikan FEFO | Stok sehat yang boleh dipesan dan dikirim | Gunakan **Stok Bebas FEFO (`AVAILABLE`)** |
| **Reserved Stock** | `RESERVED` — Terkunci Pesanan Aktif | Unit yang sudah dialokasikan untuk Sales Order | Gunakan **Stok Terkunci Pesanan (`RESERVED`)** |
| **Quarantine Stock** | `QUARANTINE` — Isolasi Mutu / Recall | Stok tertahan menunggu rilis QA/PJT; terblokir dari FEFO | Gunakan **Karantina (`QUARANTINE`)** |
| **Damaged / Bad Stock** | `DAMAGED` — Rusak (`Bad Stock`) | Barang cacat fisik yang dipisahkan di gudang khusus | Gunakan **Barang Rusak (`DAMAGED`)** |
| **Expired Lock** | `EXPIRED_LOCK` — Terkunci Batas ED | Kunci otomatis sistem bila sisa umur simpan melewati ambang | Gunakan **Kunci Kedaluwarsa (`EXPIRED_LOCK`)** |
| **Multi-Warehouse & Bin Location** | Multi-Gudang & Lokasi Bin / Rak (`Aisle-Row-Shelf-Bin`) | Struktur fisik `Lorong-Baris-Rak-Laci` | Gunakan **Lokasi Bin / Rak** |
| **Directed Put-Away** | Penempatan Terarah | Penentuan bin otomatis berdasarkan kategori, suhu, steril, dan recall | Gunakan **Penempatan Terarah (Directed Put-Away)** |
| **Inbound (Receiving / GRN)** | Penerimaan Barang Masuk (`Inbound` / BTB) | Pencocokan PO, inspeksi QC masuk, uji fungsi, dan label | Gunakan **Penerimaan Barang (Inbound)** |
| **PO Matching** | Pencocokan Surat Pesanan Pembelian (PO) | Validasi kesesuaian fisik vs dokumen PO | Gunakan **Pencocokan PO** |
| **Outbound (Picking & Packing)** | Pengiriman Keluar (`Outbound` — Pengambilan & Pengemasan) | Penyusunan rute picking, packing, dan penerbitan Surat Jalan | Gunakan **Pengiriman Keluar (Outbound)** |
| **Picking Route** | Rute Pengambilan (`Picking`) | Urutan kunjungan bin berdasarkan jarak dari dock | Gunakan **Rute Pengambilan (Picking)** |
| **Delivery Order (DO) / Manifest** | Surat Jalan / Manifes Pengiriman | Dokumen resmi pengantaran barang ke fasyankes | Wajib gunakan **Surat Jalan** |
| **3PL (Third-Party Logistics)** | Ekspedisi Pihak Ketiga (`3PL Ekspedisi`) | Jasa angkut luar selain armada internal | Gunakan **Ekspedisi Pihak Ketiga (3PL)** |
| **Stock Opname / Cycle Count** | Hitung Fisik / Pencacahan Berkala (`Cycle Count`) | Audit kesesuaian stok fisik vs sistem | Gunakan **Stok Opname & Hitung Berkala (Cycle Count)** |
| **Blind Count vs Open Count** | Hitung Buta vs Hitung Terbuka | `Blind Count` menyembunyikan qty sistem agar penghitungan objektif | Gunakan **Hitung Buta (Blind Count)** dalam SOP Opname |
| **Min-Max & Reorder Point (ROP)** | Stok Minimum-Maksimum & Titik Pemesanan Ulang (**ROP**) | Rumus pemicu pengadaan sebelum stockout | Gunakan **Titik Pemesanan Ulang (ROP)** |
| **Safety Stock & Lead Time** | Stok Pengaman & Waktu Tunggu Pemasok | Penyangga keterlambatan pengiriman prinsipal | Gunakan **Stok Pengaman** dan **Waktu Tunggu (Lead Time)** |
| **Stockout / Overstock** | Kekosongan Stok / Kelebihan Stok | Risiko kekurangan pasokan vs penumpukan stok lambat | Gunakan **Kekosongan Stok (Stockout)** / **Kelebihan Stok** |
| **Write-Off / Disposal** | Penghapusbukuan / Pemusnahan Barang | Pengeluaran permanen stok kedaluwarsa/rusak berita acara | Gunakan **Pemusnahan & Penghapusbukuan** |
| **Pest Control** | Pengendalian Hama & Sanitasi Ruang | Inspeksi perangkap umpan, fogging, lampu UV | Wajib gunakan **Pengendalian Hama** |
| **RFID Gate / Handheld PDA** | Gerbang RFID / Pemindai Genggam PDA | Perangkat validasi bin, batch, dan zona suhu (`USB/Serial`, `MQTT`) | Gunakan **Pemindai Genggam PDA** & **Gerbang RFID** |
| **LKPP e-Katalog Webhook** | Sinkronisasi Stok e-Katalog LKPP | Pelaporan ketersediaan stok ke sistem pengadaan pemerintah | Gunakan **Sinkronisasi e-Katalog LKPP** |
| **HL7 FHIR SATUSEHAT (SupplyDelivery)** | Kiriman Logistik SATUSEHAT Kemenkes (`HL7 FHIR`) | Standar pertukaran data distribusi nasional Kemenkes | Pertahankan **HL7 FHIR SATUSEHAT** |

---

## 3. Komersial, Penjualan, Tender, CRM & Pemasaran

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Customer Relationship Management (CRM)** | Manajemen Hubungan Pelanggan (**CRM**) | Pengelolaan profil fasyankes, prospek, dan kredit | Gunakan **CRM / Profil Pelanggan B2B** |
| **Lead & Opportunity Pipeline** | Prospek & Jalur Peluang Penjualan | Pelacakan tahap penjualan dari perkenalan hingga menang | Gunakan **Prospek & Pipeline Penjualan** |
| **Cold Call / Referral** | Panggilan Prospek Baru / Rujukan | Sumber awal masuknya prospek fasyankes | Gunakan **Kontak Langsung / Rujukan** |
| **Credit Limit & Exposure** | Pagu / Batas Kredit & Paparan Piutang | Pengendalian piutang pelanggan sebelum Sales Order disetujui | Gunakan **Batas Kredit (Credit Limit)** |
| **Terms of Payment (TOP)** | Syarat / Termin Pembayaran (`TOP 30/45/60 Hari`) | Batas waktu pelunasan faktur fasyankes | Gunakan **Termin Pembayaran (TOP)** |
| **Quotation** | **Surat Penawaran Harga (SPH / Quotation)** | Dokumen penawaran resmi bernomor, berstempel, dan ber-NIE | Wajib gunakan **Surat Penawaran Harga (Quotation)** |
| **Sales Order (SO)** | Surat Pesanan Penjualan (`Sales Order`) | Pesanan pelanggan tervalidasi NIE, izin fasyankes, kredit & FEFO | Gunakan **Pesanan Penjualan (Sales Order)** |
| **Pre-Order (Mobile Order Taking)** | Pra-Order Lapangan (`Pre-Order MedRep`) | Pesanan awal dari tenaga pemasaran sebelum konversi SO | Gunakan **Pra-Order** |
| **Purchase Order (PO)** | Surat Pesanan Pembelian (**PO**) | Dokumen pembelian ke pabrikan/prinsipal/distributor | Gunakan **Pesanan Pembelian (PO)** |
| **LPSE / E-Purchasing / e-Katalog** | Layanan Pengadaan Secara Elektronik / Pembelian Elektronik | Kanal pengadaan resmi pemerintah & rumah sakit publik | Pertahankan akronim resmi **LPSE / e-Katalog LKPP** |
| **Owner Estimate (HPS)** | Harga Perkiraan Sendiri (**HPS**) | Pagu maksimum penawaran paket tender pemerintah | Wajib gunakan **HPS (Harga Perkiraan Sendiri)** |
| **Medical Representative (MedRep)** | Perwakilan Medis / Tenaga Pemasaran Alkes (**MedRep**) | Staf lapangan kunjungan ke dokter/pengadaan RS | Gunakan **Tenaga Pemasaran (MedRep)** |
| **Visit Planner & Geo-Tagging** | Rencana Kunjungan & Penandaan Lokasi GPS | Validasi kehadiran kunjungan di dalam radius geofence RS | Gunakan **Rencana Kunjungan & Geotag GPS** |
| **Geofencing** | Pagar Geografis (`Geofence`) | Batas radius koordinat GPS lokasi fasyankes/pabrik | Gunakan **Batas Radius GPS (Geofencing)** |
| **Multi-Level Pricing & Tiered Discount** | Skema Harga Bertingkat & Diskon Kuantitas | Perbedaan harga Eceran, Institusi, Distributor & potongan volume | Gunakan **Skema Harga Bertingkat** |
| **Price Lock Contract** | Kontrak Penguncian Harga | Kesepakatan harga tetap hasil tender dalam periode tertentu | Gunakan **Kontrak Penguncian Harga** |
| **Return on Investment (ROI)** | Imbal Hasil Investasi (**ROI**) | Perbandingan nilai konversi vs biaya kampanye/pameran | Gunakan **ROI (Imbal Hasil)** |
| **Sample & Demo Unit** | Unit Contoh & Unit Demo Pinjaman | Pemantauan alat yang dipinjamkan ke RS beserta Berita Acara | Gunakan **Unit Demo** |
| **Rebate / Loyalty Program** | Program Rabat / Insentif Volume Mitra | Potongan/bonus berbasis pencapaian target unit periode | Gunakan **Program Rabat (Rebate)** |
| **Demand Forecasting** | Peramalan Permintaan | Proyeksi kebutuhan unit berdasarkan riwayat penjualan bulanan | Gunakan **Peramalan Permintaan** |
| **Sales Territory / Rayon** | Wilayah Penjualan / Rayon Distribusi | Pembagian area kerja provinsi tanpa tumpang tindih | Gunakan **Rayon Distribusi / Wilayah Penjualan** |
| **Promotional Ethics Verification** | Verifikasi Etika Promosi Alkes | Pengawasan PJT agar iklan/brosur/kontrak tidak melanggar klaim NIE | Wajib gunakan **Verifikasi Etika Promosi PJT** |
| **Mailing List / Newsletter** | Daftar Surat / Buletin Elektronik | Modul pengiriman buletin informasi produk ke pelanggan | Gunakan **Daftar Surat & Buletin** |
| **Subscriber** | Pelanggan Surat (`Subscriber`) | Kontak penerima email berstatus `Enabled`, `Unsubscribed`, `Blocked`, `Imported` | Gunakan **Pelanggan Surat (Subscriber)** |
| **Single / Double Opt-In** | Persetujuan Langganan Tunggal / Ganda (`Opt-In`) | Mekanisme kepatuhan persetujuan kirim surel (UU PDP & RFC 8058) | Gunakan **Persetujuan Langganan (`Opt-In`)** |
| **Bounce / Blocklist** | Surel Mental (`Bounce`) / Daftar Blokir (`Blocklist`) | Penanganan otomatis alamat gagal kirim berturut-turut | Gunakan **Daftar Blokir (Blocklist)** |
| **Transactional Email** | Pesan Surel Transaksional | Pengiriman satu penerima (notifikasi dokumen, tanpa statistik blast) | Gunakan **Surel Transaksional** |

---

## 4. Manufaktur / Produksi (CPAKB) & Layanan Purna Jual

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Batch Manufacturing Record (BMR)** | Catatan Pengolahan Bets (**BMR**) | Dokumen produksi wajib tiap batch dari penimbangan hingga rilis QC | Pertahankan **BMR (Catatan Bets Produksi)** |
| **Cleanroom (Class C / D)** | Ruang Bersih (`Cleanroom Kelas C/D`) | Area manufaktur terkendali partikel dan mikroba sesuai CPAKB | Gunakan **Ruang Bersih (Cleanroom)** |
| **Production Yield** | Rendemen / Realisasi Hasil Produksi (`Yield`) | Perbandingan jumlah realisasi vs rencana pada BMR | Gunakan **Realisasi Hasil (Yield)** |
| **Primary Packaging & Sterilization** | Pengemasan Primer & Sterilisasi | Tahap proses produksi alkes steril sebelum rilis QC | Gunakan **Pengemasan Primer & Sterilisasi** |
| **Sanitation Log** | Catatan Sanitasi Area Produksi | Bukti kebersihan ruang bersih sebelum/sesudah produksi | Gunakan **Catatan Sanitasi** |
| **After-Sales Service** | Layanan Purna Jual & Teknis | Dukungan instalasi, kalibrasi, pemeliharaan, dan perbaikan | Gunakan **Layanan Purna Jual** |
| **Installation & Commissioning** | Instalasi & Uji Fungsi Klinis | Pemasangan alat di RS dan verifikasi parameter sebelum serah terima | Gunakan **Instalasi & Uji Fungsi** |
| **Preventive Maintenance (PM)** | Pemeliharaan Preventif / Berkala | Jadwal perawatan rutin alat terpasang untuk mencegah kerusakan | Gunakan **Pemeliharaan Preventif** |
| **Calibration Certificate** | Sertifikat Kalibrasi (**BPFK** / Terakreditasi) | Sertifikat keabsahan pengukuran alat elektromedik | Wajib gunakan **Sertifikat Kalibrasi** |
| **Troubleshooting / Repair** | Perbaikan Kerusakan | Penanganan keluhan teknis alat di lapangan | Gunakan **Perbaikan Kerusakan** |
| **Spare Parts** | Suku Cadang | Komponen pengganti pada servis alat elektromedik | Gunakan **Suku Cadang** |
| **Serial Number (SN)** | Nomor Seri (`SN`) | Identitas unik per unit alat kesehatan elektromedik (Jalur B) | Gunakan **Nomor Seri** |
| **Warranty / Installed Base** | Garansi & Basis Alat Terpasang | Pelacakan masa garansi dan lokasi RS tempat alat beroperasi | Gunakan **Garansi & Basis Terpasang** |
| **Decommissioning** | Penghentian Operasi / Afkir Alat | Tahap akhir siklus hidup alat berat di fasyankes | Gunakan **Penghentian Operasi (Decommissioning)** |

---

## 5. Pengawasan Pasca-Pemasaran (PMS & Vigilance)

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Post-Market Surveillance (PMS)** | Pengawasan Pasca-Pemasaran (**PMS**) | Pemantauan keamanan, mutu, dan performa alkes setelah beredar | Gunakan **Pengawasan Pasca-Pemasaran (PMS)** |
| **Vigilance** | Kewaspadaan / Surveilans Keamanan Alkes | Sistem pelaporan insiden serius alat kesehatan | Gunakan **Kewaspadaan Keamanan (Vigilance)** |
| **Adverse Event (AE)** | **Kejadian Tidak Diinginkan (KTD)** | Insiden kematian, cedera serius/ringan, atau malfungsi alat | Wajib gunakan **KTD (Kejadian Tidak Diinginkan)** |
| **e-Watch Alkes** | Sistem Pelaporan **e-Watch Alkes Kemenkes** | Kanal pelaporan wajib KTD kepada Kementerian Kesehatan RI | Pertahankan **e-Watch Alkes Kemenkes** |
| **Field Safety Corrective Action (FSCA)** | Tindakan Korektif Keselamatan Lapangan (**FSCA**) | Peringatan keselamatan (*Field Safety Notice*) atau rekomendasi recall | Gunakan **FSCA / Peringatan Keselamatan Lapangan** |
| **Product Recall (Class I / II / III)** | **Penarikan Produk (Recall)** Kelas I / II / III | Penarikan paksa/sukarela batch cacat atau berisiko medis dari pasar | Gunakan **Penarikan Produk (Recall) Kelas I/II/III** |
| **Malfunction Without Injury** | Malfungsi Tanpa Cedera | Kategori dampak KTD saat alat gagal fungsi tanpa melukai pasien | Gunakan **Malfungsi Tanpa Cedera** |

---

## 6. Keuangan, Akuntansi & Perpajakan Alat Kesehatan

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Double-Entry Bookkeeping** | Pembukuan Berpasangan / Dua-Entry | Setiap transaksi memiliki pasangan Debet & Kredit yang seimbang bulat | Gunakan **Pembukuan Berpasangan (Double-Entry)** |
| **Chart of Accounts (CoA)** | Bagan Akun (**CoA**) | Daftar kode akun Aset, Kewajiban, Ekuitas, Pendapatan, Beban | Gunakan **Bagan Akun (CoA)** |
| **Journal Entry (Draft / Posted / Void)** | Jurnal Umum (`Draft` / `Posted` / `Void`) | Pencatatan buku besar; jurnal `Posted` tidak dapat diedit/dihapus | Gunakan **Jurnal Umum** dengan status sistem `Draft`/`Posted`/`Void` |
| **Reversing Entry** | **Jurnal Pembalik** | Mekanisme pembatalan/koreksi atas jurnal yang sudah `Posted` | Wajib gunakan **Jurnal Pembalik** |
| **Cost Center** | Pusat Biaya (`PB-MFG`, `PB-DIST`, `PB-REG`, `PB-QA`, dll.) | Penandaan alokasi beban per divisi | Gunakan **Pusat Biaya** |
| **Cost of Goods Sold (COGS)** | **Harga Pokok Penjualan (HPP)** | Biaya perolehan barang terjual (FIFO atau Rata-rata Tertimbang) | Wajib gunakan **HPP (Harga Pokok Penjualan)** |
| **Batch Valuation** | Valuasi Persediaan per Batch | Penetapan nilai pokok rupiah per batch stok alkes | Gunakan **Valuasi Batch** |
| **FIFO vs Weighted Average** | Masuk Pertama Keluar Pertama (**FIFO**) vs **Rata-rata Tertimbang** | Metode akuntansi biaya persediaan (berbeda dengan urutan fisik FEFO) | Gunakan **FIFO (Biaya)** dan **Rata-rata Tertimbang** |
| **Impairment Allowance / Contra Account** | Cadangan Penurunan Nilai Persediaan (Akun Kontra) | Pengakuan potensi rugi stok karantina/rusak sebelum pemusnahan | Gunakan **Cadangan Penurunan Nilai** |
| **Inventory Write-Off** | Penghapusbukuan Persediaan (`Write-Off`) | Pengakuan beban kerugian permanen atas stok kedaluwarsa/dimusnahkan | Gunakan **Penghapusbukuan (Write-Off)** |
| **Landed Cost (FOB, CIF, Freight, Duty)** | Biaya Perolehan Impor (`Landed Cost`) | Kapitalisasi harga barang CIF + bea masuk + angkut ke persediaan | Gunakan **Biaya Perolehan Impor (Landed Cost)** |
| **Import Declaration (PIB / API)** | Pemberitahuan Impor Barang (**PIB**) / Angka Pengenal Importir (**API**) | Dasar pengkreditan PPh 22 Impor (2,5% dengan API vs 7,5% tanpa API) | Wajib gunakan **PIB** dan **API** |
| **Balance Sheet** | **Neraca** (Laporan Posisi Keuangan) | Laporan Aset = Kewajiban + Ekuitas | Wajib gunakan **Neraca** |
| **Profit & Loss Statement (P&L)** | **Laporan Laba Rugi** | Laporan Pendapatan dikurangi HPP dan Beban | Wajib gunakan **Laporan Laba Rugi** |
| **Accounts Receivable (AR) / Payable (AP)** | Piutang Dagang / Hutang Usaha | Tagihan ke fasyankes dan kewajiban ke pemasok | Gunakan **Piutang Dagang** dan **Hutang Usaha** |
| **Tax Base (DPP)** | Dasar Pengenaan Pajak (**DPP**) | Nilai transaksi sebelum pajak pertambahan nilai | Gunakan **DPP (Dasar Pengenaan Pajak)** |
| **Value Added Tax (VAT — Output / Input)** | **PPN Keluaran** & **PPN Masukan** (11%) | Pajak pertambahan nilai penjualan dan kredit pajak pembelian/impor | Wajib gunakan **PPN Keluaran** & **PPN Masukan** |
| **Withholding Tax (Art. 21 / 22 / 23)** | **PPh 21**, **PPh 22 Impor**, **PPh 23 Jasa** | Pajak penghasilan karyawan, impor alkes, dan jasa kalibrasi/audit | Wajib gunakan **PPh 21 / PPh 22 / PPh 23** |
| **e-Faktur / Coretax** | Faktur Pajak Elektronik (`e-Faktur` / Coretax DJP) | Pelaporan faktur pajak keluaran & masukan resmi | Pertahankan **e-Faktur / Coretax** |
| **Accounting Period (Open / Locked / Closed)** | Periode Buku (`Terbuka` / `Dikunci` / `Ditutup`) | Pengendalian tutup buku bulanan sebelum tutup tahun | Gunakan **Periode Buku (`Terbuka`/`Dikunci`/`Ditutup`)** |
| **Dummy Valuation vs Actual Data** | Data Simulasi/Benih (`DUMMY`) vs Data Aktual (`ASLI`) | Pemisahan tegas taksiran manajemen dari biaya PO/BMR resmi | Gunakan **Data Benih (`DUMMY`)** dan **Data Aktual (`ASLI`)** |

---

## 7. Sumber Daya Manusia (HRIS), Kompetensi & K3 / HSE

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Human Resource Information System (HRIS)** | Sistem Informasi SDM (**HRIS**) | Pengelolaan personel inti, absensi, penggajian, rekrutmen, KPI, dan K3 | Gunakan **HRIS (Manajemen SDM)** |
| **Core HR & Job Grading** | Data Induk Karyawan & Tingkat Jabatan (`Grading`) | Master pegawai, mutasi, status Tetap / Kontrak (**PKWT**) / Outsourcing | Gunakan **Data Induk Karyawan & Grading** |
| **Time & Attendance / Shift** | Waktu Kerja, Kehadiran & Jadwal Shift | Log absensi `Fingerprint`, `Face Recognition`, GPS mobile, dan lembur | Gunakan **Kehadiran & Jadwal Shift** |
| **Overtime** | **Lembur** | Jam kerja tambahan berbayar yang memerlukan persetujuan atasan | Wajib gunakan **Lembur** |
| **Payroll & Payslip** | Penggajian (`Payroll`) & **Slip Gaji** | Perhitungan gaji bulanan, tunjangan, potongan, BPJS, dan PPh 21 | Gunakan **Penggajian (Payroll)** dan **Slip Gaji** |
| **Gross / Gross Up / Net (PPh 21)** | Metode Pajak `Gross` / `Gross Up` / `Net` | Ditanggung karyawan (`Gross`), ditunjang pajak (`Gross Up`), ditanggung perusahaan (`Net`) | Pertahankan **`Gross` / `Gross Up` / `Net`** di dokumen HR & Finance |
| **Take Home Pay (THP)** | Gaji Bersih Diterima (`Take Home Pay`) | Total penghasilan setelah seluruh potongan BPJS & PPh 21 | Gunakan **Gaji Bersih (`Take Home Pay`)** |
| **Piece-Rate Incentive** | Insentif Berbasis Output Unit (`Piece-Rate`) | Insentif operator produksi berdasarkan jumlah unit lolos & tingkat reject | Gunakan **Insentif Output Produksi (Piece-Rate)** |
| **Applicant Tracking System (ATS)** | Sistem Pelacakan Pelamar (**ATS**) | Rekrutmen berbasis pemindaian kata kunci CV (CDAKB, ISO 13485, STR) | Gunakan **Rekrutmen (ATS)** |
| **CV Screening / Background Check / Offering / Onboarding** | Skrining CV / Pemeriksaan Latar Belakang / Penawaran Kerja / Orientasi Masuk | Tahapan seleksi hingga kesiapan kerja karyawan baru | Gunakan **Skrining CV**, **Penawaran**, **Orientasi (`Onboarding`)** |
| **Skill Matrix** | Matriks Keterampilan / Kompetensi | Pemetaan tingkat kecakapan (`Trainee`, `Operator`, `Mahir`, `Trainer`) | Gunakan **Matriks Kompetensi (`Skill Matrix`)** |
| **STR / SIP (Practice License)** | Surat Tanda Registrasi (**STR**) / Surat Izin Praktik (**SIP**) | Lisensi profesi wajib bagi PJT Apoteker & Teknisi Elektromedik | Wajib gunakan **STR / SIP** |
| **Key Performance Indicator (KPI)** | Indikator Kinerja Utama (**KPI**) | Ukuran capaian kinerja karyawan | Gunakan **KPI (Indikator Kinerja Utama)** |
| **Balanced Scorecard (BSC)** | Kartu Skor Berimbang (`Balanced Scorecard`) | Kerangka penilaian staf kantor & penjualan | Gunakan **Balanced Scorecard** |
| **Overall Equipment Effectiveness (OEE)** | Efektivitas Peralatan Menyeluruh (**OEE**) | Skor ketersediaan × performa × kualitas lini produksi (benchmark ≥ 85%) | Pertahankan **OEE** |
| **360-Degree Feedback** | Umpan Balik 360 Derajat | Penilaian atasan, rekan sejawat, bawahan, dan diri sendiri | Gunakan **Umpan Balik 360°** |
| **Health, Safety & Environment (HSE)** | Kesehatan, Keselamatan Kerja & Lingkungan (**K3 / HSE**) | Kepatuhan UU 1/1970 & PP 50/2012 di pabrik dan gudang | Wajib gunakan **K3 (Keselamatan & Kesehatan Kerja)** |
| **Near Miss** | Hampir Celaka (`Near Miss`) | Kejadian berpotensi cedera tanpa menimbulkan korban | Gunakan **Hampir Celaka (`Near Miss`)** |
| **Lost Time Injury Frequency Rate (LTIFR)** | Angka Kekerapan Cedera Hilang Hari Kerja (**LTIFR**) | Indikator statistik keselamatan kerja berdasarkan jam kerja | Pertahankan **LTIFR** |
| **Medical Check-Up (MCU)** | Pemeriksaan Kesehatan Berkala (**MCU**) | Hasil kelaikan kerja: `Fit to Work`, `Fit with Restriction`, `Perlu Evaluasi` | Gunakan **Pemeriksaan Kesehatan (MCU)** |
| **Personal Protective Equipment (PPE)** | Alat Pelindung Diri (**APD**) | Perlengkapan keselamatan kerja berstandar SNI / EN | Wajib gunakan **APD (Alat Pelindung Diri)** |

---

## 8. Teknologi Informasi, Keamanan Akses, Integritas Data & Situs Web

| Istilah Inggris / Asing | Padanan Indonesia di Aplikasi | Konteks Regulasi & Operasional | Rekomendasi Penggunaan oleh PJT |
| :--- | :--- | :--- | :--- |
| **Traceability** | **Ketertelusuran** | Pelacakan hulu-ke-hilir dari pemasok/BMR, gudang, suhu hingga fasyankes | Wajib gunakan **Ketertelusuran (Traceability)** |
| **Audit Trail (Old Value / New Value)** | **Jejak Audit** (Nilai Lama / Nilai Baru) | Rekaman setiap perubahan data oleh pengguna beserta waktu & peran | Wajib gunakan **Jejak Audit** |
| **ALCOA+** | Prinsip Integritas Data **ALCOA+** | *Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available* | Pertahankan **ALCOA+** saat inspeksi mutu |
| **SHA-256 Hash Chain & Genesis Hash** | Rantai Hash Kriptografi SHA-256 & Hash Awal (`Genesis`) | Pengunci anti-ubah pada log pergerakan gudang dan jurnal keuangan | Gunakan **Rantai Hash SHA-256** |
| **Role-Based Access Control (RBAC)** | Kendali Akses Berbasis Peran (**RBAC**) | Pembatasan wewenang lihat/buat/ubah/setujui per peran pengguna | Gunakan **Hak Akses Berbasis Peran (RBAC)** |
| **Offline-First & Auto Sync** | Luring-Utama (`Offline-First`) & Sinkronisasi Otomatis | Penyimpanan lokal browser yang tersinkron real-time ke server via WebSocket/HTTP | Gunakan **Sinkronisasi Otomatis** |
| **Seed / Dummy Data** | Data Benih / Data Contoh (`DUMMY`) | Data awal pengujian agar simulasi dapat dijalankan sebelum operasional riil | Gunakan **Data Contoh (`DUMMY`)** |
| **Data Provenance / Origin** | Asal-Usul Data (`DUMMY` vs `USER_BARU` vs `USER_DIEDIT`) | Penanda pemisah antara data contoh bawaan dan data input pengguna | Gunakan **Asal Data** |
| **Purge Dummy Data** | Pembersihan / Hapus Data Contoh (`Purge Dummy`) | Pembersihan selektif data awal tanpa menghapus data yang diinput pengguna | Gunakan **Pembersihan Data Contoh (Purge Dummy)** |
| **Content Management System (CMS)** | Sistem Pengelola Konten Situs Web (`Website CMS`) | Pengelolaan draf & terbit profil perusahaan dan katalog publik | Gunakan **Pengelola Konten Situs Web** |
| **Draft vs Published** | Draf vs Versi Terbit (`Published`) | Pemisahan suntingan internal dari tayangan publik | Gunakan **Draf** dan **Terbit** |

---

## Ringkasan Cepat Istilah Paling Sering Ditanyakan PJT

- **Cold Chain** → **Rantai Dingin** (`2°C - 8°C`)
- **Adverse Event** → **Kejadian Tidak Diinginkan (KTD)**
- **Field Safety Corrective Action (FSCA)** → **Tindakan Korektif Keselamatan Lapangan (FSCA)**
- **Product Recall** → **Penarikan Produk (Recall)**
- **Quarantine / Hold** → **Karantina / Ditahan (`QUARANTINE`)**
- **Released** → **Lolos / Rilis Mutu (`Released`)**
- **Traceability** → **Ketertelusuran**
- **Batch Manufacturing Record (BMR)** → **Catatan Pengolahan Bets (BMR)**
- **First Expired First Out (FEFO)** → **Keluar Lebih Dulu yang Kedaluwarsa Terdekat (FEFO)**
- **Blind Count** → **Hitung Buta Opname**
- **Write-Off** → **Penghapusbukuan Persediaan**
- **Reversing Entry** → **Jurnal Pembalik**
- **Cost of Goods Sold (COGS)** → **Harga Pokok Penjualan (HPP)**
- **Audit Trail** → **Jejak Audit**
- **Personal Protective Equipment (PPE)** → **Alat Pelindung Diri (APD)**
