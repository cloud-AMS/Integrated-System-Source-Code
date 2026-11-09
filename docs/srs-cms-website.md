# SRS — Modul CMS Visual Situs Publik (AMS Integrated System)

| | |
|---|---|
| **Kode** | SRS-CMS-2026-001 |
| **Versi** | 1.1 |
| **Tanggal** | 2026-11-09 |
| **Status** | Fase 1 (template + warna + font + susunan Beranda) — **terimplementasi & terverifikasi di build** |
| **Pemilik dokumen** | Langgo Bramandityo |
| **Reviewer** | PJT / QA Manager |

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini menspesifikasikan **modul CMS visual** pada aplikasi **AMS Integrated System (PT Anugrah Mitra Selaras / REMEDI)**: kemampuan bagi admin (tanpa menyentuh kode) untuk mengatur **template, warna merek, tipografi, favicon/logo, dan urutan seksi Beranda** situs publik `/web`, serta mekanisme penerapan perubahan itu ke halaman depan.

### 1.2 Ruang Lingkup
**Termasuk:** pengaturan template dasar; kustomisasi warna utama/sekunder; pilihan font; unggah logo & favicon; penyusunan urutan seksi Beranda; penerapan real-time ke pratinjau dan tayang setelah diterbitkan.

**Tidak termasuk (di luar fase ini):** editor tema dari nol (tema builder drag-and-drop), susunan halaman selain Beranda, multi-bahasa (i18n), manajemen aset terpusat (Media Library), dan template tambahan di luar 3 bawaan.

### 1.3 Definisi
| Istilah | Arti |
|---|---|
| Draf | Konfigurasi situs yang sedang diedit, tersimpan terpisah dari yang tayang |
| Tayang | Snapshot `isPublished = true` yang dilihat pengunjung `/web` |
| Snapshot | `website-published.json` — artefak yang dilayani `/api/website/published` dan salinan `public/website-published.json` |
| Template | Kulit visual situs: gaya header/hero/footer, bukan isi konten |
| Variabel merek | CSS custom properties `--brand`, `--brand-aksen`, `--brand-font` yang diatur CMS |

### 1.4 Acuan
- `docs/system-blueprint.md`, `docs/blueprint-website-cms.md`, `docs/production-list.md`
- Kode acuan: `src/components/modules/website/**`, `src/utils/tampilan.ts`, `src/index.css`

---

## 2. Keadaan Saat Ini (As-Is) & Masalah

CMS situs publik **sudah ada dan berjalan**: semua teks/gambar/per seksi bisa diedit dari menu **Website**; draf terpisah dari tayang; pratinjau live via iframe `/web/?pratinjau=1` + `postMessage`; snapshot tayang dilayani server; audit trail setiap aksi.

**Yang belum bisa diatur admin (keluhan laporan):**
1. Tidak ada pilihan **template** — header/hero/footer hard-coded (`bg-white`, `bg-slate-900`, hero split).
2. Warna aksen (teal) tertulis langsung di kelas Tailwind; admin tidak bisa menggantinya.
3. Font dipaksa `Quicksand`; tidak ada pemilih tipografi.
4. **Urutan seksi Beranda** dikunci di `PETA_HALAMAN.beranda` (kode).

**Constraint yang harus dihormati:**
- Snapshot lama (tanpa field `tampilan`) harus tetap tayang normal → field visual **opsional**.
- Data situs disimpan di `localStorage` + file JSON server (bukan database server) — desain mengikuti itu, bukan database relasional.
- Penerbitan terbatas peran: hanya **PJT** dan **IT Admin** (`PERAN_PENERBIT`).

---

## 3. Kebutuhan Fungsional

Setiap FR ditandai dengan status implementasi per 2026-11-09.

| ID | Kebutuhan | Status |
|---|---|---|
| FR-01 | Admin dapat memilih salah satu dari 3 template dasar: **REMEDI Klasik** (bawaan), **REMEDI Premium Gelap**, **REMEDI Minimal** — lewat kartu pratinjau visual | ✅ Terimplementasi |
| FR-02 | Admin dapat mengatur **warna utama** dan **warna sekunder** (input color picker + isian hex validasi) dan 8 preset merek | ✅ |
| FR-03 | Admin dapat mengunggah **logo** dan **favicon** (di menu Identitas & SEO), tervalidasi & terkompres otomatis | ✅ (sudah ada, dipertahankan) |
| FR-04 | Admin dapat memilih **tipografi**: Quicksand (bawaan), Open Sans, JetBrains Mono, Sistem — dengan contoh teks langsung di pilihan | ✅ |
| FR-05 | Admin dapat **menyusun urutan 15 seksi Beranda** (naik/turun) dan tombol "Kembalikan Bawaan" | ✅ |
| FR-06 | Perubahan langsung terlihat di **Live Preview** (iframe `/web`, real-time via postMessage, tanpa simpan) | ✅ |
| FR-07 | Perubahan baru **tayang** setelah PJT/IT Admin menekan **Terbitkan**; ada peringatan "perubahan belum terbit" bila berbeda dari tayang | ✅ (mekanisme lama) |
| FR-08 | Setiap penyimpanan/terbit tercatat di **audit trail** dengan nama pengguna, peran, nilai lama/baru | ✅ (mekanisme lama) |
| FR-09 | Konfigurasi `tampilan` tidak valid (warna rusak, template tak dikenal, urutan korup) **dinormalkan otomatis** ke default REMEDI Klasik — tidak pernah menjatuhkan halaman | ✅ |
| FR-10 | Favicon dari CMS tampil di tab browser halaman `/web` sesaat setelah render | ✅ |
| FR-11 | Situs `/web` tetap berfungsi 100% tanpa paket apa pun yang baru (semua dependensi yang dipakai sudah tersedia) | ✅ |

### 3.1 Logika penerapan (FR-06 / FR-09 / FR-10)
1. **Penyimpanan draf** — disimpan di `localStorage('website_draft')` + dicatat di audit trail (mekanisme yang sudah ada).
2. **Render `/web`** — `PublicWebsite` membaca konfigurasi terpilih (urutan: snapshot server → snapshot statis → localStorage), memanggil `tampilanEfektif(cfg)` yang:
   - memvalidasi `templateId` terhadap daftar 3 template; selain itu → `remedi-klasik`;
   - memvalidasi kedua warna dengan regex `^#[0-9a-f]{6}$`; selain itu → `#0d9488` / `#0f766e`;
   - memvalidasi `fontId` terhadap 4 pilihan; selain itu → `quicksand`;
   - memvalidasi `berandaUrutan`: hanya kunci seksi yang dikenal, tanpa duplikat; seksi yang absen ditambahkan di akhir daftar bawaan.
3. **Variabel merek** — CSS custom properties `--brand`, `--brand-aksen` disuntik **inline** pada wrapper utama halaman (`<div style={{ '--brand': …, fontFamily: … }}>`); kelas `template-<id>` mengaktifkan aturan template di `index.css`.
4. **Komponen** — seluruh tombol/aksen/tautan/badge menggunakan `text-[var(--brand)]`, `bg-[var(--brand)]`, `border-[var(--brand)]`, dan tint ringan via `color-mix(in srgb, var(--brand) …)`; tidak ada hex hardcoded di markup (sisa 0).
5. **Susunan Beranda** — bila `rute.halaman === 'beranda'`, renderer memakai `tema.berandaUrutan` (hasil normalisasi) alih-alih `PETA_HALAMAN.beranda`; halaman lain tetap baku.
6. **Favicon** — `useEffect` di `PublicWebsite` menulis/menambah `<link rel="icon" href={faviconUrl}>` pada setiap perubahan `identitas`.

---

## 4. Menu & Sub-menu Modul CMS (Website)

```
Website (menu utama, badge SEGERA — hanya PJT & IT Admin untuk penerbitan)
├── TEMPLATE & TAMPILAN                      ← BARU
│   ├── Template, Warna & Font               (FR-01, FR-02, FR-04)
│   │   ├── 1. Template Dasar                — 3 kartu pratinjau: REMEDI Klasik / Premium Gelap / Minimal
│   │   ├── 2. Warna Merek                   — color picker + hex + 8 preset (Utama & Sekunder)
│   │   └── 3. Tipografi                     — Quicksand / Open Sans / JetBrains Mono / Sistem
│   └── Susunan Seksi Beranda                (FR-05)
│       ├── Daftar 15 seksi bernomor, tombol naik/turun
│       └── "Kembalikan Bawaan"
├── IDENTITAS & NAVIGASI
│   ├── Identitas & SEO                      — nama, tagline, logo, FAVICON (FR-03), judul tab, meta description
│   ├── Tombol Header                        — CTA utama/cadangan/portal
│   ├── Navigasi Header                      — item menu (mega/link)
│   ├── Kolom Footer                         — 3–4 kolom tautan
│   └── Catatan Footer                       — hak cipta & legal
├── KONTEN BERANDA
│   ├── Hero Utama · Banner/Slider · Legalitas & Sertifikat · Solusi per Kategori
│   ├── Pita Konsultasi · Capaian Terukur · Merek / Prinsipal · Tahap Perjalanan Layanan
│   └── Institusi yang Dilayani · Kegiatan & Seminar · Promo & Skema Harga
└── KATALOG & SUMBER DAYA
    ├── Katalog Produk · Berita & Artikel · Galeri Fasilitas · Testimoni Pelanggan
    └── Pertanyaan Umum · Tentang Kami · Kantor & Rayon · Kontak & Alamat · Media Sosial
```
Mode tampilan per menu: **Editor** (form) · **Live Preview** (iframe, lihat langsung) · **Jejak** (audit trail).

---

## 5. Model Data & Penyimpanan

### 5.1 Tipe baru (`src/types/index.ts`)
```ts
type TemplateSitus = 'remedi-klasik' | 'remedi-gelap' | 'remedi-minimal';
type FontSitus     = 'quicksand' | 'open-sans' | 'jetbrains-mono' | 'system';
type KunciSeksiSitus =
  | 'hero' | 'slide' | 'kepercayaan' | 'solusi' | 'konsultasi' | 'statistik'
  | 'produk' | 'merek' | 'perjalanan' | 'institusi' | 'kegiatan' | 'promo'
  | 'artikel' | 'testimoni' | 'faq';

interface TampilanSitus {
  templateId: TemplateSitus;
  warnaUtama: string;    // hex #RRGGBB
  warnaAksen: string;    // hex #RRGGBB
  fontId: FontSitus;
  berandaUrutan: KunciSeksiSitus[];  // urutan seksi Beranda
}

interface KonfigurasiSitus {
  // … seluruh field lama …
  tampilan?: TampilanSitus;          // OPSIONAL — snapshot lama sah tanpa field ini
}
```

### 5.2 Penyimpanan (mengikuti arsitektur yang ada — **bukan** database server)
| Lapisan | Lokasi | Catatan |
|---|---|---|
| Draf (sedang diedit) | `localStorage` kunci `website_draft` | perubahan langsung untuk pratinjau |
| Tayang (snapshot) | server Express `data/website-published.json` + `public/website-published.json` | dilayani `PUT/GET /api/website/published` |
| Cadangan lokal tayang | `localStorage` kunci `website_published` | dipakai bila server tidak dijangkau |
| Jejak audit | `localStorage` kunci `log_audit_trail` (lewat `db.logAudit`) | nama pengguna + peran + nilai lama/baru |

### 5.3 Contoh payload `tampilan` di snapshot
```json
{
  "tampilan": {
    "templateId": "remedi-gelap",
    "warnaUtama": "#0d9488",
    "warnaAksen": "#0f766e",
    "fontId": "quicksand",
    "berandaUrutan": ["hero", "slide", "kepercayaan", "solusi", "konsultasi", "statistik", "produk", "merek", "perjalanan", "institusi", "kegiatan", "promo", "artikel", "testimoni", "faq"]
  }
}
```

---

## 6. Keamanan & Hak Akses

| Aksi | Peran | Mekanisme |
|---|---|---|
| Sunting draf (semua menu) | Semua peran dashboard | `useState` + `db.simpanWebsiteDraft` |
| **Terbitkan** / **Tahan Situs** | Hanya `pjt`, `it_admin` | `PERAN_PENERBIT` (WebsiteModule) — tombol dinonaktifkan + catatan peran |
| Tulis snapshot ke server | Server menegakkan `AMS_ADMIN_TOKEN` | `PUT /api/website/published` header `x-ams-admin-token` (lihat README) |
| Font pihak ketiga | **Tidak dimuat dari CDN** | self-hosted `public/fonts/` (OFL) |

---

## 7. Kebutuhan Non-Fungsional

| Kategori | Target |
|---|---|
| Performa | Tidak ada dependensi runtime baru; bundle tidak bertambah berarti (< 20 kB min untuk `tampilan.ts` + editor) |
| Kompatibilitas | Chrome/Edge/Firefox/Safari 2 rilis terakhir; ponsel ≤ 639px (skala tipografi sudah responsif) |
| Keandalan | Normalisasi tampilan tidak pernah melempar; snapshot rusak jatuh ke default |
| Maintainability | Satu sumber token (`index.css @theme`); tidak ada hex hardcoded di markup; UI kit terpusat (`components/ui`) |
| Audit | Setiap simpan/terbit tercatat (user, waktu, nilai lama/baru) |

---

## 8. Kriteria Penerimaan (Fase 1)

- [x] Ketiga template tampil berbeda dan konsisten (header/hero/footer) — diverifikasi visual via Live Preview
- [x] Warna utama/sekunder mengubah tombol & aksen tanpa reload penuh — diverifikasi via Live Preview
- [x] Keempat font terbaca & ter-apply — diverifikasi `document.fonts` (Quicksand & JetBrains Mono loaded; Open Sans swap saat cetak)
- [x] Susunan seksi Beranda dapat diubah; snapshot lama tanpa `tampilan` tetap tayang — diverifikasi kode (`tampilanEfektif`) & build
- [x] Publikasi hanya PJT/IT Admin — mekanisme lama tetap berlaku
- [x] `npm run lint` 0 error · `npm run test` 189/189 lulus · `npm run build` sukses
- [ ] Favicon CMS tampil di tab — terpasang; belum diuji untuk favicon data URL nyata
- [ ] Susunan Beranda diuji dengan urutan khusus — komponen terpasang; belum diuji end-to-end di browser

---

## 9. Batasan & Yang Belum Dikerjakan (Jujur)

1. **Susunan hanya untuk Beranda** — halaman Produk/Solusi/Layanan/Sumber Daya/Tentang/Kontak memakai susunan baku modul.
2. Hanya **3 template**; tidak ada tema custom dari nol.
3. **Tidak ada drag-and-drop** — penyusunan dengan tombol naik/turun.
4. Beranda 15 seksi; seksi yang dimatikan (`isActive: false`) tidak tampil walau ada di urutan.
5. Font baru hanya bisa ditambah lewat kode (`public/fonts/` + `@font-face` + `FONT_SITUS` + OFL license).
6. Belum ada pratinjau template pada perangkat (tablet/ponsel) selain lewat mode Pratinjau.
7. Publikasi langsung ke server memerlukan `AMS_ADMIN_TOKEN` (keamanan); tanpa token, hanya unduh JSON manual.

---

## 10. Rencana Lanjutan (Fase 2)

1. Susunan seksi untuk halaman selain Beranda (per halaman).
2. Template ke-4 (mis. katalog-first untuk tender pemerintah).
3. Media Library (aset logo/favicon/galeri terpusat + kompresi massal).
4. Versi tema tersimpan (rollback ke snapshot konten/tampilan sebelumnya).
5. E2E Playwright: login → pilih template → terbit → verifikasi warna & urutan di `/web`.
6. Kontras warna: peringatan bila kombinasi warna primer/teks tidak memenuhi WCAG AA 4.5:1.

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Warna merek terlalu terang (teks putih tak terbaca) | Validasi kecerahan sederhana di editor (warning non-blocking) — Fase 2 |
| Pengguna menempel hex salah → situs rusak | `tampilanEfektif` menolak dan memakai default; editor hanya menerima format valid |
| Snapshot lama invalid setelah update | Kode normalisasi tidak pernah melempar; UI tetap render |
| Cache service worker menampilkan versi lama | `registerType: 'autoUpdate'`; pengunjung dapat hard refresh; versi terpasang ulang otomatis |
| Favicon data URL besar memperlambat snapshot | Kompresi via `kompresGambarWebsite` (canvas, maks 1280px) sudah ada; favicon diharapkan ≤ 64px |
