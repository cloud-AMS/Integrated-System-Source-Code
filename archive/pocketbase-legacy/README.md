# Arsip Pengaturan Database PocketBase (AMS Integrated System)

Direktori ini menyimpan arsip lengkap konfigurasi **PocketBase + Express JSON Store** sebelum aplikasi beralih ke **Firebase Firestore** untuk fase pengembangan di AI Studio.

## Apa Saja yang Diarsipkan?
1. `pocketbase-config.json` — Seluruh parameter koneksi PocketBase (`127.0.0.1:8091`), rute proxy aman (`/api/ams-pb`), daftar koleksi operasional & mobile sync, unit systemd, konfigurasi Nginx/Caddy, serta struktur berkas persisten (`app-state.json`, `rbac-db.json`, `website-published.json`, `.session-secret`).
2. `website-published.snapshot.json` — Snapshot konten situs publik terakhir sebelum fase Firebase.
3. Salinan arsip ini juga disinkronkan ke koleksi Firestore `ams_archives/pocketbase_legacy` agar tetap tersedia meskipun kontainer AI Studio di-republish.

## Cara Mengembalikan Database ke PocketBase Setelah Pengembangan Selesai

### Opsi A — Melalui UI Aplikasi (Menu IT Hub -> Pengaturan Database & Cloud Sync)
1. Buka **Information Technology (IT) -> Ketelusuran & Sistem -> Pengaturan Database (Firebase / PocketBase)**.
2. Klik **Unduh Paket Migrasi JSON** jika Anda ingin membawa seluruh akun pengguna, peran RBAC, konten CMS website, dan transaksi yang dibuat selama fase Firebase ke server PocketBase / VPS.
3. Klik tombol **Kembalikan ke Mode PocketBase** (atau atur `AMS_DB_DRIVER=pocketbase` di `.env`).

### Opsi B — Melalui Environment Variable (`.env` di VPS / Server Lokal)
```env
AMS_DB_DRIVER="pocketbase"
AMS_DATA_DIR="/var/lib/ams-data"
```
Lalu aktifkan service PocketBase sesuai `docs/pocketbase-ams-server.md` & `docs/panduan-deploy-vps.md`, dan letakkan file hasil ekspor (`app-state.json` & `rbac-db.json`) ke folder `AMS_DATA_DIR` agar seluruh data dari fase pengembangan tetap terbawa.
