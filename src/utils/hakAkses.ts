import type { AkunPengguna, AksesEfektif, ModuleNavId, RoleSistem, UserRole } from '../types';

export interface DefinisiModulAkses {
  id: ModuleNavId;
  nama: string;
  grup: 'Umum & Publik' | 'Regulatory Affairs' | 'Operations & Technical' | 'Commercial & Market' | 'Supporting System';
  deskripsi: string;
}

export const DAFTAR_MODUL_SISTEM: DefinisiModulAkses[] = [
  {
    id: 'overview',
    nama: 'Executive Overview',
    grup: 'Umum & Publik',
    deskripsi: 'Kokpit direksi, ringkasan kinerja divisi, dan pelaporan eksekutif.'
  },
  {
    id: 'website',
    nama: 'Website & CMS Publik',
    grup: 'Umum & Publik',
    deskripsi: 'Pengaturan katalog situs perusahaan dan publikasi snapshot web.'
  },
  {
    id: 'ra-pjt',
    nama: 'Regulatory Affairs (RA & PJT)',
    grup: 'Regulatory Affairs',
    deskripsi: 'Manajemen Nomor Izin Edar (NIE AKL/AKD), SDAK, dan OSS-RBA.'
  },
  {
    id: 'qa-mutu',
    nama: 'Quality Assurance (QA)',
    grup: 'Regulatory Affairs',
    deskripsi: 'Dokumen mutu ISO 13485, CAPA, audit internal, dan karantina retur.'
  },
  {
    id: 'qc-inspeksi',
    nama: 'Quality Control (QC)',
    grup: 'Regulatory Affairs',
    deskripsi: 'Inspeksi barang masuk/jadi, pengujian mutu, dan rilis batch.'
  },
  {
    id: 'pms-vigilance',
    nama: 'Post-Market Surveillance (PMS)',
    grup: 'Commercial & Market',
    deskripsi: 'Pelaporan kejadian tidak diinginkan (KTD) dan penarikan produk (recall).'
  },
  {
    id: 'gudang-logistik',
    nama: 'Warehouse & Logistics (CDAKB)',
    grup: 'Operations & Technical',
    deskripsi: 'Stok FEFO, penerimaan, surat jalan, cold chain, dan opname.'
  },
  {
    id: 'teknisi-service',
    nama: 'After-Sales Service & Kalibrasi',
    grup: 'Operations & Technical',
    deskripsi: 'Instalasi, pemeliharaan, perbaikan, dan sertifikat kalibrasi.'
  },
  {
    id: 'produksi-cpakb',
    nama: 'Manufacture (CPAKB)',
    grup: 'Operations & Technical',
    deskripsi: 'Batch Manufacturing Record (BMR), yield, dan pemantauan cleanroom.'
  },
  {
    id: 'purchasing-procurement',
    nama: 'Purchasing & Procurement',
    grup: 'Operations & Technical',
    deskripsi: 'Evaluasi pemasok, purchase order, dan penerimaan prinsipal.'
  },
  {
    id: 'sales-marketing',
    nama: 'Sales & e-Katalog LKPP',
    grup: 'Commercial & Market',
    deskripsi: 'Pesanan fasyankes, CRM, tender LPSE, kontrak, dan kampanye.'
  },
  {
    id: 'hrd-pelatihan',
    nama: 'HRD & Pelatihan (HRIS)',
    grup: 'Supporting System',
    deskripsi: 'Master data karyawan, absensi, payroll, kompetensi CDAKB, dan K3.'
  },
  {
    id: 'finance-akuntansi',
    nama: 'Finance & Accounting',
    grup: 'Supporting System',
    deskripsi: 'Buku besar berantai, faktur pajak PPN 11%, valuasi, dan laporan keuangan.'
  },
  {
    id: 'it-traceability',
    nama: 'Information Technology (IT)',
    grup: 'Supporting System',
    deskripsi: 'Ketelusuran batch, jejak audit ISO 13485 (ALCOA+), dan konfigurasi server.'
  }
];

export const SEMUA_ID_MODUL: ModuleNavId[] = DAFTAR_MODUL_SISTEM.map((m) => m.id);

export const GRUP_MODUL_URUTAN: DefinisiModulAkses['grup'][] = [
  'Umum & Publik',
  'Regulatory Affairs',
  'Operations & Technical',
  'Commercial & Market',
  'Supporting System'
];

export const ROLE_BAWAAN_SISTEM: RoleSistem[] = [
  {
    id: 'pjt',
    nama: 'Penanggung Jawab Teknis (PJT)',
    deskripsi: 'Otoritas tertinggi kepatuhan Kemenkes RI, pelepasan izin edar, serta akses penuh seluruh modul dan manajemen akun.',
    basisPeran: 'pjt',
    aksesPenuh: true,
    modulDiizinkan: [...SEMUA_ID_MODUL],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'it_admin',
    nama: 'Administrator IT & Traceability',
    deskripsi: 'Pengelola infrastruktur server, audit trail ALCOA+, serta pengaturan User Account & Roles dengan akses penuh.',
    basisPeran: 'it_admin',
    aksesPenuh: true,
    modulDiizinkan: [...SEMUA_ID_MODUL],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'qa_manager',
    nama: 'QA Manager (ISO 13485)',
    deskripsi: 'Pengelolaan sistem manajemen mutu, dokumen SOP, CAPA, audit internal, serta pengawasan karantina dan KTD.',
    basisPeran: 'qa_manager',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'qa-mutu', 'qc-inspeksi', 'ra-pjt', 'pms-vigilance', 'produksi-cpakb'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'qc_officer',
    nama: 'Lead QC Inspector',
    deskripsi: 'Inspeksi barang datang, produk jadi manufaktur, pengujian mutu, dan verifikasi pra-kirim.',
    basisPeran: 'qc_officer',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'qc-inspeksi', 'qa-mutu', 'produksi-cpakb', 'gudang-logistik'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'kepala_gudang',
    nama: 'Kepala Gudang & Logistik (CDAKB)',
    deskripsi: 'Operasional gudang FEFO, rantai dingin 2–8°C, penerimaan barang, surat jalan, dan opname stok.',
    basisPeran: 'kepala_gudang',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'gudang-logistik', 'purchasing-procurement', 'qc-inspeksi', 'pms-vigilance'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'teknisi_elektromedik',
    nama: 'Teknisi Elektromedik (Ber-STR)',
    deskripsi: 'Layanan purna jual, kalibrasi alat elektromedik, instalasi fasyankes, dan pemantauan laporan teknis.',
    basisPeran: 'teknisi_elektromedik',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'teknisi-service', 'gudang-logistik', 'pms-vigilance'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'manajer_produksi',
    nama: 'Manajer Produksi (CPAKB)',
    deskripsi: 'Pengelolaan Batch Manufacturing Record (BMR), cleanroom, dan koordinasi bahan baku dengan QC/gudang.',
    basisPeran: 'manajer_produksi',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'produksi-cpakb', 'qc-inspeksi', 'gudang-logistik', 'purchasing-procurement'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'purchasing',
    nama: 'Purchasing & Procurement',
    deskripsi: 'Pembelian alat kesehatan & bahan baku, evaluasi pemasok berkala, dan sinkronisasi penerimaan & hutang.',
    basisPeran: 'purchasing',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'purchasing-procurement', 'gudang-logistik', 'finance-akuntansi'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sales_manager',
    nama: 'Sales Manager & e-Katalog LKPP',
    deskripsi: 'Pengelolaan pesanan rumah sakit, CRM prospek, tender LPSE, etika promosi, dan katalog website publik.',
    basisPeran: 'sales_manager',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'sales-marketing', 'website', 'pms-vigilance', 'gudang-logistik'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'auditor_internal',
    nama: 'Auditor Internal ISO 13485',
    deskripsi: 'Pemantauan kepatuhan dokumen mutu, audit trail ALCOA+, rekam pelatihan staf, dan inspeksi gudang.',
    basisPeran: 'auditor_internal',
    aksesPenuh: false,
    modulDiizinkan: ['overview', 'ra-pjt', 'qa-mutu', 'qc-inspeksi', 'pms-vigilance', 'gudang-logistik', 'produksi-cpakb', 'hrd-pelatihan', 'it-traceability'],
    bawaanSistem: true,
    diperbaruiPada: '2026-01-01T00:00:00.000Z'
  }
];

export const AKUN_BAWAAN_SISTEM: AkunPengguna[] = [
  {
    id: 'USR-01',
    namaLengkap: 'apt. Dewi Kartika, S.Si',
    username: 'admin',
    email: 'pjt@anugrahmitraselaras.co.id',
    roleId: 'pjt',
    status: 'Aktif',
    aksesKustom: false,
    dibuatPada: '2026-01-01T08:00:00.000Z',
    terakhirMasuk: '2026-11-12T08:30:00.000Z'
  },
  {
    id: 'USR-02',
    namaLengkap: 'Admin IT & Traceability Hub',
    username: 'it.admin',
    email: 'it@anugrahmitraselaras.co.id',
    roleId: 'it_admin',
    status: 'Aktif',
    aksesKustom: false,
    dibuatPada: '2026-01-01T08:00:00.000Z',
    terakhirMasuk: '2026-11-11T16:15:00.000Z'
  },
  {
    id: 'USR-03',
    namaLengkap: 'Budi Utomo, S.T',
    username: 'budi.qa',
    email: 'qa@anugrahmitraselaras.co.id',
    roleId: 'qa_manager',
    status: 'Aktif',
    aksesKustom: false,
    dibuatPada: '2026-01-05T09:00:00.000Z'
  },
  {
    id: 'USR-04',
    namaLengkap: 'Hendra Setiawan',
    username: 'hendra.qc',
    email: 'qc@anugrahmitraselaras.co.id',
    roleId: 'qc_officer',
    status: 'Aktif',
    aksesKustom: false,
    dibuatPada: '2026-01-05T09:10:00.000Z'
  },
  {
    id: 'USR-05',
    namaLengkap: 'Ahmad Fauzi',
    username: 'ahmad.gudang',
    email: 'gudang@anugrahmitraselaras.co.id',
    roleId: 'kepala_gudang',
    status: 'Aktif',
    aksesKustom: false,
    dibuatPada: '2026-01-06T08:30:00.000Z'
  },
  {
    id: 'USR-06',
    namaLengkap: 'Farhan Maulana',
    username: 'farhan.sales',
    email: 'sales@anugrahmitraselaras.co.id',
    roleId: 'sales_manager',
    status: 'Aktif',
    aksesKustom: false,
    dibuatPada: '2026-01-10T10:00:00.000Z'
  }
];

function bersihkanDaftarModul(daftar?: ModuleNavId[]): ModuleNavId[] {
  if (!Array.isArray(daftar)) return [];
  const validSet = new Set<ModuleNavId>(SEMUA_ID_MODUL);
  const unik = new Set<ModuleNavId>();
  for (const item of daftar) {
    if (validSet.has(item)) unik.add(item);
  }
  return SEMUA_ID_MODUL.filter((id) => unik.has(id));
}

export function hitungAksesEfektif(
  akun: AkunPengguna | null | undefined,
  roles: RoleSistem[],
  fallbackRoleId?: UserRole | string
): AksesEfektif {
  const targetRoleId = akun?.roleId || fallbackRoleId || 'pjt';
  const role = roles.find((r) => r.id === targetRoleId);

  if (akun && akun.aksesKustom) {
    if (akun.aksesPenuhOverride) {
      return {
        aksesPenuh: true,
        modulDiizinkan: [...SEMUA_ID_MODUL],
        sumber: 'akses-penuh',
        role
      };
    }
    return {
      aksesPenuh: false,
      modulDiizinkan: bersihkanDaftarModul(akun.modulDiizinkan),
      sumber: 'kustom-user',
      role
    };
  }

  if (role?.aksesPenuh) {
    return {
      aksesPenuh: true,
      modulDiizinkan: [...SEMUA_ID_MODUL],
      sumber: 'akses-penuh',
      role
    };
  }

  if (role) {
    return {
      aksesPenuh: false,
      modulDiizinkan: bersihkanDaftarModul(role.modulDiizinkan),
      sumber: 'role',
      role
    };
  }

  const defaultBawaan = ROLE_BAWAAN_SISTEM.find((r) => r.id === targetRoleId);
  if (defaultBawaan?.aksesPenuh) {
    return {
      aksesPenuh: true,
      modulDiizinkan: [...SEMUA_ID_MODUL],
      sumber: 'akses-penuh',
      role: defaultBawaan
    };
  }

  return {
    aksesPenuh: false,
    modulDiizinkan: defaultBawaan ? [...defaultBawaan.modulDiizinkan] : ['overview'],
    sumber: 'role',
    role: defaultBawaan
  };
}

export function bolehAksesModul(
  modulId: ModuleNavId,
  akses: Pick<AksesEfektif, 'aksesPenuh' | 'modulDiizinkan'>
): boolean {
  if (akses.aksesPenuh) return true;
  return akses.modulDiizinkan.includes(modulId);
}

export function hitungAdminAksesPenuhAktif(
  daftarAkun: AkunPengguna[],
  daftarRole: RoleSistem[]
): number {
  return daftarAkun.filter((akun) => {
    if (akun.status !== 'Aktif') return false;
    return hitungAksesEfektif(akun, daftarRole).aksesPenuh;
  }).length;
}

export function buatSlugRole(nama: string, existingIds: string[]): string {
  const dasar = nama
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom_role';
  let kandidat = dasar;
  let angka = 2;
  const setId = new Set(existingIds);
  while (setId.has(kandidat)) {
    kandidat = `${dasar}_${angka}`;
    angka += 1;
  }
  return kandidat;
}
