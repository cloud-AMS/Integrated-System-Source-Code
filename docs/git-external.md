> **Status dokumen (2026-11): RENCANA — BELUM DIEKSEKUSI, JANGAN DIIMPOR APA ADANYA.** Repositori pihak ketiga yang disebut di sini (`driptobhattacharyya/Smart-Attendance-App`) adalah proyek individu tanpa riwayat audit keamanan, lisensi yang jelas, atau review untuk alur penggajian. **Biometrik wajah adalah data pribadi sensitif** (UU PDP No. 27/2022) — memproses citra wajah karyawan tanpa DPIA, dasar pemrosesan, dan pengamanan adalah pelanggaran langsung. Rekomendasi: bangun modul absensi sendiri di atas stack yang sudah ada; jika terpaksa memakai kode luar, fork + audit menyeluruh + pin versi + hapus fitur biometrik sampai ada izin tertulis dan DPIA. Mengimpor APK/repo asing apa adanya = risiko supply-chain ke sistem payroll & data pribadi.

# Integrasi Git Eksternal: Smart-Attendance-App

**Repository Sumber:** `https://github.com/driptobhattacharyya/Smart-Attendance-App.git`  
**Standar Kepatuhan:** CDAKB Permenkes RI 4/2014, ISO 13485:2016, ALCOA+ Data Integrity  
**Modul Sasaran:** HRD & Pelatihan (Time & Attendance) -> `src/components/modules/supporting/hris/TimeAttendanceModule.tsx`  
**Target:** Integrasi aplikasi turunan berbasis Android untuk karyawan (*Smart Attendance Android App*) dengan sinkronisasi geofencing GPS, face recognition, dan presensi real-time ke sistem pusat PT Anugrah Mitra Selaras (AMS).

---

## 📱 Ringkasan Arsitektur Smart Attendance Android App

1. **Mobile App Client (Android / Kotlin & Jetpack Compose / React Native)**:
   - Digunakan oleh karyawan lapangan (sales, teknisi alkes, staf gudang cold-chain).
   - Fitur utama: Absensi masuk/keluar (*clock-in/out*), verifikasi geofencing radius lokasi pabrik/gudang, pemindaian wajah (*face recognition*), serta pengajuan cuti & lembur mandiri.

2. **Backend Sync & API Gateway**:
   - Menghubungkan data absensi mobile app Android ke database pusat sistem terintegrasi AMS.
   - Pengecekan otomatis aturan toleransi keterlambatan (10 menit) dan potongan gaji proporsional.

3. **Audit Trail & Keamanan**:
   - Dilindungi dengan hash-chain audit log dan enkripsi token autentikasi karyawan.

---
*Coded by Langgo Bramandityo*
