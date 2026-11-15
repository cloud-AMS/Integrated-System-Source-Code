import type { JejakPergerakan, JurnalKeuangan } from '../types';
import {
  INITIAL_IZIN_EDAR,
  INITIAL_SERTIFIKAT,
  INITIAL_DOKUMEN_MUTU,
  INITIAL_CAPA,
  INITIAL_PRODUK_KEMBALIAN,
  INITIAL_INSPEKSI_QC,
  INITIAL_STOK_GUDANG,
  INITIAL_LOG_SUHU,
  INITIAL_PEST_CONTROL,
  INITIAL_LAYANAN_TEKNIS,
  INITIAL_BETS_PRODUKSI,
  INITIAL_PEMASOK,
  INITIAL_PURCHASE_ORDER,
  INITIAL_PENJUALAN,
  INITIAL_LAPORAN_KTD,
  INITIAL_RECALL,
  INITIAL_PELATIHAN,
  INITIAL_SERTIFIKASI_PEGAWAI,
  INITIAL_TRANSAKSI,
  INITIAL_AUDIT_TRAIL,
  INITIAL_KARYAWAN_HRIS,
  INITIAL_GRADING_JABATAN,
  INITIAL_RIWAYAT_MUTASI,
  INITIAL_JADWAL_SHIFT,
  INITIAL_ABSENSI,
  INITIAL_LEMBUR,
  INITIAL_SLIP_GAJI,
  INITIAL_KANDIDAT_ATS,
  INITIAL_SKILL_MATRIX,
  INITIAL_KPI_KARYAWAN,
  INITIAL_UMPAN_BALIK_360,
  INITIAL_INSIDEN_K3,
  INITIAL_REKAM_MCU,
  INITIAL_DISTRIBUSI_APD,
  INITIAL_PELANGGAN_B2B,
  INITIAL_PROSPEK_ALKES,
  INITIAL_TERITORIAL_PENJUALAN,
  INITIAL_TENDER_ALKES,
  INITIAL_KONTRAK_HARGA,
  INITIAL_KUNJUNGAN_MEDREP,
  INITIAL_PENGETAHUAN_PRODUK,
  INITIAL_PRA_ORDER_MEDREP,
  INITIAL_SKEMA_HARGA,
  INITIAL_UNIT_SERIAL,
  INITIAL_GARANSI_INSTALASI,
  INITIAL_KAMPANYE_ALKES,
  INITIAL_UNIT_DEMO_ALKES,
  INITIAL_PROGRAM_REBATE,
  INITIAL_RIWAYAT_PENJUALAN_BULANAN,
  INITIAL_DAFTAR_SURAT,
  INITIAL_PELANGGAN_SURAT,
  INITIAL_KAMPANYE_SURAT,
  INITIAL_TEMPLAT_SURAT,
  INITIAL_MEDIA_SURAT,
  INITIAL_PESAN_TRANSAKSIONAL,
  INITIAL_GUDANG_FISIK,
  INITIAL_LOKASI_BIN,
  INITIAL_ATURAN_SIMPAN,
  INITIAL_TERIMA_BARANG,
  INITIAL_SURAT_JALAN,
  INITIAL_OPNAME_STOK,
  INITIAL_JEJAK_PERGERAKAN,
  INITIAL_AMBANG_STOK,
  INITIAL_KEJADIAN_SCANNER,
  INITIAL_SINKRONISASI_LKPP,
  INITIAL_KIRIMAN_SATU_SEHAT
} from '../data/initialData';
import {
  INITIAL_JURNAL_KEUANGAN,
  INITIAL_VALUASI_BATCH
} from '../data/seedKeuangan';
import { hashPergerakan } from './gudang';
import { GENESIS_JURNAL, hashJurnal } from './akuntansi';

export type KategoriPenyimpananData = 'operasional' | 'master_sistem' | 'konfigurasi_user';

export interface DefinisiKoleksiData {
  key: string;
  label: string;
  modul: string;
  kategori: KategoriPenyimpananData;
  rantaiHash?: boolean;
  strukturGudang?: boolean;
}

export interface ManifestAsalData {
  versi: number;
  dummyDihapus: boolean;
  dummyDihapusPada: string | null;
  dummyDihapusOleh: string | null;
  /** ID catatan seed yang pernah dimodifikasi oleh pengguna */
  userEditedIds: Record<string, string[]>;
  /** ID catatan seed yang sengaja dihapus pengguna (mis. audit auto-seed) */
  deletedSeedIds: Record<string, string[]>;
  /** ID audit internal otomatis yang dibuat sebagai benih saat inisialisasi awal */
  seededAuditIds: string[];
}

export function buatManifestDefault(): ManifestAsalData {
  return {
    versi: 1,
    dummyDihapus: false,
    dummyDihapusPada: null,
    dummyDihapusOleh: null,
    userEditedIds: {},
    deletedSeedIds: {},
    seededAuditIds: []
  };
}

export function normalisasiManifest(raw: unknown): ManifestAsalData {
  const dasar = buatManifestDefault();
  if (!raw || typeof raw !== 'object') return dasar;
  const obj = raw as Partial<ManifestAsalData>;
  return {
    versi: typeof obj.versi === 'number' ? obj.versi : 1,
    dummyDihapus: Boolean(obj.dummyDihapus),
    dummyDihapusPada: typeof obj.dummyDihapusPada === 'string' ? obj.dummyDihapusPada : null,
    dummyDihapusOleh: typeof obj.dummyDihapusOleh === 'string' ? obj.dummyDihapusOleh : null,
    userEditedIds:
      obj.userEditedIds && typeof obj.userEditedIds === 'object' ? obj.userEditedIds : {},
    deletedSeedIds:
      obj.deletedSeedIds && typeof obj.deletedSeedIds === 'object' ? obj.deletedSeedIds : {},
    seededAuditIds: Array.isArray(obj.seededAuditIds) ? obj.seededAuditIds : []
  };
}

export const KATALOG_KOLEKSI_DATA: readonly DefinisiKoleksiData[] = [
  // Regulatory Affairs, QA & QC
  { key: 'izin_edar', label: 'Izin Edar Alkes (NIE)', modul: 'Regulatory Affairs (RA/PJT)', kategori: 'operasional' },
  { key: 'sertifikat', label: 'Sertifikat Perusahaan (SDAK/ISO/CPAKB)', modul: 'Regulatory Affairs (RA/PJT)', kategori: 'operasional' },
  { key: 'dokumen_mutu', label: 'Dokumen Mutu (SOP/IK/Pedoman)', modul: 'Quality Assurance (QA)', kategori: 'operasional' },
  { key: 'capa', label: 'Catatan CAPA', modul: 'Quality Assurance (QA)', kategori: 'operasional' },
  { key: 'produk_kembalian', label: 'Produk Kembalian & Karantina', modul: 'Quality Assurance (QA)', kategori: 'operasional' },
  { key: 'inspeksi_qc', label: 'Inspeksi Quality Control (QC)', modul: 'Quality Control (QC)', kategori: 'operasional' },
  { key: 'audit_internal_iso', label: 'Audit Internal ISO 13485', modul: 'QA & QC Terpadu', kategori: 'operasional' },

  // Warehouse & Logistics
  { key: 'stok_gudang', label: 'Kartu Stok Gudang & Batch FEFO', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'log_suhu', label: 'Log Sensor Suhu & Cold Chain', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'pest_control', label: 'Log Pengendalian Hama', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_unit', label: 'Daftar Gudang Fisik', modul: 'Gudang & Logistik', kategori: 'operasional', strukturGudang: true },
  { key: 'gudang_bin', label: 'Lokasi Rak / Bin Gudang', modul: 'Gudang & Logistik', kategori: 'operasional', strukturGudang: true },
  { key: 'gudang_aturan_simpan', label: 'Aturan Directed Put-Away', modul: 'Gudang & Logistik', kategori: 'operasional', strukturGudang: true },
  { key: 'gudang_pergerakan', label: 'Jejak Pergerakan Stok (Hash Chain)', modul: 'Gudang & Logistik', kategori: 'operasional', rantaiHash: true },
  { key: 'gudang_penerimaan', label: 'Dokumen Penerimaan Inbound', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_surat_jalan', label: 'Surat Jalan Outbound', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_opname', label: 'Opname & Cycle Count', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_ambang', label: 'Ambang Min-Max & ROP', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_scanner', label: 'Log Scanner & RFID', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_lkpp_sync', label: 'Antrean Sinkronisasi LKPP', modul: 'Gudang & Logistik', kategori: 'operasional' },
  { key: 'gudang_satusehat', label: 'Kiriman FHIR SATUSEHAT', modul: 'Gudang & Logistik', kategori: 'operasional' },

  // Technical, Production & Purchasing
  { key: 'layanan_teknis', label: 'Tiket Teknisi & Kalibrasi', modul: 'After-Sales & Teknisi', kategori: 'operasional' },
  { key: 'bets_produksi', label: 'Batch Manufacturing Record (BMR)', modul: 'Manufaktur CPAKB', kategori: 'operasional' },
  { key: 'pemasok', label: 'Daftar Pemasok Terkualifikasi', modul: 'Purchasing & Procurement', kategori: 'operasional' },
  { key: 'purchase_order', label: 'Purchase Order (PO)', modul: 'Purchasing & Procurement', kategori: 'operasional' },

  // Sales, Marketing & Newsletter
  { key: 'penjualan', label: 'Pesanan Penjualan (Sales Order)', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_pelanggan', label: 'Master Pelanggan B2B & Fasyankes', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_prospek', label: 'Pipeline Prospek CRM', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_teritorial', label: 'Pemetaan Wilayah & Target Sales', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_tender', label: 'Daftar Tender & LPSE', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_kontrak', label: 'Kontrak Penguncian Harga', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_kunjungan', label: 'Kunjungan Lapangan MedRep', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_pengetahuan_produk', label: 'Katalog Pengetahuan Produk Alkes', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_pra_order', label: 'Pra-Order Lapangan MedRep', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_skema_harga', label: 'Skema Harga & Diskon', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_unit_serial', label: 'Registri Nomor Serial Unit', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_garansi', label: 'Garansi & Basis Instalasi', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_kampanye', label: 'Kampanye & Event Simposium', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_unit_demo', label: 'Pelacakan Unit Demo', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_rebate', label: 'Program Loyalitas & Rebate', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'sales_riwayat_bulanan', label: 'Riwayat Penjualan Bulanan', modul: 'Sales & Marketing', kategori: 'operasional' },
  { key: 'surat_daftar', label: 'Daftar Milis Newsletter', modul: 'Newsletter & Mailing', kategori: 'operasional' },
  { key: 'surat_subscriber', label: 'Subscriber Newsletter', modul: 'Newsletter & Mailing', kategori: 'operasional' },
  { key: 'surat_kampanye', label: 'Kampanye Newsletter', modul: 'Newsletter & Mailing', kategori: 'operasional' },
  { key: 'surat_templat', label: 'Templat Email', modul: 'Newsletter & Mailing', kategori: 'operasional' },
  { key: 'surat_media', label: 'Media Newsletter', modul: 'Newsletter & Mailing', kategori: 'operasional' },
  { key: 'surat_tx', label: 'Log Email Transaksional', modul: 'Newsletter & Mailing', kategori: 'operasional' },

  // Post-Market Surveillance
  { key: 'laporan_ktd', label: 'Laporan KTD (Vigilance)', modul: 'Post-Market Surveillance', kategori: 'operasional' },
  { key: 'penarikan_produk', label: 'Penarikan Produk (Recall)', modul: 'Post-Market Surveillance', kategori: 'operasional' },

  // HRD & HRIS
  { key: 'pelatihan', label: 'Jadwal Pelatihan Personil', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'sertifikasi_pegawai', label: 'Sertifikasi Kompetensi Staf', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_karyawan', label: 'Data Karyawan HRIS', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_grading', label: 'Struktur Grading Jabatan', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_mutasi', label: 'Riwayat Mutasi Karyawan', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_shift', label: 'Jadwal Shift Kerja', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_absensi', label: 'Log Absensi Kehadiran', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_lembur', label: 'Perhitungan Lembur', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_slip_gaji', label: 'Riwayat Slip Gaji', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_ats', label: 'Kandidat Rekrutmen (ATS)', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_skill_matrix', label: 'Matriks Kompetensi', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_kpi', label: 'KPI Karyawan', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_umpan_balik_360', label: 'Umpan Balik 360', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_insiden_k3', label: 'Laporan Insiden K3 / HSE', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_mcu', label: 'Rekam Medical Check-Up (MCU)', modul: 'HRD & HRIS', kategori: 'operasional' },
  { key: 'hris_apd', label: 'Distribusi APD', modul: 'HRD & HRIS', kategori: 'operasional' },

  // Finance & Audit Trail
  { key: 'transaksi', label: 'Faktur & Piutang/Hutang', modul: 'Finance & Accounting', kategori: 'operasional' },
  { key: 'keuangan_valuasi_batch', label: 'Valuasi Dasar Biaya Batch', modul: 'Finance & Accounting', kategori: 'operasional' },
  { key: 'keuangan_jurnal', label: 'Jurnal Umum & Buku Besar (Hash Chain)', modul: 'Finance & Accounting', kategori: 'operasional', rantaiHash: true },
  { key: 'audit_trail', label: 'Jejak Audit Trail Sistem', modul: 'IT & Traceability', kategori: 'operasional' },

  // Master Sistem (Dipertahankan saat purge dummy)
  { key: 'keuangan_coa', label: 'Bagan Akun Standar (CoA)', modul: 'Finance & Accounting', kategori: 'master_sistem' },
  { key: 'keuangan_periode', label: 'Periode Buku Akuntansi', modul: 'Finance & Accounting', kategori: 'master_sistem' },
  { key: 'keuangan_tetapan_pajak', label: 'Tetapan Tarif Pajak (PPN/PPh/PIB)', modul: 'Finance & Accounting', kategori: 'master_sistem' },
  { key: 'gudang_pengaturan', label: 'Konfigurasi Ambang & Endpoint Gudang', modul: 'Gudang & Logistik', kategori: 'master_sistem' },
  { key: 'surat_pengaturan', label: 'Konfigurasi Pengirim Newsletter', modul: 'Newsletter & Mailing', kategori: 'master_sistem' },

  // Konfigurasi User (Dipertahankan 100% saat purge dummy)
  { key: 'website_draft', label: 'Draf Situs Web Publik', modul: 'Website & CMS', kategori: 'konfigurasi_user' },
  { key: 'website_published', label: 'Situs Web Terbit', modul: 'Website & CMS', kategori: 'konfigurasi_user' },
  { key: 'website_media_v1', label: 'Galeri Media Website', modul: 'Website & CMS', kategori: 'konfigurasi_user' },
  { key: 'quotation_identitas_v1', label: 'Identitas Kop Quotation', modul: 'Sales & Marketing', kategori: 'konfigurasi_user' },
  { key: 'quotation_riwayat_v1', label: 'Riwayat Dokumen Quotation', modul: 'Sales & Marketing', kategori: 'konfigurasi_user' },
  { key: 'catalog_settings_v1', label: 'Pengaturan e-Katalog PDF Internal', modul: 'Sales & Marketing', kategori: 'konfigurasi_user' }
] as const;

export const PETA_KATALOG_KOLEKSI = new Map<string, DefinisiKoleksiData>(
  KATALOG_KOLEKSI_DATA.map((d) => [d.key, d])
);

const INITIAL_SEEDS_MAP: Record<string, unknown[]> = {
  izin_edar: INITIAL_IZIN_EDAR,
  sertifikat: INITIAL_SERTIFIKAT,
  dokumen_mutu: INITIAL_DOKUMEN_MUTU,
  capa: INITIAL_CAPA,
  produk_kembalian: INITIAL_PRODUK_KEMBALIAN,
  inspeksi_qc: INITIAL_INSPEKSI_QC,
  stok_gudang: INITIAL_STOK_GUDANG,
  log_suhu: INITIAL_LOG_SUHU,
  pest_control: INITIAL_PEST_CONTROL,
  gudang_unit: INITIAL_GUDANG_FISIK,
  gudang_bin: INITIAL_LOKASI_BIN,
  gudang_aturan_simpan: INITIAL_ATURAN_SIMPAN,
  gudang_pergerakan: INITIAL_JEJAK_PERGERAKAN,
  gudang_penerimaan: INITIAL_TERIMA_BARANG,
  gudang_surat_jalan: INITIAL_SURAT_JALAN,
  gudang_opname: INITIAL_OPNAME_STOK,
  gudang_ambang: INITIAL_AMBANG_STOK,
  gudang_scanner: INITIAL_KEJADIAN_SCANNER,
  gudang_lkpp_sync: INITIAL_SINKRONISASI_LKPP,
  gudang_satusehat: INITIAL_KIRIMAN_SATU_SEHAT,
  layanan_teknis: INITIAL_LAYANAN_TEKNIS,
  bets_produksi: INITIAL_BETS_PRODUKSI,
  pemasok: INITIAL_PEMASOK,
  purchase_order: INITIAL_PURCHASE_ORDER,
  penjualan: INITIAL_PENJUALAN,
  laporan_ktd: INITIAL_LAPORAN_KTD,
  penarikan_produk: INITIAL_RECALL,
  pelatihan: INITIAL_PELATIHAN,
  sertifikasi_pegawai: INITIAL_SERTIFIKASI_PEGAWAI,
  hris_karyawan: INITIAL_KARYAWAN_HRIS,
  hris_grading: INITIAL_GRADING_JABATAN,
  hris_mutasi: INITIAL_RIWAYAT_MUTASI,
  hris_shift: INITIAL_JADWAL_SHIFT,
  hris_absensi: INITIAL_ABSENSI,
  hris_lembur: INITIAL_LEMBUR,
  hris_slip_gaji: INITIAL_SLIP_GAJI,
  hris_ats: INITIAL_KANDIDAT_ATS,
  hris_skill_matrix: INITIAL_SKILL_MATRIX,
  hris_kpi: INITIAL_KPI_KARYAWAN,
  hris_umpan_balik_360: INITIAL_UMPAN_BALIK_360,
  hris_insiden_k3: INITIAL_INSIDEN_K3,
  hris_mcu: INITIAL_REKAM_MCU,
  hris_apd: INITIAL_DISTRIBUSI_APD,
  sales_pelanggan: INITIAL_PELANGGAN_B2B,
  sales_prospek: INITIAL_PROSPEK_ALKES,
  sales_teritorial: INITIAL_TERITORIAL_PENJUALAN,
  sales_tender: INITIAL_TENDER_ALKES,
  sales_kontrak: INITIAL_KONTRAK_HARGA,
  sales_kunjungan: INITIAL_KUNJUNGAN_MEDREP,
  sales_pengetahuan_produk: INITIAL_PENGETAHUAN_PRODUK,
  sales_pra_order: INITIAL_PRA_ORDER_MEDREP,
  sales_skema_harga: INITIAL_SKEMA_HARGA,
  sales_unit_serial: INITIAL_UNIT_SERIAL,
  sales_garansi: INITIAL_GARANSI_INSTALASI,
  sales_kampanye: INITIAL_KAMPANYE_ALKES,
  sales_unit_demo: INITIAL_UNIT_DEMO_ALKES,
  sales_rebate: INITIAL_PROGRAM_REBATE,
  sales_riwayat_bulanan: INITIAL_RIWAYAT_PENJUALAN_BULANAN,
  surat_daftar: INITIAL_DAFTAR_SURAT,
  surat_subscriber: INITIAL_PELANGGAN_SURAT,
  surat_kampanye: INITIAL_KAMPANYE_SURAT,
  surat_templat: INITIAL_TEMPLAT_SURAT,
  surat_media: INITIAL_MEDIA_SURAT,
  surat_tx: INITIAL_PESAN_TRANSAKSIONAL,
  transaksi: INITIAL_TRANSAKSI,
  keuangan_valuasi_batch: INITIAL_VALUASI_BATCH,
  keuangan_jurnal: INITIAL_JURNAL_KEUANGAN,
  audit_trail: INITIAL_AUDIT_TRAIL
};

export function rekamKunci(key: string, item: unknown): string {
  if (!item || typeof item !== 'object') return String(item);
  const obj = item as Record<string, unknown>;
  if (key === 'keuangan_valuasi_batch') {
    return `${String(obj.nomorBatch ?? '')}|${String(obj.kodeSKU ?? '')}`;
  }
  if (typeof obj.id === 'string' && obj.id) return obj.id;
  if (typeof obj.kode === 'string' && obj.kode) return obj.kode;
  return JSON.stringify(obj);
}

/** Normalisasi item untuk membandingkan apakah catatan seed telah diubah oleh pengguna. */
function normalisasiUntukBanding(key: string, item: unknown): string {
  if (!item || typeof item !== 'object') return JSON.stringify(item);
  if (key === 'gudang_bin') {
    const { terpakai: _terpakai, ...sisa } = item as Record<string, unknown>;
    return JSON.stringify(sisa);
  }
  return JSON.stringify(item);
}

interface IndeksSeedKoleksi {
  ids: Set<string>;
  snapshots: Map<string, string>;
}

const INDEKS_SEED = new Map<string, IndeksSeedKoleksi>();
for (const [key, items] of Object.entries(INITIAL_SEEDS_MAP)) {
  const ids = new Set<string>();
  const snapshots = new Map<string, string>();
  for (const item of items) {
    const kunci = rekamKunci(key, item);
    ids.add(kunci);
    snapshots.set(kunci, normalisasiUntukBanding(key, item));
  }
  INDEKS_SEED.set(key, { ids, snapshots });
}

export type AsalRekaman = 'dummy' | 'user-diedit' | 'user-baru';

export function tentukanAsalRekaman(
  key: string,
  item: unknown,
  manifest: ManifestAsalData
): AsalRekaman {
  const kunci = rekamKunci(key, item);
  const indeks = INDEKS_SEED.get(key);
  const editedSet = new Set(manifest.userEditedIds[key] || []);

  if (key === 'audit_internal_iso') {
    const seededSet = new Set(manifest.seededAuditIds || []);
    if (!seededSet.has(kunci)) {
      // Catatan audit otomatis saat initial seed ditandai di manifest; bila belum terekam,
      // deteksi dari flag dibuatSecaraOtomatis pada id bawaan bila manifest lama kosong.
      return editedSet.has(kunci) ? 'user-diedit' : 'user-baru';
    }
    return editedSet.has(kunci) ? 'user-diedit' : 'dummy';
  }

  if (key === 'keuangan_valuasi_batch') {
    const obj = item as { asal?: string };
    if (indeks?.ids.has(kunci)) {
      if (obj?.asal === 'USER' || editedSet.has(kunci)) return 'user-diedit';
      const snap = indeks.snapshots.get(kunci);
      if (snap && snap !== normalisasiUntukBanding(key, item)) return 'user-diedit';
      return 'dummy';
    }
    return obj?.asal === 'DUMMY' ? 'dummy' : 'user-baru';
  }

  if (!indeks || !indeks.ids.has(kunci)) {
    return 'user-baru';
  }

  if (editedSet.has(kunci)) {
    return 'user-diedit';
  }

  const snap = indeks.snapshots.get(kunci);
  if (snap && snap !== normalisasiUntukBanding(key, item)) {
    return 'user-diedit';
  }

  return 'dummy';
}

/** Deteksi ID seed yang kontennya dimodifikasi saat pengguna menyimpan koleksi. */
export function kumpulkanIdSeedDiedit(
  key: string,
  items: unknown[],
  sudahTercatat: readonly string[] = []
): string[] {
  const indeks = INDEKS_SEED.get(key);
  const hasil = new Set<string>(sudahTercatat);
  if (!indeks) return Array.from(hasil);

  for (const item of items) {
    const kunci = rekamKunci(key, item);
    if (!indeks.ids.has(kunci)) continue;
    const snap = indeks.snapshots.get(kunci);
    if (snap && snap !== normalisasiUntukBanding(key, item)) {
      hasil.add(kunci);
    }
  }
  return Array.from(hasil);
}

export interface RingkasanAsalKoleksi {
  key: string;
  label: string;
  modul: string;
  kategori: KategoriPenyimpananData;
  total: number;
  dummy: number;
  userBaru: number;
  userDiedit: number;
  strukturGudang: boolean;
}

export function hitungRingkasanAsalKoleksi(
  key: string,
  items: unknown[],
  manifest: ManifestAsalData
): RingkasanAsalKoleksi {
  const def = PETA_KATALOG_KOLEKSI.get(key) ?? {
    key,
    label: key,
    modul: 'Lainnya',
    kategori: 'operasional' as const
  };
  let dummy = 0;
  let userBaru = 0;
  let userDiedit = 0;
  for (const item of items) {
    const asal = tentukanAsalRekaman(key, item, manifest);
    if (asal === 'dummy') dummy += 1;
    else if (asal === 'user-diedit') userDiedit += 1;
    else userBaru += 1;
  }
  return {
    key,
    label: def.label,
    modul: def.modul,
    kategori: def.kategori,
    total: items.length,
    dummy,
    userBaru,
    userDiedit,
    strukturGudang: Boolean(def.strukturGudang)
  };
}

export interface OpsiSaringDataUser {
  pertahankanEditUser: boolean;
  pertahankanStrukturGudang?: boolean;
}

export function saringHanyaDataUser<T>(
  key: string,
  items: T[],
  manifest: ManifestAsalData,
  opsi: OpsiSaringDataUser = { pertahankanEditUser: true }
): T[] {
  const def = PETA_KATALOG_KOLEKSI.get(key);
  if (!def || def.kategori !== 'operasional') return items;
  if (opsi.pertahankanStrukturGudang && def.strukturGudang) {
    return items;
  }

  return items.filter((item) => {
    const asal = tentukanAsalRekaman(key, item, manifest);
    if (asal === 'user-baru') return true;
    if (asal === 'user-diedit') return opsi.pertahankanEditUser;
    return false;
  });
}

/**
 * Sambung ulang rantai hash `gudang_pergerakan` mulai dari GENESIS (64 nol) setelah
 * catatan dummy sebelum data user dibuang saat purge. Menjaga `verifikasiRantaiHash()`
 * tetap 100% utuh atas data riil pengguna.
 */
export function bangunUlangRantaiPergerakan(items: JejakPergerakan[]): JejakPergerakan[] {
  if (items.length === 0) return [];
  const GENESIS = '0'.repeat(64);
  const hasil: JejakPergerakan[] = [];
  let sebelumnya = GENESIS;
  for (const baris of items) {
    const bersih: JejakPergerakan = {
      ...baris,
      hashSebelum: sebelumnya,
      hash: ''
    };
    bersih.hash = hashPergerakan(bersih, sebelumnya);
    sebelumnya = bersih.hash;
    hasil.push(bersih);
  }
  return hasil;
}

/**
 * Sambung ulang rantai hash `keuangan_jurnal` mulai dari `GENESIS_JURNAL` setelah
 * catatan jurnal dummy dibuang saat purge. Menjaga `verifikasiRantaiJurnal()` utuh.
 */
export function bangunUlangRantaiJurnal(items: JurnalKeuangan[]): JurnalKeuangan[] {
  if (items.length === 0) return [];
  const hasil: JurnalKeuangan[] = [];
  let sebelumnya = GENESIS_JURNAL;
  for (const j of items) {
    const rancangan = {
      id: j.id,
      nomorJournal: j.nomorJournal,
      tanggalTransaksi: j.tanggalTransaksi,
      periode: j.periode,
      sumberRujukan: j.sumberRujukan,
      idRujukan: j.idRujukan,
      uraian: j.uraian,
      baris: j.baris,
      status: j.status,
      dibuatOleh: j.dibuatOleh,
      peranPembuat: j.peranPembuat,
      tanggalPosting: j.tanggalPosting,
      jurnalAsalDibalik: j.jurnalAsalDibalik
    };
    const hashBaru = hashJurnal(rancangan, sebelumnya);
    hasil.push({
      ...j,
      hashSebelum: sebelumnya,
      hash: hashBaru
    });
    sebelumnya = hashBaru;
  }
  return hasil;
}
