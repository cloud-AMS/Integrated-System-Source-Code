import { describe, expect, it } from 'vitest';
import { HARI_INI, TITIK_WAKTU, stok, unit } from './fixtures';
import {
  alokasiFEFOSadarKunci,
  stokBebas,
  statusTerkunci,
  statusUnitStok,
  unitLayakKirim
} from '../../src/utils/gudang';
import { alokasikanFEFO } from '../../src/utils/sales';

describe('statusUnitStok & stokBebas — kuota yang boleh dialokasikan', () => {
  it('statusStok kosong dianggap AVAILABLE', () => {
    expect(statusUnitStok({ statusStok: undefined })).toBe('AVAILABLE');
    expect(stokBebas(stok({ jumlahStok: 5, qtyDipesan: undefined }))).toBe(5);
  });

  it.each(['QUARANTINE', 'DAMAGED', 'EXPIRED_LOCK'] as const)('%s terkunci penuh', (statusStokValue) => {
    expect(statusTerkunci(statusStokValue)).toBe(true);
    expect(stokBebas(stok({ jumlahStok: 10, qtyDipesan: 0, statusStok: statusStokValue }))).toBe(0);
  });

  it('AVAILABLE dan RESERVED melepas selisih qtyDipesan, tidak pernah negatif', () => {
    expect(stokBebas(stok({ jumlahStok: 10, qtyDipesan: 3 }))).toBe(7);
    expect(stokBebas(stok({ jumlahStok: 10, qtyDipesan: 10, statusStok: 'RESERVED' }))).toBe(0);
    expect(stokBebas(stok({ jumlahStok: 10, qtyDipesan: 25 }))).toBe(0);
  });
});

describe('unitLayakKirim — Trek B alat berat', () => {
  it('kalibrasi lewat tenggat ditolak dengan sisa hari negatif', () => {
    const hasil = unitLayakKirim(unit({ kalibrasiBerikutnya: '2026-11-04' }), TITIK_WAKTU);
    expect(hasil).toMatchObject({ layakKirim: false, lewatKalibrasi: true, sisaHariKalibrasi: -1 });
    expect(hasil.keterangan).toContain('melewati tenggat kalibrasi');
  });

  it('kalibrasi yang masih berlaku dan tanpa tanggal tetap layak', () => {
    expect(unitLayakKirim(unit({ kalibrasiBerikutnya: '2026-12-05' }), TITIK_WAKTU).sisaHariKalibrasi).toBe(30);
    const tanpa = unitLayakKirim(unit({ kalibrasiBerikutnya: undefined }), TITIK_WAKTU);
    expect(tanpa).toMatchObject({ layakKirim: true, lewatKalibrasi: false, sisaHariKalibrasi: null });
  });

  it.each([
    { statusUnit: 'Ditarik (Recall)' as const, tahapSiklusHidup: undefined },
    { statusUnit: 'Di Gudang' as const, tahapSiklusHidup: 'Decommissioning' as const }
  ])('unit ditarik atau decommissioning tidak boleh dikirim', (baru) => {
    const hasil = unitLayakKirim(unit({ ...baru, kalibrasiBerikutnya: '2030-01-01' }), TITIK_WAKTU);
    expect(hasil.layakKirim).toBe(false);
    expect(hasil.keterangan).toContain('berstatus');
  });
});

/** Kumpulan batch baku: satu kandidat per sebab penolakan, plus dua baris untuk uji urutan. */
function daftarBaku() {
  return [
    stok({ id: 'STK-100', nomorBatch: 'BETS-ED-PERTAMA', jumlahStok: 10, tanggalKedaluwarsa: '2027-01-31', tanggalMasuk: '2026-03-01' }),
    stok({ id: 'STK-101', nomorBatch: 'BETS-ED-KEDUA', jumlahStok: 8, tanggalKedaluwarsa: '2027-06-30', tanggalMasuk: '2026-02-01' }),
    stok({ id: 'STK-102', nomorBatch: 'BETS-BASAH', jumlahStok: 5, tanggalKedaluwarsa: '2026-10-01' }),
    stok({ id: 'STK-103', nomorBatch: 'BETS-KARANTINA', jumlahStok: 4, tanggalKedaluwarsa: '2028-01-01', statusStok: 'QUARANTINE', alasanKunci: 'Investigasi KTD' }),
    stok({ id: 'STK-104', nomorBatch: 'BETS-RUSAK', jumlahStok: 3, tanggalKedaluwarsa: '2028-02-01', statusStok: 'DAMAGED' }),
    stok({ id: 'STK-105', nomorBatch: 'BETS-AGEING', jumlahStok: 2, tanggalKedaluwarsa: '2028-03-01', statusStok: 'EXPIRED_LOCK' }),
    stok({ id: 'STK-106', nomorBatch: 'BETS-TERKUNCI-PESANAN', jumlahStok: 6, qtyDipesan: 6, tanggalKedaluwarsa: '2029-01-01' }),
    stok({ id: 'STK-107', nomorBatch: 'BETS-NOL', jumlahStok: 0, tanggalKedaluwarsa: '2029-06-01' }),
    stok({ id: 'STK-108', nomorBatch: 'BETS-ED-PALING-BASAH', jumlahStok: 7, tanggalKedaluwarsa: '2030-01-01' })
  ];
}

describe('alokasiFEFOSadarKunci — urutan, penolakan, dan kekurangan', () => {
  it('mengurutkan kandidat berdasarkan tanggal kedaluwarsa, bukan tanggal masuk', () => {
    const hasil = alokasiFEFOSadarKunci({ daftarStok: daftarBaku(), jumlahDiminta: 12, dari: TITIK_WAKTU });
    expect(hasil.usulan.map((u) => u.nomorBatch)).toEqual(['BETS-ED-PERTAMA', 'BETS-ED-KEDUA']);
    expect(hasil.usulan[0]).toMatchObject({ diambil: 10, sisaSetelahAmbil: 0, stokId: 'STK-100' });
    expect(hasil.usulan[1]).toMatchObject({ diambil: 2, sisaSetelahAmbil: 6 });
    expect(hasil).toMatchObject({ totalDiambil: 12, sisaKekurangan: 0 });
    expect(hasil.keterangan).toContain('Alokasi FEFO penuh 12 unit dari 2 batch');
  });

  it('kandidat terbaca dalam urutan ED → tanggal masuk → id saat kedaluwarsa sama', () => {
    const hasil = alokasiFEFOSadarKunci({
      daftarStok: [
        stok({ id: 'STK-B', nomorBatch: 'B', tanggalKedaluwarsa: '2027-01-31', tanggalMasuk: '2026-05-01', jumlahStok: 1 }),
        stok({ id: 'STK-A', nomorBatch: 'A', tanggalKedaluwarsa: '2027-01-31', tanggalMasuk: '2026-04-01', jumlahStok: 1 }),
        stok({ id: 'STK-C', nomorBatch: 'C', tanggalKedaluwarsa: '2027-02-01', tanggalMasuk: '2026-01-01', jumlahStok: 1 })
      ],
      jumlahDiminta: 3,
      dari: TITIK_WAKTU
    });
    expect(hasil.usulan.map((u) => u.nomorBatch)).toEqual(['A', 'B', 'C']);
  });

  it('melewati tiap sebab penolakan dengan keterangan yang tepat', () => {
    const hasil = alokasiFEFOSadarKunci({ daftarStok: daftarBaku(), jumlahDiminta: 1, dari: TITIK_WAKTU });
    const sebab = Object.fromEntries(hasil.dilewati.map((d) => [d.nomorBatch, d.sebab]));
    expect(sebab).toMatchObject({
      'BETS-BASAH': 'kedaluwarsa 2026-10-01',
      'BETS-KARANTINA': 'karantina — Investigasi KTD',
      'BETS-RUSAK': 'rusak (bad stock)',
      'BETS-TERKUNCI-PESANAN': 'seluruh kuota terkunci pesanan aktif'
    });
    expect(sebab['BETS-AGEING']).toMatch(/^terkunci ageing — sisa ED \d+ hari$/);
    expect(hasil.batchKedaluwarsaDilewati).toBe(5);
  });

  it('baris jumlahStok 0 tidak muncul sebagai batch yang dilewati', () => {
    const hasil = alokasiFEFOSadarKunci({ daftarStok: daftarBaku(), jumlahDiminta: 1, dari: TITIK_WAKTU });
    expect(hasil.dilewati.map((d) => d.nomorBatch)).not.toContain('BETS-NOL');
  });

  it('karantina tanpa alasan kunci memakai label generik', () => {
    const hasil = alokasiFEFOSadarKunci({
      daftarStok: [stok({ nomorBatch: 'BETS-K', statusStok: 'QUARANTINE', alasanKunci: undefined })],
      jumlahDiminta: 1,
      dari: TITIK_WAKTU
    });
    expect(hasil.dilewati[0].sebab).toBe('karantina / recall hold');
  });

  it('batas tanggal: kedaluwarsa hari ini tetap boleh dialokasikan', () => {
    const hasil = alokasiFEFOSadarKunci({
      daftarStok: [stok({ nomorBatch: 'BETS-HARI-INI', tanggalKedaluwarsa: HARI_INI, jumlahStok: 4 })],
      jumlahDiminta: 4,
      dari: TITIK_WAKTU
    });
    expect(hasil.totalDiambil).toBe(4);
    expect(hasil.batchKedaluwarsaDilewati).toBe(0);
  });

  it('kekurangan dilaporkan saat stok bebas tidak cukup', () => {
    const hasil = alokasiFEFOSadarKunci({ daftarStok: daftarBaku(), jumlahDiminta: 30, dari: TITIK_WAKTU });
    // Kandidat sah = 10 + 8 + 7; seluruh baris terkunci/kedaluwarsa tidak tersentuh.
    expect(hasil.usulan.map((u) => u.diambil)).toEqual([10, 8, 7]);
    expect(hasil).toMatchObject({ totalDiambil: 25, sisaKekurangan: 5 });
    expect(hasil.keterangan).toContain('FEFO hanya mampu menyiapkan 25 dari 30 unit');
    expect(hasil.keterangan).toContain('5 batch terkunci/kedaluwarsa dilewati');
  });

  it('permintaan nol atau negatif tidak mengalokasikan apa pun', () => {
    for (const jumlahDiminta of [0, -5]) {
      const hasil = alokasiFEFOSadarKunci({ daftarStok: daftarBaku(), jumlahDiminta, dari: TITIK_WAKTU });
      expect(hasil).toMatchObject({ usulan: [], totalDiambil: 0, sisaKekurangan: 0 });
    }
  });

  it('menyaring lewat kodeSKU yang lebih diprioritaskan daripada namaAlkes', () => {
    const daftar = [
      stok({ id: 'STK-X', kodeSKU: 'SKU-LAIN', namaAlkes: 'Basal Camera', nomorBatch: 'BETS-LAIN', jumlahStok: 9 }),
      stok({ id: 'STK-Y', kodeSKU: 'SKU-BASC-001', namaAlkes: 'Alat Lain', nomorBatch: 'BETS-UNIT', jumlahStok: 2 })
    ];
    const hasil = alokasiFEFOSadarKunci({
      daftarStok: daftar,
      jumlahDiminta: 20,
      kodeSKU: 'sku-basc-001',
      namaAlkes: 'Basal Camera',
      dari: TITIK_WAKTU
    });
    expect(hasil.usulan.map((u) => u.nomorBatch)).toEqual(['BETS-UNIT']);
    const hanyaNama = alokasiFEFOSadarKunci({ daftarStok: daftar, jumlahDiminta: 20, namaAlkes: 'Basal Camera', dari: TITIK_WAKTU });
    expect(hanyaNama.usulan.map((u) => u.nomorBatch)).toEqual(['BETS-LAIN']);
  });

  it('unit Trek B yang lewat tenggat kalibrasi menggugurkan batch terkait', () => {
    const hasil = alokasiFEFOSadarKunci({
      daftarStok: [stok({ nomorBatch: 'BETS-TREK-B', nomorSerial: 'SN-0001', jumlahStok: 5 })],
      jumlahDiminta: 5,
      daftarUnit: [unit({ nomorSerial: 'SN-0001', kalibrasiBerikutnya: '2026-10-01' })],
      dari: TITIK_WAKTU
    });
    expect(hasil.totalDiambil).toBe(0);
    expect(hasil.dilewati[0].sebab).toMatch(/^Trek B — SN-0001 melewati tenggat kalibrasi/);
  });

  it('pemanggilan sales.alokasikanFEFO adalah wrapper yang konsisten', () => {
    const hasil = alokasikanFEFO(daftarBaku(), 'Basal Camera', 12, TITIK_WAKTU);
    expect(hasil).toMatchObject({ sisaKekurangan: 0, batchKedaluwarsaDilewati: 5 });
    expect(hasil.usulan.map((u) => u.diambil)).toEqual([10, 2]);
    expect(hasil.usulan[0]).toEqual({ nomorBatch: 'BETS-ED-PERTAMA', tanggalKedaluwarsa: '2027-01-31', diambil: 10 });
  });
});
