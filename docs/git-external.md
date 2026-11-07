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
