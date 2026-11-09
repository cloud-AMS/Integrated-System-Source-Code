# PHASE 1 — EXISTING SYSTEM AUDIT
## AMS Integrated System · Existing Application Enterprise Transformation

| | |
|---|---|
| Tanggal audit | 5 November 2026 |
| Objek | repo `AMS-push` @ `main` `6812703`, 109 berkas tracked, 44.941 baris TS/TSX |
| Metode | **Read-only.** Tidak ada satu berkas sumber, basis data, atau transaksi yang diubah. |
| Acuan | [docs/master-enterprise-transformation.md](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/docs/master-enterprise-transformation.md) §3 (preservasi), §4 (arsitektur target), §5 (keamanan), §6 (integrasi), §7 (PWA), §8 (data), §10/§12 (fase) |
| Status | **DISETUJUI 2026-11-05** — pemilik menjawab Q-1..Q-6 (§15) dan memerintahkan Phase 1.5 dijalankan lebih dulu. Phase 1 sendiri tetap read-only; perubahan kode hanya terjadi pada Phase 1.5. |
| Konvensi bukti | Semua angka di bawah saya ukur sendiri pada sesi ini; angka yang berasal dari penelusuran berkas ditandai *(penelusuran)* |

---

## 0. Ringkasan eksekutif

AMS hari ini adalah **aplikasi web React satu-halaman yang sangat lengkap pada lapisan domain, dan tidak ada apa-apa pada lapisan infrastruktur.** Dalam satu kalimat yang harus diterima sebelum Phase 2: semua logika bisnis, semua perhitungan, dan seluruh "basis data" aplikasi berjalan **di dalam browser** (`localStorage`), sedangkan yang selama ini dianggap backend — Express di [server.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts) dan klien PocketBase di [src/services/pocketbase.ts:178](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L178) — tidak pernah menyimpan satu baris pun.

Skala yang nyata (semua terukur hari ini):

| Ukuran | Nilai |
|---|---|
| Berkas `.ts`/`.tsx` di `src/` | 66 berkas, 44.941 baris |
| Interface domain di [src/types/index.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/types/index.ts) | **108** interface + 25 `type` union |
| Array benih `INITIAL_*` di [src/data/initialData.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/data/initialData.ts) (5.793 baris) | **66** |
| Kunci koleksi yang dibaca/ditulis | **64** kunci array (`getCollection`/`setCollection` 66 call site masing-masing) + 5 kunci JSON konfigurasi |
| Berkas modul layar di `src/components/modules` | 49 berkas, 14 modul navigasi ([Navbar.tsx:90](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/components/layout/Navbar.tsx#L90)) |
| Call site jaringan ke PocketBase | **3** (lihat §4) |
| Keluaran build produksi | **1 chunk** `index-BW0d1HrJ.js` 1.488,82 kB (348,10 kB gzip) + CSS 60,84 kB (10,92 kB gzip) — angka awal saya di tabel ini (1.453,93 kB) keliru, lihat koreksi di §16 |

### Delapan temuan yang memblokir Phase 2

1. **Tidak ada sumber untuk dimigrasikan.** Spesifikasi §8 menuntut *migration mapping* "skema lama → skema baru". Skema lama itu tidak ada di sisi server: tidak ada PostgreSQL, tidak ada tabel, tidak ada DDL. Yang ada adalah 64 kunci JSON di `localStorage` milik tiap browser pengguna. Konsekuensi: Phase 2 tidak bisa dimulai sebelum pemilik produk menyatakan di mana data produksi AMS sebenarnya berada.
   → **Terjawab (Q-1):** belum ada database sama sekali. Phase 2 berubah sifat dari "migrasi" menjadi **pembangunan basis data pertama AMS**.
2. **Ada PocketBase hidup di `127.0.0.1:8090` yang isinya tidak bisa kami baca.** `GET /api/health` → 200; `GET /api/collections` → **401**. Kode aplikasi memang mengarah ke URL itu ([pocketbase.ts:175](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L175)), jadi instance ini sangat mungkin milik AMS — tetapi aplikasi tidak pernah melakukan CRUD ke dalamnya. Statusnya: **TIDAK DIKETAHUI**, dan ini pertanyaan nomor satu (§15).
   → **Terjawab (Q-2):** instance itu bukan sumber data AMS. Basis data dirancang baru; skema `:8090` tidak dijadikan acuan ERD maupun objek migrasi.
3. **Aturan retensi saat ini melanggar aturan preservasi Anda sendiri.** [pocketbase.ts:1329](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L1329) `BATAS_RIWAYAT_GUDANG = 300` memangkas pergerakan stok & pemindaian, `log_suhu` dipangkas ke 50, dan jejak audit ke **100 baris** ([pocketbase.ts:2122](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L2122)). Pemangkasan ini **menghapus baris historis secara fisik**. Spesifikasi §3 melarang "menghapus transaksi historis" dan §8 menuntut histori aset/utang/jurnal/pembayaran dipertahankan. Salah satu dari keduanya harus diubah — keputusan pemilik.
   → **Terjawab (Q-5):** ya, diarahkan ke arsip append-only. Retensi 300/50/100 tidak dipindahkan ke backend; `audit_logs`, `outbox_events`, `integration_logs`, dan jejak pergerakan dipartisi per waktu, bukan dipangkas.
4. **Autentikasi dan otorisasi adalah kosmetik.** [src/utils/autentikasi.ts:8](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/autentikasi.ts#L8) berisi `admin` / `admin123` dalam plaintext di bundel klien; perbandingan sandi terjadi di JavaScript ([autentikasi.ts:30](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/autentikasi.ts#L30)); sesi hanya JSON di `localStorage`; dan komentar berkas itu sendiri menyatakan "bukan batas keamanan" ([autentikasi.ts:5](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/autentikasi.ts#L5)). Peran (`UserRole`, [types/index.ts:21](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/types/index.ts#L21)) dipilih pengguna dari dropdown. Dari 14 modul, hanya 3 tempat penyaringan peran pernah ada, dan semuanya bisa dilampaui dari konsol browser. OAuth 2.0 / OIDC / JWT / RBAC / ABAC (§5) bukan sekadar "belum dimulai" — **ada lapisan palsu yang memberi rasa aman yang tidak nyata**, dan itu wajib dihapus atau diganti.
5. **Jejak audit dapat dipalsukan dari sisi klien.** `logAudit` menulis ke `localStorage`, lalu menempeli `statusIntegritas: 'Tervalidasi Digital'` tanpa hash, tanpa tanda tangan, tanpa rantai (rantai sha256 yang ada hanya berlaku untuk pergerakan stok, bukan untuk audit). Klaim "Integritas Data / ISO 13485" yang muncul di layar IT tidak punya dasar teknis. §5 sudah mengantisipasi ini — larangan "jangan klaim kepatuhan CDAKB/ISO otomatis" berlaku penuh pada aplikasi hari ini.
6. **Satu endpoint menulis ke disk tanpa autentikasi apa pun.** `PUT /api/website/published` ([server.ts:163](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L163)) menerima JSON dari klien dan menulisnya ke `data/` **dan** `public/website-published.json` yang ikut ter-commit; `suntikSeo` hanya meng-escape `<` dan `"`. Ini jalur defacement sekaligus *stored-XSS sink* ke halaman publik `/web`, dengan `listen 0.0.0.0` tanpa helmet, tanpa CORS policy, tanpa rate limiting.
7. **Gerbang verifikasi permanen merah secara deterministik.** `npm run cek:benih` → exit 0, `npm run cek:fefo` → exit 0, `npm run cek:gudang` → mencetak `OK: 39 pemeriksaan … lolos` lalu **exit 1** (`ReferenceError: EventSource is not defined`, pocketbase RealtimeService, Node v24.20.0) karena PB yang hidup di :8090 membuat `checkPBConnection()` sukses dan proses Node memasang 10 subscription realtime. Akibatnya `cek:semua` **tidak pernah bisa menjadi gerbang**, dan rantai `&&` di npm menghentikan suite di tengah. `tsc --noEmit` hijau, tetapi [tsconfig.json](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/tsconfig.json) **tidak menyalakan `strict`**; tidak ada eslint/prettier, tidak ada CI, tidak ada git hooks, tidak ada runner unit/E2E. Tiga `scripts/cek-*.ts` adalah penjaga invarian benih + satu penjaga berperilaku integrasi — aset terbaik repo ini, tapi cakupannya hanya Gudang & Sales.
   → **Ditutup di Phase 1.5:** penjaga realtime melewati lingkungan Node, konvensi exit ketiga penjaga dinormalkan, `strict: true` dinyalakan (0 error), Biome dipasang sebagai linter (typescript-eslint tidak dapat dipasang karena `peerDependencies`-nya menolak TypeScript 7), `vitest` dipasang dengan 123 uji golden baseline, dan CI `.github/workflows/ci.yml` menjalankan `npm run verifikasi`. Sekarang exit 0 yang sebenarnya.
8. **Benih memakai institusi dan orang nyata.** RSUP Nasional Dr. Cipto Mangunkusumo, RSUP Dr. Sardjito, RSUD Dr. Soetomo, RSUD Zainoel Abidin, Shenzhen Mindray Bio-Medical, PT Kimia Farma Trading, Dewi Anggraini, Hendra Setiawan, nomor `CDAKB/PJT/2024/0117`, `FTR/2024/06/119`. Dalam screenshot, printout, atau ekspor apa pun ini **tidak bisa dibedakan dari transaksi produksi** — sementara §11 melarang "data dummy sebagai pengganti data production". Hari ini yang tersedia justru hanya data yang menyerupai produksi tanpa pernah menjadi produksi.
   → **Terjawab (Q-3):** seluruh `INITIAL_*` adalah DUMMY. Penghapusan data dummy dan pengisian data asli menjadi **Phase 7** (§12), dijalankan setelah seluruh fase modernisasi selesai.

---

## 1. Kondisi aplikasi sekarang

**Cara dijalankan.** `npm run dev` = `tsx server.ts` (Express + middleware Vite). `npm run build` = `vite build` lalu `esbuild server.ts` → `server.js`; `npm start` = `node server.js`. Tidak ada `Dockerfile`, `docker-compose`, `.github/`, atau konfigurasi platform apa pun; yang ada hanya **teks** panduan Caddy/NSSM yang disajikan endpoint ([server.ts:73](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L73)) dan dibaca layar IT. [vite.config.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/vite.config.ts) menyalin `dist/index.html` ke `dist/web/index.html` karena hosting statis hanya melayani `/web/` — jadi model publikasi yang dipakai selama ini adalah **situs statis**, bukan server aplikasi.

**Dua wajah dalam satu bundel.** [src/main.tsx](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/main.tsx) memilih aplikasi lewat satu uji regex pada `location.pathname`: `/web` → situs publik + katalog; sisanya → shell ERP. Tidak ada router; tidak ada route per modul; tidak ada deep-link ke sebuah tab.

**Siklus data.** Saat modul pertama membaca suatu koleksi, `getCollection` ([pocketbase.ts:365](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L365)) melihat `localStorage`; kalau kosong, ia **langsung menulis benih** ke penyimpanan lalu mengembalikannya. Setiap aksi (terima barang, kirim, opname, kunci karantina, publikasi situs) adalah `setCollection` ([pocketbase.ts:378](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L378)): **serialisasi ulang seluruh array lalu menimpa kunci itu**. Sinkron antar-tab memakai event `storage` + `BroadcastChannel('ams_alkes_realtime_v1')`. `resetToDefaults()` memanggil `localStorage.clear()` + reload **tanpa konfirmasi**.

**State repo saat laporan ini ditulis.** Branch `main`, 4 commit (`e6fb22f` → `6812703`), tanpa tag dan tanpa branch lain. Working tree: `package-lock.json` **M** (akibat `npm install` sesi ini, bukan perubahan kode) dan `docs/` untracked 2 berkas. Tidak ada yang saya commit — sesuai aturan, commit hanya atas permintaan.

**Angka yang direproduksi hari ini vs yang tercatat di blueprint gudang.** Blueprint §7.1 mencatat 2.051,13 kB JS (441,17 kB gzip) + 58,44 kB CSS. Build commit `6812703`: **1.488,82 kB JS (348,10 kB gzip) + 60,84 kB CSS (10,92 kB gzip)** — satu chunk, dan Vite tetap memberi peringatan >500 kB. (Angka yang pertama saya tulis di sini, 1.453,93 kB, keliru; lihat koreksi §16.) Angka blueprint tidak tereproduksi; dokumen itu perlu dikoreksi sebelum dipakai sebagai dasar keputusan (debt D-12 di §14).

---

## 2. Teknologi yang digunakan (Technology Stack Assessment)

| Lapisan | Yang dipakai sekarang | Target spesifikasi | Jarak |
|---|---|---|---|
| UI framework | React 19.0.1, Vite 8.3.x, TypeScript 7, Tailwind CSS v4 (`@tailwindcss/vite`), `motion`, `lucide-react` | §4C: React 19, Vite, TS, Tailwind v4 | **Sudah sesuai** — posisi terbaik repo ini |
| Routing | tidak ada (1 regex di `main.tsx` + `useState<NavId>`) | modular frontend | perlu ditambah |
| Data fetching | tidak ada — 0 `@tanstack`, 0 wrapper REST | §4C TanStack Query | **belum dimulai** |
| Offline / PWA | 0 `vite-plugin-pwa`, 0 manifest, 0 service worker, 0 `indexedDB` di seluruh `src/` | §4C + §7: IndexedDB, background sync, conflict resolution | **belum dimulai** |
| State data | `localStorage` 64 kunci + 5 blob JSON, pub/sub in-memory | §4E PostgreSQL 16, pgvector, Redis, MinIO/S3 | **jarak penuh**: tidak ada DB |
| Backend | Express 4 di `server.ts`, 6 endpoint, fungsi utama sajikan berkas & dev middleware | §4D NestJS, DI, DTO validation, Swagger, modular domain services | **jarak penuh**: tidak ada domain logic sisi server |
| Realtime | `BroadcastChannel` + event `storage`; PocketBase `subscribe` (browser only) | §4B RabbitMQ + transactional outbox, idempotency, DLQ, versioning, correlation ID | **belum dimulai**; pub/sub hari ini tidak bertahan proses |
| Autentikasi | 1 akun hardcoded plaintext, peran dari dropdown | §5 OAuth2, OIDC, JWT, RBAC, ABAC, department-based | **belum dimulai**, dan yang ada menyesatkan |
| Integrasi | builder payload LKPP/FHIR untuk pratinjau layar; 4 `fetch()` semuanya same-origin | §6 SIMRS, HIS, HL7 FHIR, DICOM, e-Katalog LKPP, LPSE, Kemenkes, banking, principal ERP | **semuanya simulasi** (lihat §4) |
| Pengujian | `tsc --noEmit` (dinamai `lint`) + 3 `scripts/cek-*.ts`; **exit 1 deterministik** di `cek:gudang` | unit+integration+E2E+performance+security+migration test | **belum dimulai**; gerbang ada tapi merah |
| CI/CD, kontainer, monitoring | tidak ada; `console.*` 3 titik; 0 error boundary; 22 `catch {}` bisu | Docker, K8s, Caddy, health, monitoring, backup, DR | **belum dimulai** |
| AI | dependensi `@google/genai ^2.4.0` dengan **0 import** (terverifikasi), `metadata.json` menjanjikan kapabilitas sisi-server, `GEMINI_API_KEY` tidak pernah dibaca `server.ts`, `dotenv` tidak pernah di-import | — | dependensi mati, klaim metadata tak berdasar |
| Manajemen paket | `package-lock.json` (dipakai) **dan** `bun.lock` (basi, tidak dirujuk skrip apa pun) | satu sumber kebenaran | kontradiktif |

---

## 3. Struktur frontend

**Shell & navigasi.** [App.tsx](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/App.tsx) menyusun layar dengan cabang `activeTab === '…' && <Modul/>` (14 modul, semuanya impor statis, 0 `lazy`, 0 `Suspense`, 0 `import()`); [Navbar.tsx:90](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/components/layout/Navbar.tsx#L90) `ALL_TABS` adalah satu-satunya daftar navigasi — dipakai strip desktop, drawer mobile, dan bottom bar sekaligus. `auditor_internal` ada di `UserRole` tetapi tidak muncul di pilihan peran: peran mati.

**Dua generasi modul hidup berdampingan.** Generasi baru memakai shell bertab + primitif bersama (`ui.tsx`) dan tipografi token: **Gudang & Logistik 12 tab** ([WarehouseModule.tsx](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/components/modules/operations/WarehouseModule.tsx) + 12 berkas `operations/gudang/`), **Sales 7 tab**, **HRD 7 tab**, **Website CMS 3 tab + 31 definisi section** (`website/skema.ts`). Generasi lama — Regulatory, QA, QC, Production, Service, Procurement, Finance, IT, PMS — ditulis inline tanpa primitif, dengan `text-xl`/`rounded-2xl` mentah. Refactor §4C wajib menyatukan keduanya **tanpa mengubah tampilan**, dan risikonya lebih besar daripada terlihat: ada **tiga keluarga primitif duplikat** (`commercial/sales/ui.tsx`, `operations/gudang/ui.tsx`, `supporting/hris/ui.tsx`) yang union `Tone`-nya berbeda satu sama lain.

**Identitas visual yang tidak boleh berubah** ([src/index.css](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/index.css) blok `@theme`): aksen biru **#00AAFF**, sekunder oranye **#FF4400**, tinta `#111111`, cream `#F1F2F2`, skala huruf `--text-2xs 10px` → `--text-5xl 32px`, font Quicksand/Google Sans + JetBrains Mono, kontainer `max-w-[1440px]`, idiom tabel `thead bg-slate-100` + `text-xs` + `font-mono` untuk NIE/SKU/LOT, badge `text-[8px] font-mono`. Cacat yang tercatat: `className="no-print"` dipakai di shell tetapi tidak pernah didefinisikan dan tidak ada blok `@media print` — hasil cetak saat ini ikut membawa navigasi.

**Responsif:** parsial (114 `sm:` / 93 `md:` / 77 `lg:` *(penelusuran)*, drawer + bottom bar `lg:hidden`, tabel hanya `overflow-x-auto`). **i18n:** tidak ada; seluruh label Indonesia hardcoded.

---

## 4. Struktur backend & API Mapping

Kesimpulan lebih dulu: **repo ini tidak punya backend domain.** Seluruh aturan bisnis (FEFO, put-away, gerbang surat jalan, opname, audit, payroll) hidup di lapisan service sisi klien — 2.343 baris [pocketbase.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts) dan 1.390 baris [utils/gudang.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/gudang.ts) — yang berjalan di tab browser pengguna.

| Endpoint | Lokasi | Fungsi nyata | Pemanggil | REAL / SIMULATED |
|---|---|---|---|---|
| `GET /api/health` | [server.ts:61](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L61) | JSON statis yang **selalu** menyebut "PocketBase … Terhubung" | — | **SIMULATED** (tidak memeriksa apa pun) |
| `GET /api/system/deployment-guides` | [server.ts:73](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L73) | teks Caddyfile/NSSM hasil hardcode | layar IT | **SIMULATED** (panduan, bukan deploy) |
| `POST /api/kemenkes/validasi-nie` | [server.ts:128](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L128) | regex `^KEMENKES RI (AKL\|AKD) \d{11}$` | `RegulatoryModule.tsx` | **LOCAL RULE** — bukan lookup ke Kemenkes |
| `GET /api/website/published` · `GET /website-published.json` | [server.ts:150](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L150), [:157](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L157) | baca snapshot situs dari disk | situs publik | REAL (baca berkas) |
| `PUT /api/website/published` | [server.ts:163](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L163) | **tulis JSON dari klien ke `data/` dan `public/`, tanpa autentikasi** | `WebsiteModule.tsx` | REAL & TIDAK AMAN |
| `GET /web` · `GET *` | [server.ts:188](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L188), [:192](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L192) | sajikan SPA + injeksi SEO | browser | REAL |

**Seluruh jaringan keluar dari klien = 4 call site `fetch()`, semuanya same-origin** (PUT publish, validasi NIE, baca snapshot, baca deployment-guides). Tidak ada `axios`, `XMLHttpRequest`, atau `WebSocket` di `src/`.

**PocketBase: 3 call site, nol CRUD** (terverifikasi: `pb.autoCancellation` [pocketbase.ts:179](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L179), `pb.collection(...).subscribe` [:260](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L260), `pb.health.check` [:289](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L289)). Tidak ada `pb.auth`, tidak ada `create/update/get/list`. Klien itu **hanya menentukan label status koneksi** — dan ketika server PB hidup, aplikasi memasang 10 subscription realtime yang tidak menghasilkan apa pun karena datanya memang tidak pernah lewat PB.

**Integrasi eksternal: nol.** LKPP & SATUSEHAT/FHIR adalah **builder payload untuk pratinjau layar** (`bangunPayloadLkpp`, `bangunBundleFhir`, `validasiKirimanSatuSehat` di `utils/gudang.ts`, dipakai Tab 12 Kemenkes RI sebagai modal JSON) plus antrean status yang di-set manual lewat `antrekanSinkronisasiLkpp` / `catatKirimanSatuSehat` / `ubahStatusSinkronisasiLkpp`. Alamat `apio.lkpp.go.id` dan `api-satusehat.kemkes.go.id` hanya benih konfigurasi dengan catatan eksplisit "hanya alamat pratinjau" dan `klienSatuSehatTerdaftar: false`. **DICOM, SIMRS, HIS, banking, e-Faktur DJP, LPSE: tidak ada kodenya sama sekali** — LPSE adalah tabel entri manual, "e-Faktur" sebuah field string, listmonk hanya formulir konfigurasi tanpa SMTP. Sesuai §11, yang benar untuk semuanya adalah **interface + dokumentasi integrasi lebih dulu**, dan itu belum pernah dibuat.

---

## 5. Struktur database & Database Mapping

**Model nyata.** Bukan relasional. 64 kunci koleksi berprefix `ams_alkes_`, tiap kunci = satu array JSON utuh; 5 kunci konfigurasi = satu objek JSON (`gudang_pengaturan`, `surat_pengaturan`, `website_draft`, `website_content_v`, `website_published`); ditambah `sesi_login` dan `website_media_v1` (base64 JPEG hasil kompresi canvas, ukuran tidak dibatasi). Distribusi per keluarga: `gudang_*` 12, `sales_*` 15, `hris_*` 13, `surat_*` 6, inti regulatori/QA/QC 7, sisanya 11 (`stok_gudang`, `pemasok`, `purchase_order`, `penjualan`, `transaksi`, `audit_trail`, `izin_edar`, `penarikan_produk`, dll).

**Entitas.** 108 interface terbagi per blok komentar: *1 Regulatory* (`IzinEdarAlkes`, `SertifikatPerusahaan`), *2 QA* (`DokumenMutu`, `CAPARecord`, `ProdukKembalian`), *3 QC* (`InspeksiQC`), *4 Gudang & Logistik* — blok terbesar, 17 tipe termasuk `StokGudang`, `TerimaBarang`, `SuratJalan`, `OpnameStok`, `JejakPergerakan`, `SinkronisasiLkpp`, `KirimanSatuSehat`, `KonfigurasiGudang`; lalu *5 LayananTeknis*, *6 BetsProduksi*, *7 Pemasok/PO*, *8 Penjualan*, *9 KTD/Penarikan*, *10 & 13 HRD/HRIS*, *11 TransaksiKeuangan*, *12 LogAuditTrail*, dan blok Sales/CRM, newsletter, website CMS.

**Yang sudah baik dan harus dipertahankan.** Rantai sha256 pergerakan stok: bentuk kanonik `waktu|kodeSKU|nomorBets|dariBin->keBin|jumlah|tipe|dokumenRujukan|hashSebelum` dengan jangkar GENESIS 64 nol, diverifikasi ulang terhadap `node:crypto` oleh penjaga — dan implementasinya SHA-256 murni TypeScript tanpa Web Crypto, sehingga **sudah portable ke server** apa adanya. Diff lama/baru per kolom (`bentangPerubahan`) juga sudah dalam bentuk yang benar untuk audit trail §5. Keduanya adalah aset migrasi, bukan debt.

**Kesenjangan yang akan menghantam PostgreSQL (§4E):**

| # | Kesenjangan | Bukti / contoh |
|---|---|---|
| 1 | FK berupa string, bahkan **FK berbasis nama** | join pada `namaAlkes`, `namaPemasok`, `fasyankes`, `kodeSKU`, `nomorBets`, `nomorPesanan`; `nomorIzinEdarUntuk()` mencocokkan **awalan nama** dan jatuh ke `'-'` bila penamaan bergeser |
| 2 | Tidak ada keunikan | tidak ada constraint apa pun; `id`, `kodeSKU`, `nomorBets` sebagai natural key tidak ditegakkan |
| 3 | Array JSON di dalam satu kolom | `TerimaBarang.baris`, `SuratJalan.rute`, `OpnameStok.baris`, `PenarikanProduk.fasyankesTerdampak`, `PraOrderMedRep.item`, `SkemaHargaAlkes.potonganKuantitas`, `LogAuditTrail.perubahan`, dan `KirimanSatuSehat.payloadJson` **dobel tersandi** (FHIR string di dalam baris) |
| 4 | Tiga skema ID yang tidak kompatibel | benih `'STK-001'`/`'LOT-…'`; `idBerikut` menghitung maksimum numerik **non-atomik** dari array yang sudah dipangkas; `SO-`/`INV-`/`LOG-` memakai `Date.now()` |
| 5 | Waktu campur basis | tanggal string `YYYY-MM-DD`; `selisihHariDari` mem-parse sebagai UTC sementara `labelWaktu` memakai getter lokal; `logAudit` menggabungkan tanggal UTC + jam `id-ID` + label "WIB"; FEFO membandingkan kedaluwarsa secara leksikografis; tanpa kolom timezone |
| 6 | Tidak ada soft delete & ada penimpaan histori | hapus = filter array; `verifikasiSelisihOpname` menimpa `jumlahStok` dengan `qtyFisik`; `catatPengirimanSalesOrder` memutasi `StokGudang` di tempat; retensi 300/50/100 membuang baris |
| 7 | `setCollection` menimpa seluruh array | lost update antar-tab, tidak atomik, tanpa optimistic lock; seluruh integritas bergantung pada satu proses browser |
| 8 | Benih & konten terdistribusi ulang | `INITIAL_*` dipakai sebagai fallback setiap kali baca; `NAMA_LAMA` menulis ulang nama perusahaan lama; `cariKetelusuran` masih menyuntik satu record fiktif (`RSUD Pasar Minggu`/`PM44`); konten situs dibangun dari benih |

---

## 6. Modul yang sudah tersedia (Module Mapping)

| Bounded context (§4A) | Modul layar | Tab | Kematangan |
|---|---|---|---|
| Operational Management | **Gudang & Logistik** `WarehouseModule` | 12 | **Matang + terjaga** (12 aturan bisnis, hash-chain, 3 penjaga, skor audit CDB 15 poin) |
| Operational | Stok/Rantai Dingin/Hama (dahulu) kini di dalam Gudang; **CPAKB Production** `ProductionModule` | — | **Tipis**: register BMR list+form saja |
| Operational | **After Sales / Layanan Teknis** `ServiceModule` | — | **Tipis**: CRUD tiket |
| Operational | **Procurement** `ProcurementModule` | 2 | Fungsional warisan (pemasok + PO) |
| Commercial | **Sales & Marketing** `SalesModule` + `ListmonkModule` | 7 (+14 panel newsletter) | Matang secara UI; **LPSE, e-Katalog, kirim email = simulasi** |
| Commercial | CRM/Prospek, SFA/MedRep (GPS geofence), Kampanye, Analitik BI, Kontrak & harga, Rebate | ✔ | Fungsional, semuanya sisi klien |
| Regulatory | **Regulatory** `RegulatoryModule` | 3 | Fungsional; validasi NIE bersifat regex lokal |
| Quality | **QA/CAPA/dokumen mutu** `QAModule` (3 tab) + **QC** `QCModule` | 3 | Fungsional warisan; **Complaint & Calibration register tidak ada** |
| Quality | **PMS (KTD & recall)** `PMSModule` | 2 | Fungsional; eksekusi recall sudah pindah ke Gudang Tab 11 (keputusan §0B blueprint gudang) |
| Supporting | **HRD/HRIS** `HRDModule` | 7 | **Matang** (grading, mutasi, shift, absensi, lembur, slip gaji + PPh21/BPJS murni, ATS, skill matrix, KPI, 360, K3, MCU, APD) |
| Supporting | **Finance** `FinanceModule` | 1 | **Tipis sekali** — lihat §7 |
| Supporting | **IT** `ITModule` | 3 | Fungsional read-only (viewer `audit_trail`, deployment guide teks, unduh JSON) |
| (di luar §4A) | **Website CMS + situs publik** `WebsiteModule`, `website/site/*` | 3 | Matang; 31 section; publikasi lewat endpoint tulis tanpa auth |
| (lintas) | Executive Overview, Traceability modal, PrintModal | — | Fungsional |

---

## 7. Modul yang belum tersedia (gap eksplisit terhadap spesifikasi)

**Tidak ada implementasinya sama sekali:**

1. **Finance & Accounting penuh** — tidak ada jurnal, buku besar, neraca, saldo awal, aset tetap & penyusutan, utang, modal, dan **ledger piutang**. [FinanceModule.tsx](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/components/modules/supporting/FinanceModule.tsx) hanya satu tabel faktur dengan 5 kategori hardcode; "piutang" hanyalah field angka di CRM; penjualan tercatat sebagai `transaksi` tanpa posting ganda. §8 ("laporan resmi PT", "histori aset, utang, modal, jurnal, pembayaran", "jurnal pembukaan & penyerahan modal dengan bukti dan audit trail") **0 % tersedia**.
2. **Reporting engine** — tidak ada generator laporan, tidak ada ekspor CSV/PDF di seluruh aplikasi; keluaran hanya `window.print()` dan satu unduh JSON seluruh basis.
3. **Approval workflow** — tidak ada mesin persetujuan berjenjang; gerbang status ditegakkan per-layar, bukan lewat antrean kerja.
4. **Integration Gateway** — tidak ada lapisan adapter, webhook dispatcher/subscription, HMAC signing, retry, idempotency key, atau `integration_logs`.
5. **Event bus + transactional outbox** — komunikasi antar-modul terjadi dengan memanggil fungsi modul lain langsung (mis. Gudang → Finance menulis `transaksi`), jadi tidak ada event yang bisa di-replay atau diaudit.
6. **Authentication nyata & otorisasi server-side** — OAuth2/OIDC/JWT/RBAC/ABAC/department-based (§5) tidak ada (§0.4).
7. **PWA & offline-first SFA** — service worker, manifest, IndexedDB, background sync, offline draft, conflict resolution: nol. Padahal ini daftar prioritas §7 untuk Medical Representative.
8. **PostgreSQL, pgvector, Redis, MinIO/S3, versioned migration, partitioning, append-only audit trail** — tidak ada satu pun (§4E).
9. **Quality: Complaint register & Calibration register** — komplain hanya literal `sumber` di CAPA; kalibrasi hanya tipe tiket + field `nomorSertifikatKalibrasi` + tahap siklus hidup aset, tanpa daftar aset-kalibrasi dengan jadwal & toleransi.
10. **CPAKB Manufacturing** — tanpa cleanroom environmental log, validasi sterilisasi, recipe/routing, perhitungan TKDN.
11. **After Sales Service** — tanpa SLA, konsumsi spare part, biaya servis, arsip laporan commissioning.
12. **Keamanan & kesiapan produksi** — tanpa rate limiting, CSP, helmet, CORS policy, enkripsi, secure file storage, error boundary, logging, monitoring, backup/restore teruji, DR, kontainer.

---

## 8. Fitur yang perlu diperbaiki (sebelum menambah apa pun)

| Prioritas | Fitur | Masalah terukur | Tindakan yang diusulkan |
|---|---|---|---|
| **P1** | Suite penjaga | `cek:semua` exit 1 deterministik karena realtime PB dipasang di proses Node ([pocketbase.ts:256](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L256) → `subscribe` → `EventSource` tidak ada di Node 24); konvensi exit tidak seragam (`process.exitCode` vs `process.exit(1)`); `&&` menghentikan rantai | `return` bila `typeof window === 'undefined'` (1 baris, mengikuti pola `pasangPendengarLintasTab`), samakan exit code, ganti `&&` dengan pemanggilan berurutan |
| **P1** | Login & peran | akun plaintext di bundel, peran dropdown, 0 penegakan server | auth backend nyata; **sampai saat itu** tandai layar "MODE DEMO", jangan biarkan `admin/admin123` tampak sebagai kontrol |
| **P1** | Jejak audit | cap 100 baris, tanpa hash/tanda tangan, actor & peran dikirim pemanggil, `statusIntegritas: 'Tervalidasi Digital'` tanpa dasar | `audit_logs` append-only + hash chain + correlation ID (§5), hapus cap, tanda tangan di server |
| **P1** | Retensi histori | 300/50/100 baris dibuang permanen; `resetToDefaults()` = `localStorage.clear()` tanpa konfirmasi | arsip append-only; retensi menjadi view bukan hapus — **butuh keputusan §15 Q-5** |
| **P1** | Endpoint tulis situs | `PUT /api/website/published` tanpa auth + escape tipis + `listen 0.0.0.0` | autentikasi + validasi skema + sanitasi; berhenti melacak `public/website-published.json` di git |
| **P2** | Type-safety | `tsconfig` tanpa `strict`/`noImplicitAny`/`noUncheckedIndexedAccess`; 22 `as unknown as`; 5 non-null assertion | strict bertahap per direktori + pasang linter (belum pernah ada) |
| **P2** | Gerbang kualitas | 0 CI, 0 git hooks, 0 unit/E2E runner, 0 error boundary, 22 `catch {}` bisu; `cek:m6-gudang` §10 meng-assert **teks sumber** (`label: 'Kemenkes RI'`, `!isiSales.includes(...)`), rapuh dan tidak melindungi perilaku | vitest + harness E2E; ubah assertion teks menjadi assertion perilaku |
| **P2** | Tanggal acuan | benih 2024 vs jam jalan 2026; util menerima `dari?: Date` tetapi **tidak ada pemeriksaan** yang memaksa shell meneruskannya — layar bisa menampilkan semua bets kedaluwarsa | satu sumber "hari operasi" wajib + assertion penjaga |
| **P2** | Bundel | 1 chunk 1.488,82 kB JS / 348,10 kB gzip; 0 lazy; `index.html` menarik 4 stylesheet Google/cdnfonts eksternal tanpa CSP | backlog blueprint §7.1 (lazy per modul, satu chunk "gudang") + self-host font |
| **P2** | Kontrak FEFO dobel | `alokasikanFEFO` [utils/sales.ts:149](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/sales.ts#L149) membungkus `alokasiFEFOSadarKunci` [utils/gudang.ts:245](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/gudang.ts#L245) lalu **membuang `dilewati` & `stokId`**; UI Sales memakai bentuk lemah, service memakai bentuk kuat | samakan kontrak; hasil perhitungan tidak berubah, hanya field yang hilang dikembalikan |
| **P3** | Registri izin edar | `IzinEdarAlkes` tanpa `kodeSKU`; pencarian lewat awalan nama (blueprint §7.3) | tambahkan `kodeSKU` + cocokkan persis |
| **P3** | Cetak & label | `.no-print` tidak pernah didefinisikan, tidak ada `@media print`; barcode/QR belum nyata (hanya flag `labelDicetak`) | blueprint §7.1/§7.2 — pustaka barcode butuh dependensi baru & persetujuan Anda |
| **P3** | Repo hygiene | README 1 baris; `"name": "react-example"`, `"version": "0.0.0"`; `bun.lock` basi vs `package-lock.json`; `@google/genai` mati; Lampiran B blueprint menunjuk checkout lain (`…/2026-11-04/6fa62ac9/repo/…`); `target="_blank"` tanpa `rel="noreferrer"`; angka bundel blueprint tidak tereproduksi | bersihkan dalam satu commit hygiene |

---

## 9. Kesenjangan arsitektur terhadap target

**Yang sudah selaras:** frontend (§4C target = persis stack hari ini), modularitas domain pada lapisan tipe & util (blok per konteks, hampir semua perhitungan bisnis berupa fungsi murni — FEFO, ROP, proyeksi, diskon, rebate, margin tender, PPh21/BPJS, deteksi excursi, skor audit), dan pola hash-chain yang bisa dipindah ke server tanpa rewrite.

**Yang belum selaras, dan bukan refactor kecil:**

| Target | Jarak sebenarnya |
|---|---|
| Modular monolith ber-DDD dengan lapisan domain/application/infrastructure/presentation | logika domain **tercampur di layar dan satu service klien**; tidak ada proses backend untuk dipasangi DI |
| API-first + Swagger/OpenAPI + versioning | tidak ada API domain; 4 endpoint dev yang mengembalikan teks; tidak ada kontrak |
| PostgreSQL 16 + pgvector + Redis + MinIO | tidak ada DB; tidak ada objek untuk di-`pg_dump`, di-benchmark, atau di-partition |
| Event-driven + RabbitMQ + outbox | pemanggilan langsung antar-modul; tidak ada event tersimpan |
| Append-only audit trail + hash + signed checkpoint | rantai sha256 ada **hanya** untuk pergerakan stok; audit trail tidak memilikinya |
| OAuth2/OIDC/JWT/RBAC/ABAC | satu akun hardcode |
| PWA + IndexedDB + background sync + conflict resolution | nol |
| Microservices-ready | baru tercapai **setelah** boundary domain + event + DB nyata; memecah sekarang berarti memecah kepingan yang tidak punya proses |

Pernyataan jujur yang harus tertulis di audit ini: **target arsitektur §4 tidak salah, tapi tidak bisa dicapai dengan merefaktor repo ini saja.** Repo ini menyumbang domain model + UI + aturan bisnis. Separuh lainnya (backend, DB, event, auth, gateway, PWA, ops) adalah **pembangunan baru di sekitar aplikasi yang ada** — karena itu strategi *strangler* §9 satu-satunya jalan yang masuk akal; big-bang akan memusnahkan justru lapisan domain yang paling bernilai hari ini.

---

## 10. Risiko Migrasi — Risk Register

| ID | Risiko | Bukti | Dampak | Kemungkinan | Kelas | Mitigasi | Butuh keputusan? |
|---|---|---|---|---|---|---|---|
| R-01 | Tidak ada sumber data produksi untuk dimigrasikan | §0.1; DB = `localStorage` tiap browser | Phase 2 menghasilkan skema tanpa isi; keputusan bisnis diambil dari angka benih | **Tinggi** | Data | tetapkan sumber kebenaran; ekspor `localStorage` profil nyata sebagai fixture; jadikan reconciliation report | **Ya** (Q-1) |
| R-02 | Instance PocketBase `:8090` tidak terbaca | health 200, `/api/collections` 401 | bisa jadi skema/collection nyata yang justru harus jadi sumber | Tinggi | Data | kredensial baca-saja + introspeksi koleksi sebelum menulis DDL apa pun | **Ya** (Q-2) |
| R-03 | Retensi 300/50/100 menghapus histori | [pocketbase.ts:1329](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L1329), [:2122](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L2122) | melanggar §3 "jangan hapus transaksi historis"; jejak audit CDAKB bolong | **Tinggi** | Kepatuhan | arsip append-only, retensi sebagai view bukan penghapusan | **Ya** (Q-5) |
| R-04 | Tulis = ganti seluruh array, tanpa lock | [pocketbase.ts:378](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L378) | lost update antar-tab; transaksi hilang tanpa jejak | Tinggi | Integritas | tulisan berbasis baris + optimistic version; sementara: batasi satu tab per operator | Tidak |
| R-05 | Autentikasi & otorisasi kosmetik | [autentikasi.ts:8](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/autentikasi.ts#L8) | permission escalation trivial; tidak ada non-repudiation | **Tinggi** | Keamanan | auth nyata di Phase 3; interim: label demo, jangan dipakai sebagai kontrol produksi | Tidak |
| R-06 | Audit trail dapat ditulis dari konsol | `logAudit` sisi klien | seluruh "bukti audit" tidak dapat dipakai regulator | **Tinggi** | Kepatuhan | audit server-side append-only + hash chain + checkpoint | Tidak |
| R-07 | `PUT /api/website/published` tanpa auth + escape tipis + `0.0.0.0` | [server.ts:163](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L163) | defacement & stored XSS di halaman publik | Sedang–Tinggi | Keamanan | auth + validasi skema + sanitasi + helmet/CSP/rate-limit | Tidak |
| R-08 | FK string/berbasis nama, prefix-match izin edar | `nomorIzinEdarUntuk` awalan nama → `'-'` | join salah & NIE hilang saat penamaan bergeser; laporan keliru | Tinggi | Data | `kodeSKU` di registri + FK nyata + constraint; migration mapping eksplisit | Tidak |
| R-09 | Tiga skema ID & `idBerikut` non-atomik di array terpangkas | §5 #4 | duplikat nomor surat jalan/faktur setelah trim | Sedang | Integritas | sequence/UUIDv7 di server + idempotency key | Tidak |
| R-10 | Waktu campur UTC/lokal + perbandingan leksikografis | §5 #5 | salah status kedaluwarsa, jejak waktu audit bolong | Tinggi | Integritas | `timestamptz` kanonik + satu fungsi waktu yang bisa diuji | Tidak |
| R-11 | Tidak ada CI/lint/unit/E2E; `cek:m6` asertif teks sumber | §8 P2 | regresi lolos tanpa terlihat; refactor tidak aman | **Tinggi** | Kualitas | Phase 1.5: gerbang hijau dulu | Tidak |
| R-12 | Benih memakai institusi & orang nyata | §0.8 | keputusan bisnis diambil dari angka fiktif; risiko privasi/reputasi | Tinggi | Data | penanda `contoh: true` + generator data sintetis; dilarang untuk laporan resmi | **Ya** (Q-3) |
| R-13 | Dua generasi UI + 3 keluarga primitif duplikat | §3 | konsistensi visual rusak saat refactor; biaya review 2× | Sedang | UI | unifikasi primitif dengan perbandingan tampilan | Tidak |
| R-14 | Bundel satu chunk 1,45 MB, font eksternal, tanpa CSP | §8 P2 | first-load lambat di fasyankes berjejaring buruk; memblokir misi PWA/SFA | Sedang | Performa | lazy per modul + self-host font; ukur ulang | Tidak |
| R-15 | Angka tercatat blueprint tidak tereproduksi (2.051 vs 1.454 kB) | §1 | keputusan kapasitas di atas angka basi | Sedang | Dokumen | koreksi blueprint pada commit hygiene | Tidak |
| R-16 | Klaim kepatuhan/fitur di UI tanpa dasar teknis (`/api/health` "Terhubung", "Integritas Data", metadata genai) | §0.4/§4 | temuan audit eksternal; kepercayaan hilang | Tinggi | Kepatuhan | hapus label sampai kontrol nyata ada — sesuai larangan §5 | Tidak |

---

## 11. Target arsitektur (usulan — menunggu persetujuan)

**Prinsip kerja yang saya pegang:** *strangler*, satu boundary per langkah, dan **gerbang verifikasi hijau sebelum menyentuh data**. Tidak ada penghapusan modul. Tidak ada rewrite layar yang sudah berfungsi. Tidak ada perubahan hasil perhitungan bisnis tanpa persetujuan — dan itu bisa ditegakkan, karena FEFO/ROP/payroll hari ini fungsi murni yang bisa di-*replay* terhadap benih yang sama lalu dibanding angka lama vs baru.

**Lima keputusan yang harus diambil pemilik produk, bukan saya:**

1. **Backend target.** *Opsi A — NestJS + PostgreSQL 16 + Prisma/Drizzle + RabbitMQ + Redis + MinIO*, persis §4D/§4E/§4B: jarak penuh, biaya terbesar, hasil sesuai spesifikasi. *Opsi B — PocketBase dipertahankan dan dijadikan backend nyata lebih dulu*: SDK klien sudah ada dan instance `:8090` sudah hidup, tetapi outbox, hash-chain, partitioning, pgvector, dan RLS bukan kekuatan PB, sehingga Phase 3 berpeluang jadi migrasi dua kali. **Rekomendasi saya A** — dan karena itu isi PB `:8090` wajib diintrospeksi lebih dulu (Q-2) agar tidak ada skema nyata yang terlewat.
2. **Bentuk modular monolith.** `server/src/domains/{regulatory,quality,operational,commercial,supporting,integration}` + `shared-kernel/{audit,identity,reference,id}`, tiap domain mengekspor modul dengan boundary eksplisit; event bus in-process lebih dulu, RabbitMQ hanya untuk alur lintas-proses nyata (`SalesOrderCreated → StockReservationRequested → FEFO allocation → StockReserved → Credit validation → Order status`). Tidak ada microservices sampai volume menuntut.
3. **Urutan migrasi modul.** Gudang & Logistik saya usulkan **bukan** sebagai pilot pertama: ia paling dijaga (39 + 68 + ~300 assertion), sehingga justru paling berharga sebagai alat bukti preservasi. Pilot yang lebih aman adalah modul kecil dengan FK bersih (**Regulatory/NIE**) atau modul yang hari ini tipis tapi berakibat finansial (**Finance/Accounting**). Pilihan Anda.
4. **Nasib data benih:** fixture pengujian dengan penanda, atau ada ekspor produksi nyata sebagai sumber reconciliation.
5. **Batas keamanan minimum hari ini:** sebelum auth nyata ada, saya usulkan penanda "MODE DEMO / BUKAN KONTROL KEAMANAN" dan penonaktifan jalur publikasi `/api/website/published` dari situs kunci. Setuju atau tidak?

**Sasaran akhir yang realistis untuk dideklarasikan** (bukan janji): ERP modular monolith API-first dengan PostgreSQL + outbox + append-only audit berantai-hash, PWA offline-first untuk SFA, dan gateway integrasi ber-adapter — dengan kepatuhan CDAKB/ISO 13485 **dinyatakan sebagai proses organisasi, bukan konsekuensi teknis**, seperti yang §5 minta.

---

## 12. Roadmap penyesuaian

| Tahap | Isi | Keluaran | Prasyarat | Perkiraan |
|---|---|---|---|---|
| **Phase 1 (dokumen ini)** | audit read-only | laporan + risk register + module/database/API mapping | — | selesai, menunggu persetujuan |
| **Phase 1.5 — FONDASI VERIFIKASI** *(usulan baru, saya rekomendasikan kuat)* | perbaiki penjaga Node; `strict` + linter; runner unit/E2E; CI (build + lint + tsc + test + cek:semua + build); ubah assertion teks `cek:m6` menjadi assertion perilaku; satu lockfile; README; buang `@google/genai` | gerbang hijau yang benar-benar bisa menjadi gerbang | persetujuan Anda | **selesai 2026-11-05** — dua deviasi: linter = **Biome** (typescript-eslint menolak TypeScript 7), `@google/genai` **belum dibuang** (menunggu keputusan §15); assertion perilaku sudah dijaga 123 uji `tests/domain/` |
| **Phase 2 — DATABASE & DOMAIN ARCHITECTURE MODERNIZATION** *(= blok "MULAI PHASE 1" kedua di spesifikasi Anda)* | finalisasi bounded context; domain dependency map; ERD; schema mapping 64 kunci → tabel; DDL + migration versioning; `audit_logs` append-only berantai-hash; `outbox_events`; `integration_logs`; evaluasi partitioning dari volume & pola query nyata; pgvector | ERD, DDL, migration scripts, reconciliation report, test report — **di development/staging; SQL + dampak ditampilkan sebelum eksekusi; production tidak disentuh** | Q-1..Q-6 terjawab (lihat §15), Phase 1.5 selesai | 2–3 sesi |
| **Phase 3 — BACKEND MODULARIZATION** | NestJS modular (auth → user → organization → regulatory → warehouse → sales → finance → quality → service → integration); lapisan domain/application/infrastructure/presentation; DI; repository; DTO validation; RBAC + ABAC; audit interceptor; Swagger; REST + event bus + outbox; **compatibility adapter** agar pemanggil lama tidak pecah | backend modular + API docs + hasil test + dokumentasi migrasi | Phase 2 | 3–5 sesi |
| **Phase 4 — FRONTEND MODERNIZATION** | router & lazy per modul; TanStack Query di belakang *data facade* (menggantikan `getCollection` tanpa menyentuh layar); samakan 3 keluarga primitif tanpa mengubah tampilan; PWA + IndexedDB + offline queue + conflict resolution untuk SFA (Visit Planner, Customer Visit, Visit Report, Pre-Order) | frontend modern + PWA + sync engine + test report | API Phase 3 tersedia | 3–4 sesi |
| **Phase 5 — INTEGRATION GATEWAY** | API versioning, OpenAPI, webhook dispatcher/subscription, HMAC, retry, idempotency, integration logs, adapter SIMRS/FHIR/DICOM/e-Katalog/LPSE/Kemenkes/banking/principal — **interface + dokumentasi lebih dulu; tidak dinyatakan terhubung sebelum endpoint & kredensial resmi diuji** | gateway + kontrak API + integration test report | kredensial resmi (dari Anda) | 2–3 sesi |
| **Phase 6 — SECURITY & PRODUCTION READINESS** | hardening (auth, CORS, CSP, rate limit, upload, enkripsi), unit/integration/E2E/migration/performance/security/backup-restore test, Dockerfile/Compose/K8s/Caddy/env template/health/monitoring/logging/backup/DR | security + performance + test report + deployment config + readiness checklist | semua fase | 2–3 sesi |
| **Regression Audit** | dijalankan **setelah setiap fase**: tabel `FEATURE \| BEFORE \| AFTER \| TEST STATUS \| ACTION` dengan kriteria §10 (semua fitur tersedia, transaksi historis terbaca, perhitungan tidak berubah, tidak ada menu mati, tidak ada API rusak, tidak ada duplikasi transaksi, tidak ada perubahan tanpa audit, tidak ada permission escalation, tidak ada dokumen hilang, laporan konsisten) + status PASS / PASS WITH CONDITIONS / FAIL | bukti, bukan klaim | fase berjalan | per fase |
| **Phase 7 — HAPUS DATA DUMMY & INPUT DATA ASLI** *(perintah pemilik Q-3; dijalankan setelah seluruh fase di atas selesai)* | kosongkan 66 seed `INITIAL_*` dan 64 kunci `ams_alkes_`; muat data master asli (pelanggan B2B, katalog & NIE nyata, pemasok, karyawan, struktur gudang, histori transaksi) melalui jalur import bertahap yang diaudit; pin ulang golden baseline `tests/domain/gudang-*.test.ts` dan `sales-perhitungan.test.ts` ke data asli; Rekonsiliasi jumlah baris & saldo sebelum/sesudah; hapus penanda `contoh` dari layar dan laporan | basis data produksi terisi data asli + laporan rekonsiliasi + gerbang hijau ulang | Phase 6 lulus; data asli diserahkan pemilik; backup & rollback teruji | 2–4 sesi |

---

## 13. Business Process Mapping (alur nyata hari ini)

| # | Alur | Pemilik | Titik tulis utama | Penjaga | Status |
|---|---|---|---|---|---|
| 1 | Sales Order → alokasi FEFO sadar-kunci → rute picking → gerbang surat jalan → e-Faktur + faktur pajak → piutang → (khusus jalur e-Katalog) antrean LKPP | Sales/Gudang | `catatPengirimanSalesOrder` [pocketbase.ts:1177](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L1177) | `cek:fefo` (68 assertion) | nyata, sisi klien |
| 2 | Penerimaan inbound → pencocokan PO → QC/uji fungsi → directed put-away → release ke stok (sekali saja) | Gudang | `releasePenerimaanKeStok` | `cek:fefo` §C | nyata, sisi klien |
| 3 | Opname blind count → selisih → verifikasi PJT → penyesuaian `jumlahStok` | Gudang | `ajukanSelisihOpname`/`verifikasiSelisihOpname` | `cek:fefo` §D | nyata (menimpa histori — R-03) |
| 4 | Karantina & recall → kunci batch → daftar fasyankes penerima → lepas kunci | Gudang Tab 11 (hasil kepindahan dari Sales/PMS, §0B) | `kunciStokKarantina`/`lepasKunciStok`, dampak recall | `cek:gudang` 12 aturan | nyata |
| 5 | Cold chain: log suhu → deteksi excursi → eskalasi | Gudang Tab 4 | `deteksiExcursiRantaiDingin`, retensi 50 | `cek:gudang` | nyata |
| 6 | Regulatori: izin edar/NIE → validasi → kait ke kartu stok & situs | Regulatory + Gudang | `nomorIzinEdarUntuk` (awalan nama) | — | **parsial** (R-08) |
| 7 | Situs publik: draft → publish (`PUT`) → snapshot JSON → `/web` + injeksi SEO | Website | [server.ts:163](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/server.ts#L163) | — | nyata & tidak terautentikasi (R-07) |
| 8 | HRIS: absensi → shift → lembur → slip gaji (PPh21 berlapis, BPJS, gross-up) | HRD | `utils/payroll.ts` + `PARAMETER_PAYROLL_2026` | — | nyata, sisi klien |
| 9 | Newsletter listmonk: subscriber → kampanye → kirim | Sales | — | — | **simulasi** (tanpa SMTP/API nyata) |
| 10 | Tender LPSE & e-Katalog | Sales | entri manual + payload pratinjau | `cek:gudang` | **simulasi** |

---

## 14. Technical Debt (baseline tercatat)

**Ukuran & struktur.** 11 berkas ≥ 1.000 baris: `initialData.ts` 5.793 · `pocketbase.ts` 2.343 · `ListmonkModule.tsx` 1.556 · `types/index.ts` 1.545 · `utils/gudang.ts` 1.390 · `PublicCatalogSection.tsx` 1.325 · `utils/website.ts` 1.299 · `SiteSections.tsx` 1.281 · `StokFefoTab.tsx` 1.244 · `SalesOrderModule.tsx` 1.057 · `StrukturGudangTab.tsx` 1.023. God file terbesar adalah lapisan data (storage + 64 koleksi + seluruh mutasi + audit + traceability + KPI dalam satu berkas).

**Praktik.** 0 `any` eksplisit dan 0 `@ts-ignore` (baik), tetapi `strict` mati, 22 `as unknown as`, 5 non-null assertion, `allowJs: true`, `skipLibCheck: true`. 0 penanda `TODO`/`FIXME`/`HACK` repo-wide — secara terus terang: **debt tidak dilacak**, bukan debt tidak ada. 0 error boundary; 22 `catch {}` senyap; 3 `console.*`.

**Duplikasi & kebocoran.** 3 keluarga primitif UI; kontrak FEFO dobel (§8 P2); status bisnis sebagai string literal di 6 berkas (`'Menunggu Alokasi FEFO'`); PPN 11 % ditulis di 8 berkas ([pocketbase.ts:937](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L937)); nomor faktur dihitung inline `FTR/{tahun}/{bulan}/{3 digit terakhir}` ([pocketbase.ts:1226](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts#L1226)); payload fixture di dalam komponen produksi (`PenerimaanInboundTab`, `StokFefoTab`).

**Repo.** *(sebagian besar ditutup Phase 1.5 — lihat catatan di bawah)* README tadinya 1 baris; `name: react-example`, `version: 0.0.0`; dua lockfile bertentangan; `public/website-published.json` ter-commit sehingga pemakaian normal mengotori working tree; `.gitignore` tidak menutupi artefak `.qoder/`; Lampiran B blueprint menautkan checkout lain; 4 commit tanpa tag/branch.

**Dua selisih kode vs blueprint (ditemukan saat Phase 1.5 membuat golden baseline).** Keduanya dipin **sesuai perilaku kode** dan menunggu keputusan pemilik (§15):

1. **Reorder point.** Blueprint §5 (baris 106) menulis `ROP = rataRataHari × leadTimeHari + safetyStock` → `0,4 × 21 + 0,4 × 14 = 8,4 + 5,6 = 14` untuk `AMB-01`. Implementasi `hitungReorderPoint` [src/utils/gudang.ts:538](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/gudang.ts#L538) membulatkan **tiap komponen ke atas** lebih dulu → `9 + 6 = 15`. Selisih 1 unit membuat titik pesan lebih konservatif (pesan lebih awal), jadi bukan kesalahan fatal — tetapi angka laporan Purchasing tidak sama dengan rumus yang didokumentasikan.
2. **Ambang penguncian ageing.** Di `nilaiUmurStok` [src/utils/gudang.ts:558](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/utils/gudang.ts#L558) label `Kritis (< 2 Bulan)` memakai `sisaHari <= 60`, sedangkan `perluKunci` memakai `sisaHari < konfigurasi.umurKunciEdHari` (60 pada seed). Pada **tepat 60 hari** stok ditampilkan Kritis tetapi belum terkunci — satu hari off-by-one antara apa yang dilihat operator dan apa yang sistem lakukan.

**Perubahan yang sudah masuk karena Phase 1.5.** `tsconfig` kini `strict: true` (+ `noImplicitOverride`, `noFallthroughCasesInSwitch`) dengan 0 error; linter Biome 0 error; runner `vitest` 123 uji; CI `.github/workflows/ci.yml` menjalankan `npm run verifikasi`; `npm run cek:semua` benar-benar exit 0; `package.json` menjadi `ams-integrated-system` 0.1.0 dengan `engines.node >= 22`; `bun.lock` dihapus sehingga `package-lock.json` satu-satunya lockfile; README ditulis ulang. Satu bug nyata ikut diperbaiki: `RoleAvatar` tadinya didefinisikan di dalam komponen `Navbar` sehingga subtree-nya kehilangan state setiap render ([src/components/layout/Navbar.tsx](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/components/layout/Navbar.tsx)) — kini dinaikkan ke level modul. Yang **belum** ditutup: `public/website-published.json` masih ter-commit, `@google/genai` masih terpasang, dan `cek:gudang` sebagian masih assertion teks.

---

## 15. Keputusan pemilik (tercatat 2026-11-05)

Keenam pertanyaan di atas sudah dijawab pemilik produk. Jawaban ini **mengubah sifat Phase 2**
dan menjadi acuan seluruh fase berikutnya.

| # | Pertanyaan | Keputusan pemilik | Konsekuensi teknis |
|---|---|---|---|
| **Q-1** | Di mana data produksi berada? | **Belum ada database.** | Phase 2 bukan migrasi, melainkan **pembangunan basis data pertama AMS**. §8 spesifikasi (migration mapping, reconciliation dari skema lama) disesuaikan: tidak ada skema lama di server yang dipetakan. |
| **Q-2** | PocketBase `:8090` milik AMS? | **Rancang database baru.** PocketBase yang sedang hidup bukan sumber data AMS. | Skema PocketBase `:8090` tidak menjadi acuan ERD dan tidak dimigrasikan. Klien PocketBase di `src/services/pocketbase.ts` tetap ada sebagai mekanisme realtime sampai Phase 3 menyediakan event bus; ia tidak dinyatakan sebagai backend. |
| **Q-3** | `initialData.ts` nyata atau contoh? | **Semua data dummy.** Setelah seluruh fase selesai, **wajib dimulai satu fase khusus untuk menghapus data dummy dan memasukkan data asli.** | Ditambahkan sebagai **Phase 7** di roadmap. Penanda "dummy" dipasang di README dan di kepala uji yang memuat angka seed; uji-uji itu **diubah** (bukan dibiarkan gagal) saat Phase 7. Nama RS/PT/orang tidak boleh dianggap pelanggan sungguhan dalam laporan apa pun. |
| **Q-4** | Target backend? | **NestJS + PostgreSQL.** | Phase 2 memakai PostgreSQL 16+ (pgvector, Redis, MinIO/S3 sesuai §4E); Phase 3 membangun NestJS modular. Express `server.ts` diperlakukan sebagai harness sementara, dipertahankan sampai compatibility adapter siap (strangler pattern §9). |
| **Q-5** | Retensi 300/50/100 dihapus? | **Ya — arsip append-only, histori tidak dihapus.** | `capDaftarRetensi` di `src/services/pocketbase.ts` tidak dipindahkan ke backend; `audit_logs`, `outbox_events`, `integration_logs`, dan jejak pergerakan dirancang append-only dengan partisi berdasarkan waktu, bukan pemangkasan. Risiko **R-03** (penulisan ulang array menimpa histori) menjadi persyaratan desain, bukan temuan kosmetik. |
| **Q-6** | Perbaikan 1 baris penjaga Node — sekarang atau Phase 1.5? | **Masuk Phase 1.5** (perintah: "LANJUTKAN PHASE 1.5"). | Dijalankan: penjaga realtime `src/services/pocketbase.ts` kini melewati instalasi langganan saat `window` tidak ada, dan konvensi exit ketiga penjaga dinormalkan. Efeknya `npm run cek:semua` benar-benar exit 0. |

### Keputusan yang masih terbuka (menunggu pemilik)

1. **Dua selisih kode vs blueprint yang ditemukan saat golden baseline dibuat** (rinci di §14). Keduanya saya **pin sesuai perilaku kode**, bukan saya ubah, karena §3 melarang mengubah hasil perhitungan bisnis tanpa persetujuan.
2. **`@google/genai` tidak saya buang** dari `package.json` walaupun 0 berkas mengimpornya, karena `metadata.json` masih mendaftarkan `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. Perlu keputusan: fitur AI masuk backend NestJS, atau capability itu dihapus dari metadata dan dependensinya dibuang.


---

## 16. Acceptance criteria Phase 1

- [x] Kondisi aplikasi, stack, struktur frontend, backend, dan database dipetakan dengan bukti berkas + nomor baris (bagian 1–5).
- [x] Modul tersedia (bagian 6) **dan** modul belum tersedia (bagian 7) didaftar eksplisit terhadap §4A/§5/§6/§7/§8, tanpa dihaluskan.
- [x] Fitur yang perlu diperbaiki (bagian 8) diberi prioritas dengan bukti terukur.
- [x] Kesenjangan arsitektur (bagian 9) dan risiko migrasi (bagian 10, 16 risiko) tercatat dengan kelas & mitigasi.
- [x] Target arsitektur (bagian 11) dan roadmap (bagian 12) disusun dengan batas jelas antara "refactor" dan "bangun baru".
- [x] Module mapping, database mapping, API mapping, business process mapping, technical debt, dan risk register tersedia sesuai daftar keluaran §10 Phase 1.
- [x] Tidak ada kode, data, skema, atau transaksi yang diubah selama Phase 1; hanya 2 berkas dokumen baru di `docs/`.
- [x] **Persetujuan pemilik produk diterima** (2026-11-05): Q-1..Q-6 dijawab dan perintah diberikan untuk menjalankan **Phase 1.5 — Fondasi Verifikasi** lebih dulu, sebelum Phase 2.

### Status Phase 1.5 (dilaksanakan setelah persetujuan)

Gerbang verifikasi kini benar-benar hijau dan terbukti, bukan dinyatakan: `npx tsc --noEmit` exit 0
dengan `strict: true`; `npx biome lint .` exit 0 (0 error, 509 warning, 36 info); `npx vitest run`
123 uji lolos dalam 8 berkas (842 ms); `npm run cek:semua` exit 0 (39 pemeriksaan gudang lolos); dan
`npm run verifikasi` (typecheck → lint → test → cek:semua → build dirantai) selesai dengan exit 0,
dijalankan dua kali. CI `.github/workflows/ci.yml` menjalankan gerbang yang sama pada setiap push/PR
dengan Node 24.

**Koreksi angka bundel di dokumen ini.** Angka yang saya catat pada tabel §0, §1, dan §8 — *1.453,93 kB
(337,99 kB gzip) + CSS 59,42 kB* — **keliru**; angka itu tidak saya verifikasi ulang saat itu. Ukuran
sebenarnya, diukur ulang hari ini dengan `ls -l` di atas berkas yang dihasilkan commit `6812703`
(chunk `index-BW0d1HrJ.js` — hash konten identik dengan build Phase 1, jadi berkasnya byte-identik):
**JS 1.488.822 B = 1.488,82 kB (344,41 kB gzip pada level 9; Vite melaporkan 348,10 kB) + CSS
60.845 B = 60,84 kB (10,67 kB gzip; Vite melaporkan 10,92 kB)**. Kesimpulan §1 bahwa angka blueprint
§7.1 (2.051,13 kB) tidak tereproduksi **tetap berlaku** — selisihnya hanya makin besar. Setelah
dua suntingan sumber Phase 1.5 ([Navbar.tsx](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/components/layout/Navbar.tsx)
dan [pocketbase.ts](file:///C:/Users/DESKTOP/Documents/Qoder/2026-11-05/22b1c8da/src/services/pocketbase.ts))
bundel menjadi `index-254kP84y.js` 1.488,87 kB (348,11 kB gzip); saya mengukur ini dengan mengembalikan
sementara kedua berkas itu lalu build ulang, sehingga kontribusi suntingan Phase 1.5 terhadap ukuran
hanya **+0,05 kB**, dan CSS tidak berubah sama sekali (`index-CS0oIdG3.css` di kedua kondisi).

**Verifikasi UI langsung.** Perubahan `RoleAvatar` (komponen diangkat ke level modul agar tidak
dibuat ulang setiap render) saya buktikan pada aplikasi yang benar-benar berjalan, bukan dari
screenshot: dev server `npm run dev`, masuk lewat formulir "Masuk ke Aplikasi AMS" (`admin`), lalu
peran diganti melalui dropdown "Menu pengguna" dan kelas avatar dibaca dari DOM. Hasil:
`pjt` → `bg-blue-600` + `lucide-crown`; `qa_manager` → `bg-indigo-600` + `lucide-shield`;
`qc_officer` → `bg-emerald-600` + `lucide-circle-check`; `kepala_gudang` → `bg-amber-600` +
`lucide-warehouse`; `teknisi_elektromedik` (cabang default) → `bg-slate-800` + `lucide-user-cog`.
Tab aktif (Gudang) bertahan setelah ganti peran — tidak ada peremountan subtree — dan konsol browser
hanya berisi pesan koneksi Vite, tanpa error atau warning React.


### Yang secara sadar TIDAK saya kerjakan

**Selama Phase 1:** tidak menulis migration script, tidak membuat DDL PostgreSQL, tidak menyentuh
skema PocketBase `:8090`, tidak menulis satu baris NestJS pun, tidak mengubah satu berkas `src/`,
dan tidak memperbaiki penjaga Node — semuanya menunggu keputusan Q-1..Q-6 dan persetujuan atas
laporan ini.

**Setelah persetujuan (Phase 1.5), yang tetap TIDAK saya kerjakan:** tidak mengubah satu pun hasil
perhitungan bisnis — dua selisih kode vs blueprint di §14 saya **pin apa adanya** dan saya tunggu
keputusannya; tidak membuang `@google/genai` (kemungkinan fitur, §15); tidak menghapus retensi
300/50/100 dari kode klien (perilaku layar lama dipertahankan sampai Phase 2 mendesain arsip
append-only); tidak menyentuh isi `localStorage` operator maupun data apa pun; tidak menghapus
seed dummy (itu Phase 7); dan tidak melakukan commit atau push — seluruh perubahan masih di
working tree menunggu perintah Anda.
