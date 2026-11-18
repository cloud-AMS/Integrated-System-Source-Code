import type { AksesEfektif, ModuleNavId } from '../types';

export const SEMUA_ID_MODUL: ModuleNavId[] = [
  'overview',
  'website',
  'ra-pjt',
  'qa-mutu',
  'qc-inspeksi',
  'pms-vigilance',
  'gudang-logistik',
  'teknisi-service',
  'produksi-cpakb',
  'purchasing-procurement',
  'sales-marketing',
  'hrd-pelatihan',
  'finance-akuntansi',
  'it-traceability'
];

export function bolehAksesModul(
  modulId: ModuleNavId,
  akses: Pick<AksesEfektif, 'aksesPenuh' | 'modulDiizinkan'>
): boolean {
  return akses.aksesPenuh || akses.modulDiizinkan.includes(modulId);
}
