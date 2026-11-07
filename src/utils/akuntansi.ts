import type {
  AkunCoA,
  IzinEdarAlkes,
  JurnalBaris,
  JurnalKeuangan,
  KelompokLaporan,
  PelangganB2B,
  PenarikanProduk,
  PusatBiayaId,
  PeriodeBuku,
  StatusJurnal,
  StatusSuratJalan,
  StokGudang,
  TransaksiKeuangan,
  ValuasiBatch
} from '../types';
import { sha256Hex, statusUnitStok } from './gudang';
import { validasiIzinOperasionalFasyankes, validasiNomorIzinEdar } from './sales';

/**
 * Mesin pembukuan dua-entry untuk modul Finance & Accounting.
 *
 * Dua penyimpangan dari blueprint yang beredar di tim proyek, dan alasannya:
 *
 * 1. PPh 22 impor TIDAK dikapitalisasi ke persediaan. Blueprint menuliskan "PPh 22 ...
 *    langsung ke dalam HPP (Landed Cost)". Bagi importir ber-API, PPh 22 adalah uang muka
 *    pajak yang dapat dikreditkan, bukan biaya perolehan; memasukkannya ke HPP membesarkan
 *    nilai persediaan sekaligus menghilangkan kredit pajak. Yang dikapitalisasi: FOB, angkut,
 *    asuransi, bea masuk, dan PDB. PPN impor menjadi PPN Masukan.
 *
 * 2. Jurnal yang sudah Posted tidak pernah di-UPDATE. Koreksi dibuat dengan jurnal pembalik
 *    lalu jurnal baru, sehingga jejak audit ISO 13485 tetap lengkap.
 *
 * Semua nominal rupiah bulat. Tidak ada toleransi `|debit - kredit| < 0.001`: keseimbangan
 * diuji dengan kesamaan persis dan pembulatan terjadi satu kali per baris.
 */

export const GENESIS_JURNAL = '0'.repeat(64);

/** Akun dirujuk lewat konstanta ini, bukan string lepas, supaya pemetaan laporan ikut rusak
 *  terdengar saat kode CoA berubah. */
export const KODE_AKUN = {
  KAS: '1110',
  PERSEDIAAN_ALKES: '1120',
  PERSEDIAAN_KARANTINA: '1121',
  PERSEDIAAN_SUKU_CADANG: '1122',
  CADANGAN_PENURUNAN_NILAI: '1129',
  PIUTANG_DAGANG: '1130',
  PPN_MASUKAN: '1140',
  UANG_MUKA_PPH22: '1150',
  PIUTANG_PPN_LEBIH_BAYAR: '1160',
  PPN_KELUARAN: '2110',
  HUTANG_USAHA: '2120',
  HUTANG_PPN: '2130',
  MODAL_DISETOR: '3110',
  LABA_DITAHAN: '3210',
  PENDAPATAN_ALKES: '4110',
  PENDAPATAN_JASA: '4120',
  HPP_ALKES: '5110',
  BEBAN_KERUGIAN_PERSEDIAAN: '5120',
  BEBAN_KALIBRASI: '5210',
  BEBAN_AUDIT_MUTU: '5220',
  BEBAN_RETUR_MUTU: '5230',
  BEBAN_UMUM: '5310'
} as const;

export type SebabWriteOff = 'Kedaluwarsa' | 'Rusak' | 'Karantina' | 'Recall';

export interface PenyimpanganJurnal {
  kode: string;
  jenis: 'Jumlah Baris' | 'Nominal' | 'Akun' | 'Keseimbangan' | 'Periode';
  keterangan: string;
}

export interface HasilKeseimbangan {
  seimbang: boolean;
  totalDebit: number;
  totalKredit: number;
  selisih: number;
  penyimpangan: PenyimpanganJurnal[];
}

export type RancanganJurnal = Omit<JurnalKeuangan, 'hashSebelum' | 'hash' | 'id'> & { id?: string };

const bulat = (nilai: number) => Math.round(nilai);

export function periodeDari(tanggal: string) {
  return tanggal.slice(0, 7);
}

export function nomorJournalUntuk(periode: string, urutan: number) {
  return `JV-${periode.replace('-', '')}-${String(urutan).padStart(4, '0')}`;
}

function tandaBaris(baris: JurnalBaris) {
  return [
    baris.akunKode,
    String(baris.debit),
    String(baris.kredit),
    baris.nomorBatch ?? '-',
    baris.pusatBiayaId ?? '-',
    baris.keterangan ?? '-'
  ].join(':');
}

/** Baris disortir sebelum di-hash agar urutan input tidak mengubah tanda tangan jurnal. */
function barisKanonik(baris: JurnalBaris[]) {
  return [...baris].sort((a, b) => tandaBaris(a).localeCompare(tandaBaris(b))).map(tandaBaris).join(';');
}

export function validasiKeseimbanganJurnal(baris: JurnalBaris[], daftarAkun: AkunCoA[]): HasilKeseimbangan {
  const penyimpangan: PenyimpanganJurnal[] = [];
  const dikenal = new Map(daftarAkun.map((a) => [a.kode, a]));

  if (baris.length < 2) {
    penyimpangan.push({
      kode: '-',
      jenis: 'Jumlah Baris',
      keterangan: `Jurnal dua-entry membutuhkan minimal 2 baris, diterima ${baris.length}`
    });
  }

  let totalDebit = 0;
  let totalKredit = 0;

  baris.forEach((satu, indeks) => {
    const label = satu.akunKode || `baris-${indeks + 1}`;
    if (!Number.isInteger(satu.debit) || !Number.isInteger(satu.kredit)) {
      penyimpangan.push({ kode: label, jenis: 'Nominal', keterangan: 'Debit/kredit harus rupiah bulat' });
    }
    if (satu.debit < 0 || satu.kredit < 0) {
      penyimpangan.push({ kode: label, jenis: 'Nominal', keterangan: 'Debit/kredit tidak boleh negatif' });
    }
    const sisiBerpengaruh = (satu.debit > 0 ? 1 : 0) + (satu.kredit > 0 ? 1 : 0);
    if (sisiBerpengaruh !== 1) {
      penyimpangan.push({
        kode: label,
        jenis: 'Nominal',
        keterangan: `Baris harus punya tepat satu sisi bernilai > 0 (debit ${satu.debit}, kredit ${satu.kredit})`
      });
    }
    const akun = dikenal.get(satu.akunKode);
    if (!akun) {
      penyimpangan.push({ kode: label, jenis: 'Akun', keterangan: `Kode akun ${satu.akunKode} tidak ada di CoA` });
    } else if (!akun.aktif) {
      penyimpangan.push({ kode: label, jenis: 'Akun', keterangan: `Kode akun ${satu.akunKode} tidak aktif` });
    }
    totalDebit += bulat(satu.debit);
    totalKredit += bulat(satu.kredit);
  });

  if (totalDebit !== totalKredit) {
    penyimpangan.push({
      kode: '-',
      jenis: 'Keseimbangan',
      keterangan: `Total debit ${totalDebit.toLocaleString('id-ID')} tidak sama dengan total kredit ${totalKredit.toLocaleString('id-ID')} (selisih ${Math.abs(totalDebit - totalKredit).toLocaleString('id-ID')})`
    });
  }

  return { seimbang: penyimpangan.length === 0, totalDebit, totalKredit, selisih: totalDebit - totalKredit, penyimpangan };
}

export interface HasilGerbangPeriode {
  boleh: boolean;
  periode: string;
  terdaftar: boolean;
  sebab: string[];
}

/** Periode yang belum terdaftar diperlakukan Terbuka agar modul berjalan sebelum master periode
 *  diisi, tetapi ditandai `terdaftar: false` supaya tidak bisa diklaim terkunci tutup buku. */
export function gerbangPeriodeBuku(tanggalTransaksi: string, daftarPeriode: PeriodeBuku[]): HasilGerbangPeriode {
  const periode = periodeDari(tanggalTransaksi);
  const baris = daftarPeriode.find((p) => p.id === periode);
  if (!baris) return { boleh: true, periode, terdaftar: false, sebab: [] };

  const sebab: string[] = [];
  if (baris.status === 'Ditutup') sebab.push(`Periode ${baris.label} sudah ditutup${baris.alasan ? ` (${baris.alasan})` : ''}`);
  if (baris.status === 'Dikunci') sebab.push(`Periode ${baris.label} dikunci untuk tutup buku`);
  return { boleh: sebab.length === 0, periode, terdaftar: true, sebab };
}

/** Bentuk kanonik HANYA berisi isi ekonomi jurnal (nomor, tanggal, rujukan, pembuat, baris).
 *  `status` dan `tanggalPosting` sengaja tidak di-hash: keduanya marker siklus hidup yang berubah
 *  saat jurnal diposting, sedangkan rantai hash harus tetap terverifikasi setelah transisi itu.
 *  Perubahan status dicatat di log audit; koreksi angka dicatat lewat jurnal pembalik. */
export function bentukKanonikJurnal(rancangan: RancanganJurnal, hashSebelum: string) {
  return [
    rancangan.nomorJournal,
    rancangan.tanggalTransaksi,
    rancangan.sumberRujukan,
    rancangan.idRujukan,
    rancangan.dibuatOleh,
    rancangan.uraian,
    barisKanonik(rancangan.baris),
    hashSebelum
  ].join('|');
}

export function hashJurnal(rancangan: RancanganJurnal, hashSebelum: string) {
  return sha256Hex(bentukKanonikJurnal(rancangan, hashSebelum));
}

/** Menyambungkan satu rancangan ke ujung rantai. Rantai divalidasi lebih dulu agar kerusakan
 *  tidak tersamar oleh mata baru yang tampak rapi. */
export function susunJurnalBerantai(
  daftar: JurnalKeuangan[],
  rancangan: RancanganJurnal,
  opsi?: { daftarAkun?: AkunCoA[]; daftarPeriode?: PeriodeBuku[]; tolakPeriodeTertutup?: boolean }
): { jurnal: JurnalKeuangan | null; penyimpangan: PenyimpanganJurnal[] } {
  const keseimbangan = validasiKeseimbanganJurnal(
    rancangan.baris,
    opsi?.daftarAkun ?? rancangan.baris.map((b) => ({ kode: b.akunKode, nama: b.akunKode, tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true }) satisfies AkunCoA)
  );
  const penyimpangan = [...keseimbangan.penyimpangan];

  if (opsi?.tolakPeriodeTertutup) {
    const gerbang = gerbangPeriodeBuku(rancangan.tanggalTransaksi, opsi.daftarPeriode ?? []);
    if (!gerbang.boleh)
      penyimpangan.push(...gerbang.sebab.map((keterangan) => ({ kode: gerbang.periode, jenis: 'Periode' as const, keterangan })));
  }

  if (penyimpangan.length) return { jurnal: null, penyimpangan };

  const hashSebelum = daftar.length ? daftar[daftar.length - 1].hash : GENESIS_JURNAL;
  const utuh: RancanganJurnal & { id: string } = { ...rancangan, id: rancangan.id ?? `JRN-${daftar.length + 1}` };
  return { jurnal: { ...utuh, hashSebelum, hash: hashJurnal(utuh, hashSebelum) }, penyimpangan: [] };
}

/** Transisi siklus hidup tanpa menyentuh isi yang di-hash. Draft → Posted adalah satu-satunya
 *  jalan masuk laporan; Posted → Void hanya sah bila jurnal pembaliknya sudah ada. */
export function ubahStatusJurnal(
  daftar: JurnalKeuangan[],
  jurnal: JurnalKeuangan,
  statusBaru: StatusJurnal,
  opsi: { tanggal: string; daftarPeriode?: PeriodeBuku[] }
): { jurnal: JurnalKeuangan | null; penyimpangan: PenyimpanganJurnal[] } {
  const penyimpangan: PenyimpanganJurnal[] = [];
  const sah: Record<StatusJurnal, StatusJurnal[]> = { Draft: ['Posted', 'Void'], Posted: ['Void'], Void: [] };
  if (!sah[jurnal.status].includes(statusBaru))
    penyimpangan.push({
      kode: jurnal.nomorJournal,
      jenis: 'Keseimbangan',
      keterangan: `Transisi ${jurnal.status} → ${statusBaru} ditolak; hanya ${sah[jurnal.status].join('/') || 'tidak ada'} yang diizinkan`
    });
  if (statusBaru === 'Void' && !daftar.some((k) => k.jurnalAsalDibalik === jurnal.id && k.status === 'Posted'))
    penyimpangan.push({
      kode: jurnal.nomorJournal,
      jenis: 'Keseimbangan',
      keterangan: 'Jurnal Posted tidak dapat dibatalkan tanpa jurnal pembalik yang sudah di-posting (append-only)'
    });

  const gerbang = gerbangPeriodeBuku(statusBaru === 'Posted' ? opsi.tanggal : jurnal.tanggalTransaksi, opsi.daftarPeriode ?? []);
  if (!gerbang.boleh)
    penyimpangan.push(...gerbang.sebab.map((keterangan) => ({ kode: gerbang.periode, jenis: 'Periode' as const, keterangan })));

  if (penyimpangan.length) return { jurnal: null, penyimpangan };
  return {
    jurnal: {
      ...jurnal,
      status: statusBaru,
      ...(statusBaru === 'Posted' ? { tanggalPosting: opsi.tanggal } : {})
    },
    penyimpangan: []
  };
}

export interface HasilVerifikasiRantai {
  valid: boolean;
  jumlahMata: number;
  sejakGenesis: boolean;
  penyimpangan: { nomor: string; indeks: number; jenis: 'Sambungan' | 'Tanda Tangan'; keterangan: string }[];
  keterangan: string;
}

export function verifikasiRantaiJurnal(daftar: JurnalKeuangan[]): HasilVerifikasiRantai {
  const penyimpangan: HasilVerifikasiRantai['penyimpangan'] = [];
  const jangkar = daftar.length ? daftar[0].hashSebelum : GENESIS_JURNAL;
  const sejakGenesis = jangkar === GENESIS_JURNAL;

  let sebelumnya = jangkar;
  daftar.forEach((jurnal, indeks) => {
    if (jurnal.hashSebelum !== sebelumnya) {
      penyimpangan.push({
        nomor: jurnal.nomorJournal,
        indeks,
        jenis: 'Sambungan',
        keterangan: `hashSebelum ${jurnal.hashSebelum.slice(0, 12)}… tidak menyambung ke ujung ${sebelumnya.slice(0, 12)}…`
      });
    }
    const harapan = hashJurnal(jurnal, jurnal.hashSebelum);
    if (harapan !== jurnal.hash) {
      penyimpangan.push({
        nomor: jurnal.nomorJournal,
        indeks,
        jenis: 'Tanda Tangan',
        keterangan: `Isi jurnal berubah; tercatat ${jurnal.hash.slice(0, 12)}…, hasil hitung ${harapan.slice(0, 12)}…`
      });
    }
    sebelumnya = jurnal.hash;
  });

  return {
    valid: penyimpangan.length === 0,
    jumlahMata: daftar.length,
    sejakGenesis,
    penyimpangan,
    keterangan: penyimpangan.length
      ? `${penyimpangan.length} penyimpangan pada ${daftar.length} mata rantai`
      : sejakGenesis
        ? `${daftar.length} mata rantai utuh sejak genesis ${GENESIS_JURNAL.slice(0, 12)}…`
        : `${daftar.length} mata rantai utuh dalam jendela (titik cui ${jangkar.slice(0, 12)}…)`
  };
}

export function balikanJurnal(asal: JurnalKeuangan, opsi: {
  alasan: string;
  tanggal: string;
  petugas: string;
  peran: string;
  nomorJournal: string;
  daftarAkun: AkunCoA[];
  daftarPeriode?: PeriodeBuku[];
}): { rancangan: RancanganJurnal | null; penyimpangan: PenyimpanganJurnal[] } {
  const penyimpangan: PenyimpanganJurnal[] = [];
  if (asal.status !== 'Posted') {
    penyimpangan.push({
      kode: asal.nomorJournal,
      jenis: 'Keseimbangan',
      keterangan: `Hanya jurnal Posted yang dibalik (status ${asal.status}); Draft cukup dibuang, Void tidak bisa dibalik dua kali`
    });
  }
  const gerbang = gerbangPeriodeBuku(opsi.tanggal, opsi.daftarPeriode ?? []);
  if (!gerbang.boleh)
    penyimpangan.push(...gerbang.sebab.map((keterangan) => ({ kode: gerbang.periode, jenis: 'Periode' as const, keterangan })));
  if (penyimpangan.length) return { rancangan: null, penyimpangan };

  const baris: JurnalBaris[] = asal.baris.map((b) => ({
    akunKode: b.akunKode,
    debit: b.kredit,
    kredit: b.debit,
    ...(b.nomorBatch ? { nomorBatch: b.nomorBatch } : {}),
    ...(b.pusatBiayaId ? { pusatBiayaId: b.pusatBiayaId } : {}),
    keterangan: `Pembalik ${asal.nomorJournal}${opsi.alasan ? ` — ${opsi.alasan}` : ''}`
  }));

  return {
    rancangan: {
      nomorJournal: opsi.nomorJournal,
      tanggalTransaksi: opsi.tanggal,
      tanggalPosting: null,
      sumberRujukan: 'KOREKSI_JURNAL',
      idRujukan: asal.id,
      uraian: `Pembalik ${asal.nomorJournal}: ${asal.uraian}`,
      status: 'Draft',
      dibuatOleh: opsi.petugas,
      peranPembuat: opsi.peran,
      baris,
      jurnalAsalDibalik: asal.id,
      alasanBalik: opsi.alasan,
      periode: gerbang.periode
    },
    penyimpangan: validasiKeseimbanganJurnal(baris, opsi.daftarAkun).penyimpangan
  };
}

export interface OpsiPostingFaktur {
  tarifPpnPersen: number;
  /** false (bawaan): `jumlah` faktur adalah DPP, PPN dihitung di atasnya.
   *  true: `jumlah` sudah termasuk PPN sehingga DPP di-back-out. Pilihan ini mengubah angka
   *  piutang dan pendapatan, jadi keputusan pemilik, bukan default senyap. */
  ppnTermasukDalamNominal: boolean;
  petugas: string;
  peran: string;
  urutanNomor: (periode: string) => number;
}

const PETA_BEBAN: Record<Exclude<TransaksiKeuangan['kategori'], 'Pendapatan Alkes'>, { akun: string; pusatBiaya: PusatBiayaId; sumber: JurnalKeuangan['sumberRujukan'] }> = {
  'Biaya Uji Kalibrasi': { akun: KODE_AKUN.BEBAN_KALIBRASI, pusatBiaya: 'PB-QA', sumber: 'BEBAN_MUTU_KALIBRASI' },
  'Biaya Audit ISO/CDAKB': { akun: KODE_AKUN.BEBAN_AUDIT_MUTU, pusatBiaya: 'PB-REG', sumber: 'BEBAN_AUDIT_ISO_CDAKB' },
  'Pengadaan Suku Cadang': { akun: KODE_AKUN.PERSEDIAAN_SUKU_CADANG, pusatBiaya: 'PB-MFG', sumber: 'PENGADAAN_SUKU_CADANG' },
  'Biaya Retur Mutu': { akun: KODE_AKUN.BEBAN_RETUR_MUTU, pusatBiaya: 'PB-QA', sumber: 'BIAYA_RETUR_MUTU' }
};

function pisahPpn(nominal: number, tarifPersen: number, termasukDalamNominal: boolean) {
  if (!termasukDalamNominal) {
    const dpp = bulat(nominal);
    return { dpp, ppn: tarifPersen > 0 ? bulat((dpp * tarifPersen) / 100) : 0 };
  }
  const ppn = tarifPersen > 0 ? bulat((nominal * tarifPersen) / (100 + tarifPersen)) : 0;
  return { dpp: bulat(nominal) - ppn, ppn };
}

export function rancangJurnalFaktur(transaksi: TransaksiKeuangan, opsi: OpsiPostingFaktur): RancanganJurnal {
  const periode = periodeDari(transaksi.tanggal);
  const lunas = transaksi.statusPembayaran === 'Lunas';
  const kenaPpn = transaksi.ppnStatus === 'PPN 11% Terbit Faktur Pajak';
  const { dpp, ppn } = pisahPpn(transaksi.jumlah, kenaPpn ? opsi.tarifPpnPersen : 0, opsi.ppnTermasukDalamNominal);
  const baris: JurnalBaris[] = [];

  if (transaksi.kategori === 'Pendapatan Alkes') {
    baris.push({
      akunKode: lunas ? KODE_AKUN.KAS : KODE_AKUN.PIUTANG_DAGANG,
      debit: dpp + ppn,
      kredit: 0,
      pusatBiayaId: 'PB-DIST',
      keterangan: `Tagihan ${transaksi.fasyankesAtauPemasok}`
    });
    baris.push({ akunKode: KODE_AKUN.PENDAPATAN_ALKES, debit: 0, kredit: dpp, pusatBiayaId: 'PB-DIST', keterangan: transaksi.nomorFaktur });
    if (ppn > 0) baris.push({ akunKode: KODE_AKUN.PPN_KELUARAN, debit: 0, kredit: ppn, pusatBiayaId: 'PB-DIST', keterangan: 'PPN Keluaran' });
  } else {
    const peta = PETA_BEBAN[transaksi.kategori];
    baris.push({ akunKode: peta.akun, debit: dpp, kredit: 0, pusatBiayaId: peta.pusatBiaya, keterangan: transaksi.nomorFaktur });
    if (ppn > 0) baris.push({ akunKode: KODE_AKUN.PPN_MASUKAN, debit: ppn, kredit: 0, pusatBiayaId: peta.pusatBiaya, keterangan: 'PPN Masukan dapat dikreditkan' });
    baris.push({
      akunKode: lunas ? KODE_AKUN.KAS : KODE_AKUN.HUTANG_USAHA,
      debit: 0,
      kredit: dpp + ppn,
      pusatBiayaId: peta.pusatBiaya,
      keterangan: `Pembayaran ke ${transaksi.fasyankesAtauPemasok}`
    });
  }

  return {
    nomorJournal: nomorJournalUntuk(periode, opsi.urutanNomor(periode)),
    tanggalTransaksi: transaksi.tanggal,
    tanggalPosting: null,
    sumberRujukan: transaksi.kategori === 'Pendapatan Alkes' ? 'FAKTUR_PENJUALAN' : PETA_BEBAN[transaksi.kategori].sumber,
    idRujukan: transaksi.id,
    uraian: `${transaksi.kategori} — ${transaksi.fasyankesAtauPemasok}`,
    status: 'Draft',
    dibuatOleh: opsi.petugas,
    peranPembuat: opsi.peran,
    baris,
    periode
  };
}

export interface BarisValuasiPersediaan {
  nomorBatch: string;
  kodeSKU: string;
  namaAlkes: string;
  qtyFisik: number;
  statusStok: StokGudang['statusStok'];
  nilaiPerUnit: number | null;
  nilaiTotal: number;
  perluWriteOff: boolean;
  sebab: SebabWriteOff | null;
  catatan: string;
}

export interface HasilValuasiPersediaan {
  baris: BarisValuasiPersediaan[];
  totalNilaiBuku: number;
  totalPerluWriteOff: number;
  betsTanpaDasarBiaya: string[];
  keterangan: string;
}

function sebabDariStatus(stok: StokGudang, dari: Date): SebabWriteOff | null {
  const status = statusUnitStok(stok);
  if (status === 'EXPIRED_LOCK') return 'Kedaluwarsa';
  if (status === 'DAMAGED') return 'Rusak';
  if (new Date(stok.tanggalKedaluwarsa).getTime() <= dari.getTime()) return 'Kedaluwarsa';
  if (status === 'QUARANTINE') return 'Karantina';
  return null;
}

/** Nilai persediaan hanya ada bila tiap batch punya dasar biaya. Batch tanpa valuasi dilaporkan
 *  apa adanya — dianggap nol akan mengecilkan Neraca tanpa pemberitahuan. */
export function nilaiPersediaanPerBets(params: { daftarStok: StokGudang[]; daftarValuasi: ValuasiBatch[]; dari: Date }): HasilValuasiPersediaan {
  const valuasi = new Map(params.daftarValuasi.map((v) => [v.nomorBatch, v]));
  const baris: BarisValuasiPersediaan[] = [];
  const tanpaDasar: string[] = [];

  params.daftarStok.forEach((stok) => {
    const dasar = valuasi.get(stok.nomorBatch);
    const sebab = sebabDariStatus(stok, params.dari);
    const nilaiPerUnit = dasar ? dasar.nilaiPerUnit : null;
    if (!dasar && stok.jumlahStok > 0) tanpaDasar.push(stok.nomorBatch);
    baris.push({
      nomorBatch: stok.nomorBatch,
      kodeSKU: stok.kodeSKU,
      namaAlkes: stok.namaAlkes,
      qtyFisik: stok.jumlahStok,
      statusStok: stok.statusStok ?? statusUnitStok(stok),
      nilaiPerUnit,
      nilaiTotal: nilaiPerUnit === null ? 0 : bulat(nilaiPerUnit * stok.jumlahStok),
      perluWriteOff: sebab !== null && stok.jumlahStok > 0 && nilaiPerUnit !== null,
      sebab,
      catatan: dasar
        ? `${dasar.metode} • sumber ${dasar.sumberBiaya}${dasar.asal === 'DUMMY' ? ' • DUMMY' : ''}`
        : 'Belum ada dasar biaya — nilai persediaan tidak dapat dihitung'
    });
  });

  return {
    baris,
    totalNilaiBuku: baris.reduce((a, b) => a + b.nilaiTotal, 0),
    totalPerluWriteOff: baris.filter((b) => b.perluWriteOff).reduce((a, b) => a + b.nilaiTotal, 0),
    betsTanpaDasarBiaya: [...new Set(tanpaDasar)],
    keterangan: tanpaDasar.length
      ? `${[...new Set(tanpaDasar)].length} batch tanpa dasar biaya dari ${baris.length} baris kartu stok`
      : `Seluruh ${baris.length} baris kartu stok memiliki dasar biaya`
  };
}

export function rancangJurnalWriteOff(params: {
  valuasi: ValuasiBatch;
  qty: number;
  sebab: SebabWriteOff;
  tanggal: string;
  petugas: string;
  peran: string;
  nomorJournal: string;
  pusatBiaya?: PusatBiayaId;
}): RancanganJurnal {
  const nilai = bulat(params.valuasi.nilaiPerUnit * params.qty);
  const periode = periodeDari(params.tanggal);
  const kunci = { nomorBatch: params.valuasi.nomorBatch, pusatBiayaId: params.pusatBiaya ?? ('PB-DIST' as PusatBiayaId) };
  // Karantina hanya reklasifikasi di dalam persediaan (kerugian belum pasti); kedaluwarsa,
  // rusak, dan recall menimbulkan beban plus cadangan penurunan nilai.
  const reklasifikasi = params.sebab === 'Karantina';
  const baris: JurnalBaris[] = reklasifikasi
    ? [
        { akunKode: KODE_AKUN.PERSEDIAAN_KARANTINA, debit: nilai, kredit: 0, ...kunci, keterangan: `Reklasifikasi ${params.sebab.toLowerCase()}` },
        { akunKode: KODE_AKUN.PERSEDIAAN_ALKES, debit: 0, kredit: nilai, ...kunci, keterangan: 'Keluar dari stok layak kirim' }
      ]
    : [
        { akunKode: KODE_AKUN.BEBAN_KERUGIAN_PERSEDIAAN, debit: nilai, kredit: 0, ...kunci, keterangan: `Kerugian ${params.sebab.toLowerCase()} ${params.valuasi.namaAlkes}` },
        { akunKode: KODE_AKUN.CADANGAN_PENURUNAN_NILAI, debit: 0, kredit: nilai, ...kunci, keterangan: `Cadangan ${params.sebab.toLowerCase()} batch ${params.valuasi.nomorBatch}` }
      ];

  return {
    nomorJournal: params.nomorJournal,
    tanggalTransaksi: params.tanggal,
    tanggalPosting: null,
    sumberRujukan: reklasifikasi ? 'CADANGAN_PENURUNAN_NILAI' : 'WRITE_OFF_BATCH',
    idRujukan: params.valuasi.nomorBatch,
    uraian: `${reklasifikasi ? 'Reklasifikasi karantina' : `Write-off ${params.sebab.toLowerCase()}`} ${params.valuasi.namaAlkes} batch ${params.valuasi.nomorBatch} (${params.qty} ${params.valuasi.satuan})`,
    status: 'Draft',
    dibuatOleh: params.petugas,
    peranPembuat: params.peran,
    baris,
    periode
  };
}

/** Konversi saldo persediaan dari sistem lama yang tidak pernah membukukan harga pokok.
 *  Satu baris debet per batch supaya nomor batch tetap tercatat di buku besar (CDAKB), dilawan
 *  satu kredit ke akun penyeimbang (modal/ekuitas) — bukan ke pendapatan. */
export function rancangJurnalPembukaanPersediaan(params: {
  valuasi: ValuasiBatch[];
  tanggal: string;
  petugas: string;
  peran: string;
  nomorJournal: string;
  akunPenyeimbang?: string;
}): RancanganJurnal {
  const periode = periodeDari(params.tanggal);
  const akunLawan = params.akunPenyeimbang ?? KODE_AKUN.MODAL_DISETOR;
  const baris: JurnalBaris[] = [];
  let total = 0;
  for (const v of params.valuasi) {
    const nilai = bulat(v.nilaiPerUnit * v.qtyTercatat);
    if (nilai <= 0) continue;
    total += nilai;
    baris.push({
      akunKode: KODE_AKUN.PERSEDIAAN_ALKES,
      debit: nilai,
      kredit: 0,
      nomorBatch: v.nomorBatch,
      keterangan: `Saldo awal ${v.namaAlkes} (${v.qtyTercatat} ${v.satuan} × ${v.nilaiPerUnit}) — ${v.sumberBiaya}`
    });
  }
  baris.push({ akunKode: akunLawan, debit: 0, kredit: total, keterangan: `Penyeimbang pembukaan persediaan ${params.valuasi.length} batch` });

  return {
    nomorJournal: params.nomorJournal,
    tanggalTransaksi: params.tanggal,
    tanggalPosting: null,
    sumberRujukan: 'PEMBUKAAN_PERIODE',
    idRujukan: `VAL-${periode}`,
    uraian: `Pembukaan saldo persediaan hasil konversi benih gudang (${params.valuasi.length} batch)`,
    status: 'Draft',
    dibuatOleh: params.petugas,
    peranPembuat: params.peran,
    baris,
    periode
  };
}

/** HPP diakui saat barang benar-benar diserahkan, bukan saat pesanan dibuat. Satu kredit per batch
 *  agar buku besar Persediaan tetap menyebut nomor batch; bila ada batch tanpa dasar biaya, seluruh
 *  rancangan ditolak — nilai nol akan mengecilkan HPP tanpa pemberitahuan. */
export function rancangJurnalHppPengiriman(params: {
  nomorSuratJalan: string;
  tanggal: string;
  statusSuratJalan: StatusSuratJalan;
  fasyankesTujuan: string;
  rute: { nomorBatch: string; qty: number }[];
  daftarValuasi: ValuasiBatch[];
  petugas: string;
  peran: string;
  nomorJournal: string;
}): { rancangan: RancanganJurnal | null; betsTanpaDasarBiaya: string[]; penolakan: string[] } {
  const penolakan: string[] = [];
  if (params.statusSuratJalan !== 'Terkirim' && params.statusSuratJalan !== 'Diterima Penerima')
    penolakan.push(`Pengakuan HPP menunggu penyerahan (status surat jalan ${params.statusSuratJalan})`);

  const dasar = new Map(params.daftarValuasi.map((v) => [v.nomorBatch, v]));
  const tanpaDasar = [...new Set(params.rute.map((r) => r.nomorBatch))].filter((b) => !dasar.has(b));
  if (tanpaDasar.length) penolakan.push(`${tanpaDasar.length} batch belum punya dasar biaya: ${tanpaDasar.join(', ')}`);
  if (!params.rute.length) penolakan.push('Surat jalan tidak memiliki rute picking bernomor batch');

  if (penolakan.length) return { rancangan: null, betsTanpaDasarBiaya: tanpaDasar, penolakan };

  const periode = periodeDari(params.tanggal);
  const baris: JurnalBaris[] = [];
  let total = 0;
  for (const langkah of params.rute) {
    const valuasi = dasar.get(langkah.nomorBatch);
    if (!valuasi) continue;
    const nilai = bulat(valuasi.nilaiPerUnit * langkah.qty);
    total += nilai;
    baris.push({
      akunKode: KODE_AKUN.PERSEDIAAN_ALKES,
      debit: 0,
      kredit: nilai,
      nomorBatch: valuasi.nomorBatch,
      pusatBiayaId: 'PB-DIST',
      keterangan: `HPP keluar ${langkah.qty} ${valuasi.satuan} batch ${valuasi.nomorBatch}`
    });
  }
  baris.unshift({
    akunKode: KODE_AKUN.HPP_ALKES,
    debit: total,
    kredit: 0,
    pusatBiayaId: 'PB-DIST',
    keterangan: `Harga pokok ${params.nomorSuratJalan} ke ${params.fasyankesTujuan}`
  });

  return {
    rancangan: {
      nomorJournal: params.nomorJournal,
      tanggalTransaksi: params.tanggal,
      tanggalPosting: null,
      sumberRujukan: 'HPP_PENGIRIMAN',
      idRujukan: params.nomorSuratJalan,
      uraian: `Pengakuan HPP ${params.nomorSuratJalan} — ${params.fasyankesTujuan}`,
      status: 'Draft',
      dibuatOleh: params.petugas,
      peranPembuat: params.peran,
      baris,
      periode
    },
    betsTanpaDasarBiaya: [],
    penolakan: []
  };
}

export interface InputLandedCostImpor {
  hargaFob: number;  angkutLuarNegeri: number;
  asuransi: number;
  beaMasukPersen: number;
  pungutanPdbPersen?: number;
  ppnImporPersen: number;
  pph22Persen: number;
  qty: number;
  /** true bila PPh 22 tidak dapat dikreditkan (mis. tanpa NPWP/API); tetap bukan biaya
   *  perolehan persediaan, melainkan beban pajak periode berjalan. */
  pph22TidakDapatDikreditkan?: boolean;
}

export interface HasilLandedCost {
  fob: number;
  angkut: number;
  asuransi: number;
  beaMasuk: number;
  pdb: number;
  totalTercapitalisasi: number;
  biayaPerUnit: number;
  sisaPembulatan: number;
  ppnImporMasukan: number;
  pph22UangMuka: number;
  pph22Beban: number;
  totalPembayaran: number;
  uraianKomponen: { komponen: string; nilai: number; diperlakukan: string }[];
}

export function hitungLandedCostImpor(input: InputLandedCostImpor): HasilLandedCost {
  const fob = bulat(input.hargaFob);
  const angkut = bulat(input.angkutLuarNegeri);
  const asuransi = bulat(input.asuransi);
  const beaMasuk = bulat((fob * input.beaMasukPersen) / 100);
  const nilaiPabean = fob + angkut + asuransi;
  const pdb = bulat((nilaiPabean * (input.pungutanPdbPersen ?? 0)) / 100);
  const totalTercapitalisasi = fob + angkut + asuransi + beaMasuk + pdb;
  const ppnImporMasukan = bulat((totalTercapitalisasi * input.ppnImporPersen) / 100);
  const pph22 = bulat((totalTercapitalisasi * input.pph22Persen) / 100);
  const qty = input.qty > 0 ? input.qty : 1;
  const biayaPerUnit = Math.floor(totalTercapitalisasi / qty);

  return {
    fob,
    angkut,
    asuransi,
    beaMasuk,
    pdb,
    totalTercapitalisasi,
    biayaPerUnit,
    sisaPembulatan: totalTercapitalisasi - biayaPerUnit * qty,
    ppnImporMasukan,
    pph22UangMuka: input.pph22TidakDapatDikreditkan ? 0 : pph22,
    pph22Beban: input.pph22TidakDapatDikreditkan ? pph22 : 0,
    totalPembayaran: totalTercapitalisasi + ppnImporMasukan + pph22,
    uraianKomponen: [
      { komponen: 'Harga FOB', nilai: fob, diperlakukan: 'Kapitalisasi persediaan' },
      { komponen: 'Angkut luar negeri', nilai: angkut, diperlakukan: 'Kapitalisasi persediaan' },
      { komponen: 'Asuransi kargo', nilai: asuransi, diperlakukan: 'Kapitalisasi persediaan' },
      { komponen: `Bea masuk ${input.beaMasukPersen}%`, nilai: beaMasuk, diperlakukan: 'Kapitalisasi persediaan' },
      { komponen: `Pungutan PDB ${input.pungutanPdbPersen ?? 0}%`, nilai: pdb, diperlakukan: 'Kapitalisasi persediaan' },
      { komponen: `PPN impor ${input.ppnImporPersen}%`, nilai: ppnImporMasukan, diperlakukan: 'PPN Masukan (kredit pajak)' },
      { komponen: `PPh 22 impor ${input.pph22Persen}%`, nilai: pph22, diperlakukan: input.pph22TidakDapatDikreditkan ? 'Beban (tidak dapat dikreditkan)' : 'Uang muka pajak (kredit)' }
    ]
  };
}

export function rancangJurnalLandedCost(params: {
  landed: HasilLandedCost;
  nomorBatch: string;
  tanggal: string;
  petugas: string;
  peran: string;
  nomorJournal: string;
  idRujukan: string;
  namaAlkes: string;
  dibayarTunai?: boolean;
}): RancanganJurnal {
  const periode = periodeDari(params.tanggal);
  const baris: JurnalBaris[] = [
    {
      akunKode: KODE_AKUN.PERSEDIAAN_ALKES,
      debit: params.landed.totalTercapitalisasi,
      kredit: 0,
      nomorBatch: params.nomorBatch,
      pusatBiayaId: 'PB-DIST',
      keterangan: `Landed cost impor ${params.namaAlkes}`
    },
    { akunKode: KODE_AKUN.PPN_MASUKAN, debit: params.landed.ppnImporMasukan, kredit: 0, pusatBiayaId: 'PB-DIST', keterangan: 'PPN impor dapat dikreditkan' }
  ];
  if (params.landed.pph22UangMuka > 0) {
    baris.push({
      akunKode: KODE_AKUN.UANG_MUKA_PPH22,
      debit: params.landed.pph22UangMuka,
      kredit: 0,
      pusatBiayaId: 'PB-DIST',
      keterangan: 'PPh 22 impor sebagai uang muka pajak'
    });
  }
  if (params.landed.pph22Beban > 0) {
    baris.push({
      akunKode: KODE_AKUN.BEBAN_UMUM,
      debit: params.landed.pph22Beban,
      kredit: 0,
      pusatBiayaId: 'PB-HQ',
      keterangan: 'PPh 22 impor tidak dapat dikreditkan'
    });
  }
  baris.push({
    akunKode: params.dibayarTunai ? KODE_AKUN.KAS : KODE_AKUN.HUTANG_USAHA,
    debit: 0,
    kredit: params.landed.totalPembayaran,
    pusatBiayaId: 'PB-DIST',
    keterangan: 'Kewajiban kepabeanan dan pemasok'
  });

  return {
    nomorJournal: params.nomorJournal,
    tanggalTransaksi: params.tanggal,
    tanggalPosting: null,
    sumberRujukan: 'LANDED_COST_IMPOR',
    idRujukan: params.idRujukan,
    uraian: `Perolehan impor ${params.namaAlkes} batch ${params.nomorBatch}`,
    status: 'Draft',
    dibuatOleh: params.petugas,
    peranPembuat: params.peran,
    baris,
    periode
  };
}

/** Tanda untuk halaman buku besar satu akun: mengikuti `saldoNormal`, sehingga akun kontra
 *  seperti Cadangan Penurunan Nilai membaca saldonya sendiri sebagai kredit. */
function gerakAkun(akun: Pick<AkunCoA, 'saldoNormal'>, baris: Pick<JurnalBaris, 'debit' | 'kredit'>) {
  return akun.saldoNormal === 'Debet' ? baris.debit - baris.kredit : baris.kredit - baris.debit;
}

/** Tanda untuk laporan keuangan: mengikuti hakikat akun (`tipe`), bukan `saldoNormal`.
 *  Kalau memakai saldoNormal, Cadangan Penurunan Nilai (kontra-aset) justru MENAMBAH Aset
 *  sebesar 134 juta dan Neraca tidak pernah seimbang. */
function gerakLaporan(akun: Pick<AkunCoA, 'tipe'>, baris: Pick<JurnalBaris, 'debit' | 'kredit'>) {
  return akun.tipe === 'Aset' || akun.tipe === 'Beban' ? baris.debit - baris.kredit : baris.kredit - baris.debit;
}

export interface EntriBukuBesar {
  tanggal: string;
  nomorJournal: string;
  uraian: string;
  debit: number;
  kredit: number;
  saldo: number;
  nomorBatch?: string;
}

export interface HasilBukuBesar {
  akunKode: string;
  namaAkun: string;
  entri: EntriBukuBesar[];
  totalDebit: number;
  totalKredit: number;
  saldo: number;
  saldoNormal: AkunCoA['saldoNormal'];
}

/** Hanya jurnal Posted yang masuk buku besar; Draft dan Void tidak mengubah laporan. */
export function bukuBesar(params: {
  daftarJurnal: JurnalKeuangan[];
  akun: AkunCoA;
  dari?: string;
  sampai?: string;
  statusDiikutkan?: StatusJurnal[];
}): HasilBukuBesar {
  const statusYangDiikut = params.statusDiikutkan ?? ['Posted'];
  const kutipan = params.daftarJurnal
    .filter((j) => statusYangDiikut.includes(j.status))
    .filter((j) => (!params.dari || j.tanggalTransaksi >= params.dari) && (!params.sampai || j.tanggalTransaksi <= params.sampai))
    .flatMap((j) => j.baris.filter((b) => b.akunKode === params.akun.kode).map((b) => ({ jurnal: j, baris: b })))
    .sort((a, b) => a.jurnal.tanggalTransaksi.localeCompare(b.jurnal.tanggalTransaksi) || a.jurnal.nomorJournal.localeCompare(b.jurnal.nomorJournal));

  let saldo = 0;
  const entri: EntriBukuBesar[] = kutipan.map(({ jurnal, baris }) => {
    saldo += gerakAkun(params.akun, baris);
    return {
      tanggal: jurnal.tanggalTransaksi,
      nomorJournal: jurnal.nomorJournal,
      uraian: jurnal.uraian,
      debit: baris.debit,
      kredit: baris.kredit,
      saldo,
      ...(baris.nomorBatch ? { nomorBatch: baris.nomorBatch } : {})
    };
  });

  return {
    akunKode: params.akun.kode,
    namaAkun: params.akun.nama,
    entri,
    totalDebit: entri.reduce((a, e) => a + e.debit, 0),
    totalKredit: entri.reduce((a, e) => a + e.kredit, 0),
    saldo,
    saldoNormal: params.akun.saldoNormal
  };
}

export function saldoPerAkun(params: {
  daftarJurnal: JurnalKeuangan[];
  daftarAkun: AkunCoA[];
  sampai?: string;
  statusDiikutkan?: StatusJurnal[];
}) {
  const statusYangDiikut = params.statusDiikutkan ?? ['Posted'];
  const denganKode = new Map(params.daftarAkun.map((a) => [a.kode, a]));
  const saldo = new Map<string, number>();

  for (const j of params.daftarJurnal) {
    if (!statusYangDiikut.includes(j.status)) continue;
    if (params.sampai && j.tanggalTransaksi > params.sampai) continue;
    for (const b of j.baris) {
      const akun = denganKode.get(b.akunKode);
      if (!akun) continue;
      saldo.set(akun.kode, (saldo.get(akun.kode) ?? 0) + gerakLaporan(akun, b));
    }
  }

  return saldo;
}

/** Harga pokok persediaan duduk di 1120/1121/1122. Cadangan Penurunan Nilai (1129) sengaja
 *  dipisah: menyamakannya dengan nilai kartu stok akan membuat benih yang benar sekalipun
 *  selalu tampak selisih sebesar cadangan yang memang sudah di-posting. */
const AKUN_HARGA_POKOK_PERSEDIAAN: string[] = [
  KODE_AKUN.PERSEDIAAN_ALKES,
  KODE_AKUN.PERSEDIAAN_KARANTINA,
  KODE_AKUN.PERSEDIAAN_SUKU_CADANG
];
const AKUN_CADANGAN_PERSEDIAAN: string[] = [KODE_AKUN.CADANGAN_PENURUNAN_NILAI];

export interface BarisRekonsiliasiPersediaan {
  nomorBatch: string;
  namaAlkes: string;
  nilaiKartuStok: number;
  hargaPokokBukuBesar: number;
  selisih: number;
  sebab: string;
}

export interface HasilRekonsiliasiPersediaan {
  totalKartuStok: number;
  hargaPokokBukuBesar: number;
  /** kontra-aset Posted, selalu negatif atau nol */
  cadanganPenurunanNilai: number;
  nilaiBersihBukuBesar: number;
  status: 'Seimbang' | 'Perlu Rekonsiliasi' | 'Buku Besar Belum Dibuka';
  baris: BarisRekonsiliasiPersediaan[];
  /** pergerakan akun persediaan yang tidak menyebut nomor batch — tidak boleh hilang dari jembatan */
  tanpaNomorBatch: number;
  keterangan: string;
}

/**
 * Tie-out dua sumber kebenaran persediaan: kartu stok × dasar biaya (modul Gudang) lawan
 * harga pokok di buku besar (modul Finance), lalu dijembatani ke nilai bersih Neraca lewat
 * cadangan penurunan nilai. Selisih per batch dinaturalisasi supaya user tahu penyebabnya,
 * bukan sekadar melihat dua tab yang tidak cocok. Fungsi ini hanya membaca — memaksa keduanya
 * sama lewat tulisan otomatis justru menghapus jejak yang sedang dicari.
 */
export function rekonsiliasiPersediaan(params: {
  daftarJurnal: JurnalKeuangan[];
  daftarAkun: AkunCoA[];
  daftarStok: StokGudang[];
  daftarValuasi: ValuasiBatch[];
  sampai: string;
  dari: Date;
}): HasilRekonsiliasiPersediaan {
  const denganKode = new Map(params.daftarAkun.map((a) => [a.kode, a]));
  const buku = new Map<string, number>();
  let cadanganPenurunanNilai = 0;
  let tanpaNomorBatch = 0;

  for (const j of params.daftarJurnal) {
    if (j.status !== 'Posted') continue;
    if (j.tanggalTransaksi > params.sampai) continue;
    for (const mata of j.baris) {
      const akun = denganKode.get(mata.akunKode);
      if (!akun) continue;
      const gerak = gerakLaporan(akun, mata);
      if (AKUN_CADANGAN_PERSEDIAAN.includes(akun.kode)) {
        cadanganPenurunanNilai += gerak;
        continue;
      }
      if (!AKUN_HARGA_POKOK_PERSEDIAAN.includes(akun.kode)) continue;
      if (!mata.nomorBatch) {
        tanpaNomorBatch += gerak;
        continue;
      }
      buku.set(mata.nomorBatch, (buku.get(mata.nomorBatch) ?? 0) + gerak);
    }
  }

  const valuasi = nilaiPersediaanPerBets({ daftarStok: params.daftarStok, daftarValuasi: params.daftarValuasi, dari: params.dari });
  const stok = new Map<string, { nilai: number; namaAlkes: string }>();
  for (const baris of valuasi.baris) {
    const gabung = stok.get(baris.nomorBatch) ?? { nilai: 0, namaAlkes: baris.namaAlkes };
    stok.set(baris.nomorBatch, { nilai: gabung.nilai + baris.nilaiTotal, namaAlkes: gabung.namaAlkes });
  }

  const namaDariValuasi = new Map(params.daftarValuasi.map((v) => [v.nomorBatch, v.namaAlkes]));
  const nomor = [...new Set([...stok.keys(), ...buku.keys()])];
  const baris: BarisRekonsiliasiPersediaan[] = [];

  for (const nomorBatch of nomor) {
    const nilaiKartuStok = stok.get(nomorBatch)?.nilai ?? 0;
    const hargaPokokBukuBesar = buku.get(nomorBatch) ?? 0;
    const selisih = hargaPokokBukuBesar - nilaiKartuStok;
    if (selisih === 0) continue;
    const punyaDasarBiaya = params.daftarValuasi.some((v) => v.nomorBatch === nomorBatch);
    const sebab = !stok.has(nomorBatch)
      ? 'Tercatat di buku besar tetapi tidak ada pada kartu stok saat ini'
      : !buku.has(nomorBatch)
        ? 'Ada di kartu stok tetapi belum pernah dibuka di buku besar'
        : !punyaDasarBiaya
          ? 'Kartu stok tanpa dasar biaya — nilainya tidak dapat dihitung dari sisi gudang'
          : 'Nominal berbeda; periksa write-off atau HPP yang sudah di-posting tetapi belum dieksekusi di gudang';
    baris.push({
      nomorBatch,
      namaAlkes: stok.get(nomorBatch)?.namaAlkes ?? namaDariValuasi.get(nomorBatch) ?? '-',
      nilaiKartuStok,
      hargaPokokBukuBesar,
      selisih,
      sebab
    });
  }

  baris.sort((a, b) => Math.abs(b.selisih) - Math.abs(a.selisih) || a.nomorBatch.localeCompare(b.nomorBatch));

  const totalKartuStok = valuasi.totalNilaiBuku;
  const hargaPokokBukuBesar = [...buku.values()].reduce((a, b) => a + b, 0) + tanpaNomorBatch;
  const nilaiBersihBukuBesar = hargaPokokBukuBesar + cadanganPenurunanNilai;
  const bersih = baris.length === 0 && tanpaNomorBatch === 0;

  return {
    totalKartuStok,
    hargaPokokBukuBesar,
    cadanganPenurunanNilai,
    nilaiBersihBukuBesar,
    status: hargaPokokBukuBesar === 0 && cadanganPenurunanNilai === 0 ? 'Buku Besar Belum Dibuka' : bersih ? 'Seimbang' : 'Perlu Rekonsiliasi',
    baris,
    tanpaNomorBatch,
    keterangan: bersih
      ? `Seluruh ${nomor.length} batch cocok antara kartu stok dan buku besar.`
      : `${baris.length} dari ${nomor.length} batch tidak cocok${tanpaNomorBatch ? ', ditambah pergerakan tanpa nomor batch' : ''}.`
  };
}

export interface BarisLaporan {
  kelompok: KelompokLaporan;
  label: string;
  nilai: number;
  kodeAkun: string;
}

export interface HasilNeraca {
  perTanggal: string;
  aset: BarisLaporan[];
  kewajiban: BarisLaporan[];
  ekuitas: BarisLaporan[];
  totalAset: number;
  totalKewajiban: number;
  totalEkuitas: number;
  labaPeriodeBerjalan: number;
  seimbang: boolean;
  catatan: string[];
}

/** Laba periode berjalan dimasukkan ke Ekuitas secara virtual (jurnal penutup belum dijalankan),
 *  supaya Neraca tetap seimbang tanpa memaksa tutup buku setiap saat. */
export function susunNeraca(params: { daftarJurnal: JurnalKeuangan[]; daftarAkun: AkunCoA[]; sampai: string }): HasilNeraca {
  const saldo = saldoPerAkun({ daftarJurnal: params.daftarJurnal, daftarAkun: params.daftarAkun, sampai: params.sampai });
  const ringkas = (tipe: AkunCoA['tipe']): BarisLaporan[] =>
    params.daftarAkun
      .filter((a) => a.tipe === tipe)
      .map((a) => ({ kelompok: a.kelompokLaporan, label: a.nama, nilai: saldo.get(a.kode) ?? 0, kodeAkun: a.kode }))
      .filter((b) => b.nilai !== 0)
      .sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));

  const total = (daftar: BarisLaporan[]) => daftar.reduce((a, b) => a + b.nilai, 0);
  const totalPendapatan = params.daftarAkun.filter((a) => a.tipe === 'Pendapatan').reduce((a, ak) => a + (saldo.get(ak.kode) ?? 0), 0);
  const totalBeban = params.daftarAkun.filter((a) => a.tipe === 'Beban').reduce((a, ak) => a + (saldo.get(ak.kode) ?? 0), 0);
  const labaPeriodeBerjalan = totalPendapatan - totalBeban;

  const aset = ringkas('Aset');
  const kewajiban = ringkas('Kewajiban');
  const ekuitas = ringkas('Ekuitas');
  const totalAset = total(aset);
  const totalKewajiban = total(kewajiban);
  const totalEkuitas = total(ekuitas) + labaPeriodeBerjalan;
  const catatan: string[] = [];

  if (totalAset !== totalKewajiban + totalEkuitas) {
    catatan.push(`Neraca tidak seimbang: selisih ${(totalAset - totalKewajiban - totalEkuitas).toLocaleString('id-ID')} rupiah pada ${params.sampai}`);
  }
  const akunAsing = params.daftarJurnal
    .filter((j) => j.status === 'Posted')
    .flatMap((j) => j.baris.map((b) => b.akunKode))
    .filter((kode) => !params.daftarAkun.some((a) => a.kode === kode));
  if (akunAsing.length) catatan.push(`${[...new Set(akunAsing)].length} kode akun di jurnal tidak dikenal CoA: ${[...new Set(akunAsing)].join(', ')}`);

  return {
    perTanggal: params.sampai,
    aset,
    kewajiban,
    ekuitas,
    totalAset,
    totalKewajiban,
    totalEkuitas,
    labaPeriodeBerjalan,
    seimbang: totalAset === totalKewajiban + totalEkuitas,
    catatan
  };
}

export interface BarisLabaRugiSegmen {
  pusatBiaya: PusatBiayaId;
  pendapatan: number;
  hpp: number;
  labaKotor: number;
  bebanOperasional: number;
  labaUsaha: number;
}

export interface HasilLabaRugi {
  dari: string;
  sampai: string;
  pendapatan: BarisLaporan[];
  hpp: BarisLaporan[];
  beban: BarisLaporan[];
  totalPendapatan: number;
  totalHpp: number;
  labaKotor: number;
  marginKotorPersen: number;
  totalBeban: number;
  labaUsaha: number;
  marginUsahaPersen: number;
  perSegmen: BarisLabaRugiSegmen[];
  segmenTanpaLabel: number;
}

export function susunLabaRugi(params: { daftarJurnal: JurnalKeuangan[]; daftarAkun: AkunCoA[]; dari: string; sampai: string }): HasilLabaRugi {
  const dalam = params.daftarJurnal.filter(
    (j) => j.status === 'Posted' && j.tanggalTransaksi >= params.dari && j.tanggalTransaksi <= params.sampai
  );
  const denganKode = new Map(params.daftarAkun.map((a) => [a.kode, a]));

  const nilaiPerAkun = (akun: AkunCoA) =>
    dalam.flatMap((j) => j.baris.filter((b) => b.akunKode === akun.kode)).reduce((a, b) => a + gerakLaporan(akun, b), 0);

  const baris = (tipe: AkunCoA['tipe'], kelompok?: KelompokLaporan): BarisLaporan[] =>
    params.daftarAkun
      .filter((a) => a.tipe === tipe && (!kelompok || a.kelompokLaporan === kelompok))
      .map((a) => ({ kelompok: a.kelompokLaporan, label: a.nama, nilai: nilaiPerAkun(a), kodeAkun: a.kode }))
      .filter((b) => b.nilai !== 0)
      .sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));

  const pendapatan = baris('Pendapatan');
  const hpp = baris('Beban', 'Harga Pokok Penjualan');
  const beban = baris('Beban', 'Beban Operasional').concat(baris('Beban', 'Beban Lain-lain'));
  const total = (daftar: BarisLaporan[]) => daftar.reduce((a, b) => a + b.nilai, 0);
  const totalPendapatan = total(pendapatan);
  const totalHpp = total(hpp);
  const totalBeban = total(beban);
  const labaKotor = totalPendapatan - totalHpp;
  const labaUsaha = labaKotor - totalBeban;

  const pusatMuncul = new Set<PusatBiayaId>();
  let segmenTanpaLabel = 0;
  for (const j of dalam) {
    for (const b of j.baris) {
      if (b.pusatBiayaId) {
        pusatMuncul.add(b.pusatBiayaId);
      } else if (denganKode.get(b.akunKode)?.tipe === 'Pendapatan' || denganKode.get(b.akunKode)?.kelompokLaporan === 'Beban Operasional') {
        segmenTanpaLabel += 1;
      }
    }
  }

  const perSegmen = [...pusatMuncul].sort().map((pusatBiaya) => {
    const nilai = (tipe: AkunCoA['tipe'], kelompok?: KelompokLaporan) =>
      dalam
        .flatMap((j) => j.baris.filter((b) => b.pusatBiayaId === pusatBiaya && denganKode.get(b.akunKode)?.tipe === tipe))
        .filter((b) => !kelompok || denganKode.get(b.akunKode)?.kelompokLaporan === kelompok)
        .reduce((a, b) => a + gerakAkun(denganKode.get(b.akunKode) as AkunCoA, b), 0);
    const pendapatanSegmen = nilai('Pendapatan');
    const hppSegmen = nilai('Beban', 'Harga Pokok Penjualan');
    const bebanSegmen = nilai('Beban', 'Beban Operasional') + nilai('Beban', 'Beban Lain-lain');
    return {
      pusatBiaya,
      pendapatan: pendapatanSegmen,
      hpp: hppSegmen,
      labaKotor: pendapatanSegmen - hppSegmen,
      bebanOperasional: bebanSegmen,
      labaUsaha: pendapatanSegmen - hppSegmen - bebanSegmen
    };
  });

  return {
    dari: params.dari,
    sampai: params.sampai,
    pendapatan,
    hpp,
    beban,
    totalPendapatan,
    totalHpp,
    labaKotor,
    marginKotorPersen: totalPendapatan > 0 ? (labaKotor / totalPendapatan) * 100 : 0,
    totalBeban,
    labaUsaha,
    marginUsahaPersen: totalPendapatan > 0 ? (labaUsaha / totalPendapatan) * 100 : 0,
    perSegmen,
    segmenTanpaLabel
  };
}

export interface HasilRekapPpn {
  masa: string;
  keluaran: number;
  masukan: number;
  kurangBayar: number;
  lebihBayar: number;
  jumlahFaktur: number;
  status: 'Kurang Bayar' | 'Lebih Bayar' | 'Nihil';
}

export function rekapPpnMasa(params: { daftarJurnal: JurnalKeuangan[]; masa: string }): HasilRekapPpn {
  const dalam = params.daftarJurnal.filter((j) => j.status === 'Posted' && periodeDari(j.tanggalTransaksi) === params.masa);
  const garis = (kode: string, sisi: 'kredit' | 'debit') =>
    dalam.flatMap((j) => j.baris.filter((b) => b.akunKode === kode)).reduce((a, b) => a + b[sisi], 0);
  const keluaran = garis(KODE_AKUN.PPN_KELUARAN, 'kredit');
  const masukan = garis(KODE_AKUN.PPN_MASUKAN, 'debit');
  const net = keluaran - masukan;

  return {
    masa: params.masa,
    keluaran,
    masukan,
    kurangBayar: Math.max(net, 0),
    lebihBayar: Math.max(-net, 0),
    jumlahFaktur: dalam.filter((j) => j.sumberRujukan === 'FAKTUR_PENJUALAN').length,
    status: net > 0 ? 'Kurang Bayar' : net < 0 ? 'Lebih Bayar' : 'Nihil'
  };
}

export interface BarisFakturPajak {
  nomorFaktur: string;
  tanggalFaktur: string;
  npwpPembeli: string;
  namaPembeli: string;
  dpp: number;
  ppn: number;
  kodeTransaksi: string;
}

function escapeXmlAttr(nilai: string) {
  return nilai.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitizeCsv(nilai: string | number) {
  const teks = String(nilai);
  // Sel yang diawali = + - @ dieksekusi spreadsheet; berkas ini diunduh manusia ke Excel.
  const aman = /^[=+\-@]/.test(teks) ? `'${teks}` : teks;
  return /[",\n]/.test(aman) ? `"${aman.replace(/"/g, '""')}"` : aman;
}

/** Draf untuk diunggah ke e-Faktur, BUKAN pengiriman ke DJP: tidak ada sertifikat elektronik
 *  dan tidak ada nomor faktur dari API DJP. Format dan kode transaksi harus diverifikasi PJT. */
export function drafXmlEFaktur(baris: BarisFakturPajak[], npwpPengusaha: string) {
  const isi = baris
    .map(
      (b) =>
        `    <faktur kodeTransaksi="${escapeXmlAttr(b.kodeTransaksi)}" nomorFaktur="${escapeXmlAttr(b.nomorFaktur)}" tanggalFaktur="${escapeXmlAttr(b.tanggalFaktur)}" npwp="${escapeXmlAttr(b.npwpPembeli)}" nama="${escapeXmlAttr(b.namaPembeli)}" dpp="${b.dpp}" ppn="${b.ppn}" />`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<fakturPajakKeluaranDraf status="BELUM DIKIRIM KE DJP" npwp="${escapeXmlAttr(npwpPengusaha)}" jumlahBaris="${baris.length}">\n${isi}\n</fakturPajakKeluaranDraf>`;
}

export function csvEksporKpp(baris: BarisFakturPajak[]) {
  const kepala = ['No. Faktur', 'Tanggal Faktur', 'NPWP', 'Nama Pembeli', 'DPP', 'PPN', 'Kode Transaksi'];
  const isi = baris.map((b) => [b.nomorFaktur, b.tanggalFaktur, b.npwpPembeli, b.namaPembeli, b.dpp, b.ppn, b.kodeTransaksi].map(sanitizeCsv).join(','));
  return [kepala.join(','), ...isi].join('\n');
}

export interface HasilGerbangPenagihan {
  bolehDitagih: boolean;
  sebab: string[];
  lolosNie: boolean;
  fasyankesBerizin: boolean;
  betsDalamRecall: boolean;
}

/** Gerbang CDAKB/SDAK sebelum menagih: batch ada dan layak kirim, tidak sedang recall,
 *  NIE sah, dan fasyankes tujuan punya izin operasional berlaku. */
export function gerbangPenagihanCdakb(params: {
  nomorBatch: string;
  nomorIzinEdar: string;
  daftarStok: StokGudang[];
  daftarRecall: PenarikanProduk[];
  daftarIzinEdar: IzinEdarAlkes[];
  pelanggan?: PelangganB2B;
  dari: Date;
}): HasilGerbangPenagihan {
  const sebab: string[] = [];
  const kartu = params.daftarStok.filter((s) => s.nomorBatch === params.nomorBatch);
  if (!kartu.length) sebab.push(`Batch ${params.nomorBatch} tidak ada pada kartu stok`);
  kartu.forEach((s) => {
    const status = statusUnitStok(s);
    if (status !== 'AVAILABLE' && status !== 'RESERVED') sebab.push(`Batch ${params.nomorBatch} berstatus ${status} — tidak boleh ditagih`);
  });

  const recallAktif = params.daftarRecall.filter((r) => r.nomorBatchTerdampak === params.nomorBatch && r.status !== 'Ditutup');
  if (recallAktif.length) sebab.push(`Batch ${params.nomorBatch} sedang dalam recall ${recallAktif.map((r) => r.nomorRecall).join(', ')}`);

  const nie = validasiNomorIzinEdar(params.nomorIzinEdar, params.daftarIzinEdar, params.dari);
  const izin = validasiIzinOperasionalFasyankes(params.pelanggan, params.dari);
  if (nie.status !== 'Lolos') sebab.push(`NIE: ${nie.keterangan}`);
  if (izin.status !== 'Lolos') sebab.push(`Izin fasyankes: ${izin.keterangan}`);

  return {
    bolehDitagih: sebab.length === 0,
    sebab,
    lolosNie: nie.status === 'Lolos',
    fasyankesBerizin: izin.status === 'Lolos',
    betsDalamRecall: recallAktif.length > 0
  };
}

export interface AlokasiBiayaMutu {
  keHpp: number;
  keBebanOperasional: number;
  rincian: { komponen: string; nilai: number; tujuan: 'COGM/HPP' | 'BOP' }[];
  alasan: string;
}

/** Biaya mutu yang terikat satu BMR masuk COGM/HPP; biaya mutu periodik (audit sertifikasi,
 *  kalibrasi alat bersama) tetap Beban Operasional. */
export function alokasiBiayaMutu(params: { biayaKalibrasi: number; nilaiScrap: number; nomorBmrTerkait?: string }): AlokasiBiayaMutu {
  const kalibrasi = bulat(params.biayaKalibrasi);
  const scrap = bulat(params.nilaiScrap);
  const terikatBets = Boolean(params.nomorBmrTerkait);
  const tujuan = terikatBets ? 'COGM/HPP' : 'BOP';

  return {
    keHpp: terikatBets ? kalibrasi + scrap : 0,
    keBebanOperasional: terikatBets ? 0 : kalibrasi + scrap,
    rincian: [
      { komponen: 'Kalibrasi & uji fungsi', nilai: kalibrasi, tujuan },
      { komponen: 'Scrap material gagal', nilai: scrap, tujuan }
    ],
    alasan: terikatBets ? `Terlacak ke BMR ${params.nomorBmrTerkait}` : 'Tidak terikat batch produksi — biaya mutu periodik'
  };
}

export const NAMA_PUSAT_BIAYA: Record<PusatBiayaId, string> = {
  'PB-MFG': 'Manufaktur (CPAKB)',
  'PB-DIST': 'Distribusi & Penjualan',
  'PB-REG': 'Regulatory Affairs & PJT',
  'PB-QA': 'Jaminan Mutu (QA/QC)',
  'PB-SALES': 'Pemasaran',
  'PB-HR': 'SDM & Pelatihan',
  'PB-IT': 'TI & Traceability',
  'PB-HQ': 'Kantor Pusat'
};
