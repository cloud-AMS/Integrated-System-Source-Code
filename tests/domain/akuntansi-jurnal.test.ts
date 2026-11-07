import { describe, expect, it } from 'vitest';
import type { AkunCoA, JurnalBaris, JurnalKeuangan, ValuasiBatch } from '../../src/types';
import {
  GENESIS_JURNAL,
  KODE_AKUN,
  type RancanganJurnal,
  balikanJurnal,
  nomorJournalUntuk,
  rancangJurnalHppPengiriman,
  rancangJurnalWriteOff,
  susunJurnalBerantai,
  ubahStatusJurnal,
  validasiKeseimbanganJurnal,
  verifikasiRantaiJurnal
} from '../../src/utils/akuntansi';

/** CoA secukupnya. Uji keseimbangan sengaja memakai akun sendiri supaya tidak ikut berubah
 *  kalau CoA benih ditambah. */
const AKUN: AkunCoA[] = [
  { kode: '1110', nama: 'Kas', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: '1120', nama: 'Persediaan Alkes', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: '1121', nama: 'Persediaan Karantina', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: '1129', nama: 'Cadangan Penurunan Nilai', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Kredit', aktif: true },
  { kode: '1130', nama: 'Piutang Dagang', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: '1140', nama: 'PPN Masukan', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: '1150', nama: 'Uang Muka PPh 22', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: '2110', nama: 'PPN Keluaran', tipe: 'Kewajiban', kelompokLaporan: 'Kewajiban Lancar', saldoNormal: 'Kredit', aktif: true },
  { kode: '2120', nama: 'Hutang Usaha', tipe: 'Kewajiban', kelompokLaporan: 'Kewajiban Lancar', saldoNormal: 'Kredit', aktif: true },
  { kode: '4110', nama: 'Pendapatan Alkes', tipe: 'Pendapatan', kelompokLaporan: 'Pendapatan Operasional', saldoNormal: 'Kredit', aktif: true },
  { kode: '5110', nama: 'HPP Alkes', tipe: 'Beban', kelompokLaporan: 'Harga Pokok Penjualan', saldoNormal: 'Debet', aktif: true },
  { kode: '5120', nama: 'Beban Kerugian Persediaan', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true },
  { kode: '9999', nama: 'Akun Nonaktif', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: false }
];

const baris = (baru: Partial<JurnalBaris> & Pick<JurnalBaris, 'akunKode'>): JurnalBaris => ({
  debit: 0,
  kredit: 0,
  ...baru
});

const rancangan = (baru: Partial<RancanganJurnal> = {}): RancanganJurnal => ({
  nomorJournal: 'JV-202406-0001',
  tanggalTransaksi: '2024-06-10',
  tanggalPosting: null,
  sumberRujukan: 'FAKTUR_PENJUALAN',
  idRujukan: 'INV/AMS/2024/06/001',
  uraian: 'Penjualan tunai',
  status: 'Draft',
  dibuatOleh: 'Uji',
  peranPembuat: 'pjt',
  baris: [baris({ akunKode: KODE_AKUN.KAS, debit: 1_110_000 }), baris({ akunKode: KODE_AKUN.PENDAPATAN_ALKES, kredit: 1_000_000 }), baris({ akunKode: KODE_AKUN.PPN_KELUARAN, kredit: 110_000 })],
  periode: '2024-06',
  ...baru
});

const valuasi = (baru: Partial<ValuasiBatch> = {}): ValuasiBatch => ({
  nomorBatch: 'LOT-UJI-01',
  kodeSKU: 'ALKES-PM-01',
  namaAlkes: 'Patient Monitor',
  tanggalProduksi: '2024-01-10',
  tanggalKedaluwarsa: '2027-01-10',
  qtyTercatat: 20,
  satuan: 'Unit',
  nilaiPerUnit: 42_000_000,
  metode: 'FIFO',
  sumberBiaya: 'Purchase Order',
  rujukanSumber: 'PO-UJI-001',
  asal: 'ASLI',
  tercatatPada: '2024-06-15',
  ...baru
});

describe('validasiKeseimbanganJurnal — rupiah bulat dan debet = kredit persis', () => {
  it('menerima jurnal seimbang tiga baris', () => {
    const hasil = validasiKeseimbanganJurnal(rancangan().baris, AKUN);
    expect(hasil).toMatchObject({ seimbang: true, totalDebit: 1_110_000, totalKredit: 1_110_000, selisih: 0 });
    expect(hasil.penyimpangan).toEqual([]);
  });

  it('menolak selisih satu rupiah, bukan toleransi 0,001', () => {
    const hasil = validasiKeseimbanganJurnal([baris({ akunKode: KODE_AKUN.KAS, debit: 1_000_001 }), baris({ akunKode: KODE_AKUN.PENDAPATAN_ALKES, kredit: 1_000_000 })], AKUN);
    expect(hasil.seimbang).toBe(false);
    expect(hasil.selisih).toBe(1);
    expect(hasil.penyimpangan.map((p) => p.jenis)).toContain('Keseimbangan');
  });

  it('menolak satu baris, nominal pecahan, sisi ganda, dan baris nol', () => {
    expect(validasiKeseimbanganJurnal([baris({ akunKode: KODE_AKUN.KAS, debit: 5 })], AKUN).penyimpangan.map((p) => p.jenis)).toContain('Jumlah Baris');
    const pecahan = validasiKeseimbanganJurnal([baris({ akunKode: KODE_AKUN.KAS, debit: 1000.5 }), baris({ akunKode: KODE_AKUN.PENDAPATAN_ALKES, kredit: 1000.5 })], AKUN);
    expect(pecahan.penyimpangan.filter((p) => p.jenis === 'Nominal')).toHaveLength(2);
    expect(validasiKeseimbanganJurnal([baris({ akunKode: KODE_AKUN.KAS, debit: 10, kredit: 10 }), baris({ akunKode: KODE_AKUN.PENDAPATAN_ALKES, kredit: 10 })], AKUN).seimbang).toBe(false);
  });

  it('menolak akun tak dikenal dan akun nonaktif', () => {
    const hasil = validasiKeseimbanganJurnal([baris({ akunKode: '1234', debit: 10 }), baris({ akunKode: '9999', kredit: 10 })], AKUN);
    const jenis = hasil.penyimpangan.map((p) => `${p.kode}:${p.keterangan.includes('tidak ada') ? 'tak-dikenal' : 'nonaktif'}`);
    expect(jenis).toEqual(expect.arrayContaining(['1234:tak-dikenal', '9999:nonaktif']));
  });
});

describe('susunJurnalBerantai — tanda tangan SHA-256 per mata', () => {
  it('mata pertama menyambung ke genesis dan mata kedua ke hash mata pertama', () => {
    const satu = susunJurnalBerantai([], rancangan(), { daftarAkun: AKUN });
    expect(satu.jurnal?.hashSebelum).toBe(GENESIS_JURNAL);
    const dua = susunJurnalBerantai([satu.jurnal as JurnalKeuangan], rancangan({ nomorJournal: 'JV-202406-0002', idRujukan: 'INV/AMS/2024/06/002' }), { daftarAkun: AKUN });
    expect(dua.jurnal?.hashSebelum).toBe(satu.jurnal?.hash);
    expect(verifikasiRantaiJurnal([satu.jurnal as JurnalKeuangan, dua.jurnal as JurnalKeuangan]).valid).toBe(true);
  });

  it('urutan baris tidak mengubah tanda tangan', () => {
    const acak = rancangan();
    const terbalik = { ...acak, baris: [...acak.baris].reverse() };
    expect(susunJurnalBerantai([], acak, { daftarAkun: AKUN }).jurnal?.hash).toBe(susunJurnalBerantai([], terbalik, { daftarAkun: AKUN }).jurnal?.hash);
  });

  it('jurnal ditolak bila tidak seimbang — tidak ada mata setengah jadi', () => {
    const hasil = susunJurnalBerantai([], rancangan({ baris: [baris({ akunKode: KODE_AKUN.KAS, debit: 500 }), baris({ akunKode: KODE_AKUN.PENDAPATAN_ALKES, kredit: 400 })] }), { daftarAkun: AKUN });
    expect(hasil.jurnal).toBeNull();
    expect(hasil.penyimpangan[0].jenis).toBe('Keseimbangan');
  });

  it('penyimpangan rantai terdeteksi saat isi diubah, mata di tengah dihapus, atau sambungan diputus', () => {
    const satu = susunJurnalBerantai([], rancangan(), { daftarAkun: AKUN }).jurnal as JurnalKeuangan;
    const dua = susunJurnalBerantai([satu], rancangan({ nomorJournal: 'JV-202406-0002', idRujukan: 'INV/AMS/2024/06/002' }), { daftarAkun: AKUN }).jurnal as JurnalKeuangan;
    const tiga = susunJurnalBerantai([satu, dua], rancangan({ nomorJournal: 'JV-202406-0003', idRujukan: 'INV/AMS/2024/06/003' }), { daftarAkun: AKUN }).jurnal as JurnalKeuangan;
    expect(verifikasiRantaiJurnal([satu, dua, tiga]).valid).toBe(true);

    const disunting = [satu, { ...dua, baris: dua.baris.map((b) => ({ ...b })) }, tiga];
    disunting[1].baris[0].debit += 1;
    const hasilSunting = verifikasiRantaiJurnal(disunting);
    expect(hasilSunting.valid).toBe(false);
    expect(hasilSunting.penyimpangan.map((p) => p.jenis)).toContain('Tanda Tangan');

    const tanpaTengah = verifikasiRantaiJurnal([satu, tiga]);
    expect(tanpaTengah.penyimpangan.map((p) => p.jenis)).toContain('Sambungan');

    const sambunganDiputus = verifikasiRantaiJurnal([satu, { ...dua, hashSebelum: GENESIS_JURNAL }, tiga]);
    expect(sambunganDiputus.penyimpangan[0]).toMatchObject({ nomor: 'JV-202406-0002', jenis: 'Sambungan' });
  });
});

describe('Siklus hidup jurnal — posting tidak membatalkan tanda tangan', () => {
  const posting = (jurnal: JurnalKeuangan) => ubahStatusJurnal([jurnal], jurnal, 'Posted', { tanggal: '2024-06-15', daftarPeriode: [] });

  it('Draft → Posted mengubah status dan tanggalPosting saja', () => {
    const asal = susunJurnalBerantai([], rancangan(), { daftarAkun: AKUN }).jurnal as JurnalKeuangan;
    const hasil = posting(asal);
    expect(hasil.jurnal).not.toBeNull();
    expect(hasil.jurnal?.status).toBe('Posted');
    expect(hasil.jurnal?.tanggalPosting).toBe('2024-06-15');
    expect(hasil.jurnal?.hash).toBe(asal.hash);
    expect(verifikasiRantaiJurnal([hasil.jurnal as JurnalKeuangan]).valid).toBe(true);
  });

  it('Posted → Posted dan Void → Posted ditolak', () => {
    const asal = posting(susunJurnalBerantai([], rancangan(), { daftarAkun: AKUN }).jurnal as JurnalKeuangan).jurnal as JurnalKeuangan;
    expect(ubahStatusJurnal([asal], asal, 'Posted', { tanggal: '2024-06-16' }).jurnal).toBeNull();
    const voidLangsung = ubahStatusJurnal([asal], { ...asal, status: 'Void' }, 'Posted', { tanggal: '2024-06-16' });
    expect(voidLangsung.penyimpangan[0].keterangan).toContain('tidak ada');
  });

  it('Posted → Void butuh jurnal pembalik yang sudah Posted', () => {
    const asal = posting(susunJurnalBerantai([], rancangan(), { daftarAkun: AKUN }).jurnal as JurnalKeuangan).jurnal as JurnalKeuangan;
    expect(ubahStatusJurnal([asal], asal, 'Void', { tanggal: '2024-06-20' }).penyimpangan[0].keterangan).toContain('append-only');

    const balikan = balikanJurnal(asal, { alasan: 'Nominal faktur salah', tanggal: '2024-06-21', petugas: 'Uji', peran: 'pjt', nomorJournal: 'JV-202406-0009', daftarAkun: AKUN });
    expect(balikan.rancangan).not.toBeNull();
    const postedBalikan = susunJurnalBerantai([asal], balikan.rancangan as RancanganJurnal, { daftarAkun: AKUN });
    const pembalik = posting(postedBalikan.jurnal as JurnalKeuangan).jurnal as JurnalKeuangan;
    const batal = ubahStatusJurnal([asal, pembalik], asal, 'Void', { tanggal: '2024-06-21' });
    expect(batal.jurnal?.status).toBe('Void');
    expect(verifikasiRantaiJurnal([asal, pembalik]).valid).toBe(true);
  });

  it('balikanJurnal menukar sisi dan menolak jurnal non-Posted', () => {
    const asal = posting(susunJurnalBerantai([], rancangan(), { daftarAkun: AKUN }).jurnal as JurnalKeuangan).jurnal as JurnalKeuangan;
    const balikan = balikanJurnal(asal, { alasan: 'salah input', tanggal: '2024-06-22', petugas: 'Uji', peran: 'pjt', nomorJournal: 'JV-202406-0010', daftarAkun: AKUN });
    const barisBalik = balikan.rancangan?.baris ?? [];
    asal.baris.forEach((b, i) => {
      expect(barisBalik[i]).toMatchObject({ akunKode: b.akunKode, debit: b.kredit, kredit: b.debit });
    });
    expect(balikan.rancangan?.sumberRujukan).toBe('KOREKSI_JURNAL');
    expect(balikan.rancangan?.jurnalAsalDibalik).toBe(asal.id);
    expect(balikan.rancangan?.idRujukan).toBe(asal.id);
    expect(balikan.rancangan?.uraian).toBe(`Pembalik ${asal.nomorJournal}: ${asal.uraian}`);
    expect(balikan.rancangan?.baris[0].keterangan).toContain('salah input');
    expect(balikan.penyimpangan).toEqual([]);

    const draft = susunJurnalBerantai([], rancangan({ nomorJournal: 'JV-202406-0011' }), { daftarAkun: AKUN }).jurnal as JurnalKeuangan;
    const tolak = balikanJurnal(draft, { alasan: 'x', tanggal: '2024-06-22', petugas: 'Uji', peran: 'pjt', nomorJournal: 'JV-202406-0012', daftarAkun: AKUN });
    expect(tolak.rancangan).toBeNull();
    expect(tolak.penyimpangan[0].keterangan).toContain('Draft cukup dibuang');
  });

  it('nomor jurnal memakai pola JV-YYYYMM dengan urutan empat digit', () => {
    expect(nomorJournalUntuk('2024-06', 7)).toBe('JV-202406-0007');
  });
});

describe('rancangJurnalWriteOff — karantina bukan kerugian', () => {
  it('Karantina berpindah antar akun persediaan tanpa menyentuh Laba Rugi', () => {
    const hasil = rancangJurnalWriteOff({ valuasi: valuasi(), qty: 4, sebab: 'Karantina', tanggal: '2024-06-12', petugas: 'Uji', peran: 'qa_manager', nomorJournal: 'JV-202406-0020' });
    expect(hasil.baris).toHaveLength(2);
    expect(hasil.baris.find((b) => b.akunKode === KODE_AKUN.PERSEDIAAN_KARANTINA)?.debit).toBe(168_000_000);
    expect(hasil.baris.find((b) => b.akunKode === KODE_AKUN.PERSEDIAAN_ALKES)?.kredit).toBe(168_000_000);
    expect(hasil.sumberRujukan).toBe('CADANGAN_PENURUNAN_NILAI');
    expect(validasiKeseimbanganJurnal(hasil.baris, AKUN).seimbang).toBe(true);
  });

  it('Kedaluwarsa memindahkan nilai ke beban dengan lawan cadangan penurunan nilai', () => {
    const hasil = rancangJurnalWriteOff({ valuasi: valuasi(), qty: 3, sebab: 'Kedaluwarsa', tanggal: '2024-06-12', petugas: 'Uji', peran: 'qa_manager', nomorJournal: 'JV-202406-0021', pusatBiaya: 'PB-QA' });
    expect(hasil.baris.find((b) => b.akunKode === KODE_AKUN.BEBAN_KERUGIAN_PERSEDIAAN)?.debit).toBe(126_000_000);
    expect(hasil.baris.find((b) => b.akunKode === KODE_AKUN.CADANGAN_PENURUNAN_NILAI)?.kredit).toBe(126_000_000);
    expect(hasil.baris.every((b) => b.nomorBatch === 'LOT-UJI-01' && b.pusatBiayaId === 'PB-QA')).toBe(true);
    expect(hasil.sumberRujukan).toBe('WRITE_OFF_BATCH');
  });
});

describe('rancangJurnalHppPengiriman — HPP hanya saat penyerahan', () => {
  const rute = [
    { nomorBatch: 'LOT-UJI-01', qty: 2 },
    { nomorBatch: 'LOT-UJI-02', qty: 1 }
  ];

  it('menolak selama surat jalan belum diserahkan', () => {
    const hasil = rancangJurnalHppPengiriman({ nomorSuratJalan: 'SJ/2024/06/001', tanggal: '2024-06-14', statusSuratJalan: 'Sedang Picking', fasyankesTujuan: 'RSUD Uji', rute, daftarValuasi: [valuasi(), valuasi({ nomorBatch: 'LOT-UJI-02', nilaiPerUnit: 1_000_000 })], petugas: 'Uji', peran: 'pjt', nomorJournal: 'JV-202406-0030' });
    expect(hasil.rancangan).toBeNull();
    expect(hasil.penolakan[0]).toContain('Sedang Picking');
  });

  it('menolak batch tanpa dasar biaya alih-alih mengarang harga pokok', () => {
    const hasil = rancangJurnalHppPengiriman({ nomorSuratJalan: 'SJ/2024/06/002', tanggal: '2024-06-14', statusSuratJalan: 'Terkirim', fasyankesTujuan: 'RSUD Uji', rute, daftarValuasi: [valuasi()], petugas: 'Uji', peran: 'pjt', nomorJournal: 'JV-202406-0031' });
    expect(hasil.rancangan).toBeNull();
    expect(hasil.betsTanpaDasarBiaya).toEqual(['LOT-UJI-02']);
  });

  it('menghasilkan HPP per batch dan pengurang persediaan yang seimbang', () => {
    const hasil = rancangJurnalHppPengiriman({
      nomorSuratJalan: 'SJ/2024/06/003',
      tanggal: '2024-06-14',
      statusSuratJalan: 'Diterima Penerima',
      fasyankesTujuan: 'RSUD Uji',
      rute,
      daftarValuasi: [valuasi(), valuasi({ nomorBatch: 'LOT-UJI-02', nilaiPerUnit: 1_000_000 })],
      petugas: 'Uji',
      peran: 'pjt',
      nomorJournal: 'JV-202406-0032'
    });
    const barisHpp = hasil.rancangan?.baris ?? [];
    expect(barisHpp[0]).toMatchObject({ akunKode: KODE_AKUN.HPP_ALKES, debit: 85_000_000 });
    expect(barisHpp.filter((b) => b.akunKode === KODE_AKUN.PERSEDIAAN_ALKES).reduce((a, b) => a + b.kredit, 0)).toBe(85_000_000);
    expect(hasil.rancangan?.sumberRujukan).toBe('HPP_PENGIRIMAN');
    expect(validasiKeseimbanganJurnal(barisHpp, AKUN).seimbang).toBe(true);
  });
});
