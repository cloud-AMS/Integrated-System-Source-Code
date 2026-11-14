> **Status 12 November 2026: NO-GO untuk input data asli.** Snapshot GitHub `3979f45` lulus build, 198 unit test, dan typecheck lokal, tetapi autentikasi serta persistensi operasional server belum tersedia. Hasil lokal bukan verifikasi VPS dan tidak menutup Fase A–K. Lihat **Lampiran — Checklist Setup VPS dan Pembukaan Input Data Asli** untuk persiapan server, informasi yang dibutuhkan, dan gerbang peluncuran.

## Developer Notes

Sebelum mengutip dokumen ini di luar tim: aplikasi ini belum lolos Fase A, sehingga seluruh klaim "siap produksi" di bagian mana pun adalah aspirasi, bukan kenyataan. Yang menegakkan kebenaran klaim adalah kode + tes + tanda tangan PJT, bukan tulisan ini.

# Protokol & Checklist Peluncuran Produksi (Production Readiness Checklist)

Dokumen ini adalah **Protokol Resmi Peluncuran Produksi (*Production Deployment Protocol*)** untuk **AMS Integrated System (PT Anugrahmitra Selaras)**, termasuk panduan dan checklist migrasi data / input data asli (*real data seeding*) untuk setiap modul fungsional.
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
- [ ] **A2**: Bootstrap produksi dimulai tanpa data contoh operasional dan tanpa fallback ke seed saat baca/simpan gagal. Inventaris `src/data/initialData.ts`, `salesMarketingData.ts`, `seedKeuangan.ts`, dan `websiteRujukan.ts`; pisahkan referensi yang disetujui dari data karangan. Jangan menghapus data browser/server yang sudah ada sebelum backup dan klasifikasi demo versus asli. Bukti: database baru dan browser baru tidak memunculkan karyawan, saldo, atau stok contoh; kesalahan server terlihat sebagai kegagalan, bukan sukses lokal.
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
- [ ] **F3**: Backup konsisten database + lampiran dijadwalkan sesuai RPO yang disetujui, terenkripsi, dan disalin offsite. Bila memakai PostgreSQL dan memerlukan *point-in-time recovery*, konfigurasikan base backup + arsip WAL dan uji pemulihan ke waktu tertentu; backup harian saja bukan PITR. Untuk PocketBase, gunakan prosedur backup konsisten yang didukung versi terpilih, bukan menyalin database aktif secara sembarang.
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
- [ ] **H13 (FIN-4)**: Tarif, dasar pengenaan, pengecualian, pembulatan, dan tanggal efektif PPN/PPh dikonfigurasi sesuai transaksi serta ketentuan yang berlaku, lalu diverifikasi Finance; jangan langsung memakai angka pada seed.
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
4. **Developer Notes — label**: status apa pun yang belum terukur tidak boleh ditulis sebagai "aktif/terhubung" di UI atau dokumen; tulis "belum dikonfigurasi".
5. Berkas ini ditulis ulang pada 2026-11. Perubahan berikutnya wajib melalui review PJT + QA.

---

## Lampiran — Checklist Setup VPS dan Pembukaan Input Data Asli

Disiapkan 12 November 2026. Ini runbook persiapan, **bukan catatan bahwa VPS telah dikonfigurasi**. Belum ada IP, OS, domain, ataupun akses SSH target. Checklist infrastruktur dapat disiapkan paralel dengan pengembangan fondasi; input data asli tetap menunggu gerbang aplikasi dan operasional lulus. Kolom bukti, penanggung jawab, dan tanggal wajib dicatat untuk setiap item yang ditutup.

### V0 — Baseline dan keputusan target

| Pemeriksaan | Status yang terbukti |
|---|---|
| Sumber yang diuji | GitHub `cloud-AMS/Integrated-System-Source-Code`, `main`, commit `3979f45` |
| Lingkungan pengujian | Salinan sementara lokal; Node `26.13.1`, npm `11.20.0` |
| `npm ci` | Berhasil; ada peringatan dependensi deprecated dan lifecycle script |
| `npm run build` | Frontend dan server berhasil; peringatan bundle JS sekitar 1,8 MB |
| `npm test` | 198/198 test lulus dalam 12 file |
| `npm run lint` | Typecheck berhasil |
| `npm run cek:semua` / `npm run verifikasi` | Belum dijalankan sebagai rangkaian lengkap |
| Browser | Beranda lokal berhasil dimuat; belum uji transaksi multiuser atau produksi |
| VPS, TLS, database produksi, backup | Belum diprovisi atau diverifikasi |

- [ ] **V0.1**: Konfirmasi commit kandidat rilis dan lokasi sumber permanen. Jangan deploy direktori sementara atau menganggap folder kerja lokal identik dengan snapshot yang diuji.
- [ ] **V0.2**: Tentukan modul yang akan dibuka pertama, jumlah pengguna serentak, perkiraan lampiran, dan jam operasional. Modul di luar cakupan tidak boleh menerima input; pembatasannya ditegakkan server.
- [x] **V0.3 — Keputusan backend**: PostgreSQL + API Express disetujui pengguna pada 12 November 2026 untuk persistensi operasional dan transaksi database. Bukti: persetujuan eksplisit dalam percakapan. Persetujuan ini bukan sign-off produksi; fondasi koneksi Express–PostgreSQL lokal telah ditambahkan, tetapi CRUD ERP, autentikasi server, dan provisioning VPS belum selesai. `docs/erd-postgresql.sql` masih blueprint, bukan migrasi siap produksi. Koneksi PocketBase yang ada tidak menjadi backend operasional target; transisinya harus diuji tanpa menghapus data yang sudah ada.
- [ ] **V0.4**: Usulan awal bila VPS belum dipilih: Ubuntu Server 24.04 LTS, 2 vCPU, RAM 4 GB, SSD 60 GB untuk pilot kecil. Ukuran final bergantung uji beban, kebutuhan database/media, dan retensi; bukan jaminan kapasitas.
- [ ] **V0.5**: Pilih Node LTS yang masih didukung dan memenuhi `engines` (`>=22`), pin versi runtime/package manager, lalu ulangi verifikasi pada versi tersebut di Linux target.

### V1 — Informasi dan akses yang diperlukan

Isi bersama administrator sebelum menjalankan perubahan remote:

| Informasi | Nilai |
|---|---|
| Provider, IP/hostname VPS, OS dan versi | Belum diberikan |
| CPU/RAM/disk serta layanan yang sudah berjalan | Belum diberikan |
| Domain aplikasi dan domain staging | Belum diberikan |
| Pengelola DNS dan penggunaan proxy CDN | Belum diberikan |
| Alias SSH atau user + host + port; akses sudo | Belum diberikan |
| Akses console/recovery dari provider | Belum dikonfirmasi |
| Backend | PostgreSQL + Express; fondasi koneksi, konfigurasi, dan health/readiness lokal tersedia; CRUD ERP dan autentikasi server belum diimplementasikan |
| Lokasi backup offsite dan penanggung jawab | Belum diputuskan |
| Modul pilot, pengguna/peran, cut-off, RPO/RTO | Belum disetujui |

- [ ] **V1.1**: Akses melalui SSH key/agent yang sudah tersedia secara lokal; jangan menaruh password, private key, recovery code, atau token di chat/repo.
- [ ] **V1.2**: Verifikasi fingerprint host melalui sumber tepercaya; jangan menonaktifkan pemeriksaan host key.
- [ ] **V1.3**: Inventaris layanan, port, firewall, disk, dan konfigurasi existing dengan pemeriksaan read-only. Backup konfigurasi sebelum perubahan; jangan menghentikan aplikasi lain atau mengganti reverse proxy tanpa persetujuan.
- [ ] **V1.4**: Konfirmasi lingkup perubahan: instalasi paket, service, firewall, DNS, database, backup, dan waktu maintenance. Jangan menimpa konfigurasi existing secara menyeluruh.

### V2 — Fondasi aplikasi sebelum data asli (penghambat utama)

- [ ] **V2.1**: Ganti login klien dengan akun individual dan autentikasi server; hash password yang sesuai, pembatasan percobaan login, logout/revokasi sesi, serta cookie aman dan perlindungan CSRF bila menggunakan sesi cookie.
- [ ] **V2.2**: RBAC server melindungi baca maupun tulis per modul/record, terutama HR/payroll, finance, dan dokumen legal. Pengguna tidak bisa menaikkan peran lewat UI/localStorage.
- [ ] **V2.3**: Implementasikan CRUD bersama di database, validasi server, constraint, kontrol perubahan bersamaan, dan transaksi atomik untuk stok/jurnal. Tampilkan berhasil hanya setelah server mengonfirmasi commit.
- [ ] **V2.4**: Uji dua akun di browser/perangkat berbeda: tulis, baca, edit, konflik edit, serta hak akses ditolak. Data tetap ada setelah aplikasi/server restart dan cache browser dikosongkan.
- [ ] **V2.5**: Hentikan seed otomatis/fallback data contoh di produksi; bedakan database kosong dari database gagal diakses. Uji formulir dan dashboard dengan koleksi kosong.
- [ ] **V2.6**: Buat migrasi skema versioned dan bootstrap administrator pertama yang aman; jangan menjalankan DDL blueprint langsung terhadap database berisi data.
- [ ] **V2.7**: Simpan lampiran di volume/object storage persisten dengan pembatasan akses, ukuran/jenis berkas, dan validasi upload. Jangan mengandalkan URL `media:` atau data browser sebagai satu-satunya salinan.
- [ ] **V2.8**: Audit server mencatat aktor terautentikasi, waktu, objek, dan perubahan; pengguna biasa tidak dapat mengubahnya. Audit browser yang dipangkas menjadi 100 entri bukan arsip operasional.
- [ ] **V2.9**: Jika PocketBase dipakai, periksa aturan akses koleksi di server aktual. Dokumentasi saat ini menyebut baca publik/tulis superuser; jangan masukkan HR, finance, atau data pribadi ke koleksi publik. Jangan membuka seluruh proxy untuk membuat CRUD/realtime terlihat bekerja.
- [ ] **V2.10**: Pisahkan konten website publik dari data ERP internal. Review field yang diterbitkan, gambar, izin publikasi, serta proses menahan situs; UI CMS saat ini belum mengirim otorisasi yang diminta endpoint server.
- [ ] **V2.11**: Integrasikan izin publikasi dengan autentikasi/RBAC server; jangan memasukkan `AMS_ADMIN_TOKEN` ke frontend. Menetapkan token runtime saja belum menyelesaikan alur tombol CMS.
- [ ] **V2.12**: Uji update PWA, logout, offline, dan pergantian akun: respons privat/secret tidak tertinggal di cache; kegagalan jaringan tidak berubah menjadi transaksi lokal yang dianggap tersimpan server.

### V3 — Setup OS, jaringan, dan runtime

Target Linux berikut adalah usulan sampai OS dikonfirmasi; bila VPS Windows, siapkan padanan service dan hardening yang sesuai, bukan menjalankan perintah Linux.

- [ ] **V3.1**: Pasang pembaruan OS, sinkronisasi waktu, dan akun deploy/service non-root dengan izin minimum. Tetapkan UTC untuk waktu server/database dan konversi zona waktu di aplikasi.
- [ ] **V3.2**: Pastikan akses SSH baru dan console recovery berfungsi sebelum membatasi login/password. Firewall mengizinkan SSH dari sumber yang disetujui dan HTTP/HTTPS publik, bukan menutup akses administrator tanpa uji.
- [ ] **V3.3**: Sediakan reverse proxy HTTPS (usulan Caddy) di depan Node. Port aplikasi, database, PocketBase, dan panel admin tidak boleh terbuka ke internet; verifikasi dari luar VPS, termasuk IPv6 dan aturan jaringan container bila digunakan.
- [ ] **V3.4**: Buat service systemd dengan working directory yang jelas, `NODE_ENV=production`, port internal yang tidak bentrok, restart-on-failure, start-on-boot, dan log terpantau. Jangan memakai `npm run dev`, terminal SSH, atau Quick Tunnel sebagai runtime produksi.
- [ ] **V3.5**: Simpan environment/secret di luar repo dengan permission minimum dan injeksikan lewat service. Server kini memuat `.env` tanpa menimpa environment proses; untuk VPS tetap injeksikan `NODE_ENV=production`, `HOST`, `PORT`, `APP_URL`, `DATABASE_URL`, serta secret yang benar-benar dipakai melalui service saat runtime, bukan hanya build.
- [ ] **V3.6**: Bind Node default `127.0.0.1`; `HOST`/`PORT` kini tervalidasi dan `PORT=8080` dihormati. Bootstrap lokal memakai port 3002; tentukan port VPS sesuai layanan existing. Proxy PocketBase lama masih dipatok ke `127.0.0.1:8091` dan belum dihapus saat fondasi PostgreSQL ditambahkan. Tutup akses langsung memakai firewall dan sesuaikan topologi sebelum rilis; jangan mengikuti contoh lama PB8090 tanpa peninjauan.
- [ ] **V3.7**: Buat database/staging dengan akun dan storage terpisah. Aplikasi memakai akun DB terbatas; akun migrasi/administrasi tidak disebarkan ke frontend.
- [ ] **V3.8**: Tempatkan database, lampiran, dan snapshot CMS di penyimpanan persisten di luar direktori rilis. Kode sekarang menulis snapshot relatif terhadap server ke `data/website-published.json` dan `public/website-published.json`; siapkan path/volume yang teruji dan jangan kehilangan isinya saat pergantian rilis.
- [ ] **V3.9**: Arahkan DNS ke target yang disepakati, periksa A/AAAA, terbitkan TLS otomatis, redirect HTTP, dan uji pembaruan sertifikat. Aktifkan HSTS setelah HTTPS stabil; jangan langsung preload/includeSubDomains tanpa meninjau subdomain lain.
- [ ] **V3.10**: Konfigurasikan security headers, batas body/upload, timeout, serta rate limit sesuai alur aplikasi. Jika di belakang proxy, batasi trust proxy ke topologi aktual agar IP, HTTPS, cookie, dan rate limit tidak salah.
- [ ] **V3.11**: Jika realtime dipakai, uji koneksi dan perubahan lintas perangkat sungguhan melalui proxy. Respons health 200 atau teks "terhubung" bukan bukti database maupun realtime bekerja.

### V4 — Rilis staging, backup, dan pemulihan

Urutan verifikasi paket pada kandidat rilis yang dipin:

```bash
npm ci
npm run verifikasi
```

`verifikasi` menjalankan typecheck, unit test, pemeriksaan gudang/FEFO, dan build. Jalankan di build/staging dengan devDependencies tersedia, bukan menginstal ulang langsung pada rilis live yang sedang dipakai. Runtime memerlukan `dist/`, `server.js`, dependencies eksternal, dan file runtime terkait; menyalin `dist/` saja menghilangkan backend. Jalankan hasil build melalui service dengan `NODE_ENV=production`.

- [ ] **V4.1**: Seluruh verifikasi lulus pada OS/Node target; tinjau kerentanan dependensi dan bundle besar. Jangan menjalankan pembaruan paksa dependency tanpa uji regresi.
- [ ] **V4.2**: Terapkan rilis pada staging terisolasi yang hanya memakai data sintetis sampai perlindungan data dan akses lulus; jangan mengunggah dump data asli untuk sekadar menguji deployment.
- [ ] **V4.3**: Uji login salah/benar/logout, akses tanpa login, peran salah, restart service/VPS, persistensi multiuser, upload, input kosong/tidak valid, transaksi bersamaan, dan alur modul pilot. Database tidak tersedia harus menghasilkan kegagalan yang jelas.
- [ ] **V4.4**: Catat RPO (kehilangan data maksimum) dan RTO (waktu pemulihan maksimum) yang disetujui. Usulan awal untuk dibahas: RPO 1 jam, RTO 4 jam; jadwal dan mekanisme backup harus benar-benar mampu memenuhinya.
- [ ] **V4.5**: Backup konsisten mencakup database, lampiran, snapshot CMS, dan konfigurasi pemulihan; terenkripsi, kredensial terpisah, offsite, dengan retensi harian/mingguan/bulanan sesuai kebijakan. Snapshot VPS saja bukan satu-satunya backup.
- [ ] **V4.6**: Restore ke instance terpisah, buka aplikasi, baca record dan lampiran, periksa saldo/stok/audit, lalu ukur waktu pemulihan. Verifikasi kunci dekripsi tersedia bagi petugas yang berwenang dan alert backup gagal benar-benar terkirim.
- [ ] **V4.7**: Pantau uptime, readiness koneksi database/storage yang nyata, 5xx, restart berulang, CPU/RAM/disk, usia backup, dan masa berlaku TLS; log tidak memuat password/token atau payload pribadi lengkap. Endpoint health yang ada belum memeriksa database.
- [ ] **V4.8**: Simpan rilis sebelumnya dan latih rollback aplikasi beserta kompatibilitas migrasi. Bila database harus dipulihkan, hentikan penulisan sesuai persetujuan, backup keadaan terbaru, dan rekonsiliasi transaksi setelah backup; jangan menimpa transaksi baru secara diam-diam.

### V5 — Pembukaan input data asli

- [ ] **V5.1**: PJT/QA, penanggung jawab modul, dan administrator menandatangani bahwa V2–V4 serta fase A–K yang relevan untuk cakupan pilot telah lulus. Pengecualian cakupan harus tertulis; kontrol keamanan, persistensi, dan restore tidak boleh dikecualikan.
- [ ] **V5.2**: Buat akun staf individual dan matriks peran; verifikasi daftar pengguna, dasar pemrosesan data pribadi, retensi, serta prosedur penonaktifan akun.
- [ ] **V5.3**: Inventaris data yang pernah diinput di setiap browser/origin, termasuk localhost. Domain baru tidak membawa localStorage lama; ekspor browser yang tersedia belum mencakup semua koleksi/lampiran dan bukan backup penuh. Jangan membersihkan browser lama sebelum migrasi direkonsiliasi.
- [ ] **V5.4**: Sediakan impor tervalidasi dengan ID stabil, pencegahan duplikasi, laporan error, dan dry-run. Data demo dipisahkan dari data asli tanpa menghapus sumber sebelum backup.
- [ ] **V5.5**: Input bertahap: organisasi/peran → referensi CoA/pajak/satuan/gudang → produk/NIE/pemasok/pelanggan → karyawan sesuai izin → stok batch dan saldo awal pada cut-off → transaksi harian. Sesuaikan cakupan dan dependensi dengan Fase H.
- [ ] **V5.6**: Rekonsiliasi jumlah record, batch/expiry/kuantitas, nilai stok, saldo awal, AR/AP, dan lampiran terhadap sumber. Untuk batch migrasi, tidak boleh ada record hilang atau duplikat yang tidak dijelaskan; saldo harus tepat.
- [ ] **V5.7**: Mulai pilot dengan kelompok kecil, pantau hasil setiap hari, dan tetapkan kontak eskalasi serta mekanisme kembali ke prosedur lama tanpa membuat dua sumber transaksi yang saling bertentangan.
- [ ] **V5.8**: Buka pengguna/modul berikutnya hanya setelah pilot disetujui dan bukti tersimpan. Integrasi pemerintah yang belum benar-benar terhubung tidak boleh ditampilkan sebagai pengiriman sukses.

**Keputusan saat checklist ini disiapkan:** lanjut persiapan infrastruktur dan fondasi aplikasi; **jangan mulai input data asli atau membuka dashboard tanpa kontrol akses di internet**. Backend PostgreSQL + Express telah disetujui; eksekusi VPS masih menunggu detail target, akses aman, serta cakupan pilot dari pemilik sistem.
