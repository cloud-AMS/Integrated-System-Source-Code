# Deployment staging AMS di Render

Konfigurasi [render.yaml](../render.yaml) membuat Web Service Node.js dengan WebSocket, health check, dan persistent disk terpisah di `/var/data`. URL publik `*.onrender.com` baru dibuat oleh Render setelah Blueprint diterapkan di akun Anda. Paket `starter` dan persistent disk berbayar; periksa biaya Render sebelum melanjutkan.

> Untuk deployment **Firebase Staging di VPS Windows Server** (PowerShell + NSSM + Caddy HTTPS), lihat [panduan VPS Windows](./panduan-deploy-vps-windows.md).

## 1. Buat proyek Firebase staging terpisah

Jangan gunakan konfigurasi dari `firebase-applet-config.json` untuk staging. Di Firebase Console:

1. Buat proyek Firebase baru khusus staging dan daftarkan aplikasi Web.
2. Aktifkan Google sebagai provider di Authentication.
3. Buat database Cloud Firestore dengan ID `(default)`, lalu terbitkan aturan dari `firestore.rules` pada proyek staging tersebut.
4. Catat konfigurasi aplikasi Web: API key, Auth domain, Project ID, Storage bucket, Messaging sender ID, dan App ID.

## 2. Buat Render Web Service

1. Pastikan perubahan repository sudah di-commit dan dipush ke branch `main`.
2. Di Render, buat **Blueprint** dari repository ini dan pilih `render.yaml`.
3. Isi variabel Firebase staging yang diminta dengan nilai dari proyek staging. Jangan masukkan kredensial Firebase production.
4. Terapkan Blueprint dan tunggu build serta `/api/health` lolos. Render akan menetapkan URL unik untuk service.
5. Tambahkan hostname persis service, misalnya `ams-integrated-staging.onrender.com` (tanpa `https://`), ke **Firebase Authentication → Settings → Authorized domains**.

Blueprint menonaktifkan auto-deploy agar service tidak dibangun sebelum konfigurasi Firebase staging diisi. `SESSION_SECRET` dan `INITIAL_SETUP_TOKEN` dibuat oleh Render; lihat nilainya di dashboard service. Jaga token setup, lalu gunakan untuk membuat akun administrator pertama. Jangan memasukkan token atau password ke Git.

Data aplikasi staging disimpan pada disk Render yang terpisah dan tidak menyalin folder `data` lokal. Firestore staging juga terpisah dari proyek yang saat ini dikonfigurasi untuk aplikasi lokal.
