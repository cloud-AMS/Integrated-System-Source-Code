> **Status dokumen (diperbarui 2026-11): FAKTA TERVERIFIKASI (checklist jujur / zero-skip policy)** — Fondasi persistensi server (`A1`), autentikasi & RBAC server-side (`B1`–`B2`), serta verifikasi lint/tes/build kode sumber (`D1`, verifikasi repositori lokal) **sudah terpenuhi di codebase**. Item yang memerlukan eksekusi di server staging/produksi, integrasi eksternal, migrasi data, dan tanda tangan PJT **tetap belum dicentang `[ ]`** sampai ada bukti di lingkungan target.

## Developer Notes

Catatan arsitektur saat ini:
- Persistensi lintas pengguna & perangkat sudah berjalan di server Express (`server/dataSyncStore.ts` → `<AMS_DATA_DIR>/app-state.json`, `server/rbacStore.ts` → `<AMS_DATA_DIR>/rbac-db.json`, serta WebSocket `/api/sync/ws`).
- Meskipun fondasi kode pada **A1, B1, B2, dan D1** sudah terverifikasi, aplikasi **belum berstatus siap go-live produksi** sebelum seluruh fase staging, hardening VPS/proxy, integrasi eksternal, migrasi & rekonsiliasi data, serta **tanda tangan PJT + penanggung jawab teknis** terpenuhi.

# Protokol & Checklist Peluncuran Produksi (Production Readiness Checklist)

Dokumen ini adalah **Protokol Resmi Peluncuran Produksi (*Production Deployment Protocol*)** untuk **AMS Integrated System (PT Anugrahmitra Selaras)**, termasuk panduan dan checklist migrasi data / input data asli (*real data seeding*) untuk setiap modul fungsional.
Coded by Langgo Bramandityo

Dokumen ini mengikuti urutan implementasi produksi yang jujur: **pintu dikunci dulu, baru integrasi dibuka; backup dibuktikan bisa dipulihkan sebelum data dimasukkan; data dimasukkan dengan rekonsiliasi; kepatuhan ditandatangani; baru go-live**. Seluruh item ditandai hanya berdasarkan fakta yang dapat diverifikasi.

---

## Ringkasan Status Terkini (Audit Codebase)

| Kode Item | Status | Bukti Verifikasi Terkini |
| :--- | :--- | :--- |
| **A1** | **Terpenuhi `[x]`** | `server/dataSyncStore.ts` (`app-state.json`), `server/rbacStore.ts` (`rbac-db.json`), `/api/sync/*`, `/api/sync/ws`, `src/services/pocketbase.ts`; diuji oleh `tests/domain/rbac-realtime-sync.test.ts` & `tests/domain/data-origin-sync.test.ts`. |
| **A2** | Parsial (Mekanisme Siap `[ ]`) | Mekanisme isolasi & pembersihan selektif tersedia (`src/utils/dataOrigin.ts`, `POST /api/sync/purge-dummy`, Pusat Purge di `ITModule`), namun seed/demo (`src/data/*`) masih ada di bundle sampai dipurge/dinonaktifkan pada build produksi. |
| **B1** | **Terpenuhi `[x]`** | Login server-side `scrypt` + HMAC-SHA256 cookie `HttpOnly` (`ams_session`) & Bearer fallback TTL 12 jam (`server/rbacStore.ts`, `server/rbacMiddleware.ts`); Setup Wizard & `npm run auth:bootstrap` menggantikan login statis klien. *(Catatan: cookie memakai `SameSite=None; Secure` di HTTPS untuk kompatibilitas iframe; tinjau jika perlu `SameSite=Strict` di domain tunggal produksi.)* |
| **B2** | **Terpenuhi `[x]`** | `requirePermission(...)`, `canWriteSyncKey`, `canDeleteSyncKey`, pencabutan sesi real-time WebSocket (`rbac:session-revoked`), & audit penolakan `DENIED` di `rbac-db.json`. |
| **B3–B6** | Parsial (Di Repo / Proxy `[ ]`) | Kode bebas kredensial & `.env.example` bersih; rate limit login (`15x/15 mnt` per IP+user → HTTP 429) & `/api/website/published` (`30x/15 mnt/IP`) aktif, namun Secret Manager VPS, rate limit global API, security header aktif di server/Nginx produksi, dan pembatasan CORS domain belum diverifikasi di server target. |
| **D1** | **Terpenuhi `[x]`** | `npm run lint` (`tsc --noEmit`) lulus tanpa error. |
| **D2–D3** | Parsial (Lokal Hijau `[ ]`) | Di repositori lokal: `npm run test` (16 file, 225 tes), `npm run cek:semua` (`cek:benih`, `cek:fefo`, `cek:gudang`), & `npm run verifikasi` lulus. Belum dijalankan di server staging; `npm run build` sukses namun Vite masih memberi peringatan chunk >500 kB (`dist/assets/index-*.js` ~3,43 MB / ~757 kB gzip). |

---

## Aturan Protokol Peluncuran (Deployment Rules)

1. **Wajib berurutan**: fase dijalankan dari **A sampai K**. Fase tidak boleh dilewati tanpa pengecualian tertulis dari Lead Developer dan PJT.
2. **Zero-skip policy**: tidak ada item yang dicentang tanpa bukti verifikasi (log, tangkapan layar, nomor tiket, hasil test/build, atau tanda tangan).
3. **Sign-off ganda**: setiap fase ditutup dengan tanda tangan **PJT + penanggung jawab teknis** pada kolom "Diverifikasi oleh".
4. **Kriteria go/no-go**: go-live **batal otomatis** bila salah satu terpenuhi — audit trail tidak berjalan; restore backup gagal diuji; rekonsiliasi data melebihi toleransi (lihat H-RECON); ada temuan keamanan kritis terbuka; sign-off PJT belum ada.
5. **Rollback wajib dilatih**: skenario "kembali ke sistem lama" harus pernah dicoba di staging sebelum go-live pertama, bukan dikarang saat krisis.
6. **UU PDP (UU No. 27 Tahun 2022)**: setiap isian yang memuat data pribadi (NIK, kontak, data rekam medis ringkas) wajib punya dasar pemrosesan yang sah, dan kebijakan privasi perusahaan harus tersedia sebelum data asli dimuat.

---

## Fase A — Fondasi & Data Demo (WAJIB PERTAMA)

> Catatan arsitektur: aplikasi sekarang menyimpan seluruh data operasional, akun RBAC, peran, sesi, dan log audit keamanan di **server Express** (`<AMS_DATA_DIR>/app-state.json` & `<AMS_DATA_DIR>/rbac-db.json`) serta menyiarkan pembaruan lintas perangkat secara real-time melalui **WebSocket `/api/sync/ws`** (`src/services/pocketbase.ts` mempertahankan `localStorage` hanya sebagai cache/cadangan offline dan mengutamakan state otoritatif server).

- [x] **A1**: Persistensi data di server terverifikasi — data dan akun/peran yang disimpan satu pengguna tersinkron ke server dan terbaca pengguna lain secara real-time via HTTP `/api/sync/*`, `/api/rbac/*`, dan WebSocket `/api/sync/ws`. **Bukti**: `server/dataSyncStore.ts`, `server/rbacStore.ts`, `server.ts`, serta 16 file (225 tes) Vitest termasuk `tests/domain/rbac-realtime-sync.test.ts` dan `tests/domain/data-origin-sync.test.ts` lulus.
- [ ] **A2**: **Data seed/demo dipurge.** Seluruh isi `src/data/initialData.ts`, `salesMarketingData.ts`, `seedKeuangan.ts`, `websiteRujukan.ts` (±280 KB data karangan: karyawan, jurnal, stok, suhu, dst.) diganti atau dinonaktifkan di build produksi. **Status**: Mekanisme pembersihan selektif sudah tersedia (`src/utils/dataOrigin.ts`, `POST /api/sync/purge-dummy`, & Pusat Purge Data Dummy di `ITModule` yang mempertahankan CoA, pajak, RBAC, dan pengaturan situs), tetapi eksekusi purge + verifikasi 0 string seed pada build produksi tetap wajib dijalankan sebelum cut-off.
- [ ] **A3**: Lingkungan **staging** tersedia dengan struktur yang sama dengan produksi (boleh data kecil, wajib skema sama).
- [ ] **A4**: Backup data yang sudah ada (bila ada) diambil **sebelum** migrasi apa pun.

## Fase B — Keamanan Inti (sebelum integrasi apa pun dibuka)

- [x] **B1**: Autentikasi **di sisi server** terimplementasi dengan password hashing `scrypt`, token sesi bertanda tangan HMAC-SHA256, dan cookie `HttpOnly` (`ams_session`, TTL 12 jam) + header `Authorization: Bearer` (`server/rbacStore.ts`, `server/rbacMiddleware.ts`, `/api/auth/login`, `/api/auth/setup`, `npm run auth:bootstrap`). Login statis klien (`admin/admin123`) sudah dihapus permanen. *(Catatan verifikasi: cookie memakai `SameSite=None; Secure` pada HTTPS agar kompatibel dengan iframe & `SameSite=Lax` pada HTTP; bila produksi hanya domain tunggal non-iframe dan mewajibkan `SameSite=Strict`, ubah di `server/rbacMiddleware.ts`.)*
- [x] **B2**: Otorisasi peran (PJT, IT Admin, QA, QC, Gudang, Teknisi, Manufaktur, Purchasing, Sales, HRD, Finance) ditegakkan **di server** untuk setiap endpoint tulis, hapus, RBAC admin, dan sync key (`requirePermission(...)`, `canWriteSyncKey`, `canDeleteSyncKey`), lengkap dengan pencabutan sesi real-time via WebSocket (`rbac:session-revoked`) dan pencatatan `PERMISSION_DENIED` pada audit log server. **Bukti**: `tests/domain/rbac-realtime-sync.test.ts`, `tests/domain/hak-akses.test.ts`.
- [ ] **B3**: Rahasia (API key, token, password DB) tidak ada di kode sumber maupun repo; memakai Secret Manager / environment variable di server target. **Status**: Di kode sumber & `.env.example` sudah bersih tanpa rahasia hardcoded (`SESSION_SECRET`, `INITIAL_SETUP_TOKEN`, `GEMINI_API_KEY`, `AMS_ADMIN_TOKEN`, fallback runtime `.session-secret` izin `0600`), menunggu konfigurasi Secret Manager / `.env` pada server staging & produksi.
- [ ] **B4**: *Rate limiting* untuk endpoint autentikasi dan endpoint tulis sensitif. **Status**: Di server Express sudah aktif batas login gagal (`15 percobaan / 15 menit` per `ip::username` → HTTP `429`) dan publikasi situs (`30 req / 15 menit / IP` → HTTP `429`); pembatasan laju global via Nginx `limit_req` / endpoint tulis lain (`/api/sync/*`, `/api/rbac/*`, `/api/auth/setup`) masih harus diaktifkan di server produksi.
- [ ] **B5**: *Security headers* aktif di server/reverse proxy target: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Content-Security-Policy. *(Template Nginx/Caddy sudah tersedia di `docs/panduan-deploy-vps.md` & `/api/system/deployment-guides`, menunggu verifikasi aktif di VPS target.)*
- [ ] **B6**: CORS dibatasi hanya ke domain resmi perusahaan.
- [ ] **B7**: **Kepatuhan UU PDP**: inventaris data pribadi yang diproses, dasar hukum pemrosesan, hak akses/penghapusan subjek data, dan kebijakan privasi yang diterbitkan.
- [ ] **B8**: Kebijakan password staf (minimal kuat, rotasi berkala) + MFA bila memungkinkan.

## Fase C — Monitoring & Observabilitas (sebelum go-live, bukan sesudahnya)

- [ ] **C1**: Error tracking produksi (mis. Sentry) aktif dan alert terkirim ke tim.
- [ ] **C2**: *Uptime monitoring* untuk aplikasi (`/api/health` + layanan pendukung) dengan alert ke HP tim IT.
- [ ] **C3**: Alarm darurat cold chain (2°C–8°C) terhubung ke webhook PJT / WhatsApp bila suhu deviasi.
- [ ] **C4**: Log terstruktur dengan retensi minimal 90 hari; log audit tersimpan terpisah (immutable/WORM bila memungkinkan).

## Fase D — Build & Verifikasi di Staging

- [x] **D1**: `npm run lint` (`tsc --noEmit`) lolos tanpa error — **Terverifikasi** pada repo (`tsc --noEmit` keluar kode 0).
- [ ] **D2**: `npm run test` lolos; `npm run verifikasi` hijau **di server staging**. **Status**: Di repo lokal seluruh suite sudah lulus (`npm run verifikasi`: 16 file / 225 tes Vitest, `cek:benih`, `cek:fefo`, `cek:gudang`, dan `build` hijau); tinggal dijalankan ulang dan diverifikasi di server staging target.
- [ ] **D3**: `npm run build` tanpa peringatan kritis; bundle ditinjau (code-splitting aktif; ukuran per chunk wajar). **Status**: `npm run build` menghasilkan `dist/`, PWA service worker `dist/sw.js`, dan `server.js` (89,6 KB) tanpa error fatal, tetapi Vite masih menampilkan peringatan chunk >500 kB (`dist/assets/index-*.js` ~3.427 kB / ~757 kB gzip) sehingga code-splitting lanjutan masih perlu dilakukan sebelum dicentang.
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
4. **Developer Notes — label**: status apa pun yang belum terukur tidak boleh ditulis sebagai "aktif/terhubung" di UI atau dokumen; tulis "belum dikonfigurasi".
5. Berkas ini ditulis ulang pada 2026-11. Perubahan berikutnya wajib melalui review PJT + QA.
