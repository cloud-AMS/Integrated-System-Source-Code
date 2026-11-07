import {
  Badge,
  BarCapaian,
  Modal,
  Panel,
  Stat,
  chipFilter,
  formatPersen,
  formatRupiah,
  formatTanggal,
  inputClass,
  labelClass,
  tombolBahaya,
  tombolPrimer,
  tombolSekunder,
  type Tone
} from '../../commercial/sales/ui';
import type { JurnalKeuangan, PeriodeBuku, UserRole } from '../../../../types';
import { nomorJournalUntuk } from '../../../../utils/akuntansi';

export {
  Badge,
  BarCapaian,
  Modal,
  Panel,
  Stat,
  chipFilter,
  formatPersen,
  formatRupiah,
  formatTanggal,
  inputClass,
  labelClass,
  tombolBahaya,
  tombolPrimer,
  tombolSekunder,
  type Tone
};

export type FinanceTabId = 'dasbor' | 'jurnal' | 'laporan' | 'persediaan' | 'pajak' | 'faktur' | 'periode';

export const TAB_NOMOR_KE_ID: Record<number, FinanceTabId> = {
  1: 'dasbor',
  2: 'jurnal',
  3: 'laporan',
  4: 'persediaan',
  5: 'pajak',
  6: 'faktur',
  7: 'periode'
};

export interface IdentitasFinance {
  pengguna: string;
  peran: string;
  /** Posting jurnal umum dan tutup buku adalah hak akuntansi: PJT dan Manajer QA. */
  bolehPosting: boolean;
  /** Karantina/write-off berasal dari operasional, jadi boleh diajukan tanpa hak posting. */
  bolehAjukanWriteOff: boolean;
}

export function identitasPeranFinance(role: UserRole): IdentitasFinance {
  switch (role) {
    case 'pjt':
      return { pengguna: 'apt. Dewi Kartika, S.Si', peran: 'Penanggung Jawab Teknis', bolehPosting: true, bolehAjukanWriteOff: true };
    case 'qa_manager':
      return { pengguna: 'Budi Utomo, S.T', peran: 'QA Manager', bolehPosting: true, bolehAjukanWriteOff: true };
    case 'qc_officer':
      return { pengguna: 'Hendra Setiawan', peran: 'Lead QC', bolehPosting: false, bolehAjukanWriteOff: true };
    case 'kepala_gudang':
      return { pengguna: 'Ahmad Fauzi', peran: 'Kepala Gudang CDAKB', bolehPosting: false, bolehAjukanWriteOff: true };
    case 'purchasing':
      return { pengguna: 'Dewi Anggraini', peran: 'Purchasing', bolehPosting: false, bolehAjukanWriteOff: false };
    case 'sales_manager':
      return { pengguna: 'Farhan Maulana', peran: 'Sales Manager', bolehPosting: false, bolehAjukanWriteOff: false };
    case 'manajer_produksi':
      return { pengguna: 'Ir. Agus Santoso', peran: 'Manajer Produksi CPAKB', bolehPosting: false, bolehAjukanWriteOff: true };
    case 'it_admin':
      return { pengguna: 'Admin IT & Hub', peran: 'IT & Traceability', bolehPosting: false, bolehAjukanWriteOff: false };
    default:
      return { pengguna: 'Pengguna Sistem', peran: 'Pengunjung', bolehPosting: false, bolehAjukanWriteOff: false };
  }
}

export const labelAkunSingkat = (kode: string, nama: string) => `${kode} · ${nama}`;

/** Warna baris jurnal: Posted hijau, Draft kuning, Void merah — seragam di semua tab. */
export const toneStatusJurnal = (status: JurnalKeuangan['status']): Tone =>
  status === 'Posted' ? 'emerald' : status === 'Draft' ? 'amber' : 'rose';

export const toneStatusPeriode = (status: PeriodeBuku['status']): Tone =>
  status === 'Terbuka' ? 'emerald' : status === 'Dikunci' ? 'amber' : 'blue';

export const totalSisi = (jurnal: JurnalKeuangan, sisi: 'debit' | 'kredit') =>
  jurnal.baris.reduce((akum, baris) => akum + baris[sisi], 0);

/** Nomor jurnal periode berjalan: JV-YYYYMM-NNNN. Diambil dari jumlah jurnal pada periode
 *  yang sama, bukan dari panjang daftar, supaya nomor tidak melompat saat ada void. */
export function nomorJurnalBerikutnya(daftar: JurnalKeuangan[], tanggal: string) {
  const periode = tanggal.slice(0, 7);
  const sudah = daftar.filter((j) => j.periode === periode || j.tanggalTransaksi.startsWith(periode)).length;
  return nomorJournalUntuk(periode, sudah + 1);
}

export const pesanClass = (tipe: 'sukses' | 'galat'): string =>
  tipe === 'sukses'
    ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900'
    : 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900';

/** Tabel kecil khas modul: header abu, baris bergaris, teks ekstra kecil. */
export const tabelKelas = 'w-full text-xs text-left';
export const kepalaTabelKelas = 'bg-slate-100 text-slate-700 border-b border-slate-200';
export const selKelas = 'py-2.5 px-3';
