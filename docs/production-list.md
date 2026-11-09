> **Status dokumen (2026-11): FAKTA TERVERIFIKASI (checklist jujur)** — tetapi **Fase A belum terpenuhi**: aplikasi belum persist ke server, sehingga Fase B–K belum bisa dicentang tanpa membangun persistensi lebih dulu. Jangan centang satu pun item tanpa bukti.

# Protokol & Checklist Peluncuran Produksi (Production Readiness Checklist)

Dokumen ini adalah **Protokol Resmi Peluncuran Produksi (*Production Deployment Protocol*)** untuk **AMS Integrated System (PT Anugrah Mitra Selaras)**, termasuk panduan dan checklist migrasi data / input data asli (*real data seeding*) untuk setiap modul fungsional.
Coded by Langgo Bramandityo

Dokumen ini ditulis ulang (2026-11) mengikuti urutan yang layak pakai di dunia nyata: **pintu dikunci dulu, baru integrasi dibuka; backup dibuktikan bisa dipulihkan sebelum data dimasukkan; data dimasukkan dengan rekonsiliasi; kepatuhan ditandatangani; baru go-live**. Seluruh item ditulis ulang agar jujur terhadap kondisi aplikasi.

---

## Aturan Protokol Peluncuran (Deployment Rules)

1. **Wajib berurutan**: fase dijalankan dari **A sampai K**. Fase tidak boleh dilewati tanpa pengecualian tertulis dari Lead Developer dan PJT.
2. **Zero-skip policy**: tidak ada item yang dicentang tanpa bukti verifikasi (log, tangkapan layar, nomor tiket, atau tanda tangan).
3. **Sign-off ganda**: setiap fase ditutup dengan tanda tangan **PJT + penanggung jawab teknis** pada kolom "Diverifikasi oleh".
4. **Kriteria go/no-go**: go-live **batal otomatis** bila salah satu terpenuhi — audit trail tidak berjalan; restore backup gagal diuji; rekonsiliasi data melebihi toleransi (lihat H-RECON); ada temuan keamanan kritis terbuka; sign-off PJT belum ada.
5. **Rollback wajib dilatih**: skenario "kembali ke sistem lama" harus pernah dicoba di staging sebelum go-live pertama, bukan dikarang saat krisis.
6. **UU PDP (UU No. 27 Tahun 2022)**: setiap isian yang memuat data pribadi (NIK, kontak, data rekam medis ringkas) wajib punya dasar pemrosesan yang sah, dan kebijakan privasi perusahaan harus tersedia sebelum data asli dimuat.

---

## Fase A — Fondasi & Data Demo (WAJIB PERTAMA)

> Catatan kejujuran: aplikasi ini saat ini menyimpan data di `localStorage` per browser dan **tidak menulis ke PocketBase**. Checklist ini hanya bermakna bila persistensi sisi server sudah berjalan. Jika belum, seluruh fase di bawah dianggap **belum bisa dimulai**.

- [ ] **A1**: Persistensi data di server terverifikasi — data yang disimpan satu pengguna terbaca oleh pengguna lain (bukan hanya `localStorage` browser). Bukti: tulis uji di satu perangkat, baca dari perangkat lain.
- [ ] **A2**: **Data seed/demo dipurge.** Seluruh isi `src/data/initialData.ts`, `salesMarketingData.ts`, `seedKeuangan.ts`, `websiteRujukan.ts` ( ±280 KB data karangan: karyawan, jurnal, stok, suhu, dst.) diganti atau dinonaktifkan di build produksi. Bukti: pencarian string seed di bundle hasil build = 0 temuan.
- [ ] **A3**: Lingkungan **staging** tersedia dengan struktur yang sama dengan produksi (boleh data kecil, wajib skema sama).
- [ ] **A4**: Backup data yang sudah ada (bila ada) diambil **sebelum** migrasi apa pun.

## Fase B — Keamanan Inti (sebelum integrasi apa pun dibuka)

- [ ] **B1**: Autentikasi **di sisi server** (sesi + cookie `HttpOnly`, `Secure`, `SameSite=Strict`). Login klien-saja (`admin/admin123`) tidak lagi menjadi satu-satunya gerbang.
- [ ] **B2**: Otorisasi peran (PJT, QA, QC, Gudang, Direksi, HR, Finance) ditegakkan di server untuk setiap endpoint tulis — bukan hanya menyembunyikan tombol di UI.
- [ ] **B3**: Rahasia (API key, token, password DB) tidak ada di kode sumber maupun repo; memakai Secret Manager / environment variable.
- [ ] **B4**: *Rate limiting* untuk endpoint autentikasi (maks. 100 request / 15 menit / IP) dan endpoint tulis sensitif.
- [ ] **B5**: *Security headers*: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Content-Security-Policy.
- [ ] **B6**: CORS dibatasi hanya ke domain resmi perusahaan.
- [ ] **B7**: **Kepatuhan UU PDP**: inventaris data pribadi yang diproses, dasar hukum pemrosesan, hak akses/penghapusan subjek data, dan kebijakan privasi yang diterbitkan.
- [ ] **B8**: Kebijakan password staf (minimal kuat, rotasi berkala) + MFA bila memungkinkan.

## Fase C — Monitoring & Observabilitas (sebelum go-live, bukan sesudahnya)

- [ ] **C1**: Error tracking produksi (mis. Sentry) aktif dan alert terkirim ke tim.
- [ ] **C2**: *Uptime monitoring* untuk aplikasi + PocketBase dengan alert ke HP tim IT.
- [ ] **C3**: Alarm darurat cold chain (2°C–8°C) terhubung ke webhook PJT / WhatsApp bila suhu deviasi.
- [ ] **C4**: Log terstruktur dengan retensi minimal 90 hari; log audit tersimpan terpisah (immutable/WORM bila memungkinkan).

## Fase D — Build & Verifikasi di Staging

- [ ] **D1**: `npm run lint` lolos tanpa error.
- [ ] **D2**: `npm run test` lolos; `npm run verifikasi` hijau di staging.
- [ ] **D3**: `npm run build` tanpa peringatan kritis; bundle ditinjau (code-splitting aktif; ukuran per chunk wajar).
- [ ] **D4**: Load test dasar: mis. 50 pengguna bersamaan membuka dasbor + 1 transaksi — tanpa error 5xx dan respons < 2 detik.
- [ ] **D5**: Smoke test manual semua 13 modul di staging (daftar di Fase K).
- [ ] **D6**: Rollback rehearsal: staging dikembalikan ke versi sebelumnya dan diverifikasi pulih.

## Fase E — Domain & TLS

- [ ] **E1**: Domain resmi perusahaan terdaftar (mis. `https://app.anugrahmitraselaras.co.id`).
- [ ] **E2**: Sertifikat SSL/TLS valid (Let's Encrypt / Cloudflare) aktif dan diperbarui otomatis.
- [ ] **E3**: HTTP → HTTPS redirect aktif; HSTS menyala.
- [ ] **E4**: DNS mengarah ke server produksi; propagasi diverifikasi.

## Fase F — Database & Cadangan (dibuktikan, bukan diklaim)

- [ ] **F1**: Basis data produksi diprovisi (Managed PocketBase / PostgreSQL), kapasitas dan kredensial terpisah dari staging.
- [ ] **F2**: Migrasi skema dijalankan; skema tervalidasi terhadap aplikasi.
- [ ] **F3**: Backup otomatis harian + *point-in-time recovery* dikonfigurasi.
- [ ] **F4**: **Restore diuji di staging** dari backup produksi — aplikasi hidup kembali dari snapshot. (Bukan sekadar "backup berhasil dijadwalkan".)
- [ ] **F5**: Jadwal drill pemulihan bencana masuk kalender (6 bulan sekali, dimulai setelah 2 minggu pasca go-live).

## Fase G — Integrasi Pemerintah & Eksternal (terakhir sebelum migrasi data)

> Dikerjakan **hanya setelah H (Fase B) dan C hijau**. Sandbox dulu, live kemudian.

- [ ] **G1**: SatuSehat (HL7 FHIR): kredensial produksi, ping test sandbox OK, payload uji tervalidasi.
- [ ] **G2**: LPSE / e-Katalog LKPP: koneksi tender live terverifikasi dengan 1 paket uji.
- [ ] **G3**: Gateway WhatsApp/SMS untuk notifikasi darurat PJT dan recall aktif.
- [ ] **G4**: Kredensial API tidak tersimpan di kode; token dapat dirotasi tanpa downtime (diuji).

## Fase H — Migrasi & Input Data Asli (urutan berdasarkan ketergantungan)

> Prinsip: **referensi dulu, transaksi kemudian; saldo beku terakhir; rekonsiliasi sebelum sign-off.**
> Seed demo **sudah harus dipurge** di Fase A2. Migrasi dilakukan di lingkungan staging lebih dulu, baru diputar ulang di produksi saat cut-off.

- [ ] **H1 (FIN-1)**: *Chart of Accounts* sesuai standar akuntansi alkes — semua modul bergantung pada ini.
- [ ] **H2 (IT-1)**: Verifikasi rantai hash ALCOA+ SHA-256 berjalan di lingkungan target; jurnal contoh terbentuk dan terverifikasi berantai.
- [ ] **H3 (RA)**: Daftar NIE aktif + kelas risiko + kedaluwarsa; dokumen SDAK & surat penunjukan PJT.
- [ ] **H4 (PUR)**: Master prinsipal/pemasok & harga beli (landed cost) — dirujuk stok dan pembelian.
- [ ] **H5 (WH)**: Struktur gudang → stok awal per batch (nomor batch, expiry, qty fisik, suhu); kalibrasi sensor cold chain 2°C–8°C.
- [ ] **H6 (QA/QC)**: SOP & manual mutu ISO 13485; CAPA terbuka; parameter inbound inspection.
- [ ] **H7 (MFG)**: BOM, parameter cleanroom, resep BMR.
- [ ] **H8 (HR)**: Karyawan aktif, sertifikasi (STR/PJT/CDAKB), shift & parameter payroll.
- [ ] **H9 (CRM)**: Pelanggan B2B, kontrak harga e-Katalog/tender, subscriber listmonk.
- [ ] **H10 (SRV)**: Unit terpasang di fasyankes + masa garansi + jadwal kalibrasi.
- [ ] **H11 (PMS)**: Eskalasi KTD, SOP recall.
- [ ] **H12 (FIN-2/3)**: Saldo awal buku besar, AR/AP — **saat cut-off**, setelah transaksi di sistem lama dibekukan.
- [ ] **H13 (FIN-4)**: Tarif PPN 11% & PPh potong-pungut dikonfigurasi.
- [ ] **H-RECON (wajib)**: **Rekonsiliasi pasca-migrasi** — jumlah record, total saldo CoA, total nilai persediaan, jumlah karyawan, jumlah NIE: semuanya **sama persis dengan sumber**. Selisih dilaporkan dan ditandatangani PJT + Finance. Toleransi selisih: nol untuk saldo, ≤ 0,01% untuk jumlah record (dengan penjelasan tertulis).
- [ ] **H-IT2**: Uji endpoint API Gateway + SatuSehat + LKPP dari lingkungan **staging**, bukan produksi.

## Fase I — Audit Kepatuhan & Sign-off

- [ ] **I1**: Audit trail ALCOA+ aktif dan mencatat seluruh perubahan data (diverifikasi dengan 3 aksi uji tulis).
- [ ] **I2**: SOP dan sertifikat mutu terlampir di sistem; masa berlaku dicek.
- [ ] **I3**: Persetujuan tertulis **PJT** + QA untuk pemakaian operasional.
- [ ] **I4**: Kebijakan retensi & penghapusan data sesuai UU PDP terdokumentasi.

## Fase J — Uji Kuat Tekanan & Kesiapan Operasional

- [ ] **J1**: Lintas-departemen melakukan *walkthrough* penuh satu siklus nyata (terima barang → stok → penjualan → faktur → jurnal → pembayaran) di staging.
- [ ] **J2**: Pelatihan seluruh pengguna akhir selesai (absensi tercatat); panduan ringkas per peran tersedia.
- [ ] **J3**: Tim *hypercare* minggu pertama ditetapkan: siapa memantau, eskalasi ke siapa, jam berapa.
- [ ] **J4**: Kriteria go/no-go ditinjau bersama manajemen; keputusan go/no-go didokumentasikan.

## Fase K — Eksekusi Go-Live

- [ ] **K1**: Cut-off: transaksi di sistem lama dibekukan; saldo beku diekspor; H12–H13 dieksekusi.
- [ ] **K2**: Migrasi diputar ulang/diverifikasi di produksi; H-RECON diulang dan ditandatangani.
- [ ] **K3**: Smoke test semua 13 modul di produksi (lihat daftar di bawah) — lulus.
- [ ] **K4**: Go-live pada jam operasional rendah; pengumuman ke seluruh divisi.
- [ ] **K5**: Hypercare 1–2 minggu: harian stand-up singkat, log insiden, perbaikan cepat.
- [ ] **K6**: 2 minggu pasca go-live: drill pemulihan bencana pertama (restore dari backup produksi), jadwalkan ulang 6 bulanan.

---

## Daftar Smoke Test 13 Modul (untuk D5 / K3)

1. Executive Dashboard — angka termuat dari data nyata, bukan seed.
2. Regulatory Affairs / PJT — NIE muncul, reminder perpanjangan bekerja.
3. QA & ISO 13485 — CAPA bisa dibuat, diverifikasi, ditutup.
4. QC — inbound inspection tercatat dan memblokir posting stok bila ditolak.
5. Warehouse & Logistics — FEFO mengalokasi; karantina mengunci batch; surat jalan terbit.
6. After-Sales — tiket layanan terbuat dan terjadwal kalibrasi.
7. Manufacture — BMR terbentuk dan yield terhitung.
8. Purchasing — PO terbuat, landed cost terhitung.
9. CRM & Sales — prospek → penawaran → order → faktur; e-Katalog terhubung (uji tulis).
10. PMS / Vigilance — laporan KTD terkirim ke alur eskalasi.
11. HRD / HRIS — absensi hari berjalan tercatat; slip gaji contoh terhitung.
12. Finance & Accounting — jurnal berantai terverifikasi; PPN terhitung; laporan bulan berjalan terbit.
13. IT & Traceability Hub — lacak batch end-to-end; audit trail terbaca; ekspor CSV ALCOA+ valid.

---

## Checklist Migrasi Data — Ringkasan Urutan

```
FIN-1 (CoA) → IT-1 (hash) → RA → PUR → WH → QA/QC → MFG → HR → CRM → SRV → PMS
   → [cut-off] FIN-2/3/4 (saldo & tarif) → H-RECON (rekonsiliasi) → IT-2 → go-live
```

Aturan keras:
- **Tidak ada** seed/demo yang tersisa setelah H-RECON.
- Selisih saldo = **0**; selisih jumlah record harus dijelaskan tertulis.
- Setiap tahap ditandatangani PJT + penanggung jawab modul bersangkutan.

---

## Panduan untuk Pengembang

1. **Sebelum merilis**: semua kotak Fase A sampai K terisi dengan bukti; tidak ada "nanti saja".
2. **Jika terjadi kendala**: hentikan deployment, jalankan rollback yang sudah dilatih di D6, evaluasi log lewat Sentry/terminal; jangan "perbaiki langsung di produksi".
3. **Dokumentasikan perubahan**: setiap penyesuaian konfigurasi produksi dicatat dalam log pembaharuan sistem.
4. **Kejujuran label**: status apa pun yang belum terukur tidak boleh ditulis sebagai "aktif/terhubung" di UI atau dokumen; tulis "belum dikonfigurasi".
5. Berkas ini ditulis ulang pada 2026-11. Perubahan berikutnya wajib melalui review PJT + QA.
