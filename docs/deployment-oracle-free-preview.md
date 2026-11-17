# Preview AMS gratis dengan Oracle Cloud Always Free dan Firebase

Panduan ini menjalankan Express, WebSocket sync, dan aplikasi web pada VM Ubuntu Oracle Cloud Always Free. State aplikasi dan akun RBAC disimpan di `/var/lib/ams-data` pada boot volume VM. Firebase tetap menjadi driver yang dikonfigurasi; Firestore digunakan untuk sinkronisasi cloud yang sudah didukung aplikasi, bukan satu-satunya penyimpanan state server.

## Batasan dan biaya

- PocketBase tidak dipakai pada deployment ini. Walaupun software PocketBase gratis dan dapat self-hosted, repositori resminya diarsipkan pada 26 Oktober 2026 dan read-only; karena itu tidak disarankan untuk layanan internet-facing yang menyimpan data pengguna.
- Oracle menyatakan Compute Always Free tersedia selama akun aktif dalam batas resource dan home region. Kapasitas VM tidak dijamin; instance idle dapat direklamasi. Pembuatan akun meminta metode pembayaran untuk verifikasi, meskipun resource yang memenuhi syarat Always Free tidak dikenakan biaya. Pastikan Console menandai resource **Always Free-eligible** dan jangan membuat resource berbayar/trial.
- Oracle mensyaratkan resource memenuhi aturan idle-VM. Jika VM direklamasi, layanan dapat berhenti; boot volume yang tidak dihapus menyimpan data, tetapi selalu lakukan backup.
- Firebase Spark menyediakan Cloud Firestore Standard hingga 1 GiB tersimpan, 20.000 writes/hari, 50.000 reads/hari, dan 10 GiB egress/bulan. Kuota dapat berubah; monitor penggunaan di Firebase Console.
- VM ini tetap aktif dan tidak tidur seperti web service gratis Render. Firebase Spark sendiri tidak menjalankan server Express/WebSocket aplikasi ini.

## 1. Siapkan akun, VM, dan hostname

1. Buat akun Oracle Cloud Free Tier. Jangan membagikan password, private key, kartu, atau file credential.
2. Buat Ubuntu 22.04/24.04 ARM64 VM pada **home region** dengan shape yang berlabel **Always Free-eligible**. Untuk ruang build aplikasi, gunakan alokasi A1 yang masih dalam kuota Always Free (maksimum gabungan 2 OCPU dan 12 GB RAM, bila kapasitas tersedia).
3. Pertahankan boot volume VM dan jangan menaruh data aplikasi hanya di folder kode.
4. Pasang public IPv4, buat aturan ingress TCP 22, 80, dan 443 pada Oracle Security List/NSG serta firewall VM.
5. Siapkan hostname yang Anda kendalikan (domain milik sendiri atau subdomain DNS gratis) dan arahkan A record ke public IPv4 VM. Tunggu DNS mengarah sebelum meminta sertifikat SSL.

## 2. Siapkan Firebase staging gratis

Gunakan proyek Firebase terpisah dari proyek produksi:

1. Buat proyek Firebase staging di Spark dan daftarkan aplikasi Web.
2. Aktifkan provider Google jika login Google ingin dipakai.
3. Buat database Cloud Firestore Standard dengan ID `(default)`, lalu terapkan aturan dari `firestore.rules`.
4. Simpan konfigurasi aplikasi Web: API key, Auth domain, Project ID, Storage bucket, Messaging sender ID, dan App ID.
5. Setelah hostname tersedia, tambahkan hostname itu ke **Firebase Authentication → Settings → Authorized domains**.

## 3. Clone dan konfigurasi server

Hubungkan ke VM dengan SSH key. Clone repository ke `/var/www/ams-integrated-system`, lalu buat `.env` di direktori tersebut dengan permission terbatas:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://nama-hostname-anda
VITE_DEPLOYMENT_ENV=staging
DEPLOYMENT_ENV=staging
AMS_DB_DRIVER=firebase
AMS_DATA_DIR=/var/lib/ams-data
SESSION_SECRET=GANTI_DENGAN_NILAI_ACAK_MINIMAL_32_BYTE
INITIAL_SETUP_TOKEN=GANTI_DENGAN_TOKEN_ACAK_PANJANG
LETSENCRYPT_EMAIL=email-aktif-anda@example.com
VITE_FIREBASE_API_KEY=API_KEY_FIREBASE_STAGING
VITE_FIREBASE_AUTH_DOMAIN=PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=SENDER_ID
VITE_FIREBASE_APP_ID=APP_ID
VITE_FIRESTORE_DATABASE_ID=(default)
```

Buat `SESSION_SECRET` dan `INITIAL_SETUP_TOKEN` dengan generator kriptografis pada VM (contoh `openssl rand -hex 32`), bukan dengan menyalin contoh di atas. Jangan commit `.env`. Firebase Web API key adalah konfigurasi client, bukan private service-account key; tetap gunakan aturan Firestore untuk melindungi data.

Pastikan hostname, `.env`, dan repository siap. Jalankan installer dari repository:

```bash
sudo bash scripts/setup-vps.sh nama-hostname-anda
```

Script memasang Node.js, Nginx, dan PM2; build dan menjalankan aplikasi sebagai user sistem non-root `amsadmin`; mengatur PM2 agar hidup kembali setelah VM restart; serta menyimpan data server di `/var/lib/ams-data`. Gunakan alamat email aktif untuk notifikasi sertifikat. Setelah deployment sehat, cek `https://nama-hostname-anda/api/health`.

## 4. Bootstrap dan uji

1. Ambil `INITIAL_SETUP_TOKEN` dari `.env` secara lokal pada VM, buka hostname HTTPS, lalu buat akun developer pertama melalui wizard setup.
2. Tambahkan akun dan role uji melalui modul RBAC; login dengan akun terpisah pada dua browser/perangkat.
3. Verifikasi update dari satu browser muncul pada browser lain melalui WebSocket, dan periksa `/api/health`.
4. Buat backup rutin `/var/lib/ams-data`. Folder ini berisi `app-state.json`, `rbac-db.json`, dan secret sesi; jangan masukkan backup ke repository.

Semua user tetap harus login dan hanya dapat read/write sesuai permission RBAC. Jangan membuka endpoint write tanpa autentikasi hanya demi memudahkan preview.
