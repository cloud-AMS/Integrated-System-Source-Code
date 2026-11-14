/**
 * Registry benih (seed) & provenance data.
 *
 * Satu-satunya sumber kebenaran tentang rekaman mana yang merupakan data dummy
 * bawaan development. Server memakai registry ini untuk menyemai basis data
 * sekali saat bootstrap, dan untuk mempurge data dummy ketika go-live.
 *
 * Provenance ditandai pada field `__sumberData` sehingga data dummy terpisah
 * tegas dari data yang diinput pengguna (tanpa penanda = data user). Konstanta
 * INITIAL_* tidak dimutasi agar tes dan utilitas domain tetap menerima benih murni.
 */
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
  INITIAL_KIRIMAN_SATU_SEHAT,
  INITIAL_TRANSAKSI,
  INITIAL_AUDIT_TRAIL
} from './initialData';
import {
  INITIAL_COA,
  INITIAL_JURNAL_KEUANGAN,
  INITIAL_PERIODE_BUKU,
  INITIAL_TETAPAN_PAJAK,
  INITIAL_VALUASI_BATCH
} from './seedKeuangan';
import { AKUN_BAWAAN_SISTEM, ROLE_BAWAAN_SISTEM } from '../utils/hakAkses';
import {
  auditOtomatisDokumenQA,
  auditOtomatisDokumenQC
} from '../utils/auditInternalIso13485';

/** Field provenance yang dibawa setiap rekaman dummy melewati JSON/localStorage/server. */
export const PENANDA_SUMBER = '__sumberData' as const;

export type SumberData = 'dummy' | 'user';

/** Salin dangkal tiap rekaman lalu beri penanda dummy. Tidak mengubah array asli. */
export function tandaiDummy<T>(items: T[]): T[] {
  return items.map((item) => ({ ...item, [PENANDA_SUMBER]: 'dummy' })) as T[];
}

export function adalahDummy(rec: unknown): boolean {
  return (
    !!rec &&
    typeof rec === 'object' &&
    (rec as Record<string, unknown>)[PENANDA_SUMBER] === 'dummy'
  );
}

/** Buang seluruh rekaman dummy, sisakan data user (tanpa penanda). */
export function saringDummy<T>(items: T[]): T[] {
  return items.filter((item) => !adalahDummy(item));
}

/**
 * Benih dummy mentah per kunci sync. `audit_internal_iso` diturunkan dari benih
 * dokumen mutu/QC/stok agar tampilan audit demo tetap tersedia sebelum dipurge.
 */
const BENIH_DUMMY: Record<string, unknown[]> = {
  izin_edar: INITIAL_IZIN_EDAR,
  sertifikat: INITIAL_SERTIFIKAT,
  dokumen_mutu: INITIAL_DOKUMEN_MUTU,
  capa: INITIAL_CAPA,
  produk_kembalian: INITIAL_PRODUK_KEMBALIAN,
  inspeksi_qc: INITIAL_INSPEKSI_QC,
  audit_internal_iso: [
    auditOtomatisDokumenQA(INITIAL_DOKUMEN_MUTU, INITIAL_CAPA, INITIAL_PRODUK_KEMBALIAN),
    auditOtomatisDokumenQC(INITIAL_INSPEKSI_QC, INITIAL_STOK_GUDANG)
  ],
  stok_gudang: INITIAL_STOK_GUDANG,
  log_suhu: INITIAL_LOG_SUHU,
  pest_control: INITIAL_PEST_CONTROL,
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
  transaksi: INITIAL_TRANSAKSI,
  keuangan_coa: INITIAL_COA,
  keuangan_valuasi_batch: INITIAL_VALUASI_BATCH,
  keuangan_periode: INITIAL_PERIODE_BUKU,
  keuangan_tetapan_pajak: INITIAL_TETAPAN_PAJAK,
  keuangan_jurnal: INITIAL_JURNAL_KEUANGAN,
  audit_trail: INITIAL_AUDIT_TRAIL
};

/** Benih dummy yang sudah bertanda provenance — siap ditulis server saat bootstrap. */
export const SEED_DUMMY: Record<string, unknown[]> = Object.fromEntries(
  Object.entries(BENIH_DUMMY).map(([kunci, arr]) => [kunci, tandaiDummy(arr)])
);

/**
 * Seed sistem (bukan dummy bisnis): role & akun bawaan RBAC. Tidak ikut dipurge
 * agar aplikasi tetap berfungsi setelah go-live; dikelola lewat modul User & Roles.
 */
export const SEED_SISTEM: Record<string, unknown[]> = {
  rb_role: ROLE_BAWAAN_SISTEM,
  rb_akun: AKUN_BAWAAN_SISTEM
};

/**
 * Kumpulan id benih dummy per kunci. Dipakai sebagai jaring pengaman untuk
 * rekaman lama yang belum bertanda (mis. terlanjur tersinkron sebelum fitur ini).
 */
export const SEED_IDS_DUMMY: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(BENIH_DUMMY).map(([kunci, arr]) => [
    kunci,
    new Set(
      arr
        .map((r) => (r as { id?: string }).id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  ])
);