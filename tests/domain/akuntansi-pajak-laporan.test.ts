import { describe, expect, it } from 'vitest';
import type { AkunCoA, PenarikanProduk, TransaksiKeuangan } from '../../src/types';
import { INITIAL_COA, INITIAL_JURNAL_KEUANGAN, INITIAL_PERIODE_BUKU, INITIAL_VALUASI_BATCH } from '../../src/data/seedKeuangan';
import { INITIAL_STOK_GUDANG } from '../../src/data/initialData';
import {
  KODE_AKUN,
  type BarisFakturPajak,
  type RancanganJurnal,
  alokasiBiayaMutu,
  bukuBesar,
  csvEksporKpp,
  drafXmlEFaktur,
  gerbangPenagihanCdakb,
  gerbangPeriodeBuku,
  hitungLandedCostImpor,
  nilaiPersediaanPerBets,
  rancangJurnalFaktur,
  rancangJurnalLandedCost,
  rekapPpnMasa,
  rekonsiliasiPersediaan,
  saldoPerAkun,
  susunJurnalBerantai,
  susunLabaRugi,
  susunNeraca,
  validasiKeseimbanganJurnal,
  verifikasiRantaiJurnal
} from '../../src/utils/akuntansi';
import { GENESIS_UJI, TITIK_WAKTU, izinEdar, pelanggan, stok } from './fixtures';

/** Tanggal acuan benih (M3/M4 kontrak) — sama yang dipakai modul dan seed. */
const SAMPAI = '2024-06-15';

function akunBenih(kode: string): AkunCoA {
  const temu = INITIAL_COA.find((a) => a.kode === kode);
  if (!temu) throw new Error(`Akun ${kode} tidak ada pada CoA benih`);
  return temu;
}

const transaksi = (baru: Partial<TransaksiKeuangan> = {}): TransaksiKeuangan => ({
  id: 'TRX-UJI-001',
  nomorFaktur: 'INV/AMS/2024/06/001',
  kategori: 'Pendapatan Alkes',
  fasyankesAtauPemasok: 'RSUD Contoh',
  tanggal: '2024-06-10',
  jumlah: 1_000_000,
  statusPembayaran: 'Lunas',
  ppnStatus: 'PPN 11% Terbit Faktur Pajak',
  ...baru
});

const fakturPajak = (baru: Partial<BarisFakturPajak> = {}): BarisFakturPajak => ({
  nomorFaktur: '0000001',
  tanggalFaktur: '2024-06-10',
  npwpPembeli: '01.234.567.8-901.000',
  namaPembeli: 'RSUD Contoh',
  dpp: 1_000_000,
  ppn: 110_000,
  kodeTransaksi: '01',
  ...baru
});

const recall = (baru: Partial<PenarikanProduk> = {}): PenarikanProduk => ({
  id: 'RCL-001',
  nomorRecall: 'RCL/2026/001',
  namaAlkes: 'Basal Camera',
  nomorBatchTerdampak: 'BETS-001',
  alasanRecall: 'Firmware tidak sesuai spesifikasi terdaftar',
  klasifikasiRecall: 'Kelas II (Risiko Medis Sementara)',
  jumlahBeredar: 12,
  jumlahTelahDitarik: 0,
  fasyankesTerdampak: ['RSUD Contoh'],
  tanggalMulaiRecall: '2026-10-01',
  targetSelesai: '2026-12-31',
  status: 'Penarikan Lapangan',
  ...baru
});

describe('hitungLandedCostImpor — PPh 22 bukan harga pokok (koreksi blueprint #1)', () => {
  const dasar = {
    hargaFob: 1_200_000_000,
    angkutLuarNegeri: 85_000_000,
    asuransi: 24_000_000,
    beaMasukPersen: 0,
    pungutanPdbPersen: 0.5,
    ppnImporPersen: 11,
    pph22Persen: 2.5,
    qty: 4
  };

  it('hanya FOB,angkut,asuransi,bea masuk,PDB yang dikapitalisasi', () => {
    const hasil = hitungLandedCostImpor(dasar);
    expect(hasil.totalTercapitalisasi).toBe(1_315_545_000);
    expect(hasil.totalTercapitalisasi).toBe(hasil.fob + hasil.angkut + hasil.asuransi + hasil.beaMasuk + hasil.pdb);
    const kapitalisasi = hasil.uraianKomponen.filter((k) => k.diperlakukan === 'Kapitalisasi persediaan').reduce((a, k) => a + k.nilai, 0);
    expect(kapitalisasi).toBe(hasil.totalTercapitalisasi);
    // PPN impor dan PPh 22 tetap dibayar, tetapi keluar dari nilai buku persediaan.
    expect(hasil.totalPembayaran).toBe(hasil.totalTercapitalisasi + hasil.ppnImporMasukan + hasil.pph22UangMuka + hasil.pph22Beban);
  });

  it('PPh 22 pindah ke beban hanya bila dinyatakan tidak dapat dikreditkan', () => {
    const kredit = hitungLandedCostImpor(dasar);
    expect(kredit.pph22UangMuka).toBe(32_888_625);
    expect(kredit.pph22Beban).toBe(0);

    const beban = hitungLandedCostImpor({ ...dasar, pph22TidakDapatDikreditkan: true });
    expect(beban.pph22UangMuka).toBe(0);
    expect(beban.pph22Beban).toBe(32_888_625);
    expect(beban.totalTercapitalisasi).toBe(kredit.totalTercapitalisasi);
    expect(beban.uraianKomponen.find((k) => k.komponen.startsWith('PPh 22'))?.diperlakukan).toBe('Beban (tidak dapat dikreditkan)');
  });

  it('sisa pembagian per unit dilaporkan, tidak dibulatkan diam-diam', () => {
    const hasil = hitungLandedCostImpor({
      hargaFob: 1_000_000_001,
      angkutLuarNegeri: 0,
      asuransi: 0,
      beaMasukPersen: 0,
      ppnImporPersen: 11,
      pph22Persen: 2.5,
      qty: 3
    });
    expect(hasil.biayaPerUnit).toBe(333_333_333);
    expect(hasil.sisaPembulatan).toBe(2);
    expect(hasil.biayaPerUnit * 3 + hasil.sisaPembulatan).toBe(hasil.totalTercapitalisasi);
  });

  it('qty nol dan negatif tidak membagi dengan nol', () => {
    const input = { hargaFob: 500_000, angkutLuarNegeri: 0, asuransi: 0, beaMasukPersen: 0, ppnImporPersen: 11, pph22Persen: 2.5 };
    expect(hitungLandedCostImpor({ ...input, qty: 0 }).biayaPerUnit).toBe(500_000);
    expect(Number.isFinite(hitungLandedCostImpor({ ...input, qty: -3 }).biayaPerUnit)).toBe(true);
  });
});

describe('rancangJurnalLandedCost — empat sisi, tetap seimbang rupiah bulat', () => {
  const params = (landed: ReturnType<typeof hitungLandedCostImpor>, baru: Partial<Parameters<typeof rancangJurnalLandedCost>[0]> = {}) =>
    rancangJurnalLandedCost({
      landed,
      nomorBatch: 'LOT-IMPOR-01',
      tanggal: '2024-06-10',
      petugas: 'Siti',
      peran: 'pjt',
      nomorJournal: 'JV-202406-0099',
      idRujukan: 'PIBK-UJI-001',
      namaAlkes: 'Basal Camera',
      ...baru
    });

  const imporKredit = hitungLandedCostImpor({
    hargaFob: 1_000_000_001,
    angkutLuarNegeri: 0,
    asuransi: 0,
    beaMasukPersen: 0,
    ppnImporPersen: 11,
    pph22Persen: 2.5,
    qty: 3
  });

  it('menaruh persediaan, PPN Masukan, dan Uang Muka PPh 22 di debet; hutang di kredit', () => {
    const rancangan = params(imporKredit);
    const sisi = (kode: string) => rancangan.baris.find((b) => b.akunKode === kode);
    expect(sisi(KODE_AKUN.PERSEDIAAN_ALKES)?.debit).toBe(1_000_000_001);
    expect(sisi(KODE_AKUN.PERSEDIAAN_ALKES)?.nomorBatch).toBe('LOT-IMPOR-01');
    expect(sisi(KODE_AKUN.PPN_MASUKAN)?.debit).toBe(110_000_000);
    expect(sisi(KODE_AKUN.UANG_MUKA_PPH22)?.debit).toBe(25_000_000);
    expect(sisi(KODE_AKUN.HUTANG_USAHA)?.kredit).toBe(1_135_000_001);
    expect(rancangan.baris.some((b) => b.akunKode === KODE_AKUN.BEBAN_UMUM)).toBe(false);
    expect(validasiKeseimbanganJurnal(rancangan.baris, INITIAL_COA).penyimpangan).toEqual([]);
    expect(rancangan.sumberRujukan).toBe('LANDED_COST_IMPOR');
    expect(rancangan.status).toBe('Draft');
  });

  it('PPh 22 tidak kredit masuk Beban Umum pusat biaya kantor, bukan persediaan', () => {
    const rancangan = params(hitungLandedCostImpor({
      hargaFob: 1_200_000_000,
      angkutLuarNegeri: 85_000_000,
      asuransi: 24_000_000,
      beaMasukPersen: 0,
      pungutanPdbPersen: 0.5,
      ppnImporPersen: 11,
      pph22Persen: 2.5,
      qty: 4,
      pph22TidakDapatDikreditkan: true
    }));
    const beban = rancangan.baris.find((b) => b.akunKode === KODE_AKUN.BEBAN_UMUM);
    expect(beban?.debit).toBe(32_888_625);
    expect(beban?.pusatBiayaId).toBe('PB-HQ');
    expect(rancangan.baris.some((b) => b.akunKode === KODE_AKUN.UANG_MUKA_PPH22)).toBe(false);
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.HUTANG_USAHA)?.kredit).toBe(1_493_143_575);
    expect(validasiKeseimbanganJurnal(rancangan.baris, INITIAL_COA).seimbang).toBe(true);
  });

  it('dibayar tunai mengurangi kas, bukan menambah hutang', () => {
    const rancangan = params(imporKredit, { dibayarTunai: true });
    expect(rancangan.baris.some((b) => b.akunKode === KODE_AKUN.HUTANG_USAHA)).toBe(false);
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.KAS)?.kredit).toBe(1_135_000_001);
  });

  it('masuk rantai benih dan tetap terverifikasi setelah posting', () => {
    const { jurnal, penyimpangan } = susunJurnalBerantai(INITIAL_JURNAL_KEUANGAN, params(imporKredit), {
      daftarAkun: INITIAL_COA,
      daftarPeriode: INITIAL_PERIODE_BUKU,
      tolakPeriodeTertutup: true
    });
    expect(penyimpangan).toEqual([]);
    expect(jurnal?.hashSebelum).toBe(INITIAL_JURNAL_KEUANGAN[INITIAL_JURNAL_KEUANGAN.length - 1].hash);
    const daftar = [...INITIAL_JURNAL_KEUANGAN, ...(jurnal ? [jurnal] : [])];
    const hasil = verifikasiRantaiJurnal(daftar);
    expect(hasil.sejakGenesis).toBe(true);
    expect(hasil.jumlahMata).toBe(daftar.length);
    expect(hasil.penyimpangan).toEqual([]);
  });

  it('ditolak bila periode buku dikunci untuk rekonsiliasi PPN', () => {
    const { jurnal, penyimpangan } = susunJurnalBerantai(INITIAL_JURNAL_KEUANGAN, params(imporKredit, { tanggal: '2024-05-20' }), {
      daftarAkun: INITIAL_COA,
      daftarPeriode: INITIAL_PERIODE_BUKU,
      tolakPeriodeTertutup: true
    });
    expect(jurnal).toBeNull();
    expect(penyimpangan.map((p) => p.jenis)).toContain('Periode');
  });
});

describe('gerbangPeriodeBuku — kunci, tutup, dan periode yang belum terdaftar', () => {
  it('menolak Ditutup dan Dikunci dengan sebab yang bisa dibaca pemilik', () => {
    const tutup = gerbangPeriodeBuku('2024-01-15', INITIAL_PERIODE_BUKU);
    expect(tutup).toMatchObject({ boleh: false, terdaftar: true, periode: '2024-01' });
    expect(tutup.sebab.join(' ')).toContain('sudah ditutup');
    expect(tutup.sebab.join(' ')).toContain('Tutup buku massal');

    const kunci = gerbangPeriodeBuku('2024-05-15', INITIAL_PERIODE_BUKU);
    expect(kunci.boleh).toBe(false);
    expect(kunci.sebab.join(' ')).toContain('dikunci untuk tutup buku');
  });

  it('periode Terbuka lolos, periode tak terdaftar lolos tetapi ditandai tidak terdaftar', () => {
    expect(gerbangPeriodeBuku('2024-06-15', INITIAL_PERIODE_BUKU)).toMatchObject({ boleh: true, terdaftar: true, sebab: [] });
    const asing = gerbangPeriodeBuku('2027-03-15', INITIAL_PERIODE_BUKU);
    expect(asing).toMatchObject({ boleh: true, terdaftar: false });
  });

  it('susunJurnalBerantai tanpa tolakPeriodeTertutup tidak diam-diam mengunci', () => {
    const rancangan: RancanganJurnal = {
      nomorJournal: 'JV-202401-0001',
      tanggalTransaksi: '2024-01-10',
      tanggalPosting: null,
      sumberRujukan: 'BEBAN_AUDIT_ISO_CDAKB',
      idRujukan: 'UJI-1',
      uraian: 'Beban Januari pada periode tertutup',
      status: 'Draft',
      dibuatOleh: 'Uji',
      peranPembuat: 'pjt',
      periode: '2024-01',
      baris: [
        { akunKode: KODE_AKUN.BEBAN_UMUM, debit: 10_000, kredit: 0 },
        { akunKode: KODE_AKUN.KAS, debit: 0, kredit: 10_000 }
      ]
    };
    expect(susunJurnalBerantai([], rancangan, { daftarAkun: INITIAL_COA, daftarPeriode: INITIAL_PERIODE_BUKU }).jurnal).not.toBeNull();
    expect(susunJurnalBerantai([], rancangan, {
      daftarAkun: INITIAL_COA,
      daftarPeriode: INITIAL_PERIODE_BUKU,
      tolakPeriodeTertutup: true
    }).jurnal).toBeNull();
  });
});

describe('bukuBesar — hanya Posted dan kontra-aset membaca sisi sendiri', () => {
  const cadangan = akunBenih(KODE_AKUN.CADANGAN_PENURUNAN_NILAI);

  it('menyaring Draft dan Void kecuali diminta eksplisit', () => {
    const posted = bukuBesar({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, akun: akunBenih(KODE_AKUN.PERSEDIAAN_ALKES) });
    const semua = bukuBesar({
      daftarJurnal: INITIAL_JURNAL_KEUANGAN,
      akun: akunBenih(KODE_AKUN.PERSEDIAAN_ALKES),
      statusDiikutkan: ['Posted', 'Draft', 'Void']
    });
    expect(posted.entri.length).toBe(semua.entri.length);
    expect(posted.saldo).toBe(7_970_020_000);
    expect(posted.saldo).toBe(saldoPerAkun({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, daftarAkun: INITIAL_COA, sampai: SAMPAI }).get(KODE_AKUN.PERSEDIAAN_ALKES));
    expect(posted.totalDebit).toBeGreaterThan(0);

    const campur = [...INITIAL_JURNAL_KEUANGAN.slice(0, 2), { ...INITIAL_JURNAL_KEUANGAN[2], status: 'Draft' as const }];
    const hasil = bukuBesar({ daftarJurnal: campur, akun: akunBenih(KODE_AKUN.BEBAN_KALIBRASI) });
    expect(hasil.entri.some((e) => e.nomorJournal === INITIAL_JURNAL_KEUANGAN[2].nomorJournal)).toBe(false);
    expect(hasil.entri.length).toBe(0);
  });

  it('halaman buku besar kontra-aset positif kredit, laporan tetap mengurangi aset', () => {
    const halaman = bukuBesar({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, akun: cadangan });
    const saldo = saldoPerAkun({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, daftarAkun: INITIAL_COA, sampai: SAMPAI });
    expect(halaman.saldoNormal).toBe('Kredit');
    expect(halaman.saldo).toBe(134_460_000);
    expect(saldo.get(KODE_AKUN.CADANGAN_PENURUNAN_NILAI)).toBe(-134_460_000);
  });

  it('genesis rantai benih cocok dengan konstanta uji', () => {
    expect(INITIAL_JURNAL_KEUANGAN[0].hashSebelum).toBe(GENESIS_UJI);
    expect(verifikasiRantaiJurnal(INITIAL_JURNAL_KEUANGAN).valid).toBe(true);
  });
});

describe('laporan benih — angka yang dilihat pemilik di tab Laporan', () => {
  const neraca = susunNeraca({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, daftarAkun: INITIAL_COA, sampai: SAMPAI });
  const labaRugi = susunLabaRugi({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, daftarAkun: INITIAL_COA, dari: '2024-01-01', sampai: SAMPAI });
  const saldo = saldoPerAkun({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, daftarAkun: INITIAL_COA, sampai: SAMPAI });

  it('Neraca seimbang persis dan tanpa catatan', () => {
    expect(neraca.totalAset).toBe(8_213_260_000);
    expect(neraca.totalKewajiban).toBe(13_200_000);
    expect(neraca.totalEkuitas).toBe(8_200_060_000);
    expect(neraca.seimbang).toBe(true);
    expect(neraca.catatan).toEqual([]);
    expect(neraca.aset.map((b) => `${b.kodeAkun}:${b.nilai}`).join(' ')).toBe(
      '1110:79850000 1120:7970020000 1121:294000000 1129:-134460000 1140:3850000'
    );
  });

  it('Laba Rugi nyambung ke baris virtual ekuitas di Neraca', () => {
    expect(labaRugi.totalPendapatan).toBe(120_000_000);
    expect(labaRugi.totalHpp).toBe(0);
    expect(labaRugi.totalBeban).toBe(183_960_000);
    expect(labaRugi.labaUsaha).toBe(-63_960_000);
    expect(labaRugi.labaUsaha).toBe(neraca.labaPeriodeBerjalan);
    expect(labaRugi.hpp).toEqual([]);
    expect(labaRugi.segmenTanpaLabel).toBe(0);
    expect(labaRugi.perSegmen.length).toBe(3);
  });

  it('nilai buku persediaan sama dengan saldo akun persediaan di Neraca', () => {
    const valuasi = nilaiPersediaanPerBets({
      daftarStok: INITIAL_STOK_GUDANG,
      daftarValuasi: INITIAL_VALUASI_BATCH,
      dari: new Date(`${SAMPAI}T08:00:00`)
    });
    expect(valuasi.totalNilaiBuku).toBe(8_264_020_000);
    expect(valuasi.totalNilaiBuku).toBe((saldo.get(KODE_AKUN.PERSEDIAAN_ALKES) ?? 0) + (saldo.get(KODE_AKUN.PERSEDIAAN_KARANTINA) ?? 0));
    expect(valuasi.totalPerluWriteOff).toBe(673_460_000);
    expect(valuasi.betsTanpaDasarBiaya).toEqual([]);
  });

  it('dasar biaya benih masih DUMMY —_phase 7_ wajib diganti', () => {
    expect(INITIAL_VALUASI_BATCH.every((v) => v.asal === 'DUMMY')).toBe(true);
    const valuasi = nilaiPersediaanPerBets({
      daftarStok: INITIAL_STOK_GUDANG,
      daftarValuasi: INITIAL_VALUASI_BATCH,
      dari: new Date(`${SAMPAI}T08:00:00`)
    });
    expect(valuasi.baris.every((b) => b.catatan.includes('DUMMY'))).toBe(true);
  });

  it('batch tanpa dasar biaya dilaporkan, tidak dianggap nol diam-diam', () => {
    const valuasi = nilaiPersediaanPerBets({
      daftarStok: [stok({ nomorBatch: 'BETS-TANPA-BIAYA', jumlahStok: 4 })],
      daftarValuasi: [],
      dari: TITIK_WAKTU
    });
    expect(valuasi.betsTanpaDasarBiaya).toEqual(['BETS-TANPA-BIAYA']);
    expect(valuasi.baris[0].nilaiPerUnit).toBeNull();
    expect(valuasi.baris[0].catatan).toContain('Belum ada dasar biaya');
  });
});

describe('rekonsiliasiPersediaan — jembatan kartu stok ke nilai bersih Neraca', () => {
  const dasar = {
    daftarJurnal: INITIAL_JURNAL_KEUANGAN,
    daftarAkun: INITIAL_COA,
    daftarValuasi: INITIAL_VALUASI_BATCH,
    sampai: SAMPAI,
    dari: TITIK_WAKTU
  };
  const akunPersediaan: string[] = [KODE_AKUN.PERSEDIAAN_ALKES, KODE_AKUN.PERSEDIAAN_KARANTINA, KODE_AKUN.CADANGAN_PENURUNAN_NILAI];

  it('benih utuh seimbang dan cadangan muncul sebagai jembatan, bukan sebagai selisih', () => {
    const hasil = rekonsiliasiPersediaan({ ...dasar, daftarStok: INITIAL_STOK_GUDANG });
    expect(hasil.status).toBe('Seimbang');
    expect(hasil.baris).toEqual([]);
    expect(hasil.totalKartuStok).toBe(8_264_020_000);
    expect(hasil.hargaPokokBukuBesar).toBe(8_264_020_000);
    expect(hasil.cadanganPenurunanNilai).toBe(-134_460_000);
    expect(hasil.nilaiBersihBukuBesar).toBe(8_129_560_000);

    const neraca = susunNeraca({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, daftarAkun: INITIAL_COA, sampai: SAMPAI });
    const persediaanLaporan = neraca.aset.filter((b) => akunPersediaan.includes(b.kodeAkun)).reduce((a, b) => a + b.nilai, 0);
    expect(hasil.nilaiBersihBukuBesar).toBe(persediaanLaporan);
  });

  it('kartu stok basi diuraikan per batch, tidak dipaksakan sama', () => {
    const hasil = rekonsiliasiPersediaan({ ...dasar, daftarStok: INITIAL_STOK_GUDANG.slice(0, 5) });
    expect(hasil.status).toBe('Perlu Rekonsiliasi');
    expect(hasil.totalKartuStok).toBe(6_694_880_000);
    expect(hasil.baris.length).toBe(6);

    const terbesar = hasil.baris[0];
    expect(terbesar.nomorBatch).toBe('LOT-2024-XR03');
    expect(terbesar.nilaiKartuStok).toBe(0);
    expect(terbesar.hargaPokokBukuBesar).toBe(930_000_000);
    expect(terbesar.sebab).toContain('tidak ada pada kartu stok saat ini');

    const terjelaskan = hasil.baris.reduce((a, b) => a + b.selisih, 0) + hasil.tanpaNomorBatch;
    expect(hasil.totalKartuStok + terjelaskan).toBe(hasil.hargaPokokBukuBesar);
  });

  it('draf tidak ikut menjembatani; pergerakan tanpa nomor batch tetap masuk jembatan', () => {
    const rancangan: RancanganJurnal = {
      nomorJournal: 'JV-202406-9001',
      tanggalTransaksi: '2024-06-14',
      tanggalPosting: null,
      sumberRujukan: 'PEMBUKAAN_PERIODE',
      idRujukan: 'UJI-TANPA-BATCH',
      uraian: 'Penyesuaian persediaan tanpa nomor batch',
      status: 'Draft',
      dibuatOleh: 'Uji',
      peranPembuat: 'pjt',
      periode: '2024-06',
      baris: [
        { akunKode: KODE_AKUN.PERSEDIAAN_ALKES, debit: 5_000_000, kredit: 0 },
        { akunKode: KODE_AKUN.HUTANG_USAHA, debit: 0, kredit: 5_000_000 }
      ]
    };
    const mata = susunJurnalBerantai(INITIAL_JURNAL_KEUANGAN, rancangan, { daftarAkun: INITIAL_COA, daftarPeriode: INITIAL_PERIODE_BUKU });
    expect(mata.jurnal?.status).toBe('Draft');
    const campur = [...INITIAL_JURNAL_KEUANGAN, ...(mata.jurnal ? [mata.jurnal] : [])];

    expect(rekonsiliasiPersediaan({ ...dasar, daftarStok: INITIAL_STOK_GUDANG, daftarJurnal: campur })).toEqual(
      rekonsiliasiPersediaan({ ...dasar, daftarStok: INITIAL_STOK_GUDANG })
    );

    const posted = [...INITIAL_JURNAL_KEUANGAN, { ...campur[campur.length - 1], status: 'Posted' as const }];
    const hasil = rekonsiliasiPersediaan({ ...dasar, daftarStok: INITIAL_STOK_GUDANG, daftarJurnal: posted });
    expect(hasil.tanpaNomorBatch).toBe(5_000_000);
    expect(hasil.hargaPokokBukuBesar).toBe(8_269_020_000);
    expect(hasil.status).toBe('Perlu Rekonsiliasi');
    expect(hasil.keterangan).toContain('pergerakan tanpa nomor batch');
  });
});

describe('rekap PPN masa — hanya jurnal Posted dan hanya faktur penjualan', () => {
  it('masa 2024-05 kurang bayar dan menghitung satu faktur', () => {
    expect(rekapPpnMasa({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, masa: '2024-05' })).toMatchObject({
      keluaran: 13_200_000,
      masukan: 3_850_000,
      kurangBayar: 9_350_000,
      lebihBayar: 0,
      jumlahFaktur: 1,
      status: 'Kurang Bayar'
    });
  });

  it('masa 2024-06 nihil meski ada lima jurnal write-off/pembukaan', () => {
    expect(rekapPpnMasa({ daftarJurnal: INITIAL_JURNAL_KEUANGAN, masa: '2024-06' })).toMatchObject({
      keluaran: 0,
      masukan: 0,
      jumlahFaktur: 0,
      status: 'Nihil'
    });
  });

  it('Draft PPN tidak masuk rekap; sumber non-faktur tidak dihitung sebagai faktur', () => {
    const draft = INITIAL_JURNAL_KEUANGAN.map((j) => (j.sumberRujukan === 'FAKTUR_PENJUALAN' ? { ...j, status: 'Draft' as const } : j));
    expect(rekapPpnMasa({ daftarJurnal: draft, masa: '2024-05' })).toMatchObject({ keluaran: 0, jumlahFaktur: 0 });
  });

  it('lebih bayar terjadi bila masukan melebihi keluaran', () => {
    const lebih = rekapPpnMasa({
      daftarJurnal: [
        {
          ...INITIAL_JURNAL_KEUANGAN[0],
          tanggalTransaksi: '2024-06-05',
          periode: '2024-06',
          status: 'Posted',
          sumberRujukan: 'LANDED_COST_IMPOR',
          baris: [
            { akunKode: KODE_AKUN.PERSEDIAAN_ALKES, debit: 1_000_000, kredit: 0 },
            { akunKode: KODE_AKUN.PPN_MASUKAN, debit: 220_000, kredit: 0 },
            { akunKode: KODE_AKUN.HUTANG_USAHA, debit: 0, kredit: 1_220_000 }
          ]
        }
      ],
      masa: '2024-06'
    });
    expect(lebih).toMatchObject({ keluaran: 0, masukan: 220_000, lebihBayar: 220_000, status: 'Lebih Bayar', jumlahFaktur: 0 });
  });
});

describe('rancangJurnalFaktur — perlakuan PPN adalah keputusan pemilik, bukan default senyap', () => {
  const opsi = (baru: Partial<Parameters<typeof rancangJurnalFaktur>[1]> = {}) => ({
    tarifPpnPersen: 11,
    ppnTermasukDalamNominal: false,
    petugas: 'Siti',
    peran: 'pjt',
    urutanNomor: () => 1,
    ...baru
  });

  it('default: nominal faktur adalah DPP, PPN dihitung di atasnya', () => {
    const rancangan = rancangJurnalFaktur(transaksi(), opsi());
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.PENDAPATAN_ALKES)?.kredit).toBe(1_000_000);
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.PPN_KELUARAN)?.kredit).toBe(110_000);
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.KAS)?.debit).toBe(1_110_000);
  });

  it('PPN termasuk nominal: DPP di-back-out sehingga pendapatan tidak lebih besar dari tagihan', () => {
    const rancangan = rancangJurnalFaktur(transaksi(), opsi({ ppnTermasukDalamNominal: true }));
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.PENDAPATAN_ALKES)?.kredit).toBe(900_901);
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.PPN_KELUARAN)?.kredit).toBe(99_099);
    expect(rancangan.baris.find((b) => b.akunKode === KODE_AKUN.KAS)?.debit).toBe(1_000_000);
    expect(validasiKeseimbanganJurnal(rancangan.baris, INITIAL_COA).seimbang).toBe(true);
  });

  it('bebas PPN tidak memunculkan baris PPN; belum lunas masuk piutang', () => {
    const bebas = rancangJurnalFaktur(transaksi({ ppnStatus: 'Bebas PPN', statusPembayaran: 'Menunggu Jatuh Tempo' }), opsi());
    expect(bebas.baris.some((b) => b.akunKode === KODE_AKUN.PPN_KELUARAN)).toBe(false);
    expect(bebas.baris.find((b) => b.akunKode === KODE_AKUN.PIUTANG_DAGANG)?.debit).toBe(1_000_000);
    expect(bebas.sumberRujukan).toBe('FAKTUR_PENJUALAN');
  });

  it('biaya mutu dipetakan ke akun dan pusat biaya yang benar', () => {
    const kalibrasi = rancangJurnalFaktur(
      transaksi({ kategori: 'Biaya Uji Kalibrasi', ppnStatus: 'Bebas PPN', statusPembayaran: 'Menunggu Jatuh Tempo', fasyankesAtauPemasok: 'PT BPFK' }),
      opsi()
    );
    expect(kalibrasi.baris.find((b) => b.akunKode === KODE_AKUN.BEBAN_KALIBRASI)?.pusatBiayaId).toBe('PB-QA');
    expect(kalibrasi.sumberRujukan).toBe('BEBAN_MUTU_KALIBRASI');
    expect(kalibrasi.baris.find((b) => b.akunKode === KODE_AKUN.HUTANG_USAHA)).toBeDefined();
  });
});

describe('draf e-Faktur dan ekspor KPP — draf, bukan pengiriman DJP', () => {
  it('menandai berkas sebagai belum dikirim ke DJP dan meng-escape atribut XML', () => {
    const xml = drafXmlEFaktur([fakturPajak({ namaPembeli: 'RS & "Bina" <Sehat>', nomorFaktur: 'A<B' })], '01.234.567.8-901.000');
    expect(xml).toContain('status="BELUM DIKIRIM KE DJP"');
    expect(xml).toContain('jumlahBaris="1"');
    expect(xml).toContain('nama="RS &amp; &quot;Bina&quot; &lt;Sehat&gt;"');
    expect(xml).not.toContain('<Sehat>');
    expect(xml).toContain('nomorFaktur="A&lt;B"');
  });

  it('baris kosong menghasilkan draf nol baris, bukan berkas rusak', () => {
    const xml = drafXmlEFaktur([], '01.234.567.8-901.000');
    expect(xml).toContain('jumlahBaris="0"');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it('menetralkan sel CSV yang diawali = + - @ agar tidak dieksekusi spreadsheet', () => {
    const csv = csvEksporKpp([
      fakturPajak({ namaPembeli: '=SUM(1,2)' }),
      fakturPajak({ nomorFaktur: '@cmd', namaPembeli: 'RS "Sehat"' })
    ]);
    const baris = csv.split('\n');
    expect(baris[0]).toBe('No. Faktur,Tanggal Faktur,NPWP,Nama Pembeli,DPP,PPN,Kode Transaksi');
    expect(baris[1]).toContain("\"'=SUM(1,2)\"");
    expect(baris[2]).toContain('\'@cmd');
    expect(baris[2]).toContain('"RS ""Sehat"""');
  });
});

describe('gerbangPenagihanCdakb — CDAKB/SDAK sebelum menagih', () => {
  const dasar = {
    daftarStok: [stok({ nomorBatch: 'BETS-001' })],
    daftarRecall: [] as PenarikanProduk[],
    daftarIzinEdar: [izinEdar()],
    pelanggan: pelanggan(),
    dari: TITIK_WAKTU
  };

  it('meloloskan batch layak kirim dengan NIE dan izin fasyankes aktif', () => {
    const hasil = gerbangPenagihanCdakb({ nomorBatch: 'BETS-001', nomorIzinEdar: 'KEMENKES RI AKL 11122233344', ...dasar });
    expect(hasil).toMatchObject({ bolehDitagih: true, sebab: [], lolosNie: true, fasyankesBerizin: true, betsDalamRecall: false });
  });

  it('menahan batch yang sedang recall dan belum ditutup', () => {
    const hasil = gerbangPenagihanCdakb({
      nomorBatch: 'BETS-001',
      nomorIzinEdar: 'KEMENKES RI AKL 11122233344',
      ...dasar,
      daftarRecall: [recall()]
    });
    expect(hasil.bolehDitagih).toBe(false);
    expect(hasil.betsDalamRecall).toBe(true);
    expect(hasil.sebab.join(' ')).toContain('RCL/2026/001');
  });

  it('recall yang sudah Ditutup tidak lagi menahan', () => {
    const hasil = gerbangPenagihanCdakb({
      nomorBatch: 'BETS-001',
      nomorIzinEdar: 'KEMENKES RI AKL 11122233344',
      ...dasar,
      daftarRecall: [recall({ status: 'Ditutup' })]
    });
    expect(hasil.bolehDitagih).toBe(true);
  });

  it('menahan batch karantina, NIE tak terdaftar, dan pelanggan tanpa izin', () => {
    const karantina = gerbangPenagihanCdakb({
      nomorBatch: 'BETS-001',
      nomorIzinEdar: 'KEMENKES RI AKL 11122233344',
      ...dasar,
      daftarStok: [stok({ nomorBatch: 'BETS-001', statusStok: 'QUARANTINE' })]
    });
    expect(karantina.sebab.join(' ')).toContain('QUARANTINE');

    const niePalsu = gerbangPenagihanCdakb({ nomorBatch: 'BETS-001', nomorIzinEdar: 'AKL 1', ...dasar });
    expect(niePalsu.lolosNie).toBe(false);
    expect(niePalsu.sebab.join(' ')).toContain('NIE');

    const tanpaPelanggan = gerbangPenagihanCdakb({
      nomorBatch: 'BETS-001',
      nomorIzinEdar: 'KEMENKES RI AKL 11122233344',
      ...dasar,
      pelanggan: undefined
    });
    expect(tanpaPelanggan.fasyankesBerizin).toBe(false);
    expect(tanpaPelanggan.sebab.join(' ')).toContain('master B2B Customer Profiling');
  });

  it('batch yang tidak ada di kartu stok dilaporkan, bukan diloloskan', () => {
    const hasil = gerbangPenagihanCdakb({ nomorBatch: 'BETS-KOHOR', nomorIzinEdar: 'KEMENKES RI AKL 11122233344', ...dasar });
    expect(hasil.bolehDitagih).toBe(false);
    expect(hasil.sebab.join(' ')).toContain('tidak ada pada kartu stok');
  });
});

describe('alokasiBiayaMutu — ISO 13485: terikat BMR masuk HPP, periodik masuk BOP', () => {
  it('kalau ada BMR, seluruh biaya ikut harga pokok', () => {
    const hasil = alokasiBiayaMutu({ biayaKalibrasi: 4_500_000, nilaiScrap: 1_250_000, nomorBmrTerkait: 'BMR-2024-011' });
    expect(hasil.keHpp).toBe(5_750_000);
    expect(hasil.keBebanOperasional).toBe(0);
    expect(hasil.rincian.every((r) => r.tujuan === 'COGM/HPP')).toBe(true);
    expect(hasil.alasan).toContain('BMR-2024-011');
  });

  it('tanpa BMR tetap beban periode berjalan', () => {
    const hasil = alokasiBiayaMutu({ biayaKalibrasi: 4_500_000, nilaiScrap: 1_250_000 });
    expect(hasil.keHpp).toBe(0);
    expect(hasil.keBebanOperasional).toBe(5_750_000);
    expect(hasil.alasan).toContain('biaya mutu periodik');
  });

  it('nominal dibulatkan ke rupiah, pecahan tidak diikat sebagai desimal', () => {
    expect(alokasiBiayaMutu({ biayaKalibrasi: 1_000.4, nilaiScrap: 1_999.6 }).keBebanOperasional).toBe(3_000);
  });
});
