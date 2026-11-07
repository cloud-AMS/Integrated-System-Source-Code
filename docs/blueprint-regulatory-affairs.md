# Blueprint — Regulatory Affairs & PJT Management (Child)

Status: **SELESAI & TERINTEGRASI KE PARENT SYSTEM BLUEPRINT**  
Parent Document: `/docs/system-blueprint.md` (Domain: Regulatory & Quality Compliance)  
Sasaran: `src/components/modules/regulatory/RegulatoryModule.tsx`
Coded by Langgo Bramandityo

---

## 1. STACK TEKNOLOGI MODUL
- **Frontend Stack**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Modal Dialogs & Table Grids.
- **State & Data Layer**: PocketBase Collections (`nie_records`, `pjt_certificates`).
- **Engine / Logika**: NIE Expiry Alert Validator, PJT Credential & SKP Verification Engine.

---

## 2. KONEKSI LINTAS MODUL (PARENT-CHILD INTEGRATION)
- **Hubungan dengan Parent (`system-blueprint.md`):** Merupakan fondasi legalitas dan regulasi Kemenkes RI yang mengamankan seluruh operasional perusahaan di bawah Root Parent.
- **Koneksi ke Child Modul Lain:**
  - *Procurement & Sales*: Menyediakan validasi nomor izin edar (NIE) aktif sebelum PO atau Sales Order diterbitkan.
  - *WMS Gudang*: Mencegah penerimaan atau pengeluaran alkes yang izin edarnya kedaluwarsa.
