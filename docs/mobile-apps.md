# Blueprint AMS Mobile Apps

**Status:** rancangan disetujui; MVP backend attendance sudah diimplementasikan & terverifikasi. Blueprint diselaraskan dengan repo referensi **Smart-Attendance-App (Attendify)**, design system **AMS Integrated System**, dan stack yang compatible dengan induk.
**Tanggal:** 15 November 2026.
**Induk:** AMS Integrated System — PT Anugrahmitra Selaras (Express + PostgreSQL, server-authoritative, RBAC server-side, WebSocket sync). Versi `2.4.0-cdakb`.
**Cakupan mobile:** Android & iOS — (1) time attendance berbasis geo-tagging + foto, (2) notifikasi pekerjaan berdasarkan role karyawan.
**Referensi sistem:** https://github.com/driptobhattacharyya/Smart-Attendance-App (Expo + React Native + TypeScript).

---

## 1. Tujuan & Prinsip

1. Mobile adalah **klien tipis (thin client)** di atas backend induk yang sudah menjadi *single source of truth*. Tidak ada database bisnis terpisah di mobile.
2. **Server otoritatif:** waktu, lokasi, status kehadiran, dan penerima notifikasi ditentukan server. Mobile hanya menangkap (GPS, foto, niat clock-in) dan menampilkan.
3. **Satu kontrak data:** types & util domain (geofence, keterlambatan, RBAC) dipakai bersama web dan mobile agar tidak ada drift definisi.
4. **Konsistensi multi-perangkat:** absensi yang ditulis mobile langsung terlihat di web HRIS (dan sebaliknya) melalui sync server-authoritative + WebSocket.
5. **Privasi & kepatuhan:** consent GPS/foto, minimisasi data, retensi terbatas, akses foto via RBAC, audit trail (selaras UU PDP).
6. **Desain turunan induk:** UI/UX mobile adalah *turunan* design system AMS Integrated System (token, tipografi, kit komponen, navigasi, brand yang sama) — bukan aplikasi berdesain terpisah.
7. **Stack compatible:** mobile memakai bahasa/paradigma yang sama dengan induk (TypeScript + React) dan kontrak API yang sama, sehingga types/util dapat dipakai ulang.

## 2. Fondasi yang Sudah Ada di Induk

| Komponen | Lokasi | Relevansi untuk mobile |
|---|---|---|
| `SumberAbsensi` sudah memuat `'Geofencing GPS (Mobile)'` | `src/types/index.ts:896` | Model absensi memang dirancang menerima input mobile GPS |
| `LogAbsensi` + ekstensi mobile (koordinat, akurasi, geofence, foto, deviceId, waktuServer, flagAntiSpoof, idempotencyKey) | `src/types/index.ts:908` | **Sudah diperluas** di MVP backend; opsional agar rekaman lama kompatibel |
| Haversine `hitungJarakKm` + `verifikasiGeofence(jarakKm, radiusMeter)` | `src/utils/hris.ts:71-90` | Validasi geofence dipakai ulang **di server** |
| `evaluasiKeterlambatan` (shift 07/08/15/23) + `hitungPotonganKeterlambatan` | `src/utils/hris.ts:41,66` | Status Hadir/Terlambat + integrasi payroll |
| Auth mendukung `Authorization: Bearer <token>` selain cookie `ams_session` | `server/rbacMiddleware.ts:46-54` | Mobile login → session token → Bearer; tanpa sistem auth baru |
| RBAC server-side `resolveEffectiveRole` | `server/rbacStore.ts:618` | Routing notifikasi per role/permission |
| Koleksi `hris_absensi` + dataSyncStore + WebSocket `/api/sync/ws` | `server/dataSyncStore.ts`, `server.ts`, `src/services/pocketbase.ts:1251` | Mobile menulis ke koleksi sama; web melihat data identik |
| **MVP backend attendance (sudah jadi):** `createAttendanceRouter` | `server/attendance.ts`, mount `server.ts:304` | `/api/geo/locations`, `/api/attendance/clock-in\|clock-out\|today\|history\|photo/:berkas` |
| Design system induk (token + kit primitif) | `src/index.css`, `src/components/ui/index.tsx`, `src/components/layout/Navbar.tsx` | Sumber turunan UI/UX mobile (lihat §5) |
| **Belum ada:** infra push FCM/APNs, tabel inbox notifikasi, endpoint notifikasi/device, aplikasi mobile | — | Pekerjaan blueprint ini |

## 3. Referensi Sistem: Smart-Attendance-App (Attendify)

Repo referensi adalah aplikasi **Expo SDK 52 + React Native 0.76 + React 18.3 + TypeScript 5.3** dengan **Expo Router** (file-based routing `app/`). Dipakai sebagai **referensi pola & fitur**, bukan disalin mentah-mentah.

### 3.1 Fitur & pola referensi yang dipetakan

| Aspek di Attendify | Bukti (repo referensi) | Keputusan untuk AMS Mobile |
|---|---|---|
| Geofencing entry/exit + `haversine-distance` | `app/(tabs)/location_services.tsx`, `package.json` | **Adopsi konsep**, tapi validasi geofence **di server** memakai `hitungJarakKm`/`verifikasiGeofence` induk |
| Bluetooth proximity (`react-native-ble-plx`) | `app/(tabs)/bluetooth_services.tsx`, `components/BluetoothDeviceSelection.tsx` | **Fase lanjut opsional** (beacon kantor); MVP cukup GPS + foto |
| Face recognition (`react-native-vision-camera`) | `components/face_recog.tsx`, `components/FaceRegistration.tsx` | **Fase lanjut** (liveness/face-match); MVP cukup selfie bukti |
| Navigasi tab + stack auth | `app/(tabs)/_layout.tsx` (Home/Bluetooth/Location/Dashboard), `app/_layout.tsx` | **Adopsi pola** Expo Router; tab AMS disesuaikan role (lihat §5.4) |
| Sesi tersimpan aman (`expo-secure-store`) + `AppContext` | `app/_layout.tsx:36`, `AppContext.tsx` | **Adopsi pola**; simpan token `ams_session`, bukan `employee_id` |
| Konfigurasi base URL + endpoint terpisah | `app/config.ts` (`API_CONFIG.BASE_URL`, `/user/*`, `/face_recog/*`) | **Ganti** ke base URL VPS AMS + `/api/attendance`, `/api/auth`, `/api/notifications` |
| Laporan kehadiran + grafik (`react-native-gifted-charts`) | `package.json`, `app/(tabs)/user_dashboard.tsx` | **Adopsi** untuk laporan kehadiran mobile |
| Manager tools (koreksi manual, approval, action log) | `components/request_form.tsx`, `components/MultiStepForm.tsx` | **Adopsi** sebagai modul approval atasan/HR, selaras RBAC + `audit_trail` induk |
| Komponen alur absen | `OfficeSelection.tsx`, `PhotoPreviewSection.tsx`, `SummaryScreen.tsx`, `timer.tsx` | **Adopsi pola**: OfficeSelection → `geo_lokasi` AMS; PhotoPreview → selfie; Summary → ringkasan harian |
| Tema default Expo (`#0a7ea4`, SpaceMono, `ThemedText`) | `constants/Colors.ts`, `components/ThemedText.tsx` | **Ganti total** dengan design system AMS Integrated System (§5) |

### 3.2 Yang TIDAK boleh disalin dari referensi

- **Google Maps API key tertanam** di `app.json` (`android.config.googleMaps.apiKey`) → jangan dipakai; gunakan key milik AMS via environment/config build.
- **Kredensial demo** (`EMP003` / `password` di README) → jangan dipakai; autentikasi memakai RBAC AMS (`/api/auth/login`).
- **Base URL backend pihak ketiga** (`*.cloudworkstations.dev`) dan `eas.projectId`/`package` `com.anonymous.*` → ganti dengan milik AMS.
- Lisensi & atribusi: repo referensi dipakai sebagai inspirasi pola; kode yang diadopsi ditulis ulang mengikuti konvensi AMS.

## 4. Pilihan & Kompatibilitas Stack Mobile

### 4.1 Keputusan stack

| Opsi | Kelebihan | Kekurangan | Keputusan |
|---|---|---|---|
| **React Native + Expo (TypeScript)** | Satu codebase Android+iOS; **share types & util TS dengan induk**; tim sudah React/TS; Expo modul GPS/kamera/push; referensi Attendify sudah RN/Expo | Setup EAS & config native di awal | **Dipilih** |
| Flutter | Performa & konsistensi UI baik | Belajar Dart; tidak share types/logic; duplikasi model | Alternatif |
| Native (Kotlin + Swift) | Kontrol & performa maksimal | 2× effort, dua codebase | Hanya bila fitur native sangat khusus |

### 4.2 Penyelarasan agar compatible dengan induk

Induk: **React 19.0.1 + TypeScript + Vite 8 + Tailwind CSS 4 + Express 4** (`package.json`). Referensi Attendify masih React 18.3 / Expo 52. Agar selaras:

| Dimensi | Induk (AMS) | Mobile (AMS) | Cara menyelaraskan |
|---|---|---|---|
| Bahasa & paradigm | TypeScript + React | TypeScript + React Native | Types & util murni dipakai bersama |
| Versi React | 19.0.1 | **React 19** | Pilih **Expo SDK ≥ 53** (React 19, RN 0.79+); gunakan versi stabil terbaru saat scaffold — bukan Expo 52/React 18 milik referensi |
| Styling | Tailwind CSS 4 (`@theme` di `src/index.css`) | **NativeWind** (Tailwind untuk RN) | Petakan token `@theme` induk ke `tailwind.config` mobile agar kelas/warna identik |
| Ikon | `lucide-react` | **`lucide-react-native`** | Set ikon sama persis dengan web |
| Font | Quicksand, JetBrains Mono, Open Sans (self-hosted `public/fonts`) | **`expo-font`** memuat Quicksand & JetBrains Mono | Pakai berkas font induk (konversi woff2→ttf untuk RN) |
| Kontrak API | REST `/api/*` + WS `/api/sync/ws` + RBAC | Sama persis | Mobile memakai endpoint & Bearer/cookie `ams_session` yang sama |
| State/data | React state + service sync | **TanStack Query** (REST) + WS client + `expo-secure-store` | Token di Keychain/Keystore |
| Build/distribusi | Vite + esbuild | **EAS Build** + `expo-dev-client` (modul native BLE/vision-camera) | Android/iOS dari satu codebase |

### 4.3 Paket bersama (satu kontrak data)

Ekstrak bagian **murni (tanpa DOM)** dari induk ke paket bersama, mis. `packages/ams-core`:
- `src/types/index.ts` → tipe `LogAbsensi`, `SumberAbsensi`, `RoleDefinition`, `ServerUserPublic`, dll.
- `src/utils/hris.ts` → `hitungJarakKm`, `verifikasiGeofence`, `evaluasiKeterlambatan` (dipakai server; mobile cukup menampilkan hasil server).

Web dan mobile sama-sama meng-import paket ini (monorepo workspace / path alias), sehingga tidak ada drift definisi. *Catatan:* util geofence tetap dijalankan **di server**; mobile tidak menghitung ulang status kehadiran.

**Tradeoff utama RN/Expo:** kecepatan development & konsistensi kontrak data ditukar dengan kerja setup native (EAS build, izin GPS/kamera/notifikasi, prebuild modul).

## 5. Design System Turunan AMS Integrated System

UI/UX mobile **diturunkan** dari design system induk. Sumber kebenaran: `src/index.css` (token) dan `src/components/ui/index.tsx` (kit primitif). Semua nilai di bawah diambil langsung dari kode induk.

### 5.1 Token warna & netral (dari `src/index.css`)

| Peran | Token induk | Nilai | Bukti | Pemakaian di mobile |
|---|---|---|---|---|
| Aksen utama / tint | `--color-blue-500` | `#00aaff` | `src/index.css:125` | Tab aktif, link, highlight, ikon aksen |
| Aksen sekunder | `--color-orange-500` | `#ff4400` | `src/index.css:138` | CTA sekunder / penanda perhatian |
| Ink (teks utama) | `--color-slate-900` | `#111111` | `src/index.css:116` | Teks judul/isi |
| Muted (teks sekunder) | `--color-slate-500` | `#7a7a7a` | `src/index.css:112` | Keterangan, label sekunder |
| Cream (chip/divider) | `--color-slate-100` | `#f1f2f2` | `src/index.css:108` | Latar chip, garis pemisah |
| Latar aplikasi | `--color-slate-50` | `#f7f8f8` | `src/index.css:107` | Background layar |
| Border kartu | `--color-slate-200` | `#e3e5e5` | `src/index.css:109` | Garis tepi Panel/Card |
| Sukses / tombol primer | `--color-emerald-600` | `#059669` | `src/index.css:178` | Tombol primer, status **Hadir** |
| Peringatan | `--color-amber-500` | `#f59e0b` | `src/index.css:189` | Status **Terlambat**, badge warning |
| Bahaya | `--color-rose-600` | `#e11d48` | `src/index.css:202` | Tombol danger, status **Mangkir** |
| Info | `--color-indigo-500` | `#6366f1` | `src/index.css:164` | Badge info |

> Catatan: komentar di `src/index.css` menyebut token "diselaraskan dengan bejo-pos" — itu hanya catatan asal penyelarasan gaya. **Identitas aplikasi tetap AMS Integrated System**; seluruh token di atas adalah milik design system AMS.

### 5.2 Tipografi & bentuk

- **Font sans:** Quicksand (`--font-sans`, `src/index.css:79`); **mono:** JetBrains Mono (`--font-mono`, `src/index.css:80`) untuk angka jam/koordinat; Open Sans sebagai alternatif. Dimuat via `expo-font`.
- **Skala tipografi induk** padat (`text-base` 13.5px, `text-sm` 12.5px, `src/index.css:89-91`); di mobile dinaikkan sedikit agar terbaca (mis. body 14–16px, judul 18–23px) mengikuti override mobile `src/index.css:209-217`.
- **Radius:** `rounded-lg` (8px) untuk input/tombol sekunder, `rounded-xl` (12px) untuk tombol primer/tab, `rounded-2xl` (16px) untuk kartu/panel/modal.
- **Shadow:** `shadow-xs` (kartu) dan `shadow-xl` (modal/dropdown) — versi mobile: elevation halus / shadow lembut.
- **Ikon:** `lucide-react-native` (set sama dengan `lucide-react` induk).

### 5.3 Kit komponen turunan (dari `src/components/ui/index.tsx`)

| Komponen induk | Gaya persis (bukti) | Padanan mobile (RN + NativeWind) |
|---|---|---|
| `Panel` | `bg-white rounded-2xl border border-slate-200 shadow-xs`; header `px-5 py-4 border-b border-slate-100`; judul `text-sm font-bold text-slate-900` (`ui/index.tsx:66-74`) | `Card` putih radius 16, border `#e3e5e5`, header judul + keterangan |
| `Stat` | kartu sama `p-4` (`ui/index.tsx:91`) | `StatCard` ringkasan (jam masuk/keluar, status) |
| `Badge` (tone slate/emerald/blue/amber/rose) | `px-2 py-0.5 rounded text-2xs font-bold border`; tone mis. emerald `bg-emerald-50 text-emerald-800 border-emerald-200` (`ui/index.tsx:14-20,48`) | `Badge` RN dengan tone & warna sama |
| `tombolPrimer` | `bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs` (`ui/index.tsx:151`) | `Button` primary emerald radius 12 |
| `tombolSekunder` | `border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-100` (`ui/index.tsx:155`) | `Button` secondary outline |
| `tombolBahaya` | `bg-rose-600 hover:bg-rose-700 text-white rounded-xl` (`ui/index.tsx:157`) | `Button` danger rose |
| `tombolPrimerGudang` | `bg-amber-600` (`ui/index.tsx:153`) | Varian aksen amber bila konteks gudang |
| `inputClass` / `labelClass` | `border border-slate-300 rounded-lg text-xs` / `font-semibold text-slate-700 text-xs` (`ui/index.tsx:149-150`) | `TextInput` border `#d2d5d5` radius 8 + label |
| `Modal` | overlay `bg-slate-900/60 backdrop-blur-xs`; panel `bg-white rounded-2xl shadow-xl border border-slate-200` (`ui/index.tsx:111-112`) | `Modal`/`BottomSheet` scrim gelap + kartu putih radius 16 |
| `BarCapaian` | progress tone emerald/blue/amber/rose per persen (`ui/index.tsx:134-142`) | `ProgressBar` capaian kehadiran |

**Tone sistem** (dari `ui/index.tsx:12` & `Navbar.tsx:45`): `slate | emerald | blue | amber | rose` (+ `indigo` di navbar). Dipakai konsisten untuk badge/status/ikon.

### 5.4 Navigasi & brand turunan

- **Shell induk:** topbar putih sticky `h-14` + strip tab desktop + drawer/bottom bar mobile (`Navbar.tsx:356`); tab aktif `bg-slate-700 text-white` (`Navbar.tsx:61`); konten `max-w-[1440px]`; footer watermark "© 2026 PT Anugrahmitra Selaras (AMS) • Sistem Terintegrasi CDAKB & ISO 13485" (`App.tsx:396-407`).
- **Turunan mobile:**
  - **TopBar** putih: logo AMS (`LogoAplikasi`, fallback gradient biru) + judul "AMS Integrated System" + sub "Perusahaan Alat Kesehatan • CDAKB & ISO 13485" (`Navbar.tsx:381-384`) + avatar role.
  - **Bottom tab bar** (pola Attendify `app/(tabs)/_layout.tsx`, di-restyle): **Beranda · Absen · Notifikasi (badge unread) · Profil**; tab aktif tint `#00aaff`, ikon lucide; haptic secukupnya.
  - **Brand & versi:** splash/login menampilkan "AMS Integrated System", "PT Anugrahmitra Selaras", versi `2.4.0-cdakb`; footer "coded by Langgo Bramandityo" opsional di layar Tentang.
  - **Akses berbasis role:** tab/modul yang tampil mengikuti `resolveEffectiveRole` + permission (mis. approval hanya untuk atasan/HR), meniru `bolehAksesModul` induk (`src/utils/hakAkses.ts`).

## 6. Arsitektur Integrasi

```
┌───────────────────────────┐         ┌──────────────────────────────────────┐
│  Mobile (RN/Expo+NativeWind)│        │  VPS: Express + PostgreSQL (induk)   │
│  - design system AMS (§5)   │  HTTPS │  - /api/auth/*  (Bearer session)     │
│  - GPS + kamera (selfie)    │◄──────►│  - /api/attendance/*  (MVP, jadi)    │
│  - Inbox notifikasi       │  REST   │  - /api/notifications/* (baru)       │
│  - Push receiver FCM/APNs │         │  - /api/devices/* (baru)             │
│  - Offline queue          │  WS     │  - /api/sync/ws (realtime, ada)      │
└───────────────────────────┘◄───────►│  - RBAC resolveEffectiveRole         │
             ▲                        │  - dataSyncStore (hris_absensi, ...)  │
             │ push                   │  - Push sender FCM/APNs (baru)        │
        ┌────┴─────┐                  └──────────────────────────────────────┘
        │ FCM/APNs │                            ▲
        └──────────┘                            │ write/read
                                          ┌─────┴─────┐
                                          │ PostgreSQL│  single source of truth
                                          └───────────┘
```

- **REST** untuk transaksi (clock-in/out, inbox, register device).
- **WebSocket** (`/api/sync/ws`, sudah ada) untuk realtime in-app (absensi & notifikasi).
- **Push FCM/APNs** untuk notifikasi saat app di background.
- Semua di belakang **TLS + Bearer session + RBAC**.

## 7. Modul Time Attendance (geo-tagging + foto)

### 7.1 Model `LogAbsensi` (sudah diperluas di MVP)
Field opsional mobile: `koordinat {lat,lon}`, `akurasiMeter`, `geofence {lokasiId,radiusMeter,jarakMeter,dalamPagar}`, `fotoMasukUrl/Hash`, `fotoKeluarUrl/Hash`, `deviceId`, `waktuServer`, `flagAntiSpoof`, `idempotencyKey`; `sumber: 'Geofencing GPS (Mobile)'` (`src/types/index.ts:908`, `server/attendance.ts`).

### 7.2 Alur clock-in (server otoritatif)
1. Mobile ambil GPS high-accuracy + selfie kamera depan; kompres foto.
2. `POST /api/attendance/clock-in` (Bearer) `{ lat, lon, akurasiMeter, foto, deviceId, idempotencyKey }`.
3. Server (`server/attendance.ts`):
   - Auth + RBAC; karyawan hanya boleh absen untuk dirinya (`karyawanId = username`).
   - **Jam & tanggal resmi = waktu server** (abaikan jam klien).
   - `hitungJarakKm` ke `geo_lokasi` → `verifikasiGeofence`; tolak bila di luar pagar / akurasi > 50 m / mock-location.
   - Simpan foto content-addressed (SHA-256) + ikat ke record.
   - Status `Hadir`/`Terlambat` via `evaluasiKeterlambatan`.
   - Tulis ke `hris_absensi` via dataSyncStore + broadcast WebSocket → web HRIS langsung melihat.
4. Mobile tampilkan hasil (valid/ditolak + alasan + jarak + bukti foto/peta/jam server) memakai kit §5.

Clock-out simetris. **Offline:** queue lokal + idempotencyKey; kirim ulang saat online; server menandai `offline-reconciled`.

### 7.3 Anti-spoofing
Jam resmi server; deteksi mock/fake-GPS; ambang akurasi 50 m; selfie terikat timestamp+lokasi; device binding + rate-limit; idempotency key; (fase lanjut) liveness/face-match.

### 7.4 Penyimpanan foto
Filesystem VPS `data/attendance-photos` dengan nama ber-hash (bukan bytea PostgreSQL); URL + hash di record; akses via `GET /api/attendance/photo/:berkas` (RBAC); retensi & consent sesuai UU PDP.

## 8. Notifikasi Pekerjaan Berbasis Role

### 8.1 Routing server-side (`resolveEffectiveRole` + permission)

| Event | Penerima (role/permission) |
|---|---|
| Reminder shift / belum absen | karyawan ybs + atasan/kepala_gudang |
| Approval lembur/izin | atasan + HR (hrd-pelatihan) |
| Tugas QC / CAPA baru | qc_officer, qa_manager, PJT |
| Recall / KTD aktif | PJT, qa_manager, sales_manager |
| Stok kritis / ROP | purchasing, kepala_gudang |
| Tender / kontrak baru | sales_manager, purchasing |

### 8.2 Dua lapis pengiriman
- **In-app realtime:** WebSocket `/api/sync/ws` + tabel inbox `notifications` (badge & daftar di mobile dan web).
- **Background push:** FCM (Android) + APNs (iOS). Mobile register token (`POST /api/devices/register`); server fan-out ke token penerima hasil routing role. Opsi: `firebase-admin`/`apn` langsung, atau Expo Push/OneSignal.
- Fallback opsional WhatsApp/SMS untuk darurat (rencana G3, `docs/production-list.md`).

### 8.3 Fitur inbox
Read/unread, preferensi per jenis, quiet hours, deep-link ke modul terkait, retensi; status read disinkron server agar konsisten antar perangkat. UI inbox memakai `Panel` + `Badge` tone (§5).

## 9. Skema Data Baru (PostgreSQL)

- `geo_lokasi` — master kantor/cabang `{ id, nama, lat, lon, radiusMeter, aktif }` (MVP masih konstanta `GEO_LOKASI_DEFAULT` di `server/attendance.ts`).
- perluasan `absensi` — kolom geo/foto/device/waktuServer/flag (§7.1).
- `attendance_photo` — atau kolom URL+hash pada absensi.
- `notifications` — `{ id, jenis, judul, isi, payload, dibuatPada, kedaluwarsa }`.
- `notification_recipients` — `{ notificationId, userId, dibacaPada }`.
- `device_tokens` — `{ id, userId, platform, token, deviceId, dibuatPada }`.

## 10. Endpoint API

Semua di belakang auth Bearer + RBAC. **Sudah jadi (MVP):** `GET /api/geo/locations`, `POST /api/attendance/clock-in`, `POST /api/attendance/clock-out`, `GET /api/attendance/today`, `GET /api/attendance/history`, `GET /api/attendance/photo/:berkas` (`server/attendance.ts`).
**Baru:** `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/devices/register`, `DELETE /api/devices/:id`.

## 11. Keamanan, Privasi, Offline, Deployment

- **TLS wajib**; token di Keychain/Keystore (`expo-secure-store`), bukan AsyncStorage polos.
- **Consent** GPS+foto saat onboarding; minimisasi (koordinat hanya saat absen); retensi foto terbatas; akses foto via RBAC; audit trail.
- **Offline-first:** queue lokal + idempotency + rekonsiliasi server-authoritative; konflik dimenangkan server.
- **Deployment:** VPS + reverse proxy HTTPS; base URL API per environment (ganti `app/config.ts` referensi); EAS Build → Play Store/App Store atau enterprise/sideload; versioning API untuk kompatibilitas mobile lama.
- **Jangan** menanam API key/kredensial di repo (pelajaran dari `app.json` referensi).

## 12. Spesifikasi Layar & UI/UX (turunan induk)

Semua layar memakai token §5.1, kit §5.3, navigasi §5.4. Pola alur diadopsi dari Attendify (§3.1) dengan tampilan AMS.

1. **Splash / Login** — logo AMS + "AMS Integrated System" + "PT Anugrahmitra Selaras • CDAKB & ISO 13485"; form username/password (`inputClass` turunan); tombol primer emerald "Masuk" → `POST /api/auth/login`; versi `2.4.0-cdakb`. *Menggantikan `login_page`/`signup` Attendify; bukan `/user/login`.*
2. **Beranda** — `StatCard` ringkasan hari ini (jam masuk/keluar, `Badge` status), `Panel` "Aksi Cepat" (Clock In/Out), `Panel` notifikasi terbaru. *Pola Home Attendify, di-restyle AMS.*
3. **Absen (Clock)** — peta (`react-native-maps`) + marker `geo_lokasi`, indikator jarak/geofence (`Badge` emerald/rose), tombol besar Clock In (emerald)/Clock Out, alur selfie (`PhotoPreviewSection` turunan), hasil (jam server, jarak, foto, status). *Menggantikan `location_services` + `timer` Attendify.*
4. **Notifikasi** — inbox `Panel` + `Badge` tone per jenis, read/unread, deep-link modul; badge unread di tab. *Routing role server (§8).*
5. **Profil / Manajer** — info user + role (`Badge`), ganti sandi (`/api/auth/change-password`), keluar; untuk atasan/HR: approval koreksi absensi (`MultiStepForm`/`request_form` turunan) + action log (`audit_trail`). *Menggantikan `user_dashboard` + manager tools Attendify.*
6. **(Fase lanjut) Bluetooth proximity & face-match** — adopsi pola `bluetooth_services`/`face_recog` Attendify, dengan token & kit AMS.

## 13. Roadmap Bertahap

1. **MVP backend:** auth Bearer + clock-in/out geo+foto + geofence server + sync `hris_absensi`. ← **selesai & terverifikasi** (`server/attendance.ts`, 42 tes).
2. **MVP mobile:** scaffold Expo (React 19) + NativeWind + design system AMS (§5) + login + clock-in/out + Beranda; inbox in-app (WebSocket).
3. **Push:** FCM/APNs + device registry + routing role.
4. **Offline & anti-spoofing lengkap:** queue, idempotency, mock-GPS, device binding.
5. **Lanjutan:** liveness/face-match, BLE proximity, analytics kehadiran, payroll penuh, fallback WhatsApp.

## 14. Keputusan Terbuka

- Stack mobile: **RN/Expo (dipilih)**; versi Expo SDK ≥ 53 (React 19) — konfirmasi versi stabil saat scaffold.
- Styling: **NativeWind** (petakan token AMS) vs StyleSheet manual — NativeWind dipilih untuk konsistensi dengan Tailwind induk.
- Push: FCM/APNs langsung vs Expo Push/OneSignal.
- Foto: filesystem ber-hash (dipilih, sudah di MVP) vs object storage vs DB.
- Face recognition & BLE: fase lanjut (diadopsi dari referensi); MVP cukup selfie bukti + GPS.
- Monorepo `packages/ams-core` vs path alias untuk share types/util.

## 15. Referensi Kode Induk

- Design system: `src/index.css:78-207` (token warna/font), `src/components/ui/index.tsx:12-162` (kit primitif), `src/components/layout/Navbar.tsx:45-119,356-503` (navigasi/brand), `src/App.tsx:242-407` (shell/footer).
- Domain: `src/types/index.ts:896` (`SumberAbsensi`), `:908` (`LogAbsensi`); `src/utils/hris.ts:41,66,71-90`.
- Backend: `server/attendance.ts` (MVP), `server.ts:304` (mount), `server/rbacMiddleware.ts:46-54` (Bearer+cookie), `server/rbacStore.ts:618` (`resolveEffectiveRole`), `server/dataSyncStore.ts`, `src/services/pocketbase.ts:1251` (`hris_absensi`).
- Referensi eksternal: https://github.com/driptobhattacharyya/Smart-Attendance-App (Expo/RN; pola & fitur, bukan disalin mentah).