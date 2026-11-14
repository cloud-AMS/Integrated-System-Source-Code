# Glosarium Terminologi AMS Integrated System (Indonesia → Inggris)

**Fungsi dokumen:** referensi tunggal bagi **PJT (Penanggung Jawab Teknis)** untuk memilah istilah mana yang paling sesuai saat menstandarkan penamaan antarmuka, dokumen mutu, label, dan komunikasi resmi. Setiap istilah Indonesia yang dipakai aplikasi dipetakan ke padanan Inggris/rekomendasi beserta alternatif bila relevan.

**Cara memakai (untuk PJT):**
1. Cari istilah Indonesia pada **Bagian A (Inti Domain)** untuk istilah baku lintas modul, atau **Bagian B (Inventaris per Modul)** untuk label spesifik suatu layar.
2. Pilih padanan Inggris pada kolom rekomendasi; alternatif dalam kurung boleh dipakai bila lebih sesuai konteks regulasi/dokumen.
3. Pertahankan akronim teknis (FEFO, SKU, CAPA, CoA, KPI, dll.) sebagaimana dipakai di kode; jangan menerjemahkan akronim secara harfiah.
4. Bila satu konsep punya beberapa varian label di UI (mis. "Karantina", "Di Ruang Karantina", "Karantina (Hold)"), pilih **satu** bentuk baku dari Bagian A dan seragamkan varian lain ke bentuk itu.
5. Istilah yang sudah berbahasa Inggris di UI dicatat terpisah di tiap modul ("Istilah Inggris yang dipertahankan di UI") — tidak perlu di-Indonesiakan ulang.

**Metode & cakupan:** inventaris diekstrak programatik dari seluruh string UI pada `src/` (88 berkas `.ts`/`.tsx`: komponen modul, dashboard, layout, UI primitives, PWA, types, utils, services), lalu diterjemahkan per modul. Noise non-UI (nama orang/alamat, kelas CSS, fragmen kode, kode murni, prosa >6 kata) dilewati dan dihitung. Total ±2.943 baris pemetaan Indonesia→Inggris pada Bagian B. Bagian A adalah kurasi domain inti yang menjadi acuan konsistensi.

---

## Bagian A — Inti Domain (Kurasi, acuan konsistensi)

### A.1 Regulasi & Perizinan (Regulatory Affairs)
| Indonesia | Inggris / asal |
|---|---|
| Alat Kesehatan (Alkes) | Medical Device(s) |
| Izin Edar / Nomor Izin Edar (NIE) | Marketing Authorization / Distribution License (MA No.) |
| Kelas Risiko | Risk Class |
| Elektromedik (Radiasi / Non Radiasi) | Electromedical (Radiating / Non-radiating) |
| Diagnostik In Vitro | In Vitro Diagnostic (IVD) |
| Penanggung Jawab Teknis (PJT) | Technical Responsible Person |
| Sertifikat Standar Distribusi (SDAK) | Distribution Standard Certificate |
| Izin Penyalur Alat Kesehatan (IPAK) | Medical Device Distributor License |
| Cara Distribusi Alat Kesehatan yang Baik (CDAKB) | Good Distribution Practice (GDP) |
| Cara Produksi Alat Kesehatan yang Baik (CPAKB) | Good Manufacturing Practice (GMP) |
| OSS-RBA | Online Single Submission – Risk-Based Approach |
| Fasyankes (Fasilitas Pelayanan Kesehatan) | Healthcare Facility |
| Izin Operasional Fasyankes | Healthcare Facility Operating License |
| Surat Tanda Registrasi (STR) | Registration Certificate |
| Perpanjangan | Renewal / Extension |
| Kedaluwarsa | Expiry / Expired |
| Tanggal Terbit / Berlaku / Habis | Issue / Effective / Expiry Date |
| Penerbit / Lingkup | Issuer / Scope |

### A.2 Mutu — QA & QC (Quality)
| Indonesia | Inggris / asal |
|---|---|
| Dokumen Mutu | Quality Document |
| Pedoman Mutu | Quality Manual |
| Instruksi Kerja | Work Instruction |
| Formulir | Form |
| Revisi / Usang | Revision / Obsolete |
| Penyusun / Penyetujui | Preparer / Approver |
| Tinjau Ulang | Review |
| Tindakan Korektif / Preventif | Corrective / Preventive Action (CAPA) |
| Akar Penyebab | Root Cause |
| Ketidaksesuaian | Nonconformity (NC) |
| Temuan (Major/Minor) | Finding (Major/Minor NC) |
| OFI (Peluang Peningkatan) | Opportunity For Improvement |
| Sesuai (Compliant) | Compliant |
| Klausul / Kepatuhan | Clause / Compliance |
| Audit Internal / Tindak Lanjut | Internal Audit / Follow-up |
| Inspeksi / Inspektur | Inspection / Inspector |
| Bahan Baku Datang | Incoming Raw Material |
| Produk Jadi | Finished Goods |
| Pemeriksaan Pra-Kirim | Pre-shipment Inspection |
| Memenuhi Syarat / Tercemar | Acceptable / Contaminated |
| Lolos (Released) | Released / Pass |
| Karantina (Hold) | Quarantine / Hold |
| Tolak (Rejected) | Rejected |
| CoA | Certificate of Analysis |
| Produk Kembalian / Retur | Returned Product / Returns |
| Cacat Kemasan / Salah Kirim | Packaging Defect / Mis-shipment |
| Dimusnahkan / Layak Jual Kembali | Destroyed / Fit for Resale |
| Keluhan | Complaint |
| Penarikan Produk | Product Recall |
| Laporan KTD (Kejadian Tidak Diharapkan) | Adverse Event / Incident Report |

### A.3 Gudang & Logistik (WMS)
| Indonesia | Inggris / asal |
|---|---|
| **Rantai Dingin** | **Cold Chain** |
| Zona Suhu | Temperature Zone |
| Ruang Sejuk AC / Suhu Kamar | AC Cool Room / Room Temperature |
| Log Suhu / Kelembaban | Temperature Log / Humidity |
| Excursion (deviasi suhu) | Temperature Excursion |
| Stok Gudang / Kartu Stok | Warehouse Stock / Stock Card |
| Nomor Batch / Lot | Batch / Lot Number |
| FEFO / FIFO | First Expired First Out / First In First Out |
| SKU | Stock Keeping Unit |
| Gudang Utama / Karantina / Retur | Main / Quarantine / Returns Warehouse |
| Gudang Rusak (Bad Stock) | Damaged / Bad-Stock Warehouse |
| Lokasi Bin | Bin Location |
| Lorong / Baris / Rak / Laci | Aisle / Row / Shelf / Bin |
| Kapasitas / Terpakai | Capacity / Occupied |
| Aturan Simpan | Directed Put-away Rule |
| Terima Barang / Penerimaan | Goods Receipt / Receiving |
| Pencocokan (PO Matching) | Purchase Order Matching |
| Selisih Jumlah | Quantity Discrepancy |
| QC Masuk | Incoming QC |
| Uji Fungsi / Kalibrasi / Penyetelan | Functional Test / Calibration / Adjustment |
| Tidak Layak Pakai | Unfit for Use |
| Pengambilan (Picking) / Rute Picking | Picking / Picking Route |
| Surat Jalan | Delivery Note / Delivery Order |
| Manifes | Manifest |
| Pengangkut / Armada Internal | Carrier / Internal Fleet |
| 3PL Ekspedisi / Kargo Udara | Third-Party Logistics / Air Cargo |
| Nomor Lacak | Tracking Number |
| Dimuat / Terkirim | Loaded / Shipped |
| Opname Stok / Opname Buta | Stocktake / Cycle Count / Blind Count |
| Ambang Stok | Stock Threshold / Reorder Point |
| Jejak Pergerakan | Movement Trace |
| Kunci Stok | Stock Lock / Quarantine Hold |
| Qty Dipesan | Reserved Quantity |
| Jalur Inventaris | Inventory Track |
| Alat Habis Pakai / Alat Berat | Consumables / Capital Equipment |
| Nomor Serial / RFID Tag | Serial Number / RFID Tag |
| Hama / Bebas Hama | Pest / Pest-free |
| Perangkap Umpan / Fogging | Bait Trap / Fogging |

### A.4 Penjualan & CRM (Commercial)
| Indonesia | Inggris / asal |
|---|---|
| Penjualan / Pelanggan / Prospek | Sales / Customer / Lead |
| Teritorial Penjualan | Sales Territory |
| Tender / Kontrak Harga | Tender / Price Contract |
| Kunjungan Medrep | Medical Representative Visit |
| Pengetahuan Produk | Product Knowledge |
| Pra Order | Pre-order |
| Skema Harga | Pricing Scheme |
| Garansi Instalasi | Installation Warranty |
| Kampanye / Unit Demo | Campaign / Demo Unit |
| Program Rebate | Rebate Program |
| Penawaran | Quotation |
| Pesanan (SO) | Sales Order |
| Faktur / e-Faktur | Invoice / e-Tax Invoice |
| Piutang Dagang / Jatuh Tempo | Accounts Receivable / Due Date |
| HPP (Harga Pokok) | Cost of Goods Sold |
| Instalasi / Pemeliharaan | Installation / Maintenance |
| Kalibrasi Berkala | Periodic Calibration |
| Siklus Hidup / Terinstalasi | Lifecycle / Installed |

### A.5 Pembelian & Pengadaan (Procurement)
| Indonesia | Inggris / asal |
|---|---|
| Pemasok | Supplier / Vendor |
| Pengadaan / Pembelian | Procurement / Purchasing |
| Suku Cadang / Bahan Baku | Spare Parts / Raw Material |
| LKPP | National Public Procurement Agency |
| Paket LKPP / Sinkronisasi | Procurement Package / Sync |

### A.6 HRIS / SDM
| Indonesia | Inggris / asal |
|---|---|
| Karyawan / Pelatihan | Employee / Training |
| Grading Jabatan | Job Grading |
| Riwayat Mutasi | Transfer History |
| Jadwal Shift / Absensi / Lembur | Shift Schedule / Attendance / Overtime |
| Slip Gaji | Payslip |
| Kandidat ATS | Applicant (Applicant Tracking System) |
| Umpan Balik 360 | 360-degree Feedback |
| Insiden K3 (Keselamatan & Kesehatan Kerja) | OHS Incident |
| Rekam MCU | Medical Check-Up Record |
| Distribusi APD (Alat Pelindung Diri) | PPE Distribution |
| Sertifikasi Pegawai / Kompetensi | Employee Certification / Competence |
| Bruto / Beban Perusahaan | Gross / Employer Cost |

### A.7 Keuangan & Akuntansi
| Indonesia | Inggris / asal |
|---|---|
| COA (Bagan Akun) | Chart of Accounts |
| Jurnal Keuangan / Jurnal Pembalik | Journal Entry / Reversing Journal |
| Periode Buku | Accounting Period |
| Tetapan Pajak / Valuasi Batch | Tax Assessment / Batch Valuation |
| Aset / Kewajiban / Ekuitas | Assets / Liabilities / Equity |
| Pendapatan / Beban | Revenue / Expenses |
| Aset Lancar | Current Assets |
| Utang Dagang | Accounts Payable |
| Saldo Normal / Debet | Normal Balance / Debit |
| Pembukuan dua-entry | Double-entry Bookkeeping |

### A.8 Integrasi, IT & Umum
| Indonesia | Inggris / asal |
|---|---|
| SatuSehat / Kiriman SatuSehat | National health interoperability (FHIR) / Submission |
| Jejak Audit | Audit Trail |
| Ketertelusuran / Ketelusuran | Traceability |
| Peran / Hak Akses / Pengguna / Akun | Role / Permission / User / Account |
| Nama Pengguna / Kata Sandi | Username / Password |
| Masuk / Keluar / Dasbor | Login / Logout / Dashboard |
| Data Dummy / Benih | Dummy Data / Seed |
| Sumber Data (provenance) | Data Provenance |
| Templat / Langganan | Template / Subscriber |
| Pesan Transaksional / Daftar Surat | Transactional Message / Mailing List |
| Unggah / Unduh / Cetak | Upload / Download / Print |
| Ekspor / Impor / Segarkan | Export / Import / Refresh |
| Tambah / Ubah / Hapus / Simpan / Batal | Add / Edit / Delete / Save / Cancel |
| Pencarian / Saring / Urutkan | Search / Filter / Sort |

### A.9 Produksi (CPAKB)
| Indonesia | Inggris / asal |
|---|---|
| Bets Produksi | Production Batch |
| BMR | Batch Manufacturing Record |
| Manajer Produksi | Production Manager |

---

## Bagian B — Inventaris Lengkap per Modul (seluruh string UI)

Bagian ini memetakan setiap istilah Indonesia yang muncul di UI, dikelompokkan per modul. Gunakan untuk menelusuri label spesifik suatu layar; rujuk Bagian A untuk bentuk baku lintas modul.


## Modul Regulatory Affairs & Traceability


### Sumber: regulatory.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| 100% Pengesahan PJT Valid | 100% Valid PJT Approval (Technical Responsible Person) |
| Aksi | Action |
| Aktif | Active |
| Alasan Retur | Return Reason |
| Alkes Dalam Negeri | Domestic Medical Devices |
| Alkes Impor | Imported Medical Devices |
| Aman | Safe |
| Audit Internal | Internal Audit |
| Bahan Baku Datang | Incoming Raw Material |
| Barang Masuk Gudang | Warehouse Goods Receipt (Incoming Goods) |
| Batal | Cancel |
| Berkas QC Terverifikasi | Verified QC Files (Records) |
| Buat CAPA | Create CAPA |
| Buat Tindakan CAPA | Create CAPA Action |
| Cacat Kemasan | Packaging Defect |
| Cacat Kemasan Saat Pengiriman | Packaging Defect During Shipment |
| Cari alkes, nomor NIE, atau produsen... | Search medical devices, MA No. (NIE), or manufacturer... |
| Catat Inspeksi QC Baru | Record New QC Inspection |
| Catat Retur Karantina | Record Quarantine Return |
| Catatan Evaluasi Auditor | Auditor Evaluation Notes |
| Catatan Pemeriksaan Awal QA | QA Initial Check Notes (Preliminary Inspection) |
| Cetak Laporan | Print Report |
| Di Ruang Karantina | In Quarantine |
| Dokumen Sesuai | Compliant Documents |
| Dugaan Kerusakan Fungsi | Suspected Functional Damage (Failure) |
| Efektif Diverifikasi | Verified Effective (Effectiveness Verified) |
| Elektromedik Non Radiasi | Electromedical (Non-radiating) |
| Hasil Rilis QC | QC Release Results |
| Indeks Kepatuhan | Compliance Index |
| Indeks Kepatuhan ISO | ISO Compliance Index |
| Indeks Kepatuhan QC | QC Compliance Index |
| Inspeksi Kemenkes | Ministry of Health Inspection (Kemenkes) |
| Inspeksi Kemenkes RI | Ministry of Health RI Inspection (Kemenkes RI) |
| Integritas ALCOA+ Terverifikasi Digital | Digitally Verified ALCOA+ Integrity |
| Jalankan Audit Otomatis | Run Automated Audit |
| Jalankan Audit Otomatis QC | Run Automated QC Audit |
| Jelaskan ketidaksesuaian yang terjadi... | Describe the nonconformity that occurred... |
| Jml Diperiksa | Quantity Inspected (Qty Checked) |
| Judul Dokumen Mutu | Quality Document Title |
| Judul Pelaksanaan | Implementation Title |
| Jumlah | Quantity |
| Karantina | Quarantine / Hold |
| Kategori | Category |
| Kebersihan | Hygiene (Cleanliness) |
| Kedaluwarsa | Expiry / Expired |
| Kelas A | Class A |
| Kelas B | Class B |
| Kelas C | Class C |
| Kelas D | Class D |
| Kelas Risiko | Risk Class |
| Keluhan Fasyankes | Healthcare Facility Complaint (Fasyankes) |
| Kemasan Rusak | Damaged Packaging |
| Keputusan Rilis QC | QC Release Decision |
| Ketidaksesuaian Suhu | Temperature Nonconformity (Deviation) |
| Ketidaksesuaian Suhu Cold Chain | Cold Chain Temperature Nonconformity |
| Kode Dokumen | Document Code |
| Kondisi Kemasan Fisik | Physical Packaging Condition |
| Kritis | Critical |
| Label Tidak Jelas | Illegible Label (Unclear Label) |
| Lolos | Released / Pass |
| Masa Berlaku | Validity Period |
| Masa Retensi Wajib Minimum 5 Tahun | Mandatory Minimum 5-Year Retention Period |
| Masuk Karantina | Enter Quarantine (Move to Quarantine) |
| Memenuhi Syarat | Acceptable |
| Memenuhi syarat rilis CDAKB. | Meets CDAKB (GDP) release requirements. |
| Memindai Dokumen... | Scanning documents... |
| Memindai Rekaman QC... | Scanning QC records... |
| Mendekati Kedaluwarsa | Near Expiry (Approaching Expiry) |
| Mengapa masalah ini bisa terjadi... | Why could this problem occur... (Root Cause) |
| Modul Mutu | Quality Module |
| Modul Utama | Main Module |
| Nama Alat Kesehatan | Medical Device Name |
| Nama Alkes | Medical Device Name |
| Nama Produk Alkes | Medical Device Product Name |
| Negara Asal | Country of Origin |
| Nomor Batch | Batch Number |
| Nomor Izin Edar Kemenkes RI | Ministry of Health RI Marketing Authorization No. (NIE) |
| Nomor Retur | Return No. |
| Parameter Kendali ISO 13485 | ISO 13485 Control Parameters |
| Parameter Kepatuhan QC | QC Compliance Parameters |
| Parameter Uji | Test Parameters |
| Pemeriksaan Pra-Kirim | Pre-shipment Inspection |
| Penanggung Jawab | Person in Charge |
| Pendaftaran izin edar resmi Kemenkes RI | Official Ministry of Health RI Marketing Authorization Registration |
| Pengawasan Mutu | Quality Control (QC) |
| Penyelidikan | Investigation |
| Personil Terkait | Related Personnel |
| Perubahan prosedur agar tidak terulang... | Procedure change to prevent recurrence... |
| Produk Jadi Manufaktur | Manufactured Finished Goods |
| produk terdaftar | Registered Products |
| Produsen | Manufacturer |
| Revisi | Revision |
| Rincian Temuan | Finding Details |
| Rumah Sakit Rekanan | Partner Hospitals |
| Salah Kirim | Mis-shipment |
| Semua Hasil | All Results |
| Semua Klausul | All Clauses |
| Semua Klausul QC | All QC Clauses |
| Semua Status Temuan | All Finding Statuses |
| Sesuai | Compliant |
| Simpan CAPA | Save CAPA |
| Simpan Hasil QC | Save QC Results |
| Simpan Izin Edar | Save Marketing Authorization (Distribution License) |
| Standar Medis | Medical Standards |
| Status | Status |
| Status Karantina | Quarantine Status |
| Status Kesesuaian | Conformity Status (Compliance Status) |
| Status NIE | NIE Status (Marketing Authorization Status) |
| Sumber Temuan | Finding Source |
| Tahap Inspeksi | Inspection Stage |
| Tanggal Efektif | Effective Date |
| Tanggal Kedaluwarsa | Expiry Date |
| Tanggal Terbit | Issue Date |
| Target Selesai | Target Completion |
| Temuan | Finding (Major/Minor NC) |
| Temuan Mayor NC | Major NC Finding |
| Temuan Minor NC | Minor NC Finding |
| Temuan QC | QC Finding |
| Tercemar | Contaminated |
| Terverifikasi Kemenkes | Verified by Ministry of Health (Kemenkes) |
| Terverifikasi PJT | Verified by PJT (Technical Responsible Person) |
| Tindakan | Action |
| Tindakan langsung memperbaiki masalah... | Immediate action to fix the problem... |
| Tolak | Rejected |
| Tutup dialog | Close Dialog |
| Uji Format | Format Test |
| Uji Kesesuaian Dokumen Otomatis | Automated Document Conformity Test |
| Uji Validasi Format NIE Kemenkes | Ministry of Health (Kemenkes) NIE Format Validation Test |
| Unduh berkas CSV | Download CSV File |
| Unduh CSV | Download CSV |
| Unit | Unit |
| validasi server tidak tersedia | Server validation unavailable |

### Sumber: components_traceability.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Aman | Safe |
| Cetak Riwayat Batch | Print Batch History |
| Lacak Batch | Track Batch (Batch Trace) |
| Nomor Batch Tidak Ditemukan | Batch Number Not Found |
| Tutup | Close |

### Sumber: App.tsx.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Akses Modul Dibatasi | Module Access Restricted |
| Akun | Account |
| Kembali ke Modul yang Diizinkan | Back to Authorized Modules |
| Muat Data Terbaru | Load Latest Data (Refresh Data) |
| Tutup pemberitahuan | Close Notification (Dismiss Notification) |

### Istilah Inggris yang dipertahankan di UI

- 100% Attributable ALCOA+ (regulatory.txt)
- Compliant (regulatory.txt)
- Lead Auditor (regulatory.txt)
- Major NC (regulatory.txt)
- Minor NC (regulatory.txt)
- QA Team (regulatory.txt)
- QC Team (regulatory.txt)
- Promise (App.tsx.txt)

### Catatan jumlah baris / dilewati

| Berkas sumber | Baris input | Baris tabel ditulis | Istilah Inggris | Dilewati (noise) |
| --- | --- | --- | --- | --- |
| regulatory.txt | 146 | 132 | 7 | 7 |
| components_traceability.txt | 5 | 5 | 0 | 0 |
| App.tsx.txt | 7 | 5 | 1 | 1 |
| **Total** | **158** | **142** | **8** | **8** |

Rincian yang dilewati (8):
- regulatory.txt (7): `apt. Dewi Kartika, S.Si` (nama orang); `CAPA-` (kode murni/prefiks nomor); `Indonesia` (nama negara); `KEMENKES RI AKD` (kode murni/prefiks nomor izin edar); `NIE-` (kode murni/prefiks nomor); `PT Anugrahmitra Selaras` (nama perusahaan); `RET-` (kode murni/prefiks nomor retur).
- App.tsx.txt (1): `coded by Langgo Bramandityo` (nama orang/fragmen kode kredit).

Catatan aturan: placeholder kalimat ≤6 kata tetap diterjemahkan (mis. "Cari alkes, nomor NIE, atau produsen...", "Masa Retensi Wajib Minimum 5 Tahun"); hanya placeholder >6 kata yang dilewati (tidak ada pada input ini). Istilah "Unit" diperlakukan sebagai istilah Indonesia (ejaan sama dengan Inggris) dan dipetakan ke "Unit" sesuai pemetaan baku Satuan = Unit.


## Modul Operations & Technical (Gudang, Produksi, Teknisi, Purchasing)


### Sumber: operations.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| 0 Penyimpangan | 0 Deviations |
| 3PL Ekspedisi | Third-Party Logistics (3PL) |
| 3PL Ekspedisi Medis | Medical Third-Party Logistics (3PL) |
| Aksi | Action |
| Aktif | Active |
| Aktifkan | Enable (Activate) |
| Aktifkan pemantauan ROP otomatis | Enable Automatic ROP (Reorder Point) Monitoring |
| Alamat Fasilitas | Facility Address |
| Alasan penempatan manual... | Manual Put-away Reason... |
| Alat Kesehatan Terpindai | Scanned Medical Device |
| Aman | Safe |
| Antre | Queued |
| Antre Picking | Picking Queue |
| Antrekan Sinkronisasi Stok e-Katalog LKPP | e-Katalog LKPP Stock Sync Queue |
| Antrekan Sinkronisasi Stok LKPP | LKPP Stock Sync Queue |
| Area Bebas Hama | Pest-free Area |
| Area Pemeriksaan | Inspection Area (Check Area) |
| Area Pemeriksaan Gudang | Warehouse Inspection Area |
| Area Perakitan Terkendali | Controlled Assembly Area |
| Armada Internal | Internal Fleet |
| Asal → Tujuan | Origin → Destination |
| Aturan Directed Put-Away | Directed Put-away Rule |
| Aturan umum | General Rules |
| Auditor Mutu Internal | Internal Quality Auditor |
| AVAILABLE — Bebas Dialokasikan FEFO | AVAILABLE — Free for FEFO Allocation |
| Bacaan Sensor Tercatat | Recorded Sensor Reading |
| Bahan Baku Steril | Sterile Raw Material |
| Bahaya | Danger (Hazard) |
| Bangun Bundle FHIR Baru | Build New FHIR Bundle |
| Bangun Bundle HL7 FHIR SATUSEHAT Logistik | Build SATUSEHAT Logistics HL7 FHIR Bundle |
| Baris | Row (Line) |
| Baris Stok Terkunci | Locked Stock Lines |
| Batal | Cancel |
| Batas Qty Manifes | Manifest Quantity Limit |
| Batch Asal | Source Batch (Origin Batch) |
| Batch Cold Chain Bebas | Free Cold Chain Batch (Unrestricted) |
| batch terdaftar | Registered Batch |
| Batch Terkunci EXPIRED_LOCK | Batch Locked (EXPIRED_LOCK) |
| Batch Tidak Sesuai PO | Batch Not Matching PO |
| Batch Tidak Terdaftar | Unregistered Batch |
| Batch Wajib Kunci Ageing | Batch Requiring Ageing Lock |
| Bebas Hama | Pest-free |
| Belum Cetak | Not Yet Printed |
| Belum Dicocokkan | Not Yet Matched |
| Belum Dihitung | Not Yet Counted |
| Belum Diuji | Not Yet Tested |
| Belum Posting | Not Yet Posted |
| Belum Terbit | Not Yet Issued |
| Belum Terkirim | Not Yet Shipped |
| Berjalan | Ongoing (In Progress) |
| Bin Tidak Sesuai Zona | Bin Not Matching Zone |
| bin tujuan belum tervalidasi | Destination Bin Not Yet Validated |
| BOLEH KONFIRMASI PESANAN | Order Confirmation Allowed |
| Buat Purchase Order Alkes Resmi | Create Official Medical Device Purchase Order |
| Buat Purchase Order Resmi | Create Official Purchase Order |
| Buat Tiket Layanan Baru | Create New Service Ticket |
| Buat Tiket Layanan Teknisi Alkes | Create Medical Device Technician Service Ticket |
| Buka Batch Produksi | Open Production Batch |
| Buka CAPA Suhu | Open Temperature CAPA |
| Buka Lembar Opname | Open Stocktake Sheet |
| Buka Lokasi Bin | Open Bin Location |
| Buka Opname | Open Stocktake |
| Buka Siklus Cycle Counting Baru | Open New Cycle Counting Cycle |
| CAPA Suhu Terbuka | Open Temperature CAPA |
| Catat +5 Unit Masuk Karantina | Record +5 Units into Quarantine |
| Catat Inspeksi Hama | Record Pest Inspection |
| Catat Log Suhu Manual | Record Manual Temperature Log |
| Catat Penerimaan PO | Record PO Goods Receipt |
| Catatan Perbaikan untuk Audit Trail | Repair Note for Audit Trail |
| Catatan Serah Terima | Handover Note |
| Cetak SJ | Print Delivery Note (SJ) |
| Cleanroom Kelas C | Cleanroom Class C |
| Cleanroom Kelas D | Cleanroom Class D |
| Cocok | Matched |
| Daftar Lembar Cycle Count | Cycle Count Sheet List |
| Dalam Perbaikan | Under Repair |
| Deskripsi Penyimpangan Suhu | Temperature Deviation Description |
| Di Gudang | In Warehouse |
| Di Ruang Karantina | In Quarantine |
| Diagnostik In Vitro | In Vitro Diagnostic (IVD) |
| Diajukan | Submitted |
| Dikembalikan ke Pabrik | Returned to Manufacturer (Factory) |
| Dimuat | Loaded |
| Dimusnahkan | Destroyed |
| Distributor Tunggal | Sole Distributor |
| Ditarik mengikuti edaran Recall Tab 11 | Recalled per Recall Circular (Tab 11) |
| Ditemukan Indikasi | Indication Found |
| Diterima Penerima | Received by Recipient |
| Ditolak | Rejected |
| Ditolak Penerimaan | Rejected at Receiving |
| Ditutup | Closed |
| e-Faktur Terbit Sinkron Keuangan | e-Tax Invoice Issued & Synced to Finance |
| Edaran Recall Aktif | Active Recall Notice (Circular) |
| Eksekusi | Execute (Execution) |
| Eksekusi Gudang | Warehouse Execution |
| Elektromedik Non Radiasi | Electromedical (Non-radiating) |
| Elektromedik Radiasi | Electromedical (Radiating) |
| Endpoint HL7 FHIR SATUSEHAT Logistik | SATUSEHAT Logistics HL7 FHIR Endpoint |
| Endpoint Webhook Stok e-Katalog LKPP | e-Katalog LKPP Stock Webhook Endpoint |
| Episode Excursion Suhu | Temperature Excursion Episode |
| Estimasi Durasi | Estimated Duration |
| Estimasi Habis | Estimated Depletion (Stock-out) |
| Estimasi Tiba | Estimated Arrival (ETA) |
| Estimasi Tiba di Gudang | Estimated Arrival at Warehouse |
| Evaluasi | Evaluation |
| Evaluasi Durasi Excursion di Luar Rentang | Evaluate Out-of-Range Excursion Duration |
| EXPIRED_LOCK — Terkunci Batas ED | EXPIRED_LOCK — Locked at Expiry Date Limit |
| Fasyankes Penerima Batch Terkait | Healthcare Facility Receiving Related Batch |
| Fasyankes Terdampak | Affected Healthcare Facility |
| Fasyankes Tujuan | Destination Healthcare Facility |
| fisik · dipesan · bebas | Physical · Reserved · Free |
| Fogging Sanitasi | Sanitation Fogging |
| Gagal | Failed |
| Garansi aktif | Warranty Active |
| Garansi berakhir | Warranty Expired |
| Garansi sisa | Warranty Remaining |
| Gudang Acuan | Reference Warehouse |
| Gudang Karantina | Quarantine Warehouse |
| Gudang Retur | Returns Warehouse |
| Gudang Tujuan | Destination Warehouse |
| Gudang Utama | Main Warehouse |
| Hasil Inspeksi QC | QC Inspection Result |
| Hasil QC | QC Result |
| Hasil QC Incoming Awal | Initial Incoming QC Result |
| Hasil Temuan | Finding Results |
| Hasil Validasi | Validation Result |
| Hitung fisik... | Physical Count... |
| Identitas Unit | Unit Identity |
| Inisiasi Edaran Recall Baru | Initiate New Recall Notice |
| Inspeksi Fisik | Physical Inspection |
| Inspektur QC Gudang | Warehouse QC Inspector |
| Instalasi | Installation |
| Integritas Rantai SHA-256 | SHA-256 Chain Integrity |
| Jadwal | Schedule |
| Jadwal PM Berikutnya | Next PM (Preventive Maintenance) Schedule |
| Jadwal Produksi | Production Schedule |
| Jalur Inventaris | Inventory Track |
| Jam Sistem Hari Ini | System Time Today |
| Jenis Layanan | Service Type |
| Jenis Layanan Teknis | Technical Service Type |
| Jumlah | Quantity |
| Jumlah Bin | Number of Bins (Bin Count) |
| Jumlah Diminta | Requested Quantity |
| Jumlah Masuk | Received Quantity (Incoming Quantity) |
| Jumlah Melebihi Manifes | Quantity Exceeds Manifest |
| Jumlah Unit Beredar di Fasyankes | Units in Circulation at Healthcare Facilities |
| Kalibrasi | Calibration |
| Kalibrasi Berikutnya | Next Calibration |
| Kalibrasi Berkala | Periodic Calibration |
| Kalibrasi Berlaku | Valid Calibration (Calibration in Effect) |
| Kalibrasi Trek B | Trek B Calibration |
| Kapasitas Maksimum | Maximum Capacity |
| Karantina | Quarantine (Hold) |
| Karantina Pusat | Central Quarantine |
| Kargo Udara | Air Cargo |
| Karton Reagen Tanpa Label Master | Reagent Carton Without Master Label |
| Kategori Katalog | Catalog Category |
| Kategori Pemasok | Supplier Category |
| Kategori Produk Tersimpan | Saved Product Category |
| Kedaluwarsa | Expired (Expiry) |
| Kemasan penyok saat inspeksi dock | Dented Packaging at Dock Inspection |
| Kemenkes RI | Ministry of Health RI (Kemenkes RI) |
| Kepala Gudang | Warehouse Manager (Head of Warehouse) |
| Kepala Gudang CDAKB | CDAKB (GDP) Warehouse Manager |
| Keputusan QC Masuk | Incoming QC Decision |
| Kerusakan | Damage (Breakdown) |
| Ketidaksesuaian Suhu | Temperature Nonconformity (Temperature Deviation) |
| Khusus Alat Wajib Uji Fungsi | Only for Devices Requiring Functional Test |
| Khusus Produk Steril | Sterile Products Only |
| Kirim Usulan PO ke Purchasing | Submit PO Proposal to Purchasing |
| Klasifikasi Risiko Recall Kemenkes | Ministry of Health (Kemenkes) Recall Risk Classification |
| Klien Produksi Aktif | Active Production Client |
| Kode | Code |
| Kode Aisle-Row-Shelf-Bin + tag RFID | Aisle-Row-Shelf-Bin Code + RFID Tag |
| Kode Fasyankes SATUSEHAT | SATUSEHAT Healthcare Facility Code |
| Kode Organisasi Fasyankes Terpetakan | Mapped Healthcare Facility Organization Code |
| Kode SATUSEHAT | SATUSEHAT Code |
| Kode SKU | SKU Code |
| KONFIRMASI SALES DIBLOKIR | Sales Confirmation Blocked |
| Koordinasi Sales | Sales Coordination |
| Kritis | Critical |
| Kualifikasi Pemasok Baru | New Supplier Qualification |
| Kunci | Lock |
| Kunci QUARANTINE | QUARANTINE Lock |
| Label | Label |
| Label OK | OK Label (Pass Label) |
| Laci | Bin (Drawer) |
| Lampu UV Serangga | UV Insect Light Trap |
| Langkah 3 — Jumlah Pindai | Step 3 — Scanned Quantity |
| Layak Jual Kembali | Fit for Resale |
| Layanan Purna Jual | After-Sales Service |
| Lewat Kalibrasi | Calibration Overdue |
| Lokasi Bin | Bin Location |
| Lokasi Bin Terpetakan | Mapped Bin Location |
| Lokasi Bin Tujuan | Destination Bin Location |
| Lokasi Gudang | Warehouse Location |
| Lokasi Penyimpanan | Storage Location |
| Lokasi Sensor | Sensor Location |
| Lolos | Released (Pass) |
| Lolos Parameter Klinis | Passed Clinical Parameters |
| Lorong | Aisle |
| Manajer Manufaktur | Manufacturing Manager |
| Manufaktur CPAKB | CPAKB (GMP) Manufacturing |
| Masuk Gudang | Warehouse Entry (Inbound) |
| Masukkan ke Antrean Webhook | Add to Webhook Queue |
| Mata Rantai Pergerakan | Movement Chain Link |
| Matikan | Disable (Turn Off) |
| Max Stok Gudang | Maximum Warehouse Stock |
| Memblokir konfirmasi pesanan e-Katalog SKU terkait | Blocks Order Confirmation for Related e-Katalog SKU |
| Membutuhkan Override | Override Required |
| Memenuhi syarat legalitas Kemenkes | Meets Ministry of Health (Kemenkes) Legality Requirements |
| Menunggu Alokasi FEFO | Awaiting FEFO Allocation |
| Menunggu Jadwal | Pending Schedule |
| Menunggu Verifikasi PJT | Awaiting PJT (Technical Responsible Person) Verification |
| Metode Hitung | Counting Method |
| Metode Pengendalian | Control Method |
| Moda Pengangkut | Carrier Mode (Transport Mode) |
| Mode Operasi Gudang | Warehouse Operating Mode |
| Nama Alat Kesehatan | Medical Device Name |
| Nama Alkes | Medical Device Name |
| Nama Aturan | Rule Name |
| Nama Fasyankes Penerima | Receiving Healthcare Facility Name |
| Nama Produk Alkes | Medical Device Product Name |
| Nama Produk Terbaca | Scanned Product Name (Read) |
| Nama Unit Gudang | Warehouse Unit Name |
| Negara Asal | Country of Origin |
| Nomor | Number |
| Nomor Batch | Batch Number |
| Nomor Batch Terdampak | Affected Batch Number |
| Nomor Batch Terkait | Related Batch Number |
| Nomor BMR | BMR (Batch Manufacturing Record) Number |
| Nomor Dokumen Rujukan | Reference Document Number |
| Nomor Faktur Keuangan | Finance Invoice Number |
| Nomor Izin Edar | Marketing Authorization No. (MA No.) |
| Nomor Izin Edar Kemenkes | Ministry of Health (Kemenkes) Marketing Authorization No. (MA No.) |
| Nomor izin resmi... | Official License Number... |
| Nomor Laporan Inspeksi QC | QC Inspection Report Number |
| Nomor Paket Kontrak LKPP | LKPP Contract Package Number |
| Nomor Paket LKPP | LKPP Procurement Package Number |
| Nomor PO | PO Number |
| Nomor Serial | Serial Number |
| Nomor Tiket | Ticket Number |
| Non Elektromedik Non Steril | Non-Electromedical Non-sterile |
| Non Elektromedik Steril | Non-Electromedical Sterile |
| Non-aktif | Inactive |
| Non-rilis | Not Released (Non-release) |
| Nonaktif | Inactive |
| Nonaktifkan | Deactivate (Disable) |
| Normal | Normal |
| Okupansi Kapasitas | Capacity Occupancy |
| Okupansi Rak Gabungan | Combined Shelf Occupancy |
| Opname | Stocktake |
| Pabrikan Dalam Negeri | Domestic Manufacturer |
| Pantau Ketat | Strict Monitoring (Close Watch) |
| Parameter | Parameter |
| Pemasok Resmi | Official Supplier (Authorized Supplier) |
| Pemasok Terkualifikasi | Qualified Supplier |
| Pemasok Utama Terkualifikasi | Qualified Primary Supplier |
| Pemberitahuan Dikirim | Notification Sent |
| Pemeliharaan | Maintenance |
| Pemeliharaan kebersihan berkala sesuai SOP sanitasi. | Periodic cleaning maintenance per sanitation SOP. |
| Pemeliharaan Preventif | Preventive Maintenance |
| Pemeliharaan preventif unit serial Trek B | Preventive Maintenance for Trek B Serial Units |
| Pemicu Sinkronisasi | Sync Trigger |
| Pemindahan Rak | Shelf Transfer |
| Pemindaian Ditolak Guard | Scan Rejected by Guard |
| Pemindaian Tervalidasi | Validated Scan |
| Pemisahan zona sesuai pedoman teknis CDAKB. | Zone separation per CDAKB (GDP) technical guidelines. |
| Penanggung Jawab | Person in Charge |
| Penanggung Jawab Teknis | Technical Responsible Person (PJT) |
| Penanggung Jawab Verifikasi | Verification Person in Charge |
| Penarikan Lapangan | Field Recall (Field Withdrawal) |
| Penarikan Recall | Recall Withdrawal |
| Pencocokan PO | PO Matching |
| Penerimaan | Receiving |
| Pengemasan Primer | Primary Packaging |
| Pengendalian Hama | Pest Control |
| Penggantian umpan berkala | Periodic Bait Replacement |
| Pengiriman | Shipping (Delivery) |
| Penimbangan | Weighing |
| Penimbangan Bahan | Material Weighing |
| Perakitan | Assembly |
| Perangkap Umpan | Bait Trap |
| Perbaikan | Repair |
| Perbaikan Kerusakan | Damage Repair |
| Perhatian | Warning |
| Peringatan Suhu Rendah | Low Temperature Alert |
| Peringatan Suhu Tinggi | High Temperature Alert |
| Periode Target Penarikan | Recall Target Period |
| Perlu Pembenahan | Needs Remediation (Improvement Needed) |
| Perlu Penanganan Khusus | Special Handling Required |
| Perlu Penyetelan | Adjustment Needed |
| Perlu Pesan | Reorder Needed |
| Perlu Tindakan | Action Required |
| Perubahan Stok | Stock Change |
| Pilih Pemasok Terkualifikasi | Select Qualified Supplier |
| Pilih Produk Alkes | Select Medical Device Product |
| Pilih SKU Katalog | Select Catalog SKU |
| Pindah | Move (Transfer) |
| Pindah Rak Antar Bin | Shelf Move Between Bins |
| Pintasan | Shortcut |
| Porsi Unit Tidak Bebas | Unavailable Unit Portion (Not Free) |
| Posting idempoten sekali-jalan dengan rantai hash | One-Time Idempotent Posting with Hash Chain |
| Prefix Nomor Surat Jalan | Delivery Note Number Prefix |
| Prinsipal Luar Negeri | Overseas Principal (Foreign Principal) |
| Printer Label | Label Printer |
| Prioritas | Priority |
| Prioritas angka terkecil dieksekusi lebih dulu | Lowest priority number executed first |
| Produk | Product |
| Produk Alkes | Medical Device Product |
| Produsen | Manufacturer |
| Proses Pengerjaan | Work Process |
| Qty Diterima | Qty Received |
| Qty Ditolak | Qty Rejected |
| Qty Fisik Terhitung | Counted Physical Qty |
| Qty Sistem | System Qty |
| Qty Sistem Disembunyikan | System Qty Hidden |
| Qty Stok | Stock Qty |
| Rak | Shelf |
| Rantai Batch | Batch Chain |
| Rantai Pasok CDAKB | CDAKB (GDP) Supply Chain |
| Rantai Pasok Legal | Legal Supply Chain |
| Rekam Kejadian Pemindaian Perangkat | Record Device Scan Event |
| Rekomendasi Kepatuhan | Compliance Recommendation |
| Rekomendasi Tindakan | Recommended Action |
| Release Stok | Stock Release |
| Rentang Suhu | Temperature Range |
| RESERVED — Terkunci Pesanan Aktif | RESERVED — Locked by Active Order |
| Respons Gateway | Gateway Response |
| Retur di Ruang Karantina | Returns in Quarantine Area |
| Rilis PJT | PJT Release |
| Rilis QA | QA Release |
| Rilis QC | QC Release |
| Riwayat batch tidak ditemukan. | Batch history not found. |
| Riwayat CAPA Ketidaksesuaian Suhu | Temperature Nonconformity CAPA History |
| RS Mitra Terdampak | Affected Partner Hospital |
| Ruang Bersih | Cleanroom |
| Rute Tersusun | Composed Route (Planned Route) |
| Sales Order Menunggu FEFO | Sales Order Awaiting FEFO |
| Salin Payload JSON | Copy JSON Payload |
| Sanitasi Ruang Bersih | Cleanroom Sanitation |
| Satuan | Unit |
| Sebaran Status Stok Fisik | Physical Stock Status Distribution |
| Sedang Picking | Picking In Progress |
| Selesai | Completed |
| Selesai Packing | Packing Completed |
| Selisih | Discrepancy (Variance) |
| Selisih Diajukan | Discrepancy Submitted |
| Selisih Jumlah | Quantity Discrepancy |
| Semua | All |
| Semua Gudang | All Warehouses |
| Semua Jalur | All Tracks (All Lines) |
| Semua Layanan | All Services |
| Semua Protokol | All Protocols |
| Sensor Chiller Karantina | Quarantine Chiller Sensor |
| Sensor Gudang Bahan Non-Steril | Non-Sterile Material Warehouse Sensor |
| Sensor Ruang Alkes Elektromedik | Electromedical Device Room Sensor |
| Sesuai FEFO | FEFO Compliant (Per FEFO) |
| Sesuai SOP CPAKB | CPAKB (GMP) SOP Compliant |
| Setujui Rilis Mutu | Approve Quality Release |
| Siap Audit | Audit Ready |
| Siklus Opname Terdaftar | Registered Stocktake Cycle |
| Siklus sterilisasi terjadwal setiap pergantian shift | Sterilization cycle scheduled at every shift change |
| Simpan Aturan | Save Rule |
| Simpan Dokumen Terima | Save Receiving Document |
| Simpan Inspeksi | Save Inspection |
| Simpan ke Rak Gudang | Save to Warehouse Shelf (Put-away) |
| Simpan Keputusan QC | Save QC Decision |
| Simpan Konfigurasi | Save Configuration |
| Simpan Log Suhu | Save Temperature Log |
| Simpan Lokasi Bin | Save Bin Location |
| Simpan Parameter | Save Parameter |
| Simpan Pemasok | Save Supplier |
| Simpan Perubahan | Save Changes |
| Simpan Tiket | Save Ticket |
| Simpan Unit Gudang | Save Warehouse Unit |
| Simulator Directed Put-Away | Directed Put-away Simulator |
| Skor Kesiapan Audit CDB | CDB Audit Readiness Score |
| SKU Dipantau Min-Max | Min-Max Monitored SKU |
| Staf Pengadaan Alkes | Medical Device Procurement Staff |
| Standar | Standard |
| Status | Status |
| Status e-Faktur | e-Tax Invoice Status |
| Status Garansi | Warranty Status |
| Status Kartu | Card Status |
| Status Kemenkes | Ministry of Health (Kemenkes) Status |
| Status Pencocokan PO | PO Matching Status |
| Status ROP | ROP (Reorder Point) Status |
| Status Saat Ini | Current Status |
| Status Unit | Unit Status |
| Steril | Sterile |
| Sterilisasi | Sterilization |
| Sterilisasi Gas ETO | ETO (Ethylene Oxide) Gas Sterilization |
| Stok Bebas vs Fisik | Free vs Physical Stock |
| Stok Terkunci Karantina | Quarantine-Locked Stock |
| Sudah Diposting ke Kartu Stok | Posted to Stock Card |
| Sudah Posting | Posted |
| Sunting parameter Min-Max | Edit Min-Max Parameters |
| Susun Rute FEFO | Build FEFO Route |
| Syarat Zona Suhu Katalog Produk | Product Catalog Temperature Zone Requirement |
| Syringe Pump Presisi Tinggi AMS-SP500 | High-Precision Syringe Pump AMS-SP500 |
| Tag RFID Rak | Shelf RFID Tag |
| Tahap Awal | Initial Stage |
| Tahap Siklus Hidup | Lifecycle Stage |
| Tahapan CPAKB | CPAKB (GMP) Stages |
| Tambah Ambang SKU | Add SKU Threshold |
| Tambah Aturan | Add Rule |
| Tambah Aturan Directed Put-Away | Add Directed Put-away Rule |
| Tambah Parameter Min-Max SKU | Add SKU Min-Max Parameters |
| Tambah Stok Alkes | Add Medical Device Stock |
| Tambah Unit Gudang | Add Warehouse Unit |
| Tambah Unit Gudang Fisik | Add Physical Warehouse Unit |
| Tandai 100% Terkumpul di Karantina Pusat | Mark 100% Collected at Central Quarantine |
| Tanggal ED | Expiry Date (ED) |
| Tanggal Inspeksi | Inspection Date |
| Tanggal Instalasi | Installation Date |
| Tanggal Jadwal | Scheduled Date |
| Tanggal Mulai | Start Date |
| Tanggal Mulai Recall | Recall Start Date |
| Tanggal PO | PO Date |
| Tanpa catatan alasan kunci | Without Lock Reason Note |
| Target Jumlah Rencana | Planned Quantity Target |
| Target Selesai | Target Completion |
| Target Selesai Penarikan | Recall Target Completion |
| Teknisi Bertugas | Technician On Duty (Assigned Technician) |
| Teknisi Elektromedik | Electromedical Technician |
| Teknisi Elektromedis | Electromedical Technician |
| Terbit | Issued |
| Terbitkan CAPA | Issue CAPA |
| Terbitkan CAPA Suhu | Issue Temperature CAPA |
| Terbitkan Formulir CAPA Ketidaksesuaian Suhu | Issue Temperature Nonconformity CAPA Form |
| Terbitkan Purchase Order | Issue Purchase Order |
| Terbuka | Open |
| Terdaftar mengikuti standar isolasi ruang CDAKB. | Registered per CDAKB (GDP) room isolation standards. |
| Terhubung ke Purchase Order pengadaan | Linked to Procurement Purchase Order |
| Terjual | Sold |
| Terkirim | Shipped (Sent) |
| Terkualifikasi | Qualified |
| Terkunci | Locked |
| Terpenuhi Penuh | Fully Fulfilled |
| Terposting | Posted |
| Tersinkron | Synced |
| Tertahan | Held (On Hold) |
| Tervalidasi | Validated |
| Terverifikasi Utuh | Fully Verified (Verified Intact) |
| Tiba di Gudang | Arrived at Warehouse |
| Tidak Layak Pakai | Unfit for Use |
| Tindakan | Action |
| Tindakan Korektif Segera | Immediate Corrective Action |
| Tindakan Pengadaan | Procurement Action |
| Tindakan Preventif | Preventive Action |
| Tindakan Sanitasi | Sanitation Action |
| Tipe Ruang | Room Type |
| Tipe Sumber Daya FHIR | FHIR Resource Type |
| Tolakan OperationOutcome | OperationOutcome Rejection |
| Total Baris Batch Gudang | Total Warehouse Batch Lines |
| Total Kejadian Perangkat | Total Device Events |
| Total Nilai Transaksi | Total Transaction Value |
| Trafik Antrean MQTT | MQTT Queue Traffic |
| Tutup | Close |
| Uji Fungsi | Functional Test |
| Unit | Unit |
| Unit Dalam Recall | Units Under Recall |
| Unit Demo | Demo Unit |
| Unit Gudang | Warehouse Unit |
| Unit Gudang Aktif | Active Warehouse Unit |
| Unit Gudang Induk | Parent Warehouse Unit |
| Unit Serial Terkait | Related Serial Unit |
| Unit Terdaftar per Serial | Registered Units per Serial |
| Verifikasi Integritas Rantai | Chain Integrity Verification |
| Verifikasi Pesanan | Order Verification |
| Wajib isi alasan penempatan manual... | Manual Put-away Reason Required... |
| Wajib mencantumkan tindakan korektif sanitasi | Must Include Sanitation Corrective Action |
| Wajib terbit bila terjadi excursion kritis | Must Be Issued on Critical Excursion |
| Wajib Uji Fungsi | Functional Test Required |
| Wajib Uji Fungsi Elektromedik | Electromedical Functional Test Required |
| Zona Suhu | Temperature Zone |
| Zona Suhu Dibutuhkan | Temperature Zone Required |
| Zona Suhu Gudang | Warehouse Temperature Zone |
| Zona Suhu Standar | Standard Temperature Zone |
| Zona Suhu Wajib | Mandatory Temperature Zone |

### Istilah Inggris yang dipertahankan di UI

- Batch Recall
- Blind Count
- Box
- Bundle HL7 FHIR SATUSEHAT
- Cold Room
- Device
- Handheld PDA
- Immunization
- Kit
- Open Count
- Organization
- Patient Monitor Multi-Parameter AMS-V12 Pro
- Qty PO
- Quality Assurance
- Quality Control
- Recall
- Regulatory Affairs
- RFID Gate
- RFID Gate Dock 02
- RFID Tunnel
- RFID Tunnel Cold Room

### Catatan jumlah baris / dilewati

| Berkas sumber | Baris input | Baris tabel ditulis | Istilah Inggris | Dilewati (noise) |
| --- | --- | --- | --- | --- |
| operations.txt | 512 | 481 | 21 | 10 |
| **Total** | **512** | **481** | **21** | **10** |

Rincian yang dilewati (10):
- Kode murni / prefiks kode (5): `ALKES-`, `IVD-`, `SDAK-`, `PO-MANUAL`, `RFID-BIN-NEW01`.
- Fragmen kode / identifier PascalCase tanpa spasi (1): `SupplyDelivery` (tipe resource FHIR).
- Nama orang (1): `Dian Nugraha, A.Md.TEM`.
- Nama negara (1): `Indonesia`.
- Nama fasilitas / alamat (1): `RSUD Pasar Minggu Jakarta Selatan`.
- Nama perusahaan (1): `Shenzhen Mindray Bio-Medical Co., Ltd.` (konsisten dengan perlakuan `PT Anugrahmitra Selaras` pada g1_regulatory.md).

Catatan aturan:
- Placeholder kalimat ≤6 kata tetap diterjemahkan (mis. "Alasan penempatan manual...", "Prioritas angka terkecil dieksekusi lebih dulu", "Wajib terbit bila terjadi excursion kritis"); hanya placeholder >6 kata yang dilewati (tidak ada pada input ini).
- Istilah dengan ejaan sama dalam kedua bahasa (`Normal`, `Parameter`, `Status`, `Unit`, `Label`) diperlakukan sebagai istilah Indonesia dan dipetakan ke padanan identik, konsisten dengan perlakuan "Unit"/"Normal" pada modul lain.
- String campuran Inggris–Indonesia (mis. "AVAILABLE — Bebas Dialokasikan FEFO", "Batch Terkunci EXPIRED_LOCK", "Qty Sistem", "Release Stok") masuk tabel; kode status (`EXPIRED_LOCK`, `QUARANTINE`, `RESERVED`, `AVAILABLE`) dipertahankan verbatim.
- `Kemenkes RI` dipetakan sebagai label otoritas: Ministry of Health RI (Kemenkes RI), konsisten dengan g1_regulatory.md; `Nomor Izin Edar` mengikuti pemetaan baku Marketing Authorization (MA No.).
- Nama produk berbahasa Inggris (`Patient Monitor Multi-Parameter AMS-V12 Pro`) dipertahankan di daftar Inggris; nama produk campuran (`Syringe Pump Presisi Tinggi AMS-SP500`) diterjemahkan bagian Indonesianya dengan kode model dipertahankan.
- `Trek B` dan `CDB` dipertahankan verbatim sebagai nama jalur/label demo apa adanya di UI (tidak dikarang menjadi Track B/CDAKB).
- Varian ejaan `Teknisi Elektromedik` dan `Teknisi Elektromedis` dipetakan ke padanan yang sama (Electromedical Technician); `Nonaktif` dan `Non-aktif` keduanya Inactive.
- Tidak ada istilah yang dikarang di luar daftar input; tidak ada berkas lain yang diubah.


## Modul Commercial & Market (Sales, CRM, Quotation, Vigilance)


### Sumber: commercial.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Pada dialog cetak, pilih tujuan | In the print dialog, select destination |
| Administrator IT | IT Administrator |
| Ags | Aug (Agustus) |
| Akreditasi | Accreditation |
| Aksi | Action |
| Aksi massal dari query | Bulk action from query |
| Aktif | Active |
| aktif • Headers and footers mati. | Active • Headers and footers off. |
| Akumulasi seluruh edaran recall | Accumulation of all recall circulars |
| Alamat Kantor Utama | Head Office Address |
| Alamat Penerima | Recipient Address |
| Alat Kesehatan | Medical Device(s) |
| Alert Batas Akhir ≤ 7 Hari | Deadline alert ≤ 7 days |
| Alkes | Medical Device(s) |
| Aman | Safe |
| Ambang diskon terpakai | Applied discount threshold |
| Ambil dari Pelanggan CRM B2B | Fetch from B2B CRM customers |
| Antre pengeluaran batch tertua | Queue oldest-batch dispatch (FEFO) |
| Antrekan | Queue |
| Antrian kirim berjalan | Send queue in progress |
| Apr | Apr |
| Batal | Cancel |
| Batalkan | Cancel |
| Batalkan Pesanan | Cancel Order |
| Batas Akhir | Deadline |
| Batas Kredit | Credit Limit |
| Batch antrian | Queue batch |
| belum ada | Not yet |
| belum ada pengajuan | No submission yet |
| Belum ada produk dalam quotation ini. | No products in this quotation yet. |
| Belum ada produk dipilih | No product selected yet |
| Belum ada prospek pada tahap ini. | No leads at this stage yet. |
| belum ada realisasi | No realization yet |
| Belum check-in di lapangan | Not yet checked in on-site |
| Belum Check-in Geotag | Geotag check-in not done |
| belum check-out | Not yet checked out |
| Belum Dilaporkan | Not yet reported |
| belum diukur | Not yet measured |
| Belum Jatuh Tempo | Not yet due |
| Belum mencapai ambang | Threshold not yet reached |
| Belum Terakreditasi | Not yet accredited |
| Belum terbit | Not yet issued |
| Belum tercatat | Not yet recorded |
| Belum tercatat dari modul RA | Not yet recorded from RA (Regulatory Affairs) module |
| Bergabung | Joined (Subscribed) |
| Berhenti langganan | Unsubscribe |
| Berita Acara | Official Report (Minutes) |
| Berjalan | Running |
| Berlaku hari ini | Effective today |
| Berlaku Hingga | Valid Until |
| Biaya Lain | Other Costs |
| Blocklist hasil query | Query-result blocklist |
| Botol | Bottle |
| Bounce beruntun | Consecutive bounces |
| Buat Baru | Create New |
| Capaian Penarikan Nasional | National Recall Achievement |
| Capaian target tahunan | Annual target achievement |
| Capaian target tahunan per rayon | Annual target achievement per region |
| Cari fasyankes, alkes, atau nomor pesanan... | Search healthcare facility, medical device, or order number... |
| Cari nama alkes atau NIE... | Search medical device name or MA No. (NIE)... |
| Cari surel, nama, atau catatan... | Search email, name, or note... |
| Catat Pesanan Alkes Fasyankes | Record Healthcare Facility Medical Device Order |
| Catatan | Note |
| Cedera Ringan | Minor Injury |
| Ceritakan urutan peristiwa saat alat digunakan... | Describe the sequence of events when the device was used... |
| Check-in Di Luar Geofence | Check-in Outside Geofence |
| Check-in Kunjungan dengan Geotag | Visit Check-in with Geotag |
| Check-in Lapangan | Field Check-in |
| Clicks unik | Unique clicks |
| Daftar Periksa Regulasi | Regulatory Checklist |
| Daftarkan aset | Register asset |
| Dalam Verifikasi | Under Verification |
| Data Pesanan | Order Data |
| Dedup berbasis email unik | Deduplication based on unique email |
| Default opt-in daftar baru | Default opt-in for new lists |
| Deliverability rata-rata | Average deliverability |
| Demo Produk | Product Demo |
| dengan operator | with operator |
| Des | Dec (Desember) |
| Detail | Detail |
| Detail Dokumen Penawaran | Quotation Document Details |
| Detail Kontrak | Contract Details |
| Diajukan | Submitted |
| Dibatalkan | Cancelled |
| Diblokir | Blocked |
| Dikembalikan | Returned |
| Dikirim | Shipped |
| Dimenangkan | Won |
| Disetujui | Approved |
| Diskon | Discount |
| Diskon % | Discount % |
| Diskon Tambahan | Additional Discount |
| Diterima Fasyankes | Received by Healthcare Facility |
| Ditolak | Rejected |
| Ditutup | Closed |
| Dokter Penanggung Jawab | Responsible Physician (Person in Charge) |
| Dokumen Resmi Penawaran Harga • A4 | Official Price Quotation Document • A4 |
| Draf | Draft |
| Duplikat | Duplicate |
| Duplikat sebagai draf | Duplicate as draft |
| e-KATALOG INTERNAL E-PURCHASING | Internal E-Purchasing E-Catalog |
| e-Katalog LKPP | LKPP e-Catalog |
| Edukasi Spesialis | Specialist Education |
| Efektivitas biaya | Cost effectiveness |
| Efektivitas Biaya Kampanye | Campaign Cost Effectiveness |
| Estimasi Subtotal Baris | Estimated Line Subtotal |
| Etika Promosi | Promotion Ethics |
| Fasyankes | Healthcare Facility |
| Fasyankes dari Master Pelanggan | Healthcare Facility from Customer Master |
| Fasyankes Peminjam | Borrowing Healthcare Facility |
| Fasyankes Tujuan | Destination Healthcare Facility |
| Feb | Feb |
| Formulir quotation baru disiapkan. | New quotation form is ready. |
| Funnel Sales Order berdasarkan status pengiriman | Sales Order funnel by delivery status |
| Gagal | Failed |
| gagal membaca berkas | Failed to read file |
| Gagal menyimpan identitas quotation. | Failed to save quotation identity. |
| Hampir Tutup | Closing Soon |
| Hanya satu kampanye mengirim | Only one campaign sending |
| Hapus | Delete |
| Harga Dasar | Base Price |
| Harga Eceran | Retail Price |
| Harga eceran terdaftar | Registered retail price |
| Harga Institusi | Institution Price |
| Harga Manual | Manual Price |
| Harga Penawaran | Quotation Price |
| Harga per unit efektif | Effective price per unit |
| Harga Satuan | Unit Price |
| Harga Terkunci | Locked Price |
| Harus Kembali | Must Return |
| Hasil evaluasi pagu kredit | Credit limit evaluation result |
| Hasil pengecekan Nomor Izin Edar | Marketing Authorization No. (MA No.) check result |
| Header penghentian satu klik | One-click unsubscribe header |
| Hilang | Missing |
| Hitung Margin Paket Ini | Calculate This Package Margin |
| Identitas Kop | Letterhead Identity |
| Impor CSV | Import CSV |
| Input Manual | Manual Input |
| Input Pesanan Fasyankes Baru | New Healthcare Facility Order Input |
| Input Produk Manual | Manual Product Input |
| Input Produk Secara Manual | Input Product Manually |
| Isi dari HPS Paket Terpilih | Selected package HPS (Owner Estimate) contents |
| Item Dipesan | Ordered Item |
| Izin Operasional | Operating License |
| Jabatan | Position (Job Title) |
| Jadwalkan | Schedule |
| Jadwalkan kampanye | Schedule campaign |
| Jalankan Uji | Run Test |
| Jalur Distribusi | Distribution Channel |
| Jalur Pengadaan | Procurement Channel |
| Jam Kunjungan | Visit Time |
| Jan | Jan |
| Jarak vs Geofence | Distance vs Geofence |
| Jatuh Tempo | Due Date |
| Jatuh Tempo Piutang | Receivable Due Date |
| Jeda | Pause |
| Jejak Perubahan | Change Trace (Change History) |
| Judul Cover | Cover Title |
| Judul Utama Katalog | Catalog Main Title |
| Jul | Jul |
| Jumlah | Quantity |
| Jumlah Diminta | Requested Quantity |
| Jumlah Unit | Number of Units |
| Jun | Jun |
| Kalah | Lost |
| Kampanye | Campaign |
| Kampanye berjalan | Running campaign |
| Kampanye dibatalkan | Cancelled campaign |
| Kampanye pada daftarnya | Campaigns on its list |
| Kampanye per status | Campaigns by status |
| KAPABILITAS NASIONAL | NATIONAL CAPABILITY |
| Karantina alat, penggantian unit... | Device quarantine, unit replacement... |
| Katalog Elektronik AMS 2026 | AMS 2026 Electronic Catalog |
| KATALOG PRODUK ALAT KESEHATAN | MEDICAL DEVICE PRODUCT CATALOG |
| Kecukupan NIE | NIE (MA No.) sufficiency |
| Kegiatan | Activity |
| Kegiatan Promosi Terkelola | Managed Promotion Activity |
| Kelas C | Class C (Risk Class) |
| Kemajuan status pengiriman | Delivery status progress |
| Kematian | Death |
| Kematian Pasien | Patient Death |
| Keperluan | Purpose |
| Kesalahan kirim pada batch ini | Mis-shipment in this batch |
| Keunggulan Utama | Key Advantages |
| Kirim ke e-Watch Alkes | Send to e-Watch Alkes |
| Kirim uji | Send test |
| Kirim ulang | Resend |
| Klasifikasi Dampak | Impact Classification |
| Kode Pelanggan | Customer Code |
| Kolom | Column |
| Komponen | Component |
| Kontrak Harga Aktif | Active Price Contract |
| Kontribusi produk terhadap pendapatan | Product contribution to revenue |
| Konversi Pra-Order Menjadi Sales Order | Pre-Order to Sales Order Conversion |
| Konversi Sales Order | Sales Order Conversion |
| Koordinat Check-in | Check-in Coordinates |
| Koordinator Pemasaran | Marketing Coordinator |
| Kota Tanda Tangan | Signing City |
| Kronologi Kejadian | Event Chronology |
| Kunjungan | Visit |
| Kunjungan Lapangan Tercatat | Recorded Field Visit |
| Label Badge Atas | Top Badge Label |
| Label Biaya Tambahan | Additional Cost Label |
| Laju efektif | Effective rate |
| Lanjutkan | Continue |
| Lapor KTD e-Watch Alkes | Report KTD (Adverse Event) to e-Watch Alkes |
| Level | Level |
| Logo | Logo |
| Logo perusahaan berhasil dimuat. | Company logo loaded successfully. |
| Lolos | Released / Pass |
| Majukan Tahap | Advance Stage |
| Malfungsi Tanpa Cedera | Malfunction Without Injury |
| Manajer Pemasaran | Marketing Manager |
| Manajer Penjualan | Sales Manager |
| Mar | Mar |
| Margin Bersih | Net Margin |
| Margin bersih terhadap ambang 15% | Net margin against 15% threshold |
| Margin Kotor | Gross Margin |
| Media | Media |
| Mei | May |
| Memenuhi Etika Promosi | Meets Promotion Ethics |
| Menunggu Alokasi FEFO | Awaiting FEFO Allocation |
| Menyusun PDF… | Generating PDF… |
| Menyusun… | Generating… |
| Metode Pembayaran | Payment Method |
| Modul Komersial | Commercial Module |
| Muat | Load |
| Mulai kirim | Start sending |
| Nama Alat Kesehatan | Medical Device Name |
| Nama file | File name |
| Nama file dan URL wajib diisi. | File name and URL are required. |
| Nama Penandatangan | Signatory Name |
| Nama Perusahaan | Company Name |
| Nama Produk Alkes | Medical Device Product Name |
| Negosiasi | Negotiation |
| Negosiasi Harga | Price Negotiation |
| NIE Aktif | Active NIE (MA No.) |
| NIE Dipersyaratkan | NIE required |
| NIE Pending | Pending NIE |
| Nilai | Value |
| Nilai Baru | New Value |
| Nilai bersih | Net value |
| Nilai HPS | HPS value |
| Nilai HPS Sedang Berjalan | Running HPS value |
| Nilai Konversi | Conversion Value |
| Nilai Lama | Old Value |
| Nilai Penjualan Historis | Historical Sales Value |
| Nilai Pra-Order | Pre-Order Value |
| nilai terbuka | Open value |
| Nilai Transaksi | Transaction Value |
| No. Izin Edar | MA No. (Marketing Authorization No.) |
| Nomor Batch Alokasi FEFO | FEFO Allocation Batch Number |
| Nomor Batch FEFO | FEFO Batch Number |
| Nomor Faktur | Invoice Number |
| Nomor Izin Edar | Marketing Authorization No. (MA No.) |
| Nomor Izin Operasional | Operating License Number |
| Nomor Pengumuman | Announcement Number |
| Nomor Pesanan | Order Number |
| Nomor Pra-Order | Pre-Order Number |
| Nomor Quotation | Quotation Number |
| Nomor Unit | Unit Number |
| Non-aktif | Inactive |
| Nov | Nov |
| Okt | Oct |
| Pagu Anggaran | Budget Ceiling |
| Pagu Kredit | Credit Limit |
| Pagu Kredit vs Piutang | Credit Limit vs Receivables |
| Pagu vs Realisasi | Ceiling vs Realization |
| Paket | Package |
| Paket Pengadaan | Procurement Package |
| Paket Tender Acuan | Reference Tender Package |
| Paket Tender Dipantau | Monitored Tender Package |
| Pameran Internasional | International Exhibition |
| Panel modul | Module panel |
| Paparan Piutang Menyeluruh | Overall Receivables Exposure |
| Paripurna | Plenary |
| Pascapenjualan | After-sales |
| Pelanggan B2B Terdaftar | Registered B2B Customer |
| Pelanggan Terblokir Kredit | Credit-Blocked Customer |
| Pembaruan dokumen quotation | Quotation document update |
| Pembelian Langsung B2B | B2B Direct Purchase |
| Pembelian Langsung RS Swasta | Private Hospital Direct Purchase |
| Pemenang | Winner |
| Pemetaan ke REST API listmonk | Mapping to listmonk REST API |
| Penanggung Jawab | Person in Charge |
| Penanggung Jawab Pengadaan | Procurement Person in Charge |
| Penawaran Resmi | Official Quotation |
| Penerbitan dokumen quotation baru | New quotation document issuance |
| Penerima | Recipient |
| Penerima lolos saring | Recipients passing filter |
| Pengaturan Identitas Perusahaan pada Quotation | Company Identity Settings on Quotation |
| Pengumpulan Dokumen Tender | Tender Document Collection |
| Penjadwalan kampanye buletin | Newsletter campaign scheduling |
| Penutupan kegiatan promosi dan pencatatan realisasi | Promotion activity closure and realization recording |
| Perihal | Subject |
| Perihal Penawaran | Quotation Subject |
| Peringatan Keselamatan | Safety Alert |
| Peringkat med rep | Medical rep ranking |
| Periode | Period |
| Periode Kegiatan | Activity Period |
| Perkenalan Alat | Device Introduction |
| Perlu Persetujuan Manajemen | Management Approval Required |
| Permintaan manual dari modul | Manual request from module |
| Persen Dibayar | Percent Paid |
| Persyaratan kunci dokumen | Document locking requirements |
| Pertumbuhan langganan per bulan | Monthly subscription growth |
| Perubahan status pembayaran program rebate mitra | Partner rebate program payment status change |
| Pesanan Berjalan | Running Order |
| Pesanan Dibatalkan | Cancelled Order |
| pesanan terdaftar | Registered order |
| Pesanan Terdaftar | Registered Order |
| Pihak Pemesan | Ordering Party |
| Pilih | Select |
| Pilih Produk dari Sistem | Select Product from System |
| Pilih Produk Sistem | Select System Product |
| Pipeline Tertimbang | Weighted Pipeline |
| Piutang | Accounts Receivable |
| Piutang Berjalan | Outstanding Receivables |
| Potongan kuantitas | Quantity discount |
| Pratinjau Dokumen A4 Portrait | A4 Portrait Document Preview |
| Pratinjau token | Token preview |
| Pre-Order Menunggu Konversi | Pre-Order Awaiting Conversion |
| Prinsipal Belum Terpilih | Principal Not Yet Selected |
| Probabilitas | Probability |
| Produk | Product |
| Produk Alkes | Medical Device Product |
| Produk Ditawarkan | Offered Product |
| Produk Sistem | System Product |
| Profil Fasyankes | Healthcare Facility Profile |
| Progres antrian | Queue progress |
| Progres kirim | Send progress |
| Prospek | Lead |
| Prospek dalam Pipeline | Leads in Pipeline |
| Prospek Dihasilkan | Leads Generated |
| Prospek Melewati Tindak Lanjut | Leads Skipping Follow-up |
| Proyeksi Bulan Depan | Next Month Projection |
| Query tidak mencocokkan subscriber apa pun. | Query does not match any subscriber. |
| Rata-rata Paparan Kredit | Average Credit Exposure |
| Rayon Kalimantan | Kalimantan Region |
| Rayon Sumatera | Sumatera Region |
| Realisasi Biaya | Cost Realization |
| Rebate Terutang | Accrued Rebate |
| Referensi Katalog | Catalog Reference |
| Rencana | Plan |
| Reset dari CMS | Reset from CMS |
| Retransmisi pesan transaksional berhasil | Transactional message retransmission successful |
| Revisi Harga | Price Revision |
| Rincian pesanan lapangan | Field order details |
| Risiko Overstock | Overstock Risk |
| Risiko Stockout | Stockout Risk |
| Risiko Stok | Stock Risk |
| Riwayat kunjungan med rep | Medical rep visit history |
| Riwayat Quotation Tersimpan | Saved Quotation History |
| riwayat tertutup | Closed history |
| Sales Order Aktif | Active Sales Order |
| Sales order boleh diproses | Sales order may be processed |
| Sales order ditolak otomatis oleh validator | Sales order automatically rejected by validator |
| Sales order lintas jalur distribusi | Cross-channel sales order |
| Sales Order terkait | Related Sales Order |
| Salin | Copy |
| Satuan | Unit |
| Selesai | Completed |
| selesai diproses | Processing completed |
| Semua | All |
| Sep | Sep |
| Serapan anggaran | Budget absorption |
| Sertakan Back Cover | Include Back Cover |
| Sertakan Cover Depan | Include Front Cover |
| Sertakan PPN | Include VAT (PPN) |
| Simpan Check-in | Save Check-in |
| Simpan Draft | Save Draft |
| Simpan Identitas sebagai Default | Save Identity as Default |
| Simpan Pagu | Save Ceiling |
| Simpan pengaturan pengirim | Save sender settings |
| Simpan Perubahan | Save Changes |
| Simpan Pesanan | Save Order |
| Simpan template | Save template |
| Simposium | Symposium |
| Skema Harga | Pricing Scheme |
| Spesifikasi Ringkas | Brief Specifications |
| Spesifikasi Teknis | Technical Specifications |
| Spesifikasi teknis, garansi, atau keterangan tambahan... | Technical specifications, warranty, or additional notes... |
| Standar Unit Alkes | Medical Device Unit Standard |
| Status | Status |
| Status Efektif | Effective Status |
| Status Pelanggan | Customer Status |
| Status Pengiriman | Delivery Status |
| Status Registrasi | Registration Status |
| Status Risiko | Risk Status |
| Status Tender | Tender Status |
| Stok Aktif Sekarang | Current Active Stock |
| stok seimbang | Balanced stock |
| Subjek | Subject |
| Subscriber diaktifkan kembali | Subscriber reactivated |
| Subscribers aktif | Active subscribers |
| Sudah Tutup | Already Closed |
| Sumber | Source |
| Sumber Pengumuman | Announcement Source |
| Sumber tunggal koleksi PenarikanProduk | Single source of ProductRecall collection |
| Sunting body | Edit body |
| Supaya berkas PDF tersimpan rapi | So that the PDF file is saved neatly |
| SURAT PENAWARAN HARGA | PRICE QUOTATION LETTER |
| Surel tujuan | Destination email |
| Surel tujuan dan subjek wajib diisi. | Destination email and subject are required. |
| Tambah dari Master Katalog | Add from Catalog Master |
| Tambah hasil query ke daftar | Add query results to list |
| Tambah Lagi | Add More |
| Tambahkan ke Quotation | Add to Quotation |
| Tampilkan Logo Perusahaan | Show Company Logo |
| Tampilkan NPWP Perusahaan | Show Company NPWP (Tax ID) |
| Tandai Dikembalikan | Mark as Returned |
| Tandai Diterima Fasyankes | Mark as Received by Healthcare Facility |
| Tandai Terbayar | Mark as Paid |
| Tanggal | Date |
| Tanggal Kejadian | Event Date |
| Tanggal kirim | Send date |
| Tanggal Pesanan | Order Date |
| Tanggal Pinjam | Loan Date |
| Tanggal Terbit | Issue Date |
| Tanpa pencatatan campaign | Without campaign recording |
| tekankan penyaluran FEFO | Emphasize FEFO distribution |
| Telepon | Phone |
| Tender LPSE | LPSE Tender |
| Tender Mandiri RS | Hospital Independent Tender |
| Tender RS Pemerintah | Government Hospital Tender |
| Tender Terbuka LPSE | LPSE Open Tender |
| Terapkan query | Apply query |
| Terbayar | Paid |
| Terbitkan Quotation PDF A4 | Issue Quotation PDF A4 |
| Terbitkan Sales Order | Issue Sales Order |
| Terkirim | Shipped |
| Terkirim ke e-Watch Alkes | Sent to e-Watch Alkes |
| Terkirim ke Gudang | Sent to Warehouse |
| Terlambat | Late |
| Termin Bertahap | Staged payment terms |
| Terpinjam | On Loan |
| Tervalidasi Digital | Digitally Validated |
| Terverifikasi | Verified |
| Tidak ada tumpang tindih wilayah terdeteksi. | No overlapping territory detected. |
| Tidak aktif hari ini | Not active today |
| Tidak mengubah statistik | Does not change statistics |
| Tindakan Segera | Immediate Action |
| Tingkat Diskon | Discount Rate |
| Tipe Fasyankes | Healthcare Facility Type |
| Titik Pesan Ulang | Reorder Point |
| Total Biaya Terpakai | Total Cost Used |
| Total Nilai | Total Value |
| TOTAL PENAWARAN | TOTAL QUOTATION |
| Total Unit Ditarik Fisik | Total Units Physically Recalled |
| Tren | Trend |
| Tren nilai penjualan per bulan | Monthly sales value trend |
| Tujuan Kunjungan | Visit Purpose |
| Tunai | Cash |
| Tutup | Close |
| Ubah Pagu | Edit Ceiling |
| Unggah Logo | Upload Logo |
| Unit | Unit |
| Unit Demo Bermasalah | Problematic Demo Unit |
| URL Gambar Latar | Background Image URL |
| Urutan Produk dalam Katalog | Product Order in Catalog |
| Usulan alokasi FEFO gudang | Warehouse FEFO allocation proposal |
| Verifikasi | Verification |
| Verifikasi Pesanan | Order Verification |
| Verifikasi Tagihan | Invoice Verification |
| Views unik | Unique views |
| Wajib | Required |
| Warna Aksen Dokumen | Document Accent Color |
| Workshop Klinis | Clinical Workshop |

### Istilah Inggris yang dipertahankan di UI

- B2B Customer Profiling
- Background graphics
- Blocked
- Blocklist
- Bonus unit sample
- Bounce
- bounce action
- Box
- Campaigns
- Clicks
- Confirm subscription
- Content type
- CRM Marketing
- CRM Marketing — Quotation
- Dashboard
- Demand Forecasting
- double opt-in
- Download PDF A4
- Draft
- E-Purchasing
- Enable
- Enabled
- Endpoint
- Header email, name, attributes
- Import subscribers
- Imported
- Lists
- Margin Calculator
- Med Rep
- Media library
- No. Quotation
- None
- Public
- Reset
- Roll
- Sales Performance Dashboard
- Set
- Settings
- single opt-in
- Status Limit
- Subscriber
- Subscriber lists
- Subscribers
- Subtotal
- Templates
- Term of Payment
- Transactional
- Transactional messages
- Unsubscribe
- Unsubscribed
- Views
- Website

### Catatan jumlah baris / dilewati

| Berkas sumber | Baris input | Baris tabel ditulis | Istilah Inggris | Dilewati (noise) |
| --- | --- | --- | --- | --- |
| commercial.txt | 534 | 468 | 52 | 14 |

Rincian yang dilewati (14):
- `Auth instance memakai` (fragmen kode/log terpotong)
- `Bekasi` (nama kota/alamat)
- `Checkpoints last_subscriber_id` (fragmen kode/nama kolom)
- `dr. Damar` (nama orang)
- `Jakarta Selatan` (nama kota/alamat)
- `Katalog Elektronik AMS 2026.pdf` (nama berkas/artefak, bukan istilah UI)
- `PT AMS` (nama perusahaan)
- `PT Anugrahmitra Selaras` (nama perusahaan)
- `PT ANUGRAHMITRA SELARAS` (nama perusahaan)
- `RSUD Pasar Minggu` (nama fasilitas/alamat)
- `SP-EKAT` (kode murni)
- `SP-KLINIK` (kode murni)
- `SP-TENDER` (kode murni)
- `Syringe Pump Presisi Tinggi AMS-SP500` (nama produk + kode model)

## Modul Supporting System (HRIS, Finance, IT)

Glosarium istilah UI Indonesia → Inggris untuk AMS Integrated System (CDAKB/CPAKB/ISO 13485).

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| 1. Seluruh Log Audit | All Audit Logs |
| 2 tahun | 2 Years |
| 2. Log Terfilter Saat Ini | Current Filtered Log |
| Ajukan Lembur | Submit Overtime Request |
| Ajukan Perhitungan Lembur | Submit Overtime Calculation |
| Aksi | Action |
| Aktif | Active |
| Aktif sebagai | Active as |
| Aktivitas Operasional | Operational Activity |
| Akun | Account |
| Akun ini belum punya entri Posted. | This account has no Posted entries yet. |
| AKUN TIDAK DIKENAL | UNKNOWN ACCOUNT |
| Alamat IP | IP Address |
| Alasan | Reason |
| Alasan Mutasi | Transfer Reason |
| Alasan perubahan status... | Reason for status change... |
| Alkes | Medical Device(s) |
| Ambang satisfaktori 95% dari target | Satisfactory threshold: 95% of target |
| Angkut luar negeri | Overseas Freight |
| Asal Data | Data Provenance (Data Origin) |
| Aset | Assets |
| Aset Lancar | Current Assets |
| Aset Tidak Lancar | Non-current Assets |
| Asuransi kargo | Cargo Insurance |
| Atasan | Supervisor |
| Balik | Back / Reverse |
| Baris Aktif | Active Rows |
| Baris Laporan | Report Rows |
| Baris Tanpa NPWP | Rows Without NPWP (Tax ID) |
| Baris Tanpa Pusat Biaya | Rows Without Cost Center |
| Baru | New |
| Batal | Cancel |
| Batch Lolos Gerbang | Gate-Passed Batches |
| Batch Tanpa Dasar Biaya | Batches Without Cost Basis |
| Batch Terlibat | Involved Batches |
| Batch Tertolak | Rejected Batches |
| Bawahan | Subordinate |
| Beban | Expenses |
| Beban Lain-lain | Other Expenses |
| Beban Operasional | Operating Expenses |
| beban pajak | Tax Expense |
| Beban Periode | Period Expenses |
| Bebas PPN | VAT Exempt |
| BELUM ADA | Not yet |
| Belum ada indikator. | No indicators yet. |
| Belum ada sesi aktif pengguna operasional. | No active operational user sessions yet. |
| Belum disemai | Not yet seeded |
| Belum pernah | Never |
| BELUM-DICATAT | NOT-RECORDED |
| Bentuk Paparan | Exposure Type |
| berakar pada genesis | rooted at genesis |
| berhak mem-posting jurnal dan tutup buku | entitled to post journals and close the books |
| Berjalan | In Progress (Running) |
| Berlaku | Valid / Effective |
| Bersertifikat | Certified |
| Biaya Penanganan Retur Mutu | Quality Return Handling Cost |
| Biaya Retur Mutu | Quality Return Cost |
| Biaya Uji Kalibrasi | Calibration Test Cost |
| BMR Produksi | Production BMR |
| Boleh Tagih | Billable |
| BPJS Karyawan | Employee BPJS (Social Security) |
| Buat Peran | Create Role |
| Buat Peran RBAC Kustom | Create Custom RBAC Role |
| Buka Kembali | Reopen |
| Buku Besar Belum Dibuka | General Ledger Not Yet Opened |
| Buku Besar per Akun | General Ledger by Account |
| Cabut Sesi | Revoke Session |
| CAPA Berjalan | CAPA In Progress |
| Capaian KPI | KPI Achievement |
| Cari kode, nama, atau catatan regulasi... | Search code, name, or regulatory note... |
| Cari nomor faktur atau pihak fasyankes... | Search invoice number or healthcare facility... |
| Catat Dasar | Record Basis |
| Catat Dasar Biaya Batch | Record Batch Cost Basis |
| Catat Distribusi APD | Record PPE Distribution |
| Catat Faktur Transaksi Baru | Record New Transaction Invoice |
| Catat Faktur Transaksi Keuangan | Record Financial Transaction Invoice |
| Catat Mutasi | Record Transfer |
| Catatan | Note |
| Checklist onboarding digital | Digital Onboarding Checklist |
| CLOCK-IN BERHASIL | CLOCK-IN SUCCESSFUL |
| Clock-in Sekarang | Clock In Now |
| CLOCK-IN SEKARANG | CLOCK IN NOW |
| Daftar Akun Pengguna Terverifikasi Server | Server-Verified User Account List |
| Daftar Peran | Role List |
| Dari | From |
| dari total | of total |
| Dasar Biaya | Cost Basis |
| Dasar biaya saat ini masih DUMMY | Cost basis is currently DUMMY |
| Dasar Hukum | Legal Basis |
| Dasbor Kendali | Control Dashboard |
| Data Dummy Sudah Dipurge | Dummy Data Purged |
| Data Induk | Master Data |
| Debet | Debit |
| Deskripsi | Description |
| Deskripsi peran | Role description |
| Detail | Detail |
| di bawah | below |
| Dibayar | Paid |
| Dikunci | Locked |
| Diproses | In Process |
| Diri sendiri | Self |
| Disetujui | Approved |
| Diterima Penerima | Received by Recipient |
| Ditolak | Rejected |
| Ditutup | Closed |
| Divisi | Division |
| Dokter Pemeriksa | Examining Doctor |
| DPP Total | Total Taxable Base (DPP) |
| Draf Menunggu | Pending Drafts |
| Dua kerangka penilaian berjalan paralel | Two assessment frameworks running in parallel |
| Efisiensi Manufaktur | Manufacturing Efficiency |
| Ekspor | Export |
| Ekuitas | Equity |
| Entri | Entry |
| entri penilaian | assessment entry |
| Entri Skill Matrix | Skill Matrix Entry |
| Estimasi Biaya Lembur | Estimated Overtime Cost |
| Faktur dengan Surat Jalan | Invoice with Delivery Note |
| Fasyankes Tujuan | Destination Healthcare Facility |
| Format CSV UTF-8 tahan lama. | Durable CSV UTF-8 format. |
| Frekuensi | Frequency |
| Gagal membuat peran baru. | Failed to create new role. |
| Gagal memuat data RBAC dari server. | Failed to load RBAC data from server. |
| Gagal mencabut sesi. | Failed to revoke session. |
| Gagal menghapus pengguna. | Failed to delete user. |
| Gagal menghapus peran. | Failed to delete role. |
| Gagal menyimpan data pengguna. | Failed to save user data. |
| Gagal menyimpan matriks peran. | Failed to save role matrix. |
| Gaji pokok | Base Salary |
| Gaji Pokok | Base Salary |
| Gerbang Penagihan CDAKB | CDAKB Billing Gate |
| GPS Geofencing Karyawan Lapangan | Field Employee GPS Geofencing |
| Grade Jabatan | Job Grade (Job Grading) |
| Gudang Distribusi | Distribution Warehouse |
| Gunakan sebagai insentif operator | Use as operator incentive |
| Hadir | Present |
| Hanya peran dengan izin | Only roles with permission |
| Hapus | Delete |
| Hapus akun | Delete account |
| Hapus Peran | Delete Role |
| Harga FOB | FOB Price |
| Harga Pokok Buku Besar | General Ledger Cost |
| Harga Pokok Penjualan | Cost of Goods Sold (COGS) |
| HARGA POKOK PENJUALAN | COST OF GOODS SOLD (COGS) |
| Harga Pokok per Unit | Cost per Unit |
| Harga pokok persediaan di buku besar | Inventory cost in the general ledger |
| Hari Kehilangan Kerja | Lost Work Days |
| Hasil | Result |
| Hasil Gerbang | Gate Result |
| HPP atas Pengiriman | COGS on Shipment |
| HPP Terbukukan | Posted COGS |
| Indikator | Indicator |
| Indikator KPI Aktif | Active KPI Indicators |
| Insentif sales | Sales Incentive |
| Insentif Sales | Sales Incentive |
| Insiden Belum Ditutup | Incidents Not Yet Closed |
| Insiden Tercatat | Recorded Incidents |
| Instruktur | Instructor |
| Integrasi Perangkat Biometrik Pabrik | Factory Biometric Device Integration |
| Integritas Data | Data Integrity |
| Integritas Rantai Hash | Hash Chain Integrity |
| Investigasi | Investigation |
| Izin rbac-admin terkunci aktif demi keamanan | rbac-admin permission locked active for security |
| Jabatan | Position (Job Title) |
| Jabatan Baru | New Position |
| Jadwalkan Pelatihan Regulasi | Schedule Regulatory Training |
| Jadwalkan Pelatihan Wajib Karyawan | Schedule Mandatory Employee Training |
| Jalankan Payroll | Run Payroll |
| Jalankan Payroll Periode Baru | Run Payroll for New Period |
| Jam Kerja | Working Hours |
| Jam Lembur | Overtime Hours |
| Jam Lembur Disetujui | Approved Overtime Hours |
| Jejak delta nilai lama vs baru. | Trace of old vs new value delta. |
| Jejak perhitungan PPh 21 | PPh 21 Calculation Trace |
| Jenis APD | PPE Type |
| Jenis Kejadian | Incident Type |
| Jenis Lisensi | License Type |
| Jenis Pemeriksaan | Examination Type |
| Jumlah | Quantity |
| Jumlah Peserta | Number of Participants |
| Jumlah Transaksi | Number of Transactions |
| Jurnal | Journal (Journal Entry) |
| Jurnal Posted tidak seimbang | Posted journal is unbalanced |
| Jurnal Umum | General Journal |
| Kalibrasi | Calibration |
| Kalkulator Landed Cost Impor | Import Landed Cost Calculator |
| Kandidat | Candidate (Applicant) |
| Kandidat Aktif | Active Candidates |
| Kantor Pusat | Head Office |
| Kapitalisasi persediaan | Inventory Capitalization |
| Kapitalisasi Persediaan | Inventory Capitalization |
| Karantina | Quarantine / Hold |
| Kartu Stok | Stock Card |
| Karyawan | Employee |
| Karyawan Tetap | Permanent Employee |
| Kategori Akuntansi | Accounting Category |
| Kategori Talent | Talent Category |
| Kategori Transaksi | Transaction Category |
| Kecelakaan Kerja | Work Accident |
| Kedaluwarsa | Expiry / Expired |
| Keluaran sama dengan masukan. | Output equals input. |
| Kepala Gudang CDAKB | CDAKB Warehouse Head |
| Kerangka Penilaian | Assessment Framework |
| Keterangan | Description |
| Kewajiban | Liabilities |
| Kewajiban Lancar | Current Liabilities |
| Kewajiban Tidak Lancar | Non-current Liabilities |
| Klausul 8.2.2 Audit Internal | Clause 8.2.2 Internal Audit |
| Kode | Code |
| Kode Akun | Account Code |
| Kode dan nama akun wajib diisi. | Account code and name are required. |
| Kode Transaksi | Transaction Code |
| Kompetensi Teknis Internal | Internal Technical Competence |
| Komponen | Component |
| Komponen Biaya Mutu | Quality Cost Component |
| Kondisi | Condition |
| Kredit | Credit |
| Kredit Pajak | Tax Credit |
| Kronologi Kejadian | Incident Chronology |
| Kunci | Lock |
| Kurang Bayar | Underpayment |
| Laba Kotor | Gross Profit |
| Laba Rugi | Profit and Loss |
| Laba Usaha | Operating Profit |
| Laba Usaha Berjalan | Year-to-Date Operating Profit |
| Lapor Insiden | Report Incident |
| Layak lanjut tes teknis | Fit to proceed to technical test |
| Lebih Bayar | Overpayment |
| Lembur | Overtime |
| Level Kompetensi | Competence Level |
| Lewat Jatuh Tempo | Overdue |
| Lihat | View |
| Lima Jurnal Terakhir | Last Five Journals |
| Lisensi Belum Terverifikasi | License Not Yet Verified |
| Log Kehadiran Harian | Daily Attendance Log |
| Log Kehadiran Tercatat | Recorded Attendance Log |
| Login Terakhir | Last Login |
| Lokasi Kerja | Work Location |
| Lunas | Paid in Full |
| Mahir | Proficient |
| Manajemen Suhu Dingin | Cold Temperature Management |
| Manajer Produksi CPAKB | CPAKB Production Manager |
| Mangkir | Absent (No-show) |
| Manual HR | HR Manual |
| MASA ACUAN | REFERENCE PERIOD |
| Masa Berlaku | Validity Period |
| Masa Berlaku Sertifikat | Certificate Validity Period |
| Master Data Karyawan | Employee Master Data |
| Master data karyawan 3 lokasi kerja | Employee master data for 3 work locations |
| Masuk Beban Operasional | Charged to Operating Expenses |
| Masuk Pada | Clock-in At (Joined On) |
| Mata Rantai | Chain Link |
| Mata Rantai Jurnal | Journal Chain Link |
| Mata rantai jurnal rusak | Journal chain link broken |
| Mata Rantai terhubung | Chain link connected |
| Matriks Pelatihan Wajib Industri Alkes | Medical Device Industry Mandatory Training Matrix |
| MCU Berikutnya | Next MCU |
| MCU Perlu Tindak Lanjut | MCU Requires Follow-up |
| Memproses purge… | Purging… |
| Memuat… | Loading… |
| Menampilkan | Showing |
| Mendekati H-90 atau sudah kedaluwarsa | Approaching D-90 or already expired |
| Menunggu | Pending |
| Menunggu batch berikutnya | Awaiting next batch |
| Menunggu Jatuh Tempo | Awaiting Due Date |
| Menunggu Persetujuan | Awaiting Approval |
| Menunggu Tanda Tangan | Awaiting Signature |
| Menyimpan… | Saving… |
| Metode | Method |
| Metode Perhitungan PPh 21 | PPh 21 Calculation Method |
| Min. 5 Tahun dari Tanggal Penyaluran | Min. 5 Years from Distribution Date |
| Mode Cache Lokal | Local Cache Mode |
| Mutasi internal | Internal Transfer |
| Nama | Name |
| Nama Akun | Account Name |
| Nama Alkes | Medical Device Name |
| Nama Kandidat | Candidate Name |
| Nama Karyawan | Employee Name |
| Nama Lengkap | Full Name |
| Nama Pembeli | Buyer Name |
| Nama Peran | Role Name |
| Nama Personil | Personnel Name |
| Neraca | Balance Sheet |
| Neraca tidak seimbang | Balance sheet is unbalanced |
| NIK Karyawan | Employee ID Number (NIK) |
| Nilai | Value / Score |
| Nilai bersih persediaan pada Neraca | Net inventory value on the Balance Sheet |
| Nilai Buku | Book Value |
| Nilai Buku Persediaan | Inventory Book Value |
| Nilai Posted | Posted Value |
| No. Batch | Batch No. |
| No. Faktur | Invoice No. |
| Nomor | Number |
| Nomor Batch Tujuan | Destination Batch Number |
| Nomor Faktur | Invoice Number |
| Nomor Jurnal | Journal Number |
| Nomor Referensi | Reference Number |
| Nomor Sertifikasi | Certification Number |
| Nonaktif | Inactive |
| NPWP Pembeli | Buyer Tax ID (NPWP) |
| Operator | Operator |
| Opsional | Optional |
| Pabrik Manufaktur | Manufacturing Plant |
| Pajak Keluaran | Output Tax |
| Panduan Deployment | Deployment Guide |
| Payroll Engine Otomatis | Automated Payroll Engine |
| Pelatihan Tuntas | Training Completed |
| Pelatihan Wajib Karyawan | Mandatory Employee Training |
| Pemeriksaan MCU pra-kerja | Pre-employment MCU |
| Penagihan diblokir sampai tuntas | Billing blocked until completed |
| Penanggung Jawab Teknis | Technical Responsible Person (PJT) |
| Pendapatan | Revenue |
| Pendapatan Alkes | Medical Device Revenue |
| Pendapatan Lain-lain | Other Revenue |
| Pendapatan Operasional | Operating Revenue |
| Pendapatan Penjualan Alkes | Medical Device Sales Revenue |
| Pendapatan tercatat tanpa Harga Pokok Penjualan | Revenue recorded without Cost of Goods Sold |
| Penerima | Recipient |
| Pengadaan Suku Cadang | Spare Parts Procurement |
| Pengadaan Suku Cadang Resmi | Official Spare Parts Procurement |
| Penggantian Berkala | Periodic Replacement |
| Pengguna | User |
| Pengguna baru berhasil ditambahkan. | New user added successfully. |
| Pengguna Sistem | System User |
| Pengunjung | Visitor |
| Penilai | Assessor |
| Penjadwalan pelatihan wajib karyawan | Mandatory employee training scheduling |
| Penyakit Akibat Kerja | Occupational Disease |
| Peran | Role |
| Peran RBAC | RBAC Role |
| Pergerakan akun persediaan tanpa nomor batch | Inventory account movement without batch number |
| Peringatan | Warning |
| Peringatan Masa Berlaku Sertifikat | Certificate Validity Period Warning |
| Periode | Period |
| Periode Buku | Accounting Period |
| Periode Dikunci | Locked Period |
| Periode Ditutup | Closed Period |
| Periode Terbuka | Open Period |
| Perlakuan | Treatment |
| Perlu Evaluasi | Evaluation Required |
| Perlu Evaluasi Lanjutan Dokter K3 | Further Evaluation by OHS (K3) Doctor Required |
| Perlu review manual | Manual review required |
| Perlu Write-Off | Write-Off Required |
| Persediaan perlu write-off | Inventory requires write-off |
| Personil | Personnel |
| Persyaratan penyimpanan prinsipal | Principal's storage requirements |
| Pindahkan tahap | Move stage |
| Pos | Line Item |
| Posisi Dilamar | Position Applied For |
| Posisi Masa Ini | Current Position |
| Posisi Periode Aktif | Active Period Position |
| Potongan | Deduction |
| PPh 21 dipotong | PPh 21 Withheld |
| PPh 21 Dipotong | PPh 21 Withheld |
| PPN 11% Terbit Faktur Pajak | 11% VAT — Tax Invoice Issued |
| PPN Keluaran | Output VAT |
| PPN Keluaran masa ini | Current Period Output VAT |
| PPN Kurang Bayar | VAT Underpayment |
| PPN Lebih Bayar | VAT Overpayment |
| PPN Masukan | Input VAT |
| PPN Masukan masa ini | Current Period Input VAT |
| Program Wajib | Mandatory Program |
| Pusat Biaya | Cost Center |
| QA, RA, Kepala Divisi | QA, RA, Division Head |
| Qty Fisik | Physical Quantity |
| Qty Unit | Unit Quantity |
| Rata-rata Capaian KPI | Average KPI Achievement |
| Rata-rata Skor Kata Kunci | Average Keyword Score |
| Rata-rata Skor Kelulusan | Average Pass Score |
| Rata-rata Tertimbang | Weighted Average |
| Realisasi | Realization / Actual |
| Rekam Medis Kerja | Occupational Medical Record |
| Rekam Medis Perlu Evaluasi | Medical Record Requires Evaluation |
| rekaman audit trail. | audit trail record. |
| Rekan | Peer / Colleague |
| Rekapitulasi PPN Masa Pajak | VAT Tax Period Recapitulation |
| Rekonsiliasi Persediaan ↔ Neraca | Inventory ↔ Balance Sheet Reconciliation |
| Rendah | Low |
| Reset ke Data Standar | Reset to Default Data |
| Reset Semua Filter | Reset All Filters |
| Revisi Dasar | Basis Revision |
| Rincian Perhitungan | Calculation Details |
| Riwayat Mutasi | Transfer History |
| Rujukan | Reference / Referral |
| Rujukan Sumber | Source Reference |
| Rusak | Damaged |
| Saldo | Balance |
| Saldo Normal | Normal Balance |
| Salin Caddyfile | Copy Caddyfile |
| Salin Perintah CMD | Copy CMD Command |
| Sampai | To / Until |
| Sasaran Personil | Personnel Target |
| Sebab | Cause |
| Sedang | Medium |
| Segarkan Data | Refresh Data |
| Segarkan Status | Refresh Status |
| Seimbang | Balanced |
| Selesai | Completed |
| Selisih | Discrepancy / Difference |
| Seluruh periode | All periods |
| Semua | All |
| Semua pemeriksaan lolos | All checks passed |
| Semua periode | All periods |
| Semua Status Integritas | All Integrity Statuses |
| Semua tanggal | All dates |
| Sertifikasi | Certification |
| Sertifikasi CDAKB | CDAKB Certification |
| Sertifikat Perlu Tindak Lanjut | Certificate Requires Follow-up |
| Sertifikat SSL Otomatis Let's Encrypt | Automatic SSL Certificate (Let's Encrypt) |
| Sertifikat Terbit | Certificate Issued |
| SESI INI | THIS SESSION |
| Sesi pengguna berhasil dicabut. | User session revoked successfully. |
| Setujui | Approve |
| Setujui lembur | Approve overtime |
| Siap Onboarding | Ready for Onboarding |
| Simpan Akun | Save Account |
| Simpan Distribusi | Save Distribution |
| Simpan Draf | Save Draft |
| Simpan Indikator | Save Indicator |
| Simpan Jadwal Pelatihan | Save Training Schedule |
| Simpan Kandidat | Save Candidate |
| Simpan Karyawan | Save Employee |
| Simpan Laporan | Save Report |
| Simpan Matriks ke Server | Save Matrix to Server |
| Simpan Mutasi | Save Transfer |
| Simpan Pengajuan | Save Request |
| Simpan Penilaian | Save Assessment |
| Simpan Revisi | Save Revision |
| Simpan Transaksi | Save Transaction |
| Sinkron 2 menit lalu | Synced 2 minutes ago |
| Sinkron 8 menit lalu | Synced 8 minutes ago |
| Sisa Hari | Remaining Days |
| Skill Matrix Kompetensi | Competency Skill Matrix |
| Skor Gabungan | Combined Score |
| Skor kesiapan audit buku besar | General ledger audit readiness score |
| Skrining CV | CV Screening |
| Skrining CV Baru | New CV Screening |
| Skrining Kata Kunci CV | CV Keyword Screening |
| Slip Gaji | Payslip |
| Standar | Standard |
| Standar Regulasi | Regulatory Standard |
| Status | Status |
| Status Arsitektur Sistem Dual-Layer | Dual-Layer System Architecture Status |
| Status Bayar | Payment Status |
| Status Faktur Pajak | Tax Invoice Status |
| Status Karyawan | Employee Status |
| Status Kepegawaian | Employment Status |
| Status Kerja | Work Status |
| Status Pajak PPN | VAT Tax Status |
| Status Pembayaran | Payment Status |
| Status PPN | VAT Status |
| Status Rekam Medis Kerja | Occupational Medical Record Status |
| Status Verifikasi | Verification Status |
| Struktur Organisasi Multi-Site | Multi-Site Organization Structure |
| Sumber | Source |
| Sumber Absensi | Attendance Source |
| Sumber Biaya | Cost Source |
| Sumber Daya Manusia | Human Resources (HR) |
| Surat Jalan | Delivery Note / Delivery Order |
| Susun Draf HPP | Draft COGS |
| Susun Draf Jurnal Landed Cost | Draft Landed Cost Journal |
| Tahap Saat Ini | Current Stage |
| Tahunan | Annual |
| Taksiran Manajemen | Management Estimate |
| Tambah | Add |
| Tambah Akun | Add Account |
| Tambah Akun Chart of Accounts | Add Chart of Accounts Account |
| Tambah Akun Pengguna Baru | Add New User Account |
| Tambah Indikator KPI | Add KPI Indicator |
| Tambah Karyawan | Add Employee |
| Tambah Karyawan Baru | Add New Employee |
| Tambah Penilaian | Add Assessment |
| Tambah Penilaian Skill Matrix | Add Skill Matrix Assessment |
| Tanda Tangan | Signature |
| Tanda Tangan Diterima | Signature Received |
| Tandai Dibayar | Mark as Paid |
| Tandai Diproses | Mark as In Process |
| Tandai Sudah Diterima | Mark as Received |
| Tangani → | Handle → |
| Tanggal | Date |
| Tanggal Bergabung | Join Date |
| Tanggal Efektif | Effective Date |
| Tanggal Lahir | Date of Birth |
| Tanggal Lembur | Overtime Date |
| Tanggal MCU | MCU Date |
| Tanggal Pelaksanaan | Implementation Date |
| Tanggal Penilaian | Assessment Date |
| Tanggal Terbit | Issue Date |
| Tanggal Transaksi | Transaction Date |
| Tanpa Dasar Biaya | Without Cost Basis |
| tanpa hari kehilangan | without lost days |
| TANPA JURNAL | NO JOURNAL |
| Target | Target |
| Tarif | Rate / Tariff |
| Telah diverifikasi PPN 11% | 11% VAT Verified |
| Telusuri BMR ke Batch Produksi | Trace BMR to Production Batch |
| Terbit | Issued |
| Terbitkan Jurnal Pembalik | Issue Reversing Journal |
| Terbuka | Open |
| Tercatat ke Database Pusat HRD AMS | Recorded to AMS HRD Central Database |
| Terkirim | Shipped |
| Terlambat | Late |
| Tersalin | Copied |
| Tervalidasi Digital | Digitally Validated |
| Terverifikasi | Verified |
| Tes Teknis | Technical Test |
| Tetap | Permanent / Fixed |
| Tidak ada | None |
| Tidak ada batch pada filter ini. | No batches in this filter. |
| Tidak ada jurnal pada filter ini. | No journals in this filter. |
| Tidak ada kandidat | No candidates |
| Tidak ada kata kunci regulasi terdeteksi. | No regulatory keywords detected. |
| Tidak ada saldo pada bagian ini. | No balance in this section. |
| TIDAK seimbang | UNBALANCED |
| tidak teralokasi ke segmen | not allocated to segment |
| tidak terbuka | not open |
| tidak terhubung | not connected |
| TIDAK TERKAIT | NOT LINKED |
| Tidak Valid | Invalid |
| Tim bertugas | On-duty team |
| Tim logistik reagen IVD | IVD Reagent Logistics Team |
| Tindakan | Action |
| Tindakan Korektif Awal | Initial Corrective Action |
| Tinggi | High |
| Tingkat Risiko | Risk Level |
| Tipe | Type |
| Tolak lembur | Reject overtime |
| Top Talent — jalur promosi | Top Talent — promotion track |
| Total Aset | Total Assets |
| Total Debet | Total Debit |
| Total insentif produksi lini | Total line production incentive |
| Total Kewajiban + Ekuitas | Total Liabilities + Equity |
| Total Kredit | Total Credit |
| Total Lembur | Total Overtime |
| Total Penerimaan Faktur Fasyankes | Total Healthcare Facility Invoice Receipts |
| Total Personil Aktif | Total Active Personnel |
| Total potongan iuran karyawan | Total employee contribution deductions |
| Total Take Home Pay | Total Take Home Pay |
| Total Tercapitalisasi | Total Capitalized |
| Tujuan Alokasi | Allocation Target |
| Tunjangan kehadiran | Attendance Allowance |
| Turnstile Cleanroom Kelas C | Class C Cleanroom Turnstile |
| Tutup | Close |
| Tutup Buku | Close Books |
| Tutup Simulator | Close Simulator |
| Uang Muka Pajak | Tax Prepayment (Advance Tax) |
| Ubah | Edit |
| Umpan Balik 360° Berjalan | 360-degree Feedback In Progress |
| Unduh APK | Download APK |
| Unduh CSV KPP | Download KPP CSV |
| Unduh Draf XML | Download XML Draft |
| Unit | Unit |
| Upah lembur disetujui | Approved overtime pay |
| Upah Sejam | Hourly Wage |
| Uraian | Description |
| Valuasi Persediaan per Batch | Inventory Valuation per Batch |
| Verifikasi PJT | PJT Verification |
| Waktu | Time |
| Wawancara User | User Interview |
| yang dapat mempurge. | that can purge. |

### Istilah Inggris yang dipertahankan di UI

- ALCOA+ Compliant
- AMS Smart Attendance
- Background Check
- Balance
- Balanced
- Caddy Reverse Proxy
- Chart of Accounts
- Draft
- Email
- Face Recognition
- Fingerprint
- Fit to Work
- Fit with Restriction
- Grade
- Gross
- Gross Up
- Hash
- Latitude
- Lead QC
- Longitude
- Manufacture
- Mobile App Client v2.4
- Near Miss
- Net
- Offering
- Onboarding
- Outsourcing
- Posted
- Posting
- Purchase Order
- Purchasing
- QA Manager
- Quality Assurance
- Quality Control
- Recall
- Regulatory Affairs
- Sales Manager
- SERVER-SIDE ENFORCED
- Solid Performer
- Take Home Pay
- Technical Service
- Trainee
- Trainer
- Username
- Void
- Write-Off

### Catatan jumlah

- Total baris input (`supporting.txt`): **633**
- Baris tabel Indonesia → Inggris ditulis: **560**
- Istilah Inggris dipertahankan (daftar terpisah): **46**
- Dilewati (noise non-UI): **27**
  - Nama orang / contoh nama: 8 (Ahmad Fauzi; Ahmad Fauzi, S.Farm; apt. Dewi Kartika, S.Si; Budi Utomo, S.T; Dewi Anggraini; Farhan Maulana; Hendra Setiawan; Ir. Agus Santoso)
  - Kode murni / prefiks ID: 9 (ABS-, ABS-MOB-, APD-, ATS-, INV-, KPI-, MUT-, PB-DIST, PB-QA)
  - Perintah shell / fragmen kode: 5 (npm ci; npm run build; nssm start AMS_AppService; nssm start AMS_PocketBase; nssm start CaddyWebServer)
  - Placeholder contoh data: 2 (mis. budi.qa; mis. Supervisor Cold Chain)
  - Nama lokasi / produk contoh: 2 (Pabrik Cikarang; Usgan Portable 4CH)
  - Fragmen teks terpotong: 1 (berakar pada titik cui)
- Tidak ada baris input dengan placeholder >6 kata, sehingga kriteria tersebut tidak menambah jumlah yang dilewati.
- Duplikasi kapitalisasi/varian (mis. "Gaji pokok" vs "Gaji Pokok", "Clock-in Sekarang" vs "CLOCK-IN SEKARANG") tetap ditulis satu baris per baris input sesuai aturan.


## Modul Website & Konten Publik


### Sumber: website.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Template Dasar | Basic Template |
| Warna Merek | Brand Colors |
| Tipografi | Typography |
| Ags | Aug (August) |
| Ajukan Penawaran | Request Quotation (Request a Quote) |
| Ajukan Penawaran Sekarang | Request Quotation Now |
| Aksi | Actions |
| Aktif | Active |
| Alamat | Address |
| Alamat kantor | Office Address |
| Angka | Number (Figure) |
| Apotek | Pharmacy |
| Atur ulang filter | Reset Filters |
| Belum pernah tayang | Never Published |
| Beranda | Home |
| Berjalan | Running (In Progress) |
| Bersihkan kata kunci | Clear Keywords |
| Brosur teknis dilampirkan bersama penawaran resmi | Technical brochure enclosed with the official quotation |
| Buka Dashboard Website | Open Website Dashboard |
| Buka di Surel | Open in Email |
| Buka Katalog Lengkap | Open Full Catalog |
| Buka kunci dari sinkronisasi | Unlock from Sync |
| Buka lokasi di peta | Open Location on Map |
| Buka navigasi | Open Navigation |
| Buka Seluruh Katalog | Open Entire Catalog |
| Butir Konten | Content Item |
| Cakupan provinsi | Province Coverage |
| Capaian ringkas | Achievements Summary |
| Capaian Terukur | Measurable Achievements |
| Cari alat kesehatan | Search Medical Devices |
| Catatan Footer | Footer Note |
| Catatan kepatuhan | Compliance Note |
| Contoh instansi | Example Institutions |
| Daftar Harga REMEDI | REMEDI Price List |
| Dari Disposable hingga X-Ray System | From Disposable to X-Ray System |
| Des | Dec (December) |
| Deskripsi | Description |
| Dinas Kesehatan | Health Office (Health Agency) |
| Ditahan | On Hold |
| Ditahan selama perpanjangan NIE | On Hold during NIE Renewal |
| ditulis manual | Entered manually |
| Dokumentasi gudang, instalasi, dan kegiatan. | Warehouse, installation, and activity documentation. |
| draf belum disimpan | Draft not saved |
| Duplikat | Duplicate |
| Edukasi Spesialis | Specialist Education |
| Elektromedik Non Radiasi | Electromedical (Non-radiating) |
| Filter merek atau prinsipal | Filter by Brand or Principal |
| Filter status ketersediaan | Filter Availability Status |
| Foto produk atau fasilitas | Product or Facility Photo |
| Galeri Fasilitas | Facility Gallery |
| Ganti Foto | Change Photo |
| Grup katalog | Catalog Group |
| Grup Katalog | Catalog Group |
| Halaman situs | Site Page |
| Halaman tujuan | Destination Page |
| Hapus | Delete |
| Hapus filter grup katalog | Remove Catalog Group Filter |
| Hapus? | Delete? |
| Harga Katalog Tercantum | Listed Catalog Price |
| Hero Utama | Main Hero (Primary Hero Section) |
| Hubungi Kami | Contact Us |
| HUBUNGI KAMI | CONTACT US |
| Institusi | Institution |
| Institusi yang Dilayani | Institutions Served |
| Jabatan | Position (Job Title) |
| Jalur Pengadaan | Procurement Channel |
| Jam operasional | Operating Hours |
| Jam Operasional | Operating Hours |
| Jawaban | Answer |
| Jejak Audit Konten Situs | Site Content Audit Trail |
| Jenis Instansi | Institution Type |
| Jenis kegiatan | Activity Type |
| Judul artikel | Article Title |
| Judul banner | Banner Title |
| Judul foto | Photo Title |
| Judul H1 | H1 Heading |
| Judul kolom | Column Title |
| Judul penawaran | Quotation Title |
| Judul seksi | Section Title |
| Judul solusi | Solution Title |
| Judul tab browser | Browser Tab Title |
| Judul tahap | Stage Title |
| Jumlah instansi terdaftar | Number of Registered Institutions |
| Jumlah produk | Number of Products |
| Jumlah unit | Number of Units |
| Kartu | Card |
| Kata sandi | Password |
| Kata sandi developer minimal 8 karakter. | Developer password must be at least 8 characters. |
| Katalog Produk | Product Catalog |
| Kategori | Category |
| Kategori izin edar Kemenkes | Ministry of Health (Kemenkes) Marketing Authorization Category |
| Kategori pemasok | Supplier Category |
| Kedaluwarsa | Expiry / Expired |
| Kelas B | Class B |
| Kelas risiko | Risk Class |
| Kelola konten lewat dashboard Website | Manage Content via Website Dashboard |
| Kelompok Konten | Content Group |
| Keluar | Logout |
| Kembalikan Bawaan | Restore Defaults |
| Keterangan | Description |
| Keterangan audit mutu | Quality Audit Description |
| Ketersediaan | Availability |
| Keunggulan Utama | Key Advantages |
| Kirim Permintaan Penawaran | Submit Quotation Request |
| Klinik | Clinic |
| Kolom | Column |
| Kolom baru | New Column |
| Kolom Footer | Footer Column |
| Kolom mega menu | Mega Menu Column |
| Konfirmasi Kata Sandi | Confirm Password |
| Konfirmasi kata sandi tidak cocok. | Password confirmation does not match. |
| Konsultasikan Kebutuhan Anda | Consult Your Needs |
| Konsultasikan Kebutuhan Khusus | Consult Special Requirements |
| Kontak | Contact |
| Konten Beranda | Homepage Content |
| Kosongkan daftar | Clear List |
| Kredensial disimpan permanen dalam hash | Credentials stored permanently as a hash |
| Kunci dari timpa sinkronisasi | Lock against Sync Overwrite |
| Kurangi jumlah | Decrease Quantity |
| Kurangi jumlah unit | Decrease Unit Quantity |
| Kutipan | Quote (Blockquote) |
| Label | Label |
| Label kecil | Small Label |
| Label tahap | Stage Label |
| Laboratorium | Laboratory |
| Lanjut Ajukan Penawaran | Continue to Request Quotation |
| Layanan | Services |
| Lencana | Badge |
| Lencana di atas judul | Badge above Title |
| Lencana kartu | Card Badge |
| Lepas tautan data aplikasi | Unlink Application Data |
| lihat semua | View All |
| Lini Katalog REMEDI | REMEDI Catalog Line |
| Lokasi | Location |
| Mari Bahas Kebutuhan Instansi Anda | Let's Discuss Your Institution's Needs |
| Masuk | Login |
| Masuk ke Aplikasi AMS | Login to AMS Application |
| Masukkan ke Daftar RFQ | Add to RFQ List |
| Media Sosial | Social Media |
| Mei | May |
| Memeriksa status inisialisasi server… | Checking server initialization status… |
| Memuat halaman… | Loading page… |
| Memuat konten situs… | Loading site content… |
| Memverifikasi… | Verifying… |
| Menampilkan | Displaying |
| Mengolah... | Processing... |
| Mengolah… | Processing… |
| Menunggu draf konten dari dashboard… | Waiting for content draft from dashboard… |
| Menunggu Evaluasi | Pending Evaluation |
| Menunggu rilis NIE | Awaiting NIE Issuance |
| Mode tampilan katalog | Catalog Display Mode |
| Muat Versi Server Terbaru | Load Latest Server Version |
| Naik | Move Up |
| Naikkan seksi | Move Section Up |
| Naikkan urutan | Move Up in Order |
| Nama kegiatan | Activity Name |
| Nama legalitas | Legal Document Name |
| Nama Lengkap Developer | Developer Full Name |
| Nama lengkap developer wajib diisi. | Developer full name is required. |
| Nama merek | Brand Name |
| Nama pengguna | Username |
| Nama penulis | Author Name |
| Nama perusahaan | Company Name |
| Nama platform | Platform Name |
| Nama produk | Product Name |
| Nama segmen | Segment Name |
| Navigasi Header | Header Navigation |
| Negara | Country |
| Negara asal | Country of Origin |
| Negara Asal | Country of Origin |
| NIE Kemenkes Aktif | Active Kemenkes (MoH) NIE |
| Nilai Baru | New Value |
| Nilai Lama | Old Value (Previous Value) |
| Nomor izin edar | Marketing Authorization No. (MA No.) |
| Nomor Izin Edar | Marketing Authorization No. (MA No.) |
| Okt | Oct (October) |
| Pameran Internasional | International Exhibition |
| Paragraf isi | Body Paragraph |
| Paragraf pembuka | Opening Paragraph |
| Penanggung jawab | Person in Charge |
| Penawaran | Quotation |
| Penawaran Resmi | Official Quotation |
| Periode | Period |
| Perpanjangan | Renewal / Extension |
| Perpanjangan NIE berjalan | NIE Renewal in Progress |
| Pertanyaan | Question |
| Pertanyaan Umum | FAQ (Frequently Asked Questions) |
| perubahan belum terbit | Unpublished Changes |
| Pesan pembuka WhatsApp | WhatsApp Opening Message |
| Pita Konsultasi | Consultation Banner |
| Poin jual | Selling Points |
| Ponsel | Mobile Phone |
| Pratinjau gambar | Image Preview |
| Pratinjau situs publik | Public Site Preview |
| Price List Resmi | Official Price List |
| Produk | Product(s) |
| Produk terkait | Related Products |
| Profil perusahaan | Company Profile |
| Referensi Harga | Price Reference |
| Registrasi | Registration |
| Registrasi Kemenkes RI | Ministry of Health RI (Kemenkes RI) Registration |
| Rencana | Plan |
| Rincian Item | Item Details |
| Ringkasan | Summary |
| RS Pemerintah | Government Hospital (Public Hospital) |
| RS Swasta | Private Hospital |
| Salin Teks RFQ | Copy RFQ Text |
| Satuan | Unit |
| Seksi Daftar Tampil | List Display Section |
| Seksi tampil | Visible Section |
| Selengkapnya | Read More (Learn More) |
| Selesai | Completed |
| Sembunyi | Hidden |
| Sembunyikan kata sandi | Hide Password |
| Semua | All |
| Semua Grup | All Groups |
| Semua Status | All Statuses |
| Sesuai Daftar Harga Resmi | Per Official Price List |
| Sesuai INITIAL_SETUP_TOKEN di server | Matches INITIAL_SETUP_TOKEN on Server |
| Sesuai Price List | Per Price List |
| Simpan Draf | Save Draft |
| Simposium | Symposium |
| Sinkron dari Data Aplikasi | Sync from Application Data |
| Situs Publik Belum Tayang | Public Site Not Yet Published |
| Situs Web | Website |
| Solusi | Solutions |
| Solusi per Kategori | Solutions by Category |
| Spesifikasi | Specifications |
| Spesifikasi ringkas | Brief Specifications |
| Spesifikasi Teknis | Technical Specifications |
| Status | Status |
| Status izin edar | Marketing Authorization Status |
| Status Registrasi | Registration Status |
| Stok Bebas Gudang | Unreserved Warehouse Stock (Free Stock) |
| Stok Gudang Tersedia | Available Warehouse Stock |
| Stok Siap Kirim | Ready-to-Ship Stock |
| Sub-judul | Subtitle (Subheading) |
| Subjek Penawaran | Quotation Subject |
| Sumber angka | Figure Source (Data Source) |
| sumber data aplikasi | Application Data Provenance (App Data Source) |
| Sumber Daya | Resources |
| Surel | Email |
| Surel resmi | Official Email |
| Surel Resmi | Official Email |
| Susunan Seksi Beranda | Homepage Section Order |
| Tabel | Table |
| Tahan Situs | Hold Site (Suspend Site) |
| Tahap Perjalanan Layanan | Service Journey Stages |
| Tambah butir | Add Item |
| Tambah jumlah | Increase Quantity |
| Tambah jumlah unit | Increase Unit Quantity |
| Tambah RFQ | Add RFQ |
| Tampil | Visible |
| Tampilkan di situs | Show on Site |
| Tampilkan kata sandi | Show Password |
| Tampilkan Semua Produk | Show All Products |
| Tanya Jawab Teknis | Technical Q&A (Technical FAQ) |
| Tautan baca selengkapnya | Read More Link |
| Tautan baru | New Link |
| Tautan brosur | Brochure Link |
| Tautan dalam kolom | In-Column Link |
| Tautan footer | Footer Link |
| Tautan peta | Map Link |
| Tautan video demo | Demo Video Link |
| Tayang | Published (Live) |
| Teks catatan | Note Text |
| Teks menu | Menu Text |
| Teks portal pelanggan | Customer Portal Text |
| Teks tautan | Link Text |
| Teks tautan "lihat semua" | "View All" Link Text |
| Teks tombol | Button Text |
| Teks tombol cadangan | Secondary Button Text |
| Teks tombol utama | Primary Button Text |
| Telepon | Phone |
| Telepon kantor | Office Phone |
| Telepon Kantor | Office Phone |
| Telusuri grup ini | Browse This Group |
| Tender LPSE | LPSE Tender (Electronic Procurement Tender) |
| Tentang Kami | About Us |
| Terbit Terakhir | Last Published |
| Terbitkan | Publish |
| Terdaftar pada Register RA | Registered on RA Register |
| Tersalin | Copied |
| Tersedia di gudang distribusi CDAKB | Available at CDAKB (GDP) Distribution Warehouse |
| Tersimpan di Daftar RFQ | Saved in RFQ List |
| Testimoni Pelanggan | Customer Testimonials |
| Text potongan | Snippet Text (Excerpt) |
| Tim Komersial Pusat | Central Commercial Team |
| Tipe | Type |
| Tipe sesuai katalog merek | Type per Brand Catalog |
| Token Inisialisasi Setup | Setup Initialization Token |
| Tombol Header | Header Button |
| Total Alat Kesehatan | Total Medical Devices |
| Tujuan tautan "lihat semua" | "View All" Link Target |
| Tujuan tombol | Button Target |
| Tujuan tombol cadangan | Secondary Button Target |
| Tujuan tombol utama | Primary Button Target |
| Turun | Move Down |
| Turunkan seksi | Move Section Down |
| Turunkan urutan | Move Down in Order |
| Tutup detail produk | Close Product Details |
| Tutup form masuk | Close Login Form |
| Tutup Rincian | Close Details |
| Ulangi kata sandi | Repeat Password |
| Unduh Katalog PDF | Download PDF Catalog |
| Unduh Snapshot JSON | Download JSON Snapshot |
| Unggah Foto | Upload Photo |
| Unit | Unit |
| URL luar | External URL |
| URL portal pelanggan | Customer Portal URL |
| URL profil | Profile URL |
| Urutan Katalog | Catalog Order |
| Urutkan produk | Sort Products |
| Username Anda | Your Username |
| Verifikasi Register RA | Verify RA Register |
| Video Demonstrasi | Demonstration Video |
| WhatsApp Tim Sales | Sales Team WhatsApp |
| Workshop Klinis | Clinical Workshop |
| Zona Penyimpanan | Storage Zone |
| Zona suhu penyimpanan | Storage Temperature Zone |

### Istilah Inggris yang dipertahankan di UI

- Apr (website.txt)
- Desktop (website.txt)
- Detail (website.txt)
- Editor (website.txt)
- Escape (website.txt)
- Feb (website.txt)
- General (website.txt)
- Jan (website.txt)
- Jul (website.txt)
- Jun (website.txt)
- Live Preview (website.txt)
- Mar (website.txt)
- Nov (website.txt)
- Sep (website.txt)
- Tablet (website.txt)
- Tagline (website.txt)
- Username (website.txt)
- Website (website.txt)
- WhatsApp (website.txt)

### Catatan jumlah baris / dilewati

| Berkas sumber | Baris input | Baris tabel ditulis | Istilah Inggris | Dilewati (noise) |
| --- | --- | --- | --- | --- |
| website.txt | 342 | 320 | 19 | 3 |
| **Total** | **342** | **320** | **19** | **3** |

Rincian yang dilewati (3):
- website.txt (3): `mis. dev.utama` (placeholder contoh username / fragmen kode); `noopener noreferrer` (fragmen kode nilai atribut `rel` HTML); `X-Sync-Client-Id` (kode murni nama header HTTP).

Catatan aturan:
- Tiga baris pertama input memuat penomoran daftar ("1. Template Dasar", "2. Warna Merek", "3. Tipografi"); penanda nomor "1./2./3." diperlakukan sebagai penomoran list (non-UI) dan dilepas, sehingga istilah yang diglosariumkan adalah "Template Dasar", "Warna Merek", "Tipografi". Tidak ada istilah yang dikarang; seluruh 342 baris input terpetakkan 1:1.
- Placeholder/kalimat prosa ≤6 kata tetap diterjemahkan (mis. "Brosur teknis dilampirkan bersama penawaran resmi", "Kata sandi developer minimal 8 karakter.", "Kredensial disimpan permanen dalam hash", "Tersedia di gudang distribusi CDAKB"); hanya placeholder >6 kata yang dilewati (tidak ada pada input ini).
- Singkatan bulan yang berbeda dari Inggris (Mei, Ags, Okt, Des) diterjemahkan (May, Aug, Oct, Dec). Singkatan bulan yang ejaannya identik dengan Inggris (Jan, Feb, Mar, Apr, Jun, Jul, Sep, Nov) serta kata serapan yang ejaannya identik dengan Inggris dan tanpa pemetaan baku (Detail, Editor, Tablet) dimasukkan ke daftar istilah Inggris yang dipertahankan.
- Duplikat varian huruf besar/kecil dan tanda elipsis (mis. "Grup katalog"/"Grup Katalog", "Mengolah..."/"Mengolah…", "Hubungi Kami"/"HUBUNGI KAMI") dipertahankan sebagai baris terpisah sesuai daftar input.
- Akronim dan nama merek dipertahankan apa adanya (NIE, CDAKB, RFQ, LPSE, RA, AMS, REMEDI, PDF, JSON, URL, H1, Kemenkes, RI, INITIAL_SETUP_TOKEN); ekspansi seperti MoH/GDP diberikan dalam kurung sebagai alternatif.


## Label Status & Kategori (Model Domain / types)


| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| 3PL Ekspedisi | Third-Party Logistics (3PL Expedition) |
| Aktif | Active |
| Aktif Resmi | Officially Active (Authorized Active) |
| Aktif Terkunci | Active – Locked |
| Alokasi FEFO Gudang | Warehouse FEFO Allocation |
| Aman | Safe |
| Antre | Queued |
| Antre Picking | Picking Queue |
| Apotek | Pharmacy |
| Area Perakitan Terkendali | Controlled Assembly Area |
| Armada Internal | Internal Fleet |
| Aset | Assets |
| Aset Lancar | Current Assets |
| Aset Tidak Lancar | Non-current Assets |
| Audit Internal | Internal Audit |
| Audit Pengawasan | Surveillance Audit |
| Badan Sertifikasi Akreditasi KAN | KAN-Accredited Certification Body |
| Bahan Baku Datang | Incoming Raw Material |
| Bahan Baku Steril | Sterile Raw Material |
| Baik | Good |
| Barang Masuk Gudang | Warehouse Goods Receipt (Incoming Goods) |
| Baru | New |
| Batch Tidak Sesuai PO | Batch Not Matching PO (PO-Mismatched Batch) |
| Batch Tidak Terdaftar | Unregistered Batch |
| Bea Masuk | Import Duty |
| Beban | Expenses |
| Beban Lain-lain | Other Expenses |
| Beban Operasional | Operating Expenses |
| Bebas Hama | Pest-free |
| Bebas Konflik | Conflict-free |
| Bebas PPN | VAT-exempt (PPN-exempt) |
| Belum Diaudit | Not Yet Audited |
| Belum Dicocokkan | Not Yet Matched |
| Belum Dihitung | Not Yet Counted |
| Belum Dilaporkan | Not Yet Reported |
| Belum Diuji | Not Yet Tested |
| Belum Jatuh Tempo | Not Yet Due |
| Belum Memenuhi Target | Target Not Yet Met |
| Belum Sinkron | Not Yet Synced |
| Belum Terakreditasi | Not Yet Accredited |
| Belum Terbit | Not Yet Issued |
| Belum Terkirim | Not Yet Sent (Not Yet Shipped) |
| Berjalan | Ongoing (In Progress) |
| Berlaku | Valid (In Force) |
| Biaya Retur Mutu | Quality Return Cost |
| Biaya Uji Kalibrasi | Calibration Test Cost |
| Bin Tidak Sesuai Zona | Bin Outside Zone (Zone-Mismatched Bin) |
| BMR Produksi | Production BMR (Batch Manufacturing Record) |
| Cacat Kemasan | Packaging Defect |
| CAPA Berjalan | CAPA In Progress (Ongoing CAPA) |
| Catatan Belum Lengkap | Incomplete Records |
| Cedera Ringan | Minor Injury |
| Check-In GPS Terverifikasi | GPS-Verified Check-In |
| Cleanroom Kelas C | Class C Cleanroom |
| Cleanroom Kelas D | Class D Cleanroom |
| Cocok | Matched |
| Dalam Pengawasan Recall | Under Recall Surveillance (Recall Monitoring) |
| Dalam Pengiriman | In Transit (Out for Delivery) |
| Dalam Penyelidikan | Under Investigation |
| Dalam Perbaikan | Under Repair |
| Dalam Perpanjangan | Renewal In Progress |
| Dalam Proses | In Progress |
| Dalam Proses OSS | OSS Processing In Progress |
| Debet | Debit |
| Demo Produk | Product Demo |
| Di Gudang | In Warehouse |
| Di Ruang Karantina | In Quarantine |
| Diagnostik In Vitro | In Vitro Diagnostic (IVD) |
| Diajukan | Submitted |
| Dibatalkan | Cancelled |
| Dibayar | Paid |
| Diblokir Overlimit | Blocked – Over Credit Limit |
| Diblokir Regulasi | Blocked – Regulatory |
| Dikembalikan | Returned |
| Dikembalikan ke Pabrik | Returned to Manufacturer |
| Dikonversi Menjadi Pembelian | Converted to Purchase |
| Dikunci | Locked |
| Dimenangkan | Won |
| Dimuat | Loaded |
| Dimusnahkan | Destroyed |
| Dinas Kesehatan | Local Health Office (Dinas Kesehatan) |
| Diproses | Processed |
| Disetujui | Approved |
| Disetujui PJT | Approved by PJT (Technical Responsible Person) |
| Distributor Resmi | Authorized Distributor |
| Distributor Tunggal | Sole Distributor |
| Ditangguhkan | Suspended |
| Ditarik Kembali ke Gudang | Recalled to Warehouse (Returned to Warehouse) |
| Ditemukan Indikasi | Indication Found (Findings Detected) |
| Diterima Fasyankes | Received by Healthcare Facility |
| Diterima Penerima | Received by Recipient |
| Ditolak | Rejected |
| Ditolak Penerimaan | Rejected at Receiving |
| Ditutup | Closed |
| Diverifikasi PJT | Verified by PJT |
| Draf | Draft |
| Dugaan Kerusakan Fungsi | Suspected Functional Failure |
| e-Katalog LKPP | LKPP e-Catalogue |
| e-Katalog Mini Kompetisi | Mini-Competition e-Catalogue |
| Edukasi Spesialis | Specialist Education |
| Efektif Diverifikasi | Verified Effective |
| Efisiensi Manufaktur | Manufacturing Efficiency |
| Ekuitas | Equity |
| Elektromedik Non Radiasi | Electromedical (Non-radiating) |
| Elektromedik Radiasi | Electromedical (Radiating) |
| Entri manual | Manual Entry |
| Fogging Sanitasi | Sanitation Fogging |
| Formulir | Form |
| Gagal | Failed |
| Gudang Distribusi | Distribution Warehouse |
| Gudang Karantina | Quarantine Warehouse |
| Gudang Retur | Returns Warehouse |
| Gudang Utama | Main Warehouse |
| Habis Masa | Expired |
| Hadir | Present |
| hampir balance | Nearly Balanced |
| Hampir Tutup | Closing Soon (Nearly Closed) |
| Harga Distributor | Distributor Price |
| Harga Eceran | Retail Price |
| Harga Institusi | Institutional Price |
| Harga Pokok Penjualan | Cost of Goods Sold (HPP / COGS) |
| Harus Diperpanjang Segera | Immediate Renewal Required |
| Hilang | Missing (Lost) |
| Hubungi Kami | Contact Us |
| Implementasi | Implementation |
| Impor CSV | CSV Import |
| Indonesia Timur | Eastern Indonesia (sales territory) |
| Inspeksi Fisik | Physical Inspection |
| Inspeksi Kemenkes | Ministry of Health (Kemenkes) Inspection |
| Instruksi Kerja | Work Instruction |
| Investigasi | Investigation |
| Investigasi Bersama Kemenkes | Joint Investigation with Ministry of Health (Kemenkes) |
| Izin | License (Permit) |
| Jadwal Mendatang | Upcoming Schedule |
| Jaringan RS Swasta | Private Hospital Network |
| Jawa Barat | West Java (sales territory) |
| Jawa Timur | East Java (sales territory) |
| Jumlah Melebihi Manifes | Quantity Exceeds Manifest |
| Kalah | Lost |
| Kalibrasi Berkala | Periodic Calibration |
| Kantor Pusat | Head Office |
| Kapitalisasi Persediaan | Inventory Capitalization |
| Karantina | Quarantine (Hold) |
| Karantina Pusat | Central Quarantine |
| Kargo Udara | Air Cargo |
| Kecelakaan Kerja | Occupational Accident (Work Accident) |
| Kedaluwarsa | Expired (Expiry) |
| Kelas A | Class A |
| Kelas B | Class B |
| Kelas C | Class C |
| Kelas D | Class D |
| Keluhan Fasyankes | Healthcare Facility Complaint |
| Kemasan Rusak | Damaged Packaging |
| Kematian | Death (Fatality) |
| Kementerian Kesehatan RI | Ministry of Health of the Republic of Indonesia |
| Kerusakan | Damage (Breakdown) |
| Ketidaksesuaian Suhu | Temperature Nonconformity (Temperature Deviation) |
| Kewajiban | Liabilities |
| Kewajiban Lancar | Current Liabilities |
| Kewajiban Tidak Lancar | Non-current Liabilities |
| Klinik | Clinic |
| Klinik Mandiri | Independent Clinic |
| Klinik Pratama | Primary Clinic (Klinik Pratama) |
| Klinik Utama | Specialist Clinic (Klinik Utama) |
| Konsultasikan Kebutuhan Anda | Consult Your Needs |
| Konversi Jadi Penjualan | Convert to Sale |
| Konversi Sales Order | Sales Order Conversion |
| Kredit | Credit |
| Kredit Pajak | Tax Credit |
| Label Tidak Jelas | Illegible Label |
| Laboratorium | Laboratory |
| Laboratorium Medis | Medical Laboratory |
| Lampu UV Serangga | UV Insect Light (Insect Light Trap) |
| Layak Jual Kembali | Fit for Resale |
| Lewat Jatuh Tempo | Overdue |
| lihat semua | View All (See All) |
| Lolos | Released (Pass) |
| Lolos Parameter Klinis | Clinical Parameters Passed |
| Lolos Validasi CDAKB | CDAKB (GDP) Validation Passed |
| Lunas | Paid in Full (Settled) |
| Madya | Intermediate (Madya) |
| Mahir | Proficient |
| Malfungsi Tanpa Cedera | Malfunction Without Injury |
| Manajemen Suhu Dingin | Cold Chain Temperature Management |
| Mangkir | Absent Without Notice (No-show) |
| Memenuhi Etika Promosi | Promotional Ethics Compliant |
| Memenuhi Syarat | Acceptable |
| Mendekati Berakhir | Nearing End (Approaching Expiry) |
| Mendekati Kedaluwarsa | Near Expiry |
| Menunggu | Pending |
| Menunggu Alokasi FEFO | Awaiting FEFO Allocation |
| Menunggu Evaluasi | Awaiting Evaluation |
| Menunggu Jadwal | Awaiting Schedule |
| Menunggu Jatuh Tempo | Awaiting Due Date |
| Menunggu Persetujuan | Awaiting Approval |
| Menunggu Suku Cadang | Awaiting Spare Parts |
| Menurun | Declining (Decreasing) |
| Negosiasi | Negotiation |
| Negosiasi Harga | Price Negotiation |
| Non Elektromedik Non Steril | Non-Electromedical Non-sterile |
| Non Elektromedik Steril | Non-Electromedical Sterile |
| Non-aktif | Inactive |
| Nonaktif | Inactive |
| Normal | Normal |
| Operator | Operator |
| Opname | Stocktake |
| OSS-RBA | Online Single Submission – Risk-Based Approach (OSS-RBA) |
| Pabrik Manufaktur | Manufacturing Plant |
| Pabrikan Dalam Negeri | Domestic Manufacturer |
| Pajak Keluaran | Output Tax |
| Pameran | Exhibition |
| Pameran Hospital Expo | Hospital Expo Exhibition |
| Pameran Internasional | International Exhibition |
| Paripurna | Plenary (highest accreditation level) |
| Pascapenjualan | After-sales |
| Pedoman Mutu | Quality Manual |
| Pembelian Langsung RS Swasta | Direct Purchase by Private Hospital |
| Pemberitahuan Dikirim | Notification Sent |
| Pemeliharaan | Maintenance |
| Pemeliharaan Preventif | Preventive Maintenance |
| Pemenang | Winner |
| Pemenang Tender | Tender Winner |
| Pemeriksaan Pra-Kirim | Pre-shipment Inspection |
| Pemindahan Rak | Shelf Transfer (Rack Transfer) |
| Pemusnahan | Disposal |
| Penarikan Lapangan | Field Recall |
| Penarikan Recall | Product Recall |
| Penawaran Resmi | Official Quotation |
| Penawaran Teknis | Technical Quotation |
| Penawaran Terkirim | Quotation Sent |
| Pendapatan | Revenue |
| Pendapatan Alkes | Medical Device Revenue |
| Pendapatan Lain-lain | Other Revenue |
| Pendapatan Operasional | Operating Revenue |
| Penerimaan | Receiving |
| Penerimaan Gudang | Warehouse Receiving |
| Pengadaan Langsung | Direct Procurement |
| Pengadaan Suku Cadang | Spare Parts Procurement |
| Pengemasan Primer | Primary Packaging |
| Penggantian Berkala | Periodic Replacement |
| Pengiriman | Shipping (Delivery) |
| Pengumpulan Dokumen Tender | Tender Document Collection |
| Penimbangan | Weighing |
| Penyakit Akibat Kerja | Occupational Disease |
| Penyelidikan | Investigation |
| Penyesuaian | Adjustment |
| Penyusunan Proposal | Proposal Preparation |
| Perakitan | Assembly |
| Perangkap Umpan | Bait Trap |
| Perbaikan Kerusakan | Damage Repair |
| Perencanaan | Planning |
| Peringatan | Warning |
| Peringatan Keselamatan | Safety Warning |
| Peringatan Plafon | Credit Ceiling Warning |
| Peringatan Suhu Rendah | Low Temperature Warning |
| Peringatan Suhu Tinggi | High Temperature Warning |
| Peringatan Tumpang Tindih | Overlap Warning |
| Perkenalan Alat | Device Introduction (Product Introduction) |
| Perlu Evaluasi | Evaluation Required |
| Perlu Kalibrasi | Calibration Required |
| Perlu Pembaruan Dokumen | Document Update Required |
| Perlu Penanganan Khusus | Special Handling Required |
| Perlu Penyetelan | Adjustment Required |
| Perlu Perbaikan | Repair Required |
| Perlu Re-evaluasi | Re-evaluation Required |
| Perlu Review Dokumen Teknis | Technical Document Review Required |
| Perlu Review PJT | PJT Review Required |
| Perlu Ujian Ulang | Retest Required |
| Perlu Verifikasi PJT | PJT Verification Required |
| Perlu Verifikasi Ulang | Re-verification Required |
| Perpanjangan | Renewal (Extension) |
| Perubahan Stok | Stock Change |
| Pesan Oligo | Oligo Order |
| Portal Pelanggan | Customer Portal |
| Potensi Overstock | Potential Overstock |
| PPN 11% Terbit Faktur Pajak | 11% VAT – Tax Invoice Issued |
| PPN Impor | Import VAT (PPN Impor) |
| PPN Keluaran | Output VAT (PPN Keluaran) |
| PPN Masukan | Input VAT (PPN Masukan) |
| Pratama | Basic (Pratama) |
| Prinsipal Luar Negeri | Foreign Principal |
| Printer Label | Label Printer |
| Produk Jadi Manufaktur | Manufactured Finished Goods |
| Proses Pengerjaan | Work in Process (Processing) |
| Rata-rata Tertimbang | Weighted Average |
| Rekomendasi Recall | Recall Recommendation |
| Rencana | Planned (Plan) |
| Rendah | Low |
| Revisi Diusulkan | Revision Proposed |
| Rilis QC | QC Release |
| RS Pemerintah | Government Hospital |
| RS Pemerintah Kelas A | Class A Government Hospital |
| RS Pemerintah Kelas B | Class B Government Hospital |
| RS Swasta | Private Hospital |
| Rujukan | Referral |
| Rute Tersusun | Route Generated (Route Planned) |
| Sakit | Sick |
| Salah Kirim | Mis-shipment |
| Sangat Baik | Very Good |
| Sedang | Medium |
| Sedang Berlangsung | Ongoing |
| Sedang Picking | Picking In Progress |
| Sedang Uji Coba di RS | Hospital Trial In Progress |
| Selesai | Completed |
| Selesai Kunjungan | Visit Completed |
| Selesai Packing | Packing Completed |
| Selisih | Discrepancy (Variance) |
| Selisih Diajukan | Discrepancy Submitted |
| Selisih Jumlah | Quantity Discrepancy |
| Sertifikat CPAKB | CPAKB (GMP) Certificate |
| Sesuai | Compliant |
| Simposium | Symposium |
| Situs Web | Website |
| Skrining CV | CV Screening |
| Stabil | Stable |
| Sterilisasi | Sterilization |
| Stok Cukup | Sufficient Stock |
| Stok Terkunci Karantina | Stock Locked in Quarantine |
| Sudah Tutup | Already Closed |
| Sumatera | Sumatra (sales territory) |
| Taksiran Manajemen | Management Estimate |
| Temuan QC | QC Finding |
| Tender Mandiri RS | Hospital Self-Managed Tender |
| Tender RS Pemerintah | Government Hospital Tender |
| Tender Terbuka LPSE | LPSE Open Tender |
| Tentang Kami | About Us |
| Terbayar | Paid |
| Terbit | Issued |
| Terbuka | Open |
| Tercapai - Siap Klaim | Achieved – Ready to Claim |
| Tercemar | Contaminated |
| Terinstalasi di Fasyankes | Installed at Healthcare Facility |
| Terjadwal | Scheduled |
| Terjual | Sold |
| Terkirim | Shipped (Sent) |
| Terkirim ke e-Watch Alkes | Sent to e-Watch Alkes (Medical Device e-Watch) |
| Terkirim ke Gudang | Sent to Warehouse |
| Terkualifikasi | Qualified |
| Terkunci | Locked |
| Terlambat | Late (Overdue) |
| Termin Bertahap | Staged Installments (Progressive Payment Terms) |
| Terpinjam | On Loan (Borrowed) |
| Tersinkron | Synced |
| Tertunda | Postponed (Delayed) |
| Tervalidasi | Validated |
| Tervalidasi Digital | Digitally Validated |
| Tervalifikasi PJT | Validated by PJT |
| Terverifikasi | Verified |
| Tes Teknis | Technical Test |
| Tetap | Permanent (Fixed) |
| Tiba di Gudang | Arrived at Warehouse |
| Tidak Berlaku | Not Valid (Not Applicable) |
| Tidak Diperlukan | Not Required |
| Tidak Layak Pakai | Unfit for Use |
| Tidak Memenuhi Syarat | Unacceptable (Not Acceptable) |
| Tidak Valid | Invalid |
| Tindak Lanjut CAPA | CAPA Follow-up |
| Tinggi | High |
| Tunai | Cash |
| Unit Demo | Demo Unit |
| Usang | Obsolete |
| Utama | Advanced (Utama) |
| Valid | Valid |
| Verifikasi Pesanan | Order Verification |
| Wawancara User | User Interview |
| Webinar Medis | Medical Webinar |
| Workshop Klinis | Clinical Workshop |

### Istilah Inggris yang dipertahankan di UI

- Background Check
- Blind Count
- Blocked
- Cold Call
- Cold Room
- Decommissioning
- Device
- Double opt-in
- Draft
- E-Purchasing
- Enabled
- Fit to Work
- Fit with Restriction
- Gold
- Gross
- Gross Up
- Group
- Handheld PDA
- Immunization
- Imported
- Major NC
- Manual HR
- Minor NC
- Monitoring
- Near Miss
- Net
- Offering
- Onboarding
- Open Count
- Organization
- Outsourcing
- Picking
- Platinum
- Posted
- Private
- Public
- Public list
- Purchase Order
- Recall
- RFID Gate
- RFID Tunnel
- Silver
- Trainee
- Trainer
- Unsubscribe
- Unsubscribed
- Void

### Catatan jumlah baris / dilewati

| Berkas sumber | Baris input | Baris tabel ditulis | Istilah Inggris | Dilewati (noise) |
| --- | --- | --- | --- | --- |
| types.txt | 420 | 367 | 47 | 6 |
| **Total** | **420** | **367** | **47** | **6** |

Rincian yang dilewati (6):
- Kode murni / prefiks kode departemen-dokumen (5): `PB-DIST`, `PB-IT`, `PB-QA`, `PB-REG`, `PB-SALES`.
- Fragmen kode / identifier PascalCase tanpa spasi (1): `SupplyDelivery`.

Catatan aturan:
- Placeholder kalimat ≤6 kata tetap diterjemahkan (mis. "Konsultasikan Kebutuhan Anda", "PPN 11% Terbit Faktur Pajak", "Tercapai - Siap Klaim"); tidak ada placeholder >6 kata pada input ini.
- Nama wilayah/provinsi (`Indonesia Timur`, `Jawa Barat`, `Jawa Timur`, `Sumatera`) diperlakukan sebagai label teritorial penjualan (bukan nama negara/alamat), sehingga tetap diterjemahkan. `Kementerian Kesehatan RI` dan `Dinas Kesehatan` dipertahankan sebagai label penerbit/otoritas (issuer).
- Istilah dengan ejaan sama dalam kedua bahasa (`Normal`, `Operator`, `Valid`) diperlakukan sebagai istilah Indonesia dan dipetakan ke padanan identik, konsisten dengan perlakuan "Unit" pada modul lain.
- Pasangan `Draf` (Indonesia) dan `Draft` (Inggris) dipisahkan: `Draf` masuk tabel, `Draft` masuk daftar istilah Inggris. Demikian pula `Nonaktif` / `Non-aktif` (keduanya Indonesia → Inactive).
- Akronim regulator dipertahankan dan diberi perluasan bila perlu: KAN, Kemenkes, LKPP, LPSE, OSS-RBA, CDAKB (GDP), CPAKB (GMP), PJT, BMR, FEFO, PPN (VAT), HPP (COGS), e-Watch Alkes.
- Tidak ada istilah yang dikarang di luar daftar input; tidak ada berkas lain yang diubah.

## Utilitas & Layanan (utils, services)


### utils.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
|---|---|
| Acuan Regulasi CDAKB | CDAKB (GDP) Regulatory Reference |
| Acuan Regulasi CDAKB Kemenkes RI | CDAKB (GDP) Regulatory Reference – Kemenkes RI (MoH) |
| Ada nomor identifikasi unik dokumen | Document has a unique identification number |
| Aktif | Active |
| Akun | Account |
| ALUR LAYANAN | Service Flow |
| Aman | Safe |
| Amber Tua | Dark Amber |
| Angkut luar negeri | Overseas Transport (International Shipping) |
| Antre | Queued |
| Antre Picking | Picking Queue |
| apa pun | Anything |
| Arang | Charcoal |
| Area Karantina Terkunci | Locked Quarantine Area |
| Arsip Digital 5 Tahun | 5-Year Digital Archive |
| Aset | Assets |
| Asuransi kargo | Cargo Insurance |
| Aturan | Rule |
| Audit Internal SMM | QMS (SMM) Internal Audit |
| Bahaya | Danger (Hazard) |
| Batch Tidak Sesuai PO | Batch Does Not Match PO |
| Batch Tidak Terdaftar | Unregistered Batch |
| Beban | Expenses |
| Beban Lain-lain | Other Expenses |
| Beban Operasional | Operating Expenses |
| Belum ada item produk yang dipilih. | No product items selected yet. |
| belum ada pergerakan | No movement yet |
| Belum check-in di lapangan | Not yet checked in on site |
| BELUM DIKIRIM KE DJP | Not yet submitted to DJP (Directorate General of Taxes) |
| Belum Diuji | Not Yet Tested |
| Belum pernah disimpan | Never saved |
| Belum Siap | Not Ready |
| Belum Terkirim | Not Yet Shipped |
| Beranda | Home |
| Berdasarkan Grup Katalog | By Catalog Group |
| Berjalan | Running (In Progress) |
| Berlaku | Valid |
| Berlaku Hingga | Valid Until |
| Biaya Retur Mutu | Quality Return Cost |
| Biaya Uji Kalibrasi | Calibration Test Cost |
| Bin Tidak Sesuai Zona | Bin Not in Matching Zone |
| Biru Institusi | Institutional Blue |
| Biru Langit | Sky Blue |
| Buku Besar Belum Dibuka | General Ledger Not Yet Opened |
| Capaian Terukur | Measurable Achievements |
| Catatan Evaluasi Auditor | Auditor Evaluation Notes |
| Catatan Verifikasi PJT | PJT Verification Notes |
| Debet | Debit |
| dengan zona sesuai | With matching zone |
| DETAIL DOKUMEN PENAWARAN | Quotation Document Details |
| Di Gudang | In Warehouse |
| Di Ruang Karantina | In Quarantine |
| Diagnostik In Vitro | In Vitro Diagnostic (IVD) |
| Dibatalkan | Cancelled |
| Diblokir | Blocked |
| Dijeda | Paused |
| Dikunci | Locked |
| Disetujui | Approved |
| Diskon | Discount |
| Diskon Tambahan | Additional Discount |
| Diterima Penerima | Received by Recipient |
| Ditolak | Rejected |
| Ditutup | Closed |
| Draf | Draft |
| Efektif Diverifikasi | Verified Effective |
| Ekuitas | Equity |
| Elektromedik Non Radiasi | Electromedical (Non-radiating) |
| Elektromedik Radiasi | Electromedical (Radiating) |
| Fasyankes Mitra | Partner Healthcare Facility |
| Font sistem perangkat Anda | Your device's system font |
| Frekuensi log suhu sesuai konfigurasi | Temperature log frequency as configured |
| Gagal | Failed |
| gagal membaca berkas | Failed to read file |
| Gagal membuat akun developer awal. | Failed to create initial developer account. |
| Gagal memperbarui kata sandi. | Failed to update password. |
| gagal memuat gambar | Failed to load image |
| Gudang Utama | Main Warehouse |
| Hal yang Paling Sering Ditanyakan | Frequently Asked Questions (FAQ) |
| Harga FOB | FOB Price |
| Harga Pokok Penjualan | Cost of Goods Sold (HPP/COGS) |
| Harga Satuan | Unit Price |
| Harga skema aktif | Active scheme price |
| Hash Tidak Cocok | Hash Mismatch |
| Hero utama | Main Hero |
| Hijau Klinis | Clinical Green |
| Hilang | Missing (Lost) |
| Hubungi Kami | Contact Us |
| Ikuti Kami | Follow Us |
| Instalasi, pemeliharaan, perbaikan, dan sertifikat kalibrasi. | Installation, maintenance, repair, and calibration certificates. |
| Institusi yang Dilayani | Institutions Served |
| izin edar | Marketing Authorization (MA No.) |
| Izin Edar Aktif | Active Marketing Authorization |
| Izin edar produk berstok masih berlaku | Marketing authorization of stocked products still valid |
| Izin Operasional Fasyankes | Healthcare Facility Operating License |
| Jalur Pengadaan | Procurement Channel |
| Jumlah Baris | Row Count (Number of Lines) |
| Jumlah Melebihi Manifes | Quantity Exceeds Manifest |
| Kantor Pusat | Head Office |
| Kapitalisasi persediaan | Inventory Capitalization |
| Karantina | Quarantine (Hold) |
| Karantina Pusat | Central Quarantine |
| Kata Pelanggan Kami | What Our Customers Say (Testimonials) |
| Kata sandi berhasil diperbarui. | Password updated successfully. |
| Katalog Produk | Product Catalog |
| KATALOG PRODUK | Product Catalog |
| Kategori | Category |
| Kedaluwarsa | Expiry / Expired |
| Kelengkapan Rekaman | Record Completeness |
| Keluar dari stok layak kirim | Deducted from ship-ready stock |
| Kemenkes RI | Kemenkes RI (Indonesian Ministry of Health) |
| Kepatuhan | Compliance |
| Keseimbangan | Balance |
| Ketelusuran Batch Alkes | Medical Device Batch Traceability |
| Ketersediaan Stok FEFO | FEFO Stock Availability |
| Ketidaksesuaian Suhu | Temperature Nonconformity |
| Kewajiban | Liabilities |
| Kewajiban kepabeanan dan pemasok | Customs and supplier obligations |
| Kiriman HL7 FHIR diterima Kemenkes | HL7 FHIR submission accepted by Kemenkes (MoH) |
| Kode Transaksi | Transaction Code |
| Konsultasi CTA | Consultation CTA (Call to Action) |
| Kontak | Contact |
| Kontrol Revisi | Revision Control |
| Kritis | Critical |
| Kurang Bayar | Underpayment |
| Lampiran suhu tersedia | Temperature attachment available |
| Lampirkan bukti verifikasi saat audit | Attach verification evidence during audit |
| Laporan Audit Berkala | Periodic Audit Report |
| Laporan hasil audit terdokumentasi | Audit result report documented |
| Laporan Karantina QC | QC Quarantine Report |
| Laporan Rilis QC | QC Release Report |
| Layanan | Services |
| Lebih Bayar | Overpayment |
| Lihat Detail | View Details |
| Lihat Katalog Produk | View Product Catalog |
| Log Jejak Audit Sistem | System Audit Trail Log |
| Lolos | Released / Pass |
| Lunas | Paid in Full |
| Masa Berlaku Valid | Validity Period |
| Memenuhi Syarat | Acceptable |
| Mengirim | Sending |
| Menunggu Evaluasi | Awaiting Evaluation |
| Menunggu siklus sinkronisasi berikutnya. | Waiting for the next sync cycle. |
| Nama Pembeli | Buyer Name |
| Nama pengguna atau kata sandi salah. | Incorrect username or password. |
| Navigasi | Navigation |
| Nihil | Nil (Zero) |
| No. Faktur | Invoice No. |
| Non Elektromedik Non Steril | Non-electromedical Non-sterile |
| Non Elektromedik Steril | Non-electromedical Sterile |
| Non-aktif | Inactive |
| Opname | Stocktake |
| Optimasi Stok | Stock Optimization |
| Otoritas Pengesahan PJT | PJT Approval Authority |
| pelanggan dengan kontrak aktif | Customers with active contracts |
| Pemasaran | Marketing |
| Pemasok dengan status audit mutu Terkualifikasi | Supplier with Qualified quality audit status |
| Pemeriksaan fisik kemasan dan segel steril | Physical inspection of packaging and sterile seal |
| Penandaan status karantina yang jelas | Clear quarantine status labeling |
| Penanggung Jawab Komersial | Commercial Person in Charge |
| Pendapatan | Revenue |
| Pendapatan Alkes | Medical Device Revenue |
| Penerimaan | Receiving |
| Penetapan PIC dan tenggat waktu penyelesaian | Assignment of PIC and completion deadline |
| Pengadaan Suku Cadang | Spare Parts Procurement |
| Pengendalian Dokumen Mutu | Quality Document Control |
| Pengiriman | Shipping (Delivery) |
| Penyelidikan | Investigation |
| Perihal | Subject |
| Peringatan Anomali Integritas | Integrity Anomaly Alert |
| Peringatan Suhu Tinggi | High Temperature Alert |
| Periode | Period |
| Periode retensi arsip minimum 5 tahun | Minimum 5-year archive retention period |
| Perlu Pembenahan | Improvement Needed |
| Perlu Persetujuan Manajemen | Management Approval Required |
| Perlu Pesan | Reorder Needed |
| Perlu Rekonsiliasi | Reconciliation Needed |
| Perlu Tindakan | Action Required |
| Perpanjangan | Renewal / Extension |
| Pertanyaan Umum | FAQ (Frequently Asked Questions) |
| PERTANYAAN UMUM | FAQ (Frequently Asked Questions) |
| Perumusan tindakan korektif dan preventif | Formulation of corrective and preventive actions |
| Pihak Pemesan | Ordering Party |
| PPh 22 impor tidak dapat dikreditkan | Import PPh 22 (income tax) not creditable |
| PPN 11% Terbit Faktur Pajak | 11% VAT – Tax Invoice Issued |
| PPN impor dapat dikreditkan | Import VAT creditable |
| PPN Keluaran | Output VAT |
| PPN Masukan dapat dikreditkan | Input VAT creditable |
| Prinsipal Terkualifikasi | Qualified Principal |
| Produk | Product |
| Program Mitra | Partner Program |
| Provinsi Terlayani | Provinces Served |
| Rantai Dingin | Cold Chain |
| Realisasi biaya belum tercatat | Cost realization not yet recorded |
| Recall berjalan tertelusur sampai fasyankes | Recall traceable down to healthcare facility |
| Referensi Klausul ISO 13485 | ISO 13485 Clause Reference |
| Rekaman CAPA | CAPA Records |
| Rekaman Produk Tidak Sesuai | Nonconforming Product Records |
| Rekaman tercatat secara kronologis | Records logged chronologically |
| Reklasifikasi karantina | Quarantine Reclassification |
| REMEDI Klasik | REMEDI Classic |
| REMEDI Premium Gelap | REMEDI Premium Dark |
| Rencana | Plan (Planned) |
| Rendah | Low |
| Revisi Diusulkan | Revision Proposed |
| Risiko Overstock | Overstock Risk |
| Risiko Stockout | Stockout Risk |
| Rose Farmasi | Pharmacy Rose |
| Rusak | Damaged |
| Sambungan | Connection |
| Sambungan Putus | Connection Lost |
| Scrap material gagal | Failed scrap material |
| Seimbang | Balanced |
| Selesai | Completed |
| Selisih di atas ambang diverifikasi PJT | Discrepancy above threshold verified by PJT |
| Selisih Diajukan | Discrepancy Submitted |
| Selisih Jumlah | Quantity Discrepancy |
| seluruh kuota terkunci pesanan aktif | All quota locked by active orders |
| seluruh pelanggan terdaftar | All registered customers |
| Semua | All |
| Semua Brand | All Brands |
| Semua Katalog Produk | All Product Catalogs |
| Semua Kegiatan | All Activities |
| SEMUA MODUL SISTEM | All System Modules |
| Semua Penawaran | All Quotations |
| Semua Produk | All Products |
| Semua Solusi | All Solutions |
| Sertifikat Perusahaan | Company Certificates |
| Sesuai | Compliant |
| Sesuai Daftar Harga Resmi | Matches Official Price List |
| sesuai kontrak | As per contract |
| Siap Audit | Audit Ready |
| Sistem Validator | Validator System |
| Skema harga aktif | Active pricing scheme |
| Solusi | Solutions |
| Solusi per Kategori | Solutions by Category |
| Status dokumen aktif berlaku | Document status active and valid |
| Status Temuan Audit | Audit Finding Status |
| Stok e-Katalog sinkron dengan kartu stok | e-Catalog stock synced with stock card |
| Stok Terkunci Karantina | Quarantine-Locked Stock |
| Sumber Daya | Resources |
| SURAT PENAWARAN HARGA | Price Quotation Letter |
| Tahap Perjalanan Layanan | Service Journey Stages |
| Tanda Tangan | Signature |
| Tanggal efektif mutakhir | Latest effective date |
| Tanggal Faktur | Invoice Date |
| Tanggal jadwal kirim tidak valid | Invalid delivery schedule date |
| Tanggal Terbit | Issue Date |
| Tanya Jawab | Q&A (Questions and Answers) |
| Temuan ketidaksesuaian ditindaklanjuti melalui mekanisme CAPA | Nonconformity findings followed up through CAPA mechanism |
| Tenggat Kembali Habis | Return Deadline Expired |
| Tentang Kami | About Us |
| TENTANG KAMI | About Us |
| Terbayar | Paid |
| Terbit | Issued |
| Terbuka | Open |
| Terjadwal | Scheduled |
| Terjual | Sold |
| Terkirim | Shipped |
| Terkualifikasi | Qualified |
| Terkunci | Locked |
| Terlambat | Late (Overdue) |
| Terpinjam | On Loan |
| Tervalidasi | Validated |
| Tervalidasi Digital | Digitally Validated |
| Testimoni | Testimonials |
| Tidak | No |
| tidak ada | None |
| Tidak Ada Aturan Cocok | No Matching Rule |
| Tidak ada recall terbuka | No open recalls |
| Tiga Dekade Melayani Fasilitas Kesehatan Indonesia | Three Decades Serving Indonesian Healthcare Facilities |
| Tindak Lanjut CAPA | CAPA Follow-up |
| Tindakan Perbaikan Disarankan | Corrective Action Recommended |
| Tinggi | High |
| titik pindai | Scan point |
| Toko Online | Online Store |
| TOTAL PENAWARAN | Quotation Total |
| Usang | Obsolete |
| Verifikasi Kepatuhan oleh PJT | Compliance Verification by PJT |
| Verifikasi Ketelusuran Gudang | Warehouse Traceability Verification |
| Waktu Mundur | Countdown |

### services.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
|---|---|
| Administrator IT | IT Administrator |
| Administrator Sistem | System Administrator |
| Akses Penuh | Full Access |
| Akun | Account |
| Alat Kesehatan Terdaftar | Registered Medical Device |
| Antre Picking | Picking Queue |
| Armada Internal | Internal Fleet |
| batch terpakai | Batch in use (occupied) |
| belum check-in | Not yet checked in |
| belum diterbitkan | Not yet issued |
| belum pernah terbit | Never issued |
| Belum Terbit | Not Yet Issued |
| Check-in kunjungan lapangan dengan geotag | Field visit check-in with geotag |
| Dalam Pengawasan Recall | Under Recall Surveillance |
| Diterima Fasyankes | Received by Healthcare Facility |
| Ditolak | Rejected |
| Dokumen opname tidak ditemukan | Stocktake document not found |
| Dokumen penerimaan tidak ditemukan | Receiving document not found |
| Draf | Draft |
| e-Katalog LKPP | LKPP e-Catalog |
| Fetch tidak tersedia di lingkungan ini. | Fetch is not available in this environment. |
| Gagal | Failed |
| Gagal terhubung ke server untuk purge. | Failed to connect to server for purge. |
| Gudang Utama Distribusi | Main Distribution Warehouse |
| Input pra-order dari aplikasi lapangan | Pre-order input from field app |
| Jumlah pemindahan nol atau stok habis | Transfer quantity is zero or stock depleted |
| Jurnal tidak ditemukan di buku besar | Journal entry not found in general ledger |
| kapasitas bin | Bin capacity |
| Karantina | Quarantine (Hold) |
| Kemenkes RI | Kemenkes RI (Indonesian Ministry of Health) |
| KEMENKES RI Terdaftar | Registered with Kemenkes RI (MoH) |
| Kepala Gudang | Warehouse Head |
| Konfigurasi Gudang | Warehouse Configuration |
| Konversi pra-order lapangan menjadi Sales Order | Convert field pre-order to Sales Order |
| Konversi Sales Order | Sales Order Conversion |
| Lolos Parameter Klinis | Passed Clinical Parameters |
| Manajer Pemasaran | Marketing Manager |
| Manajer Penjualan | Sales Manager |
| Manajer Tender | Tender Manager |
| Manufaktur CPAKB | CPAKB (GMP) Manufacturing |
| Memenuhi Etika Promosi | Complies with Promotion Ethics |
| Menambahkan | Adding |
| Mengeluarkan | Issuing (Stock Out) |
| Menghubungkan ke Server Real-Time Sync... | Connecting to Real-Time Sync Server... |
| Menunggu Alokasi FEFO | Awaiting FEFO Allocation |
| Menunggu Jatuh Tempo | Awaiting Due Date |
| Operator Gudang | Warehouse Operator |
| Optimasi Stok | Stock Optimization |
| Pembaruan catatan CAPA ISO 13485 | ISO 13485 CAPA record update |
| Pembaruan dasar biaya persediaan per batch | Inventory cost basis update per batch |
| Pembaruan data izin edar alkes | Medical device marketing authorization data update |
| Pembaruan pesanan fasyankes | Healthcare facility order update |
| Pembaruan produk kembalian karantina | Quarantined returned product update |
| Pembaruan Purchase Order resmi | Official Purchase Order update |
| Pembaruan status periode buku | Accounting period status update |
| Pembaruan tetapan pajak | Tax assessment update |
| Pembukaan prospek baru pada pipeline | New lead opening in pipeline |
| Pemindahan Rak | Shelf Transfer |
| Pemindaian diterima | Scan accepted |
| Pemindaian ditolak | Scan rejected |
| Penanggung Jawab | Person in Charge |
| Pencatatan dasar biaya batch baru | New batch cost basis recording |
| Pencatatan hasil inspeksi mutu batch | Batch quality inspection result recording |
| Pencatatan laporan KTD e-Watch Alkes | Adverse event (KTD) report recording – e-Watch Alkes |
| Pencatatan master pelanggan B2B baru | New B2B customer master recording |
| Pendapatan Alkes | Medical Device Revenue |
| Penerbitan kontrak penguncian harga | Price-lock contract issuance |
| Penerbitan skema harga berjenjang | Tiered pricing scheme issuance |
| Penerimaan | Receiving |
| Penerimaan Inbound | Inbound Receiving |
| Pengaturan Newsletter | Newsletter Settings |
| Pengiriman | Shipping (Delivery) |
| Pengiriman Outbound | Outbound Shipping |
| Penguncian batch pada kartu stok | Batch locking on stock card |
| Penyimpanan draf konten website | Website content draft saving |
| Perencana Stok | Stock Planner |
| Pergerakan tahap opportunity pipeline | Opportunity pipeline stage movement |
| Perubahan aturan directed put-away | Directed put-away rule change |
| Perubahan dokumen penerimaan | Receiving document change |
| Perubahan kartu stok | Stock card change |
| Perubahan konfigurasi subscriber list | Subscriber list configuration change |
| Perubahan konfigurasi unit gudang | Warehouse unit configuration change |
| Perubahan lembar opname | Stocktake sheet change |
| Perubahan surat jalan | Delivery note change |
| Pesanan tidak ditemukan | Order not found |
| Petugas Sanitasi | Sanitation Officer |
| PPN 11% Terbit Faktur Pajak | 11% VAT – Tax Invoice Issued |
| Rantai Dingin | Cold Chain |
| Revisi dasar biaya batch | Batch cost basis revision |
| Ruang Sejuk Terpantau 24 Jam | Cool Room Monitored 24 Hours |
| rute picking | Picking Route |
| Rute Tersusun | Route Generated |
| Selesai | Completed |
| Sesi kedaluwarsa. Masuk kembali. | Session expired. Please log in again. |
| status surat jalan | Delivery note status |
| Struktur Gudang | Warehouse Structure |
| surat jalan | Delivery Note / Delivery Order |
| Surat jalan tidak ditemukan | Delivery note not found |
| tanpa nomor laporan | Without report number |
| Teknisi Elektromedik | Electromedical Technician |
| Terbit | Issued |
| Terbuka | Open |
| Terkirim | Shipped |
| Tervalidasi Digital | Digitally Validated |
| Tidak Berlaku | Not Valid (Invalid) |
| Tidak Layak Pakai | Unfit for Use |
| Verifikasi Pesanan | Order Verification |
| Website — Konten Situs Publik | Website — Public Site Content |

### Istilah Inggris yang dipertahankan di UI

Daftar gabungan (duplikat antarberkas dan varian kapitalisasi digabung; tanpa terjemahan):

- Administrator
- AMS Alkes Integrated System
- AMS Integrated System
- Batch
- Blocked
- Bundle
- Decommissioning
- Device
- Disposable
- Draft
- Enabled
- Error in listener callback
- Error in remote listener callback
- Every Life Matters
- Executive Overview
- Field
- General
- Google Sans
- Gross
- Gross Up
- HRIS — Core HR
- HRIS — Payroll
- Immunization
- Indigo
- Instagram
- Laboratory
- Lead QC Inspector
- Log ID
- Major NC
- Manual
- Medical Representative
- Minor NC
- Net
- No. Quotation
- Nominal
- Normal
- Organization
- Post-Market Surveillance
- Post-Market Vigilance
- Posted
- Posting
- Purchasing
- QA Manager
- Quality Assurance (juga muncul sebagai "quality assurance")
- Quality Control (juga muncul sebagai "quality control")
- Quotation
- Recall
- Regulatory Affairs
- REMEDI Minimal
- Request for Quotation
- Segoe UI
- Subtotal
- SupplyDelivery
- Supporting System
- Twitter
- Unit
- Unsubscribed
- Void
- X-Ray System

### Catatan jumlah

- utils.txt: 350 baris input = 280 baris tabel + 46 baris Inggris + 24 dilewati.
- services.txt: 145 baris input = 108 baris tabel + 18 baris Inggris + 19 dilewati.
- Total: 388 baris tabel ditulis; 43 baris dilewati; 64 baris Inggris (59 istilah unik pada daftar di atas).
- Rincian yang dilewati (43): nama orang 6 (Ahmad Fauzi; apt. Dewi Kartika, S.Si; Budi Utomo, S.T [2 berkas]; Farhan Maulana; Hendra Setiawan); nama perusahaan/badan usaha 11 (PT ANUGRAHMITRA SELARAS dan varian PT AMS/Anugrah Mitra Selaras); nama kota/fasilitas 2 (Jakarta; RSUD Pasar Minggu Jakarta Selatan); kode murni/fragmen teknis 24 (AGEING-ED, AKL-ALKES, ISOLASI-FISIK, IZIN-EDAR, KALIBRASI-B, KUNCI-TANPA-SEBAB, LOG-SUHU, PB-DIST, PB-IT, PB-QA, PB-REG, PB-SALES, QC-MASUK, RANTAI-DINGIN, RANTAI-HASH, UJI-FUNGSI, List-Unsubscribe-Post, DRAF-WEBSITE, INV-, LOG-, MOV-, OUT-FASYANKES, TAHAN-WEBSITE, X-Sync-Client-Id).
- Tidak ada placeholder >6 kata; seluruh pesan/logika ≤6 kata diterjemahkan dan dimasukkan ke tabel.
- Varian kapitalisasi duplikat dalam satu berkas (Katalog Produk/KATALOG PRODUK, Pertanyaan Umum/PERTANYAAN UMUM, Tentang Kami/TENTANG KAMI) tetap ditulis sebagai baris terpisah sesuai aturan satu baris per istilah input.


## Komponen UI Umum (Dashboard, Layout, Common, PWA)


### Sumber: components_dashboard.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| 10 Menit yang lalu | 10 minutes ago |
| 7 Divisi Utama Dipantau | 7 Main Divisions Monitored |
| Agu | Aug |
| Akses Penuh | Full Access |
| Akses Terbatas | Limited Access (Restricted Access) |
| Aksi | Action (Actions) |
| Aktif | Active |
| Aktif Berlaku | Active and Valid |
| Akun Akses Penuh | Full Access Account |
| Anda masuk sebagai | You are logged in as |
| Apakah Anda yakin ingin menghapus akun | Are you sure you want to delete this account? |
| Apakah Anda yakin ingin menghapus role | Are you sure you want to delete this role? |
| Apr | Apr |
| Atur Akses | Manage Access |
| Atur Batasan Kustom Per User | Set Custom Restrictions per User |
| Basis Peran Operasional | Operational Role Basis |
| Batal | Cancel |
| Batalkan grup | Ungroup (Cancel group) |
| Batasan Akses Modul | Module Access Restrictions |
| Belum ada data untuk grafik ini | No data for this chart yet |
| Belum ada sensor | No sensors yet |
| Belum tercatat | Not yet recorded |
| Berikan Akses Penuh Khusus User Ini | Grant Full Access to This User Only |
| Buat User Akun | Create User Account |
| Buat User Akun Baru | Create New User Account |
| Buka Modul Gudang | Open Warehouse Module |
| Buka Modul HRIS | Open HRIS Module |
| Buka Modul Keuangan | Open Finance Module |
| Buka Modul Komersial | Open Commercial Module |
| Buka Modul Produksi | Open Production Module |
| Buka Modul QA | Open QA Module |
| Buka Modul Regulatory | Open Regulatory Module |
| Bulan pembanding belum ada | No comparison month yet |
| Centang Semua | Check All (Select All) |
| Cetak Laporan | Print Report |
| Cetak Ringkasan Direksi | Print Executive Summary (Board Summary) |
| Daftar Role Sistem | System Role List |
| Des | Dec |
| Deskripsi Singkat | Brief Description |
| Deskripsi Tanggung Jawab | Responsibility Description |
| Ditutup | Closed |
| Diverifikasi | Verified |
| Edit detail akun | Edit account details |
| Efektif Diverifikasi | Verified Effective (Effectiveness Verified) |
| Email Perusahaan | Company Email |
| Feb | Feb |
| Filter role | Role Filter |
| Hadir | Present (Attendance) |
| Hanya baca | Read-only |
| Hanya Overview | Overview Only |
| Hapus akun | Delete account |
| Hapus Akun | Delete Account |
| Hapus Role | Delete Role |
| Harus Diperpanjang Segera | Needs Immediate Renewal |
| Ikuti Hak Akses Role | Follow Role Permissions |
| Ikuti Role | Follow Role (Inherit Role) |
| Izin Edar NIE Aktif | Active Marketing Authorization (NIE) |
| Jadikan Role Akses Penuh | Set as Full Access Role |
| Jan | Jan |
| Jul | Jul |
| Jun | Jun |
| Kata Sandi | Password |
| Kedaluwarsa | Expiry / Expired |
| Konfirmasi Hapus Role | Confirm Role Deletion |
| Konfirmasi Hapus User Akun | Confirm User Account Deletion |
| Kontrol Akses Penuh Aktif | Full Access Control Active |
| Kosongkan jika tidak mengubah sandi | Leave blank if not changing password |
| Kustom User | Custom per User |
| Lacak Batch | Track Batch (Batch Trace) |
| LKPP LPSE Terhubung | LKPP LPSE Connected |
| Lulus Sesuai Jadwal | Passed on Schedule |
| Mar | Mar |
| Mei | May |
| Memenuhi Etika Promosi | Meets Promotional Ethics |
| Minimal 8 karakter | Minimum 8 characters |
| Mode Batasan Akses Modul | Module Access Restriction Mode |
| Nama lengkap dan username wajib diisi. | Full name and username are required. |
| Nama Role | Role Name |
| Nama role tidak boleh kosong. | Role name cannot be empty. |
| Nonaktif | Inactive |
| Normal Aktif | Normal (Active) |
| Nov | Nov |
| Okt | Oct |
| Override Akses Kustom | Custom Access Override |
| Pengguna | User |
| Penuh | Full |
| per tenggat | per deadline |
| Perpanjangan | Renewal / Extension |
| Pilih semua di grup | Select all in group |
| Pusat Laporan KTD | Adverse Event (KTD) Report Center |
| Reset filter pencarian | Reset search filter |
| Role Akun | Account Role |
| Role Diberikan | Roles Granted |
| Role kustom | Custom role |
| Role kustom perusahaan. | Company custom role. |
| Role standar | Standard role |
| Role standar sistem | System standard role |
| Role yang dipilih tidak valid. | The selected role is invalid. |
| Selesai | Completed |
| Semua | All |
| Semua Role | All Roles |
| Sep | Sep |
| Simpan Batasan Akses Role | Save Role Access Restrictions |
| Simpan Perubahan Akun | Save Account Changes |
| Simpan Role Baru | Save New Role |
| Simpan User Akun | Save User Account |
| Sinkronisasi | Sync (Synchronization) |
| Sinkronisasi Aktif | Sync Active |
| Sistem Manajemen Mutu | Quality Management System (QMS) |
| Sistem Manajemen Mutu Perusahaan Tersertifikasi | Certified Company Quality Management System |
| SPT Masa Lapor | Periodic Tax Return (SPT) Filed |
| Status | Status |
| Status Akun | Account Status |
| Suhu Cold Chain | Cold Chain Temperature |
| Sumber Daya Manusia | Human Resources (HR) |
| Tambah Role Baru | Add New Role |
| Tampilkan atau sembunyikan kata sandi | Show or hide password |
| Tekanan Udara Normal | Normal Air Pressure |
| Teknisi Elektromedik | Electromedical Technician |
| Terkontrol Otomatis | Automatically Controlled |
| Terlambat | Overdue (Late) |
| Tidak ada modul dicentang | No modules checked |
| Total Pendapatan YTD | Total YTD Revenue |
| Total Role Terdaftar | Total Registered Roles |
| Total User Akun | Total User Accounts |
| User dengan checklist modul khusus | User with custom module checklist |
| Wewenang dan tanggung jawab role ini... | Authority and responsibilities of this role... |

### Sumber: components_common.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Alasan Penarikan | Recall Reason |
| Analisis Akar Penyebab | Root Cause Analysis |
| Belum ada rekaman audit internal. | No internal audit records yet. |
| Benang Bedah Polyglactin 910 Braided Absorbable | Polyglactin 910 Braided Absorbable Surgical Suture |
| Berita Acara Uji Fungsi | Functional Test Report (Official Record) |
| Farmasi RSUD | Regional Hospital (RSUD) Pharmacy |
| Fasilitas Pelapor | Reporting Facility |
| Hasil Pengujian Parameter | Parameter Test Results |
| Instruksi Bagi Fasyankes | Instructions for Healthcare Facilities (Fasyankes) |
| Judul Klausul | Clause Title |
| Jumat | Friday |
| Jumlah | Quantity |
| Kedaluwarsa | Expiry / Expired |
| Kepada Yth. | To (Attn:) |
| Kepala Instalasi ICU | Head of ICU Unit (ICU Department Head) |
| Kepatuhan | Compliance |
| Ketidaksesuaian Suhu Cold Room | Cold Room Temperature Nonconformity (NC) |
| Klasifikasi Dampak Pasien | Patient Impact Classification |
| Klausul | Clause |
| Kronologi Insiden | Incident Chronology |
| Laporan KTD e-Watch | e-Watch Adverse Event (KTD) Report |
| Logo Perusahaan | Company Logo |
| Malfungsi Alat Tanpa Cedera Klinis Pasien | Device Malfunction Without Patient Clinical Injury |
| Nama Alat Kesehatan | Medical Device Name |
| Nama Alkes | Medical Device (Alkes) Name |
| Nama Produk Alkes | Medical Device Product Name |
| No. Batch | Batch No. |
| No. Izin Edar | Marketing Authorization No. (MA No.) |
| Nomor Batch Terdampak | Affected Batch Number |
| Nomor CAPA | CAPA Number |
| Nomor Izin Edar Kemenkes RI | Ministry of Health (Kemenkes RI) Marketing Authorization No. (MA No.) |
| Nomor Referensi AMS | AMS Reference Number |
| Pada hari ini, | On this day, |
| Pemberitahuan Recall | Recall Notification |
| Penanggung Jawab Teknis | Technical Responsible Person (PJT) |
| Ruangan Penempatan | Placement Room |
| Status | Status |
| Status Efektivitas | Effectiveness Status |
| STRA Terdaftar Kemenkes | STRA Registered with Ministry of Health (Kemenkes) |
| Sumber Temuan | Finding Source |
| Telah Diverifikasi Efektif oleh PJT | Verified Effective by PJT (Technical Responsible Person) |
| Tindakan Koreksi | Correction (Immediate Fix) |
| Tindakan Mitigasi Segera | Immediate Mitigation Action |
| Tindakan Pencegahan | Preventive Action |
| Tingkat Klasifikasi Recall | Recall Classification Level |
| Tutup | Close |
| Uraian Masalah | Problem Description |

### Sumber: components_layout.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Akses Penuh | Full Access |
| Batal | Cancel |
| Beli | Buy (Purchase) |
| Buka menu aplikasi | Open application menu |
| Elektromedis Ber-STR | Electromedical Staff with STR (Registration Certificate) |
| Ganti Kata Sandi | Change Password |
| Ganti Kata Sandi Akun | Change Account Password |
| Gudang | Warehouse |
| Ikhtisar | Overview |
| Izin Edar | Marketing Authorization / Distribution License |
| Kata Sandi Saat Ini | Current Password |
| Keluar | Logout |
| Ketelusuran Nomor Batch | Batch Number Traceability |
| Lainnya | More (Others) |
| Manufaktur CPAKB | Manufacturing (CPAKB / GMP) |
| Menu pengguna | User menu |
| Menyimpan… | Saving… |
| Mode Cache Lokal | Local Cache Mode |
| Pajak | Tax |
| Penanggung Jawab Teknis | Technical Responsible Person (PJT) |
| Pengawasan Mutu Alkes | Medical Device Quality Control |
| Pengguna Terdaftar | Registered Users |
| RBAC Server Terverifikasi | RBAC Server Verified |
| Simpan Sandi | Save Password |
| Teknisi | Technician |
| Tutup menu | Close menu |

### Sumber: components_ui.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| Agustus | August |
| April | April |
| Desember | December |
| Februari | February |
| Januari | January |
| Juli | July |
| Juni | June |
| Maret | March |
| Mei | May |
| November | November |
| Oktober | October |
| September | September |
| Tutup | Close |

### Sumber: components_pwa.txt

| Istilah Indonesia | Padanan Inggris (rekomendasi) |
| --- | --- |
| 1. Ketuk tombol | 1. Tap the button |
| 2. Gulir ke bawah lalu ketuk | 2. Scroll down then tap |
| Mengerti | Got it (Understood) |
| PWA Aktif | PWA Active |

### Istilah Inggris yang dipertahankan di UI

- Add to Home Screen (components_pwa.txt)
- After-Sales Service (components_layout.txt)
- AMS Integrated System (components_layout.txt)
- AMS Integrated System v2.4.0 (components_layout.txt)
- Cockpit (components_layout.txt)
- Cold Chain (components_dashboard.txt)
- Escape (components_layout.txt)
- Executive Overview (components_layout.txt)
- Install iOS (components_pwa.txt)
- Install PWA (components_pwa.txt)
- IT Hub (components_layout.txt)
- Manufacture (components_layout.txt)
- Manufacture CPAKB (components_dashboard.txt)
- Overview (components_layout.txt)
- PocketBase Realtime (components_layout.txt)
- QA Manager (components_common.txt)
- Real-Time Board Cockpit (components_dashboard.txt)
- Regulatory Affairs (components_layout.txt)
- Reset Default (components_dashboard.txt)
- Sales e-Katalog LKPP (components_layout.txt)
- Share (components_pwa.txt)
- Staff (components_layout.txt)
- Supporting System (components_layout.txt)
- Username Login (components_dashboard.txt)
- Website (components_layout.txt)

### Catatan jumlah baris / dilewati

| Berkas sumber | Baris input | Baris tabel ditulis | Istilah Inggris | Dilewati (noise) |
| --- | --- | --- | --- | --- |
| components_dashboard.txt | 132 | 127 | 5 | 0 |
| components_common.txt | 59 | 47 | 1 | 11 |
| components_layout.txt | 49 | 26 | 15 | 8 |
| components_ui.txt | 13 | 13 | 0 | 0 |
| components_pwa.txt | 8 | 4 | 4 | 0 |
| **Total** | **261** | **217** | **25** | **19** |

Rincian yang dilewati (19):
- components_common.txt (11): `Ahmad Fauzi` (nama orang); `apt. Dewi Kartika, S.Si` (nama orang); `Budi Utomo, S.T` (nama orang); `Dian Nugraha, A.Md.TEM` (nama orang); `dr. Rahmat Hidayat, Sp.An` (nama orang); `Siti Rahma` (nama orang); `PJT Alkes PT Anugrahmitra Selaras` (nama perusahaan/identitas blok tanda tangan); `PT ANUGRAHMITRA SELARAS` (nama perusahaan); `RSUD Pasar Minggu` (nama fasilitas); `RSUD Pasar Minggu, Jakarta Selatan` (nama fasilitas + alamat); `RSUD Tarakan Jakarta Pusat` (nama fasilitas + alamat).
- components_layout.txt (8): `Ahmad Fauzi - Kepala Gudang`; `apt. Dewi Kartika - PJT Alkes`; `Budi Utomo, S.T - QA Manager`; `Dewi Anggraini - Purchasing Alkes`; `Dian Nugraha - Teknisi Elektromedis`; `Farhan Maulana - Sales e-Katalog`; `Hendra Setiawan - Lead QC Inspector`; `Ir. Agus Santoso - Manufaktur CPAKB` (semuanya nama orang + jabatan, bukan istilah UI).

Catatan aturan:
- Placeholder/kalimat ≤6 kata tetap diterjemahkan (mis. "Apakah Anda yakin ingin menghapus akun", "Wewenang dan tanggung jawab role ini..."); tidak ada placeholder >6 kata pada input ini, sehingga 0 baris dilewati karena kategori itu.
- Nama/singkatan bulan Indonesia (Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des; Januari–Desember) diperlakukan sebagai istilah Indonesia dan dipetakan ke padanan Inggris; yang ejaannya sama (Apr, Jan, Sep, Nov, April, September, November) tetap di tabel Indonesia, mengikuti preseden "Unit" pada g1_regulatory.md.
- Duplikat varian huruf kapital dipertahankan sebagai baris terpisah sesuai aturan satu baris per baris input (mis. "Hapus akun" dan "Hapus Akun"); istilah yang berulang antarberkas (Akses Penuh, Batal, Tutup, Status, Kedaluwarsa, Penanggung Jawab Teknis) muncul di tabel masing-masing berkas.
- String campuran yang memuat kata Indonesia (mis. "Suhu Cold Chain", "PWA Aktif", "RBAC Server Terverifikasi", "Hanya Overview", "Total Pendapatan YTD") masuk tabel Indonesia; string yang seluruhnya berbahasa Inggris (termasuk merek/akronim, mis. "Manufacture CPAKB", "Sales e-Katalog LKPP") masuk daftar terpisah.

---

## Bagian C — Konvensi, Akronim & Catatan Pemeliharaan

### C.1 Konvensi penamaan
- **Satu konsep, satu bentuk baku.** Varian label UI yang merujuk konsep sama (mis. "Karantina", "Di Ruang Karantina", "Karantina (Hold)") diseragamkan ke bentuk baku Bagian A saat revisi UI/dokumen.
- **Akronim dipertahankan** dalam bentuk Inggris sebagaimana di kode; kepanjangan Indonesia boleh dipakai pada penjelasan pertama kali di dokumen mutu.
- **Padanan Inggris dalam kurung di kode** (mis. `Lolos (Released)`, `Karantina (Hold)`, `OFI (Peluang Peningkatan)`, `Surat jalan (delivery order)`) adalah pemetaan eksplisit yang sudah ada; glosarium ini mengikuti dan memperluasnya.
- **Istilah regulatori Indonesia** (CDAKB, CPAKB, SDAK, IPAK, NIE, PJT, STR, KTD, LKPP, SatuSehat) tetap dipakai dalam konteks hukum Indonesia; padanan Inggris diberikan hanya untuk komunikasi internasional, bukan menggantikan istilah hukum.

### C.2 Daftar akronim
| Akronim | Kepanjangan / padanan |
|---|---|
| ALCOA+ | Attributable, Legible, Contemporaneous, Original, Accurate (+ Complete, Consistent, Enduring, Available) |
| APD | Alat Pelindung Diri = Personal Protective Equipment (PPE) |
| ATS | Applicant Tracking System |
| B2B | Business-to-Business |
| BMR | Batch Manufacturing Record |
| CAPA | Corrective And Preventive Action |
| CDAKB | Cara Distribusi Alat Kesehatan yang Baik = Good Distribution Practice (GDP) |
| CoA | Certificate of Analysis |
| COA | Chart of Accounts (Bagan Akun) |
| CPAKB | Cara Produksi Alat Kesehatan yang Baik = Good Manufacturing Practice (GMP) |
| FEFO | First Expired First Out |
| FIFO | First In First Out |
| Fasyankes | Fasilitas Pelayanan Kesehatan = Healthcare Facility |
| HPP | Harga Pokok Penjualan/Pembelian = Cost of Goods Sold |
| IPAK | Izin Penyalur Alat Kesehatan = Distributor License |
| IVD | In Vitro Diagnostic |
| K3 | Keselamatan dan Kesehatan Kerja = Occupational Health & Safety (OHS) |
| KPI | Key Performance Indicator |
| KTD | Kejadian Tidak Diharapkan = Adverse Event / Incident |
| LKPP | Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah = National Public Procurement Agency |
| MCU | Medical Check-Up |
| Medrep | Medical Representative |
| NC | Nonconformity (Ketidaksesuaian) |
| NIE | Nomor Izin Edar = Marketing Authorization No. |
| OFI | Opportunity For Improvement (Peluang Peningkatan) |
| OSS-RBA | Online Single Submission – Risk-Based Approach |
| PJT | Penanggung Jawab Teknis = Technical Responsible Person |
| PO | Purchase Order |
| PPE | Personal Protective Equipment (APD) |
| RFID | Radio Frequency Identification |
| SDAK | Sertifikat Standar Distribusi (Alat Kesehatan) |
| SKU | Stock Keeping Unit |
| SO | Sales Order |
| SOP | Standard Operating Procedure |
| STR | Surat Tanda Registrasi = Registration Certificate |
| 3PL | Third-Party Logistics |

### C.3 Catatan cakupan & pemeliharaan
- Inventaris Bagian B berasal dari ekstraksi string UI `src/` pada tanggal penyusunan (14 Nov 2026). Noise non-UI (nama orang/alamat, kelas CSS, fragmen kode, kode murni, prosa pemasaran >6 kata) sengaja dilewati karena bukan istilah.
- Bila UI bertambah/berubah, jalankan ulang ekstraksi string UI dan perbarui Bagian B; jaga konsistensi dengan Bagian A dan pemetaan baku.
- Dokumen ini **referensi terminologi**, bukan spesifikasi hukum; keputusan akhir pemilihan istilah untuk dokumen regulasi tetap pada PJT.

