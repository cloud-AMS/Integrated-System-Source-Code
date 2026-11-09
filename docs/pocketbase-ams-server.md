> **Status dokumen (2026-11): FAKTA TERVERIFIKASI** — server tercatat berjalan di `127.0.0.1:8091` saat dokumen ini ditulis; isi dokumen sesuai keadaan. Ini catatan teknis, bukan bukti kepatuhan.

# Server PocketBase AMS Integrated System

Server basis data AMS berjalan **terpisah** dari PocketBase BEJO (`C:\pocketbase`, port 8090).

| Item | Nilai |
|---|---|
| Lokasi bin & data | `C:\pocketbase-ams` (`pb_data` dibuat di dalamnya) |
| Versi | 0.28.1 (disalin dari `C:\pocketbase\pocketbase.exe`) |
| Alamat | `http://127.0.0.1:8091` |
| Migrasi koleksi | `C:\pocketbase-ams\pb_migrations\1735000000_ams_collections.js` |

## Menjalankan

```powershell
C:\pocketbase-ams\pocketbase.exe serve --http=127.0.0.1:8091
```

## Akun superuser

Dibuat sendiri oleh pemilik lewat Admin UI: `http://127.0.0.1:8091/_/` (formulir pembuatan superuser muncul pada pemasangan baru).
Tidak ada kata sandi superuser yang ditulis di berkas mana pun di repo ini.

## Koleksi yang diprovisi

`stok_gudang`, `gudang_pengaturan`, `sales_unit_serial`, `sales_skema_harga`, `sales_kontrak`,
`sales_rebate`, `izin_edar`, `penarikan_produk`, `sales_pengetahuan_produk`, `website_published`.
Semua basis, satu field `data` (JSON, maks 5 MB), aturan baca publik (`listRule`/`viewRule` kosong),
aturan tulis hanya superuser. Field `data` adalah wadah muatan — aplikasi saat ini tidak menulis ke PocketBase,
hanya memakai kanal realtime sebagai pemicu muat ulang dari penyimpanan lokal.

## Akses dari internet

Aplikasi dijalankan di port 3001 dan di-proxy oleh Express — tetapi **hanya tiga jalur baca yang diizinkan**:

- `GET /api/ams-pb/api/health` (status PB),
- `GET /api/ams-pb/api/realtime` (SSE),
- `GET /api/ams-pb/api/collections/<nama>/records` (baca koleksi publik).

Semua jalur lain — Admin UI (`/_/`), superuser, pengaturan, tulis/hapus koleksi — dijawab `403` oleh guard di `server.ts`. Klien memakai `${window.location.origin}/api/ams-pb` sebagai `PB_URL` (lihat `src/services/pocketbase.ts`); `window.__PB_URL__` tetap bisa menimpa untuk kasus khusus. Lewat Cloudflare Quick Tunnel, PocketBase AMS dapat dijangkau di `<url-tunnel>/api/ams-pb/api/health`.

## Batasan yang perlu diketahui

- Aplikasi AMS menyimpan data operasional di `localStorage` per browser (offline-first).
  PocketBase hanya dipakai untuk sinyal realtime + `website_published`; tanpa PocketBase aplikasi tetap jalan.
- Tunnel Quick tidak punya jaminan uptime; URL berubah setiap `cloudflared` direstart.
