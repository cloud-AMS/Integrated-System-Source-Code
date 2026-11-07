import { describe, expect, it } from 'vitest';
import { alokasiFEFOSadarKunci, stokBebas } from '../../src/utils/gudang';
import { INITIAL_STOK_GUDANG } from '../../src/data/initialData';
import type { StokGudang } from '../../src/types';

// Golden baseline aturan 1 & 7 (blueprint §3): FEFO sadar-kunci wajib melewati
// QUARANTINE / DAMAGED / EXPIRED_LOCK / kedaluwarsa dan mengurangi kapasitas dengan qtyDipesan.
// Fixture sengaja: LOT-2024-SP08 (karantina) punya ED paling awal — FEFO naif akan salah memilihnya.
// ID batch & jumlah di bawah berasal dari seed DUMMY INITIAL_STOK_GUDANG; ukur ulang di Fase 7.

const ACUAN = new Date('2024-06-15T08:00:00Z'); // selaras ACUAN scripts/cek-jalur-fefo.ts

describe('stokBebas — kapasitas dikurangi qty pesanan aktif', () => {
  it('AVAILABLE = jumlahStok - qtyDipesan; status terkunci = 0', () => {
    const tersedia = INITIAL_STOK_GUDANG.find((s) => s.id === 'STK-002');
    const karantina = INITIAL_STOK_GUDANG.find((s) => s.id === 'STK-006');
    if (!tersedia || !karantina) throw new Error('fixture seed berubah');
    expect(stokBebas(tersedia)).toBe(35); // 46 - 11
    expect(stokBebas(karantina)).toBe(0);
  });
});

describe('alokasiFEFOSadarKunci — jalur Syringe Pump AMS-SP500', () => {
  const hasil = alokasiFEFOSadarKunci({
    daftarStok: INITIAL_STOK_GUDANG,
    jumlahDiminta: 40,
    namaAlkes: 'Syringe Pump Presisi Tinggi AMS-SP500',
    dari: ACUAN,
  });

  it('TIDAK memilih batch karantina ber-ED paling awal LOT-2024-SP08', () => {
    expect(hasil.usulan.some((u) => u.nomorBatch === 'LOT-2024-SP08')).toBe(false);
  });

  it('hanya mengambil LOT-2024-SP12 sebanyak stok bebas (46 - 11 terkunci = 35)', () => {
    expect(hasil.usulan.map((u) => u.nomorBatch)).toEqual(['LOT-2024-SP12']);
    expect(hasil.usulan[0]?.diambil).toBe(35);
    expect(hasil.usulan[0]?.sisaSetelahAmbil).toBe(0);
    expect(hasil.usulan[0]?.stokId).toBe('STK-002');
  });

  it('melaporkan kekurangan + 4 baris SP08 dilewati (2 karantina, 2 rusak), 0 kedaluwarsa', () => {
    expect(hasil.totalDiambil).toBe(35);
    expect(hasil.sisaKekurangan).toBe(5);
    expect(hasil.batchKedaluwarsaDilewati).toBe(0);
    expect(hasil.dilewati).toHaveLength(4);
    expect(hasil.dilewati.every((d) => d.nomorBatch === 'LOT-2024-SP08')).toBe(true);
  });
});

describe('alokasiFEFOSadarKunci — melewatkan batch kedaluwarsa terhadap tanggal acuan', () => {
  const dasar = INITIAL_STOK_GUDANG[0];
  const sintetis: StokGudang[] = [
    { ...dasar, id: 'ED-LAMBAT', kodeSKU: 'UJI-FEFO', namaAlkes: 'Uji FEFO', nomorBatch: 'ED-LAMBAT', tanggalKedaluwarsa: '2024-01-01', statusStok: 'AVAILABLE', qtyDipesan: 0, jumlahStok: 10 },
    { ...dasar, id: 'ED-CEPAT', kodeSKU: 'UJI-FEFO', namaAlkes: 'Uji FEFO', nomorBatch: 'ED-CEPAT', tanggalKedaluwarsa: '2024-12-31', statusStok: 'AVAILABLE', qtyDipesan: 0, jumlahStok: 6 },
  ];

  it('ED yang lewat dari acuan tidak dipakai dan dihitung sebagai kedaluwarsaDilewati', () => {
    const r = alokasiFEFOSadarKunci({ daftarStok: sintetis, jumlahDiminta: 6, kodeSKU: 'UJI-FEFO', dari: ACUAN });
    expect(r.usulan.map((u) => u.nomorBatch)).toEqual(['ED-CEPAT']);
    expect(r.batchKedaluwarsaDilewati).toBe(10);
    expect(r.sisaKekurangan).toBe(0);
  });
});

describe('alokasiFEFOSadarKunci — menghormati qtyDipesan sebagai pengurang kapasitas', () => {
  const dasar = INITIAL_STOK_GUDANG[0];
  const stokTerpesan: StokGudang[] = [
    { ...dasar, id: 'RES-1', kodeSKU: 'UJI-RES', namaAlkes: 'Uji Reservasi', nomorBatch: 'RES-1', tanggalKedaluwarsa: '2030-01-01', statusStok: 'AVAILABLE', qtyDipesan: 10, jumlahStok: 10 },
  ];

  it('seluruh kuota terkunci pesanan aktif => tidak ada yang bisa dialokasikan', () => {
    const r = alokasiFEFOSadarKunci({ daftarStok: stokTerpesan, jumlahDiminta: 3, kodeSKU: 'UJI-RES', dari: ACUAN });
    expect(r.usulan).toHaveLength(0);
    expect(r.dilewati[0]?.sebab).toContain('terkunci pesanan aktif');
    expect(r.sisaKekurangan).toBe(3);
  });
});
