/** Helper khusus modul Gudang & Logistik. Primitif tampilan (Badge, Panel, Stat, Modal, dll)
 *  ada di src/components/ui — jangan membuat ulang di sini. */
import { JejakPergerakan, StatusStokFisik, UserRole } from '../../../../types';
import type { Tone } from '../../../ui';

export type GudangTabId =
  | 'dasbor'
  | 'struktur'
  | 'stok'
  | 'rantai-dingin'
  | 'hama'
  | 'inbound'
  | 'outbound'
  | 'opname'
  | 'optimasi'
  | 'scanner'
  | 'recall'
  | 'pemerintah';

export const TAB_NOMOR_KE_ID: Record<number, GudangTabId> = {
  1: 'dasbor',
  2: 'struktur',
  3: 'stok',
  4: 'rantai-dingin',
  5: 'hama',
  6: 'inbound',
  7: 'outbound',
  8: 'opname',
  9: 'optimasi',
  10: 'scanner',
  11: 'recall',
  12: 'pemerintah'
};

/** Tanggal acuan benih (M3/M4 kontrak) agar batch 2024–2025 tidak dinilai kedaluwarsa oleh jam sistem 2026. */
export const TANGGAL_ACUAN_BENIH = '2024-06-15';

export function buatTanggalAcuan(isoTanggal: string): Date {
  const parsed = new Date(`${isoTanggal}T08:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date('2024-06-15T08:00:00') : parsed;
}

/** Menjamin stempel waktu mutasi pergerakan tidak pernah mundur dari mata rantai terakhir (menjaga sha256 chain). */
export function waktuMutasiMonoton(dariAcuan: Date, daftarPergerakan: JejakPergerakan[]): Date {
  let maks = dariAcuan.getTime();
  if (daftarPergerakan.length > 0) {
    const terakhir = daftarPergerakan[daftarPergerakan.length - 1];
    const parsed = Date.parse(terakhir.waktu.replace(' ', 'T'));
    if (!Number.isNaN(parsed) && parsed >= maks) {
      maks = parsed + 60_000;
    }
  }
  return new Date(maks);
}

export function identitasPeranGudang(role: UserRole): {
  pengguna: string;
  peran: string;
  bolehVerifikasiPjt: boolean;
} {
  switch (role) {
    case 'pjt':
      return { pengguna: 'Apt. Sari Dewi, S.Farm (PJT)', peran: 'Penanggung Jawab Teknis', bolehVerifikasiPjt: true };
    case 'qa_manager':
      return { pengguna: 'Manajer QA & Mutu', peran: 'Quality Assurance', bolehVerifikasiPjt: true };
    case 'qc_officer':
      return { pengguna: 'Inspektur QC Gudang', peran: 'Quality Control', bolehVerifikasiPjt: false };
    case 'kepala_gudang':
      return { pengguna: 'Kepala Gudang CDAKB', peran: 'Operations & Technical', bolehVerifikasiPjt: false };
    case 'teknisi_elektromedik':
      return { pengguna: 'Teknisi Elektromedik', peran: 'Operations & Technical', bolehVerifikasiPjt: false };
    case 'purchasing':
      return { pengguna: 'Staf Pengadaan Alkes', peran: 'Purchasing & Procurement', bolehVerifikasiPjt: false };
    case 'auditor_internal':
      return { pengguna: 'Auditor Mutu Internal', peran: 'Regulatory Affairs', bolehVerifikasiPjt: false };
    default:
      return { pengguna: 'Kepala Gudang', peran: 'Operations & Technical', bolehVerifikasiPjt: false };
  }
}

export function toneStatusStok(status?: StatusStokFisik): Tone {
  switch (status ?? 'AVAILABLE') {
    case 'AVAILABLE':
      return 'emerald';
    case 'RESERVED':
      return 'blue';
    case 'QUARANTINE':
      return 'amber';
    case 'DAMAGED':
    case 'EXPIRED_LOCK':
      return 'rose';
  }
}
