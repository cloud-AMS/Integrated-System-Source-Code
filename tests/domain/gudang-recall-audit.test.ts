import { describe, expect, it } from 'vitest';
import { dampakRecallBets, gerbangPenutupanRecall, gerbangSuratJalan, nilaiKesiapanAuditCdb } from '../../src/utils/gudang';
import {
  INITIAL_AMBANG_STOK,
  INITIAL_GUDANG_FISIK,
  INITIAL_IZIN_EDAR,
  INITIAL_JEJAK_PERGERAKAN,
  INITIAL_KIRIMAN_SATU_SEHAT,
  INITIAL_OPNAME_STOK,
  INITIAL_RECALL,
  INITIAL_SINKRONISASI_LKPP,
  INITIAL_STOK_GUDANG,
  INITIAL_SURAT_JALAN,
  INITIAL_TERIMA_BARANG,
  INITIAL_UNIT_SERIAL,
  KONFIGURASI_GUDANG_AWAL,
} from '../../src/data/initialData';

// Golden baseline aturan 11 (kunci recall), gerbang surat jalan (aturan 4), dan skor
// kesiapan audit CDB 15 poin (Tab 1). Angka penerima/unit beredar berasal dari rute seed.
// Rute seed adalah data DUMMY: seluruh angka dipin ulang pada Fase 7 (data asli masuk).

const ACUAN = new Date('2024-06-15T08:00:00Z');

describe('dampakRecallBets — aturan 11 (kunci batch + daftar fasyankes penerima)', () => {
  const dampak = dampakRecallBets({
    nomorBatch: 'LOT-2024-PM44',
    daftarStok: INITIAL_STOK_GUDANG,
    daftarSuratJalan: INITIAL_SURAT_JALAN,
    daftarUnit: INITIAL_UNIT_SERIAL,
  });

  it('mengunci seluruh baris kartu stok batch tersebut (STK-001 = 32 unit)', () => {
    expect(dampak.barisTerkunci.map((b) => b.stokId)).toEqual(['STK-001']);
    expect(dampak.totalUnitGudang).toBe(32);
    expect(dampak.perluSinkronLkpp).toBe(true);
  });

  it('menghimpun unit beredar dari rute surat jalan yang memuat batch', () => {
    expect(dampak.daftarPenerima).toHaveLength(2);
    expect(dampak.unitBeredar).toBe(6); // SJT-001 (2) + SJT-005 (4)
  });

  it('batch tak dikenal => nol unit dan pesan verifikasi', () => {
    const kosong = dampakRecallBets({ nomorBatch: 'LOT-TIDAK-ADA', daftarStok: INITIAL_STOK_GUDANG, daftarSuratJalan: INITIAL_SURAT_JALAN });
    expect(kosong.totalUnitGudang).toBe(0);
    expect(kosong.keterangan).toContain('tidak ditemukan');
  });
});

describe('gerbangPenutupanRecall — recall hanya boleh ditutup setelah tuntas', () => {
  it('recall seed (42 tertarik / 50 beredar, status Penarikan Lapangan) belum boleh ditutup', () => {
    const recall = INITIAL_RECALL[0];
    if (!recall) throw new Error('fixture recall hilang');
    const gate = gerbangPenutupanRecall(recall);
    expect(gate.bolehDitutup).toBe(false);
    expect(gate.sebab).toHaveLength(2);
    expect(gate.sebab[0]).toContain('Unit tertarik 42 dari 50');
    expect(gate.sebab[1]).toContain('Karantina Pusat');
  });
});

describe('gerbangSuratJalan — surat jalan tidak terbit tanpa rute/allocasi penuh', () => {
  const dasar = {
    prefixSuratJalan: KONFIGURASI_GUDANG_AWAL.prefixSuratJalan,
    nomorPesanan: 'SP-UJI-2024',
    dari: ACUAN,
  };

  it('nomor surat jalan memakai prefix/tahun/nomorPesanan dan boleh terbit bila lengkap', () => {
    const rute = [{ urutan: 1, binId: 'BIN-B02-01-01', kodeBin: 'B-02-01-01', nomorBatch: 'LOT-2024-SP12', qty: 5, jarakMeter: 18 }];
    const gate = gerbangSuratJalan({ ...dasar, rute, qtyDiminta: 5, qtyTerkumpul: 5 });
    expect(gate.bolehTerbit).toBe(true);
    expect(gate.sebab).toHaveLength(0);
    expect(gate.nomorSuratJalan).toBe('SJ/CDAKB/2024/SP-UJI-2024');
  });

  it('menolak saat rute kosong dan alokasi FEFO kurang', () => {
    const gate = gerbangSuratJalan({ ...dasar, rute: [], qtyDiminta: 5, qtyTerkumpul: 3 });
    expect(gate.bolehTerbit).toBe(false);
    expect(gate.sebab.some((s) => s.includes('Rute picking belum tersusun'))).toBe(true);
    expect(gate.sebab.some((s) => s.includes('kurang 2 unit'))).toBe(true);
  });
});

describe('nilaiKesiapanAuditCdb — senarai periksa 15 poin (Tab 1)', () => {
  const hasil = nilaiKesiapanAuditCdb({
    daftarStok: INITIAL_STOK_GUDANG,
    daftarPergerakan: INITIAL_JEJAK_PERGERAKAN,
    daftarTerima: INITIAL_TERIMA_BARANG,
    daftarSuratJalan: INITIAL_SURAT_JALAN,
    daftarOpname: INITIAL_OPNAME_STOK,
    daftarLkpp: INITIAL_SINKRONISASI_LKPP,
    daftarFhir: INITIAL_KIRIMAN_SATU_SEHAT,
    daftarAmbang: INITIAL_AMBANG_STOK,
    daftarGudang: INITIAL_GUDANG_FISIK,
    daftarUnit: INITIAL_UNIT_SERIAL,
    daftarIzinEdar: INITIAL_IZIN_EDAR,
    daftarRecall: INITIAL_RECALL,
    konfigurasi: KONFIGURASI_GUDANG_AWAL,
    dari: ACUAN,
  });

  it('selalu memproduksi tepat 15 poin pemeriksaan', () => {
    expect(hasil.pemeriksaan).toHaveLength(15);
  });

  it('pemeriksa rantai hash Lolos saat seed pergerakan utuh (kunci kontrak aturan 9)', () => {
    const rantai = hasil.pemeriksaan.find((p) => p.kode === 'RANTAI-HASH');
    expect(rantai?.status).toBe('Lolos');
  });

  it('skor & predikat konsisten: skor integer 0..100, bahaya => Belum Siap', () => {
    expect(hasil.skorPersen).toBeGreaterThanOrEqual(0);
    expect(hasil.skorPersen).toBeLessThanOrEqual(100);
    expect(['Siap Audit', 'Perlu Pembenahan', 'Belum Siap']).toContain(hasil.predikat);
    if (hasil.jumlahBahaya > 0) expect(hasil.predikat).toBe('Belum Siap');
    else expect(hasil.predikat === 'Belum Siap').toBe(false);
  });
});
