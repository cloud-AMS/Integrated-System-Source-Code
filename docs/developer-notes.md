# Catatan Pengembang & Audit Kepatuhan — AMS Integrated System (Jujur, 2026-11)

> **Status dokumen (2026-11): FAKTA TERVERIFIKASI (dengan koreksi menyeluruh).**
> Dokumen ini menggantikan versi sebelumnya yang menyatakan "SESUAI & TERPENUHI" / "fully compliant" terhadap tujuh standar pemerintah. Klaim tersebut **tidak dapat dibuktikan dan dihapus**. Yang tersisa: alat bantu kepatuhan yang ada di aplikasi, dan daftar yang harus dipenuhi sebelum kata "sesuai" boleh dipakai.

**Aturan baca dokumen ini:** setiap bagian dibagi menjadi (a) **Yang ada di aplikasi**, (b) **Yang BELUM ada / syarat formal kepatuhan**, dan (c) **Rekomendasi**. Tidak ada bagian (a) yang boleh dikutip sebagai bukti kepatuhan.

Coded by Langgo Bramandityo

---

## Bagian 1: Audit Kepatuhan — Versi Jujur

### 1. CDAKB (Cara Distribusi Alat Kesehatan yang Baik) — Permenkes RI No. 4/2014
- **Yang ada di aplikasi**: 12 tab modul Gudang (rantai dingin 2°C–8°C, FEFO sadar-kunci, karantina/recall, pest control, FEFO alokasi, opname buta, jejak pergerakan ber-hash SHA-256). Logika inti FEFO dan rantai hash **diimplementasikan dan lolos tes** (`npm run cek:semua`).
- **Yang BELUM ada**: sertifikat CDAKB/SDAK perusahaan dari Kemenkes; audit distribusi oleh auditor eksternal; catatan suhu dari sensor fisik riil (data saat ini seed/log manual); prosedur tertulis yang dieksekusi di lapangan; penyimpanan audit trail di server (saat ini `localStorage` — bisa dihapus penggunanya); telusur fisik batch dari rak ke fasyankes.
- **Sebelum klaim "sesuai" boleh dipakai**: audit CDAKB terjadwal oleh pihak kompeten + sertifikat SDAK berlaku + 6 bulan rekam suhu & mutasi nyata dari sensor/gudang asli + backup audit trail di server.
- **Rekomendasi**: hubungkan logger suhu IoT nyata; pindahkan `JejakPergerakan` ke penyimpanan server yang tidak bisa dihapus klien; jadwalkan audit internal CDAKB pertama sebelum go-live.

### 2. CPAKB (Cara Pembuatan Alat Kesehatan yang Baik)
- **Yang ada**: layar Batch Manufacturing Record (BMR), parameter cleanroom, perhitungan yield, seed data contoh.
- **Yang BELUM ada**: sertifikasi CPAKB dari Kemenkes untuk fasilitas produksi; validasi proses nyata; catatan produksi nyata; kalibrasi alat produksi terdokumentasi; inspeksi BPOM/Kemenkes.
- **Sebelum klaim "sesuai"**: audit CPAKB fasilitas + BMR terisi dari produksi nyata selama ≥ 3 batch + dokumentasi kalibrasi alat.
- **Rekomendasi**: mulai dari 1 lini produksi sebagai pilot; jangan klaim CPAKB sebelum audit pertama lulus.

### 3. SDAK & Izin Edar (NIE)
- **Yang ada**: UI daftar NIE, kelas risiko A–D, tanggal perpanjangan, seed 6+ produk contoh, ambang peringatan.
- **Yang BELUM ada**: koneksi apa pun ke OSS RBA / Kemenkes / portal perizinan; validasi nomor NIE ke database nasional; SDAK perusahaan yang diunggah dan diverifikasi; reminder otomatis nyata (hanya tampilan).
- **Sebelum klaim "sesuai"**: SDAK aktif atas nama PT Anugrah Mitra Selaras + NIE seluruh produk yang diklaim tercatat & terverifikasi ke aslinya + SOP perpanjangan dengan pemilik tugas.
- **Rekomendasi**: impor data NIE asli dari dokumen perusahaan (bukan seed) sebagai langkah pertama `production-list.md` Fase H3.

### 4. Pengadaan & e-Katalog Pemerintah (LKPP / LPSE)
- **Yang ada**: layar tender/kontrak, kalkulator margin, antrean sinkronisasi + pratinjau payload webhook, seed tender.
- **Yang BELUM ada**: koneksi API LKPP/LPSE (kredensial, otorisasi, endpoint produksi); scraping tender nyata; pelaporan stok ke e-Katalog yang benar-benar terkirim; verifikasi kontrak e-Katalog terhadap sistem LKPP.
- **Sebelum klaim "terhubung"**: minimal 1 kontrak e-Katalog aktif terverifikasi lewat integrasi + 1 pelaporan stok uji terbaca di sistem LKPP.
- **Rekomendasi**: ajukan akses API ke LKPP resmi; sampai disetujui, tampilkan "Belum terhubung — gunakan proses manual" di UI.

### 5. PMS / Vigilance & Pelaporan KTD
- **Yang ada**: formulir laporan KTD, alur eskalasi tampilan, seed kasus.
- **Yang BELUM ada**: pengiriman laporan KTD ke e-Watch Alkes Kemenkes (endpoint & kredensial); penomoran registrasi otomatis; tindak lanjut investigasi yang tercatat resmi; integrasi penarikan produk ke kanal pemerintah.
- **Sebelum klaim "sesuai"**: minimal 1 laporan uji (kasus simulasi) tercatat di e-Watch + SOP vigilance ditandatangani PJT + latihan recall Tabletop.
- **Rekomendasi**: ikuti pelatihan vigilance Kemenkes; daftarkan perusahaan ke sistem pelaporan KTD resmi.

### 6. SatuSehat / Integrasi Pemerintah
- **Yang ada**: builder bundle FHIR (`SupplyDelivery`, `Device`, `Immunization`) + status & `OperationOutcome` — sebagai **pratinjau payload** saja.
- **Yang BELUM ada**: koneksi ke sandbox/production SatuSehat; client ID/secret; validasi bundle ke server Kemenkes; OAuth flow.
- **Sebelum klaim "terintegrasi"**: 1 bundle uji diterima sandbox SatuSehat + kredensial produksi terpasang + monitoring kirim harian.
- **Rekomendasi**: ajukan akses SatuSehat developer; kerjakan lewat `production-list.md` Fase G.

### 7. Integritas Data — ALCOA+ & SHA-256
- **Yang ada**: rantai hash SHA-256 **asli dan teruji** untuk jurnal (`akuntansi.ts`) dan pergerakan gudang (`gudang.ts`); 19 hash seed terverifikasi; `npm run cek:semua` mengunci bentuk kanonik; pencatatan old/new value di jejak audit.
- **Yang BELUM ada**: penyimpanan audit trail di **server** yang tidak bisa dihapus klien (saat ini `localStorage` — `localStorage.clear()` menghapus semuanya, termasuk "immutable log"); timestamp tepercaya (NTP); tanda tangan digital (e-signature); proteksi tulis sekali (WORM/immutable storage); retensi sesuai kebijakan.
- **Sebelum klaim "ALCOA+ compliant"**: audit trail dipindah ke penyimpanan server append-only + verifikasi independen oleh auditor + SOP retensi data + pengujian pemulihan.
- **Rekomendasi**: jadikan migrasi audit trail ke server item #1 setelah persistensi backend ada.

### Ringkasan Bagian 1

| Standar | Yang tersedia | Status boleh diklaim |
|---|---|---|
| CDAKB | Alat bantu (FEFO, cold chain, karantina) + logika teruji | "Mekanisme tersedia" — **belum** kepatuhan |
| CPAKB | Layar BMR & yield (seed) | "Alat bantu tersedia" — **belum** kepatuhan |
| SDAK/NIE | UI + seed | "Alat bantu tersedia" — **belum** kepatuhan |
| LKPP/e-Katalog | Antrean + pratinjau | "Belum terhubung" |
| PMS/Vigilance | Formulir + eskalasi tampilan | "Alat bantu tersedia" — **belum** kepatuhan |
| SatuSehat | Preview bundle FHIR | "Belum terhubung" |
| ALCOA+/SHA-256 | Rantai hash asli & teruji | "Hash tersedia, penyimpanan belum immutable" |

**Kepatuhan formal = audit + sertifikasi + bukti operasional berkala.** Tidak ada tombol di aplikasi yang bisa menggantikannya.

---

## Bagian 2: Rekomendasi Pengembangan (tetap relevan, ditandai dengan jujur)

Status "saat ini" di bawah **berdasarkan kode yang ada**, bukan aspirasi dokumen lain.

1. **Executive Overview** — status: cockpit dengan data seed. Rekomendasi: widget yang bisa diatur; narasi AI mingguan — **setelah** data nyata hidup, bukan sebelum.
2. **RA/PJT** — status: UI + seed. Rekomendasi: reminder WA 90/60/30 hari (butuh gateway yang ada & nomor nyata); sinkronisasi OSS — butuh akses resmi.
3. **QA & ISO 13485** — status: pencatatan CAPA. Rekomendasi: workflow bertingkat + e-sign; e-sign butuh infrastruktur sertifikat yang belum ada.
4. **QC** — status: inbound inspection form. Rekomendasi: scan CoA via kamera; kamera tersedia, pustaka belum dipilih.
5. **WMS** — status: 12 tab, logika FEFO teruji. Rekomendasi: IoT suhu logger nyata; smart pick path sudah ada (rute terpendek) — tinggal dipakai dengan bin asli.
6. **After-Sales** — status: tiket & kalibrasi UI. Rekomendasi: PWA teknisi lapangan dengan geotag; kamera/GPS browser tersedia.
7. **Manufacture/CPAKB** — status: BMR UI. Rekomendasi: telemetry cleanroom nyata — butuh sensor & protokol.
8. **Purchasing** — status: PO + landed cost. Rekomendasi: supplier scorecard dari data PO nyata.
9. **CRM/Sales** — status: CRM/SFA UI + seed. Rekomendasi: LPSE scraper — butuh penetapan legalitas scraping; customer portal B2B — butuh autentikasi server (belum ada).
10. **PMS** — status: formulir KTD. Rekomendasi: broadcast otomatis recall — butuh gateway WA/email nyata.
11. **HRIS** — status: payroll calculator teruji. Rekomendasi: absensi biometrik — **ditolak** sampai UU PDP dipenuhi (lihat `git-external.md`); face recognition pihak ketiga tidak boleh diimpor apa adanya.
12. **Finance** — status: double-entry + CoA teruji. Rekomendasi: integrasi e-Faktur Coretax DJP — butuh kredensial perusahaan nyata.
13. **IT & Traceability** — status: hash chain lokal. Rekomendasi: audit log di server append-only; "blockchain-backed" **ditolak** sebagai solusi — over-engineering; immutable storage + replikasi sudah cukup dan jujur.

---

## Kesimpulan Audit & Roadmap (jujur)

AMS Integrated System saat ini adalah **aplikasi front-end dengan logika domain yang serius (FEFO, jurnal berantai, payroll) di atas data contoh, tanpa persistensi server**. Ia adalah alas yang baik untuk dibangun menjadi sistem kepatuhan nyata — bukan sistem kepatuhan itu sendiri.

Urutan yang benar: (1) persistensi backend & autentikasi server; (2) pindahkan data contoh ke data asli perusahaan (lihat `production-list.md` Fase H); (3) audit trail ke server immutable; (4) integrasi pemerintah satu per satu lewat sandbox; (5) audit & sertifikasi dengan pihak berwenang; (6) baru publikasikan klaim kepatuhan.

Dokumen apa pun yang menyebut aplikasi ini "fully compliant" atau "SESUAI & TERPENUHI" sebelum langkah 4–5 selesai adalah **klaim yang tidak bisa dipertanggungjawabkan** dan harus ditarik.
