# Blueprint — Situs Web Publik & Portal Remedi (Child)

Status: **SELESAI & TERINTEGRASI KE PARENT SYSTEM BLUEPRINT**  
Parent Document: `/docs/system-blueprint.md` (Domain: Situs Web Publik & CMS)  
Sasaran: `src/components/modules/website/WebsiteModule.tsx`
Coded by Langgo Bramandityo

---

## 1. STACK TEKNOLOGI MODUL
- **Frontend Stack**: React SPA, TypeScript, Tailwind CSS v4, Lucide React, MedanEditor & SectionsEditor UI components.
- **State & Data Layer**: PocketBase CMS Collections, Local JSON Rujukan (`websiteRujukan.ts`).
- **Engine / Logika**: Dynamic Section Rendering Engine, Live CMS Preview & Layout Builder.

---

## 2. KONEKSI LINTAS MODUL (PARENT-CHILD INTEGRATION)
- **Hubungan dengan Parent (`system-blueprint.md`):** Modul ini merepresentasikan Domain Situs Web Publik pada arsitektur Modular Monolith REMEDI, menyediakan antarmuka eksternal bagi fasyankes/publik.
- **Koneksi ke Child Modul Lain:**
  - *Regulatory & Sales*: Mengambil data katalog produk resmi yang sudah memiliki NIE aktif dan harga e-Katalog LKPP untuk ditampilkan di portal publik.
