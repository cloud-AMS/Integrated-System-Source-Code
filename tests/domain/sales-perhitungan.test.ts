import { describe, expect, it } from 'vitest';
import {
  alokasikanFEFO,
  hargaTerkunciAktif,
  hitungDiskonKuantitas,
  hitungMarginTender,
  hitungRebateTerutang,
  proyeksikanPermintaan,
  statusLimitKredit,
  validasiNomorIzinEdar,
} from '../../src/utils/sales';
import { alokasiFEFOSadarKunci } from '../../src/utils/gudang';
import {
  INITIAL_IZIN_EDAR,
  INITIAL_KONTRAK_HARGA,
  INITIAL_PELANGGAN_B2B,
  INITIAL_PROGRAM_REBATE,
  INITIAL_RIWAYAT_PENJUALAN_BULANAN,
  INITIAL_SKEMA_HARGA,
  INITIAL_STOK_GUDANG,
} from '../../src/data/initialData';

// Golden baseline modul Sales: pembatas untuk matematika komersial hari ini.
// Sebagian angka bersumber dari seed DUMMY INITIAL_* (pelanggan, skema harga, rebate,
// riwayat penjualan) dan harus dipin ulang pada Fase 7, bukan dibiarkan gagal.

const ACUAN_GUDANG = new Date('2024-06-15T08:00:00Z');
const ACUAN_SALES = new Date('2026-11-05T00:00:00Z');

describe('alokasikanFEFO — pembungkus lossy atas alokasiFEFOSadarKunci', () => {
  const nama = 'Syringe Pump Presisi Tinggi AMS-SP500';
  const pembungkus = alokasikanFEFO(INITIAL_STOK_GUDANG, nama, 40, ACUAN_GUDANG);
  const sumber = alokasiFEFOSadarKunci({ daftarStok: INITIAL_STOK_GUDANG, jumlahDiminta: 40, namaAlkes: nama, dari: ACUAN_GUDANG });

  it('membuang kolom dilewati/stokId (hanya nomorBatch/tanggalKedaluwarsa/diambil)', () => {
    expect(pembungkus.usulan).toEqual([{ nomorBatch: 'LOT-2024-SP12', tanggalKedaluwarsa: '2029-04-12', diambil: 35 }]);
    expect(Object.keys(pembungkus.usulan[0] ?? {}).sort()).toEqual(['diambil', 'nomorBatch', 'tanggalKedaluwarsa']);
    expect(pembungkus).not.toHaveProperty('dilewati');
  });

  // Sifat keselamatan yang wajib dijaga selama kontrak alokasi belum disatukan:
  it('hasil alokasi identik dengan versi gudang untuk input yang sama', () => {
    expect(pembungkus.usulan.map((u) => u.nomorBatch)).toEqual(sumber.usulan.map((u) => u.nomorBatch));
    expect(pembungkus.usulan.map((u) => u.diambil)).toEqual(sumber.usulan.map((u) => u.diambil));
    expect(pembungkus.sisaKekurangan).toBe(sumber.sisaKekurangan);
    expect(pembungkus.batchKedaluwarsaDilewati).toBe(sumber.batchKedaluwarsaDilewati);
    // batch karantina LOT-2024-SP08 tidak boleh lolos lewat pembungkus Sales sekalipun
    expect(pembungkus.usulan.some((u) => u.nomorBatch === 'LOT-2024-SP08')).toBe(false);
  });
});

describe('statusLimitKredit — aturan 4.3 Credit Limit & TOP', () => {
  const pelanggan = INITIAL_PELANGGAN_B2B[0]; // PLG-001: batas 500jt, piutang 120jt, tempo 2026-12-15
  if (!pelanggan) throw new Error('fixture pelanggan hilang');

  it('Aman saat paparan ≤ 85%', () => {
    const r = statusLimitKredit(pelanggan, 0, ACUAN_SALES);
    expect(r.status).toBe('Aman');
    expect(r.rasioPersen).toBe(24);
    expect(r.sisaPagar).toBe(380000000);
  });

  it('Perlu Persetujuan Manajemen saat 85% < paparan ≤ 100%', () => {
    const r = statusLimitKredit(pelanggan, 330000000, ACUAN_SALES);
    expect(r.status).toBe('Perlu Persetujuan Manajemen');
    expect(r.rasioPersen).toBe(90);
    expect(r.piutangAkanDatang).toBe(450000000);
  });

  it('Diblokir saat paparan > 100%', () => {
    const r = statusLimitKredit(pelanggan, 450000000, ACUAN_SALES);
    expect(r.status).toBe('Diblokir');
    expect(r.sisaPagar).toBe(-70000000);
  });
});

describe('hitungDiskonKuantitas — aturan 4.2 Multi-Level Pricing', () => {
  const skema = INITIAL_SKEMA_HARGA[0]; // HRS-001: 62.5jt; tier 5@4%, 10@7%
  if (!skema) throw new Error('fixture skema harga hilang');

  it('memakai ambang tertinggi yang terlampaui (12 unit => 7%)', () => {
    const r = hitungDiskonKuantitas(skema, 12);
    expect(r.ambangTerpakai).toBe(10);
    expect(r.diskonPersen).toBe(7);
    expect(r.subtotal).toBe(750000000);
    expect(r.diskonNilai).toBe(52500000);
    expect(r.netSetelahDiskon).toBe(697500000);
    expect(r.hargaPerUnitEfektif).toBe(58125000);
  });

  it('tanpa ambang terlampaui => tanpa diskon', () => {
    const r = hitungDiskonKuantitas(skema, 3);
    expect(r.ambangTerpakai).toBeNull();
    expect(r.diskonNilai).toBe(0);
    expect(r.netSetelahDiskon).toBe(187500000);
  });
});

describe('hargaTerkunciAktif — kontrak aktif mengalahkan skema umum', () => {
  it('menemukan harga terkunci dalam periode kontrak aktif', () => {
    const r = hargaTerkunciAktif(INITIAL_KONTRAK_HARGA, 'PLG-001', 'Patient Monitor Multi-Parameter AMS-V12 Pro', ACUAN_SALES);
    expect(r.kontrak?.id).toBe('KON-001');
    expect(r.baris?.hargaTerkunci).toBe(58500000);
  });

  it('kontrak habis masa => tidak ada harga terkunci', () => {
    const r = hargaTerkunciAktif(INITIAL_KONTRAK_HARGA, 'PLG-005', 'Syringe Pump Presisi Tinggi AMS-SP500', ACUAN_SALES);
    expect(r.kontrak).toBeUndefined();
    expect(r.baris).toBeNull();
  });
});

describe('hitungMarginTender — aturan 2.3 Margin Calculator', () => {
  const r = hitungMarginTender({
    nilaiHps: 100000000,
    hargaPenawaranPersen: 5,
    hppBarang: 70000000,
    biayaLogistik: 5000000,
    komisiPersen: 2,
    biayaInstalasi: 3000000,
    ppnPersen: 11,
  });

  it('harga penawaran, komisi, dan margin bersih sesuai rantai biaya', () => {
    expect(r.hargaPenawaran).toBe(95000000);
    expect(r.komisiNilai).toBe(1900000);
    expect(r.totalBiaya).toBe(79900000);
    expect(r.marginBersih).toBe(15100000);
    expect(r.marginBersihPersen).toBeCloseTo(15.894736842105264, 6);
    expect(r.hargaSetelahPpn).toBe(105450000);
    expect(r.rekomendasi).toContain('Layak diikuti');
  });
});

describe('hitungRebateTerutang — aturan 6.3 Loyalty & Rebate', () => {
  it('target tercapai => rebate penuh', () => {
    const r = hitungRebateTerutang(INITIAL_PROGRAM_REBATE[0]!); // REB-001 46/40, 2.5%
    expect(r.tercapai).toBe(true);
    expect(r.persenDibayar).toBe(2.5);
    expect(r.nilaiRebate).toBe(46000000);
  });

  it('belum tercapai => prorata (batas atas setengah persen rebate)', () => {
    const r = hitungRebateTerutang(INITIAL_PROGRAM_REBATE[1]!); // REB-002 168/220, 3%
    expect(r.tercapai).toBe(false);
    expect(r.kekuranganUnit).toBe(52);
    expect(r.persenDibayar).toBe(1.5);
    expect(r.nilaiRebate).toBe(14700000);
  });
});

describe('proyeksikanPermintaan — aturan 7.2 moving average 3 bulan + tren dijepit ±25%', () => {
  const PM = 'Patient Monitor Multi-Parameter AMS-V12 Pro';
  const SP = 'Syringe Pump Presisi Tinggi AMS-SP500';

  it('tren naik > 25% dijepit ke +25% (proyeksi 31/3 → 13)', () => {
    const r = proyeksikanPermintaan(INITIAL_RIWAYAT_PENJUALAN_BULANAN, PM, 20);
    expect(r.rataRataBulanan).toBeCloseTo(31 / 3, 6);
    expect(r.trenPersen).toBeCloseTo(72.22222222222223, 6); // dilaporkan mentah, tak dijepit
    expect(r.proyeksiBulanBerikutnya).toBe(13); // round(10.333 × 1.25)
    expect(r.titikPesanUlang).toBe(14); // ceil((31/3 / 26) × 35)
    expect(r.status).toBe('Aman');
  });

  it('tren turun < -25% dijepit ke -25% (proyeksi 8/3 → 2), memicu Risiko Overstock', () => {
    const r = proyeksikanPermintaan(INITIAL_RIWAYAT_PENJUALAN_BULANAN, SP, 30);
    expect(r.trenPersen).toBeCloseTo(-38.46153846153846, 6);
    expect(r.proyeksiBulanBerikutnya).toBe(2); // round(2.667 × 0.75)
    expect(r.status).toBe('Risiko Overstock');
  });
});

describe('validasiNomorIzinEdar — aturan 4.1 (format KEMENKES RI AKL/AKD + 11 digit)', () => {
  it('NIE terdaftar & aktif => Lolos', () => {
    const r = validasiNomorIzinEdar('KEMENKES RI AKL 20501819203', INITIAL_IZIN_EDAR, ACUAN_GUDANG);
    expect(r.status).toBe('Lolos');
  });

  it('format menyimpang => Ditolak', () => {
    const r = validasiNomorIzinEdar('AKL-123', INITIAL_IZIN_EDAR, ACUAN_GUDANG);
    expect(r.status).toBe('Ditolak');
    expect(r.keterangan).toContain('menyimpang');
  });

  it('kosong => Ditolak sebelum diisi', () => {
    expect(validasiNomorIzinEdar('   ', INITIAL_IZIN_EDAR, ACUAN_GUDANG).status).toBe('Ditolak');
  });

  it('format valid tetapi tak terdaftar => Ditolak', () => {
    const r = validasiNomorIzinEdar('KEMENKES RI AKL 99999999999', INITIAL_IZIN_EDAR, ACUAN_GUDANG);
    expect(r.status).toBe('Ditolak');
    expect(r.keterangan).toContain('tidak ditemukan');
  });
});
