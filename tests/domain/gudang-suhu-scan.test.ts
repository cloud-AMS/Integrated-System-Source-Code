import { describe, expect, it } from 'vitest';
import {
  daftarStokPerluKunciAgeing,
  deteksiExcursiRantaiDingin,
  hitungReorderPoint,
  nilaiUmurStok,
  tentukanTempatSimpan,
  validasiPemindaian,
} from '../../src/utils/gudang';
import {
  INITIAL_AMBANG_STOK,
  INITIAL_ATURAN_SIMPAN,
  INITIAL_GUDANG_FISIK,
  INITIAL_LOKASI_BIN,
  INITIAL_LOG_SUHU,
  INITIAL_STOK_GUDANG,
  KONFIGURASI_GUDANG_AWAL,
} from '../../src/data/initialData';
import type { LogSuhu, StokGudang } from '../../src/types';

// Golden baseline aturan 3 (directed put-away), 5 (reorder point), 6 (ageing lock),
// rantai dingin (excursion), dan 10 (validasi pemindaian).
//
// DUA UTASAN YANG DIPIN SESUAI PERILAKU KODE, BUKAN BLUEPRINT (butuh keputusan pemilik):
// 1. Blueprint §5 menulis `ROP = rataRataHari × leadTimeHari + safetyStock` (= 14 untuk AMB-01),
//    kode membulatkan tiap komponen ke atas sehingga titikPesan = 9 + 6 = 15.
// 2. Label "Kritis" memakai `sisaHari <= 60` sedangkan penguncian memakai `sisaHari < 60`,
//    jadi pada tepat 60 hari stok berlabel Kritis tetapi belum terkunci.
//
// Baseline ini juga bergantung pada seed INITIAL_* (data DUMMY). Seluruh angka wajib
// diukur ulang pada Fase 7 (hapus data dummy & input data asli), bukan dibiarkan gagal.

const ACUAN = new Date('2024-06-15T08:00:00Z');
const KONFIG = KONFIGURASI_GUDANG_AWAL;

describe('hitungReorderPoint — aturan 5 (ROP = rataRataHari × leadTimeHari + safetyStock)', () => {
  const ambang = INITIAL_AMBANG_STOK.find((a) => a.id === 'AMB-01');
  if (!ambang) throw new Error('fixture AMB-01 hilang');

  it('safetyStock & titikPesan dibulatkan ke atas per komponen (0.4×21 & 0.4×14)', () => {
    const r = hitungReorderPoint(ambang, 20);
    // CATATAN DEBT: blueprint §3 aturan 5 menuliskan ROP = rataRataHari × leadTimeHari + safetyStock
    // tanpa pembulatan (0.4×21 + 0.4×14 = 8.4 + 5.6 = 14), tetapi kode membulatkan (ceil) masing-masing
    // komponen sehingga titikPesan = 9 + 6 = 15. Test ini mengunci perilaku aktual (15).
    expect(r.safetyStock).toBe(6);
    expect(r.titikPesan).toBe(15);
    expect(r.status).toBe('Aman');
    expect(r.usulanQtyBeli).toBe(0);
  });

  it('status Perlu Pesan saat tersedia ≤ titikPesan tetapi > safetyStock', () => {
    const r = hitungReorderPoint(ambang, 15);
    expect(r.status).toBe('Perlu Pesan');
    expect(r.usulanQtyBeli).toBe(11); // max(ceil(max - tersedia)=ceil(26-15)=11, titikPesan - tersedia = 0)
  });

  it('status Kritis saat tersedia ≤ safetyStock', () => {
    const r = hitungReorderPoint(ambang, 6);
    expect(r.status).toBe('Kritis');
    expect(r.hariSebelumHabis).toBe(15); // floor(6 / 0.4)
    expect(r.usulanQtyBeli).toBe(20); // ceil(26 - 6)
  });
});

describe('nilaiUmurStok + daftarStokPerluKunciAgeing — aturan 6 (ambang kunci ED 60 hari)', () => {
  it('pelabelan 60/180 hari dan keputusan perluKunci (< umurKunciEdHari)', () => {
    expect(nilaiUmurStok({ tanggalKedaluwarsa: '2024-01-01' }, KONFIG, ACUAN)).toMatchObject({
      label: 'Kedaluwarsa',
      perluKunci: true,
    });
    expect(nilaiUmurStok({ tanggalKedaluwarsa: '2024-09-23' }, KONFIG, ACUAN)).toMatchObject({
      sisaHari: 100,
      label: 'Perhatian (< 6 Bulan)',
      perluKunci: false,
    });
    expect(nilaiUmurStok({ tanggalKedaluwarsa: '2025-01-01' }, KONFIG, ACUAN)).toMatchObject({
      label: 'Aman',
      perluKunci: false,
    });
  });

  it('sisa ED tepat 60 hari: berlabel Kritis namun TIDAK perluKunci (ambang "<60")', () => {
    // CATATAN DEBT: label "Kritis (< 2 Bulan)" memakai ambang `sisaHari <= 60`, sedangkan perluKunci
    // memakai `sisaHari < umurKunciEdHari` (60). Pada sisa tepat 60 hari stok diberi label Kritis tapi
    // tidak dikunci. Aturan 6 blueprint memakai "< umurKunciEdHari" untuk penguncian, jadi penguncian
    // benar — namun tampilan dan aksi off-by-one. Test mengunci perilaku aktual.
    const r = nilaiUmurStok({ tanggalKedaluwarsa: '2024-08-14' }, KONFIG, ACUAN);
    expect(r.sisaHari).toBe(60);
    expect(r.label).toBe('Kritis (< 2 Bulan)');
    expect(r.perluKunci).toBe(false);
  });

  it('daftarStokPerluKunciAgeing mengecualikan status yang sudah terkunci (seed => 0 kandidat)', () => {
    // Semua kartu stok yang mendekati ED (LOT-2023-B884) sudah berstatus EXPIRED_LOCK, sehingga
    // disaring keluar; stok AVAILABLE lainnya ED-nya > 180 hari terhadap ACUAN 2024-06-15.
    const perlu = daftarStokPerluKunciAgeing({ daftarStok: INITIAL_STOK_GUDANG, konfigurasi: KONFIG, dari: ACUAN });
    expect(perlu).toHaveLength(0);
  });

  it('menangkap stok AVAILABLE yang lolos ambang kunci bila ED-nya mendekat', () => {
    const dasar = INITIAL_STOK_GUDANG[0];
    const near: StokGudang[] = [
      { ...dasar, id: 'AGE-1', nomorBatch: 'AGE-1', tanggalKedaluwarsa: '2024-07-15', statusStok: 'AVAILABLE', qtyDipesan: 0 },
    ];
    const perlu = daftarStokPerluKunciAgeing({ daftarStok: near, konfigurasi: KONFIG, dari: ACUAN });
    expect(perlu.map((p) => p.stok.id)).toEqual(['AGE-1']);
  });
});

describe('deteksiExcursiRantaiDingin — menitDiLuar = jumlahBacaan × (1440 / frekuensiLogSuhuPerHari)', () => {
  it('seed suhu semua Normal & dalam rentang => tidak ada episode', () => {
    const r = deteksiExcursiRantaiDingin(INITIAL_LOG_SUHU, KONFIG);
    expect(r.episode).toHaveLength(0);
    expect(r.wajibKunciColdChain).toBe(false);
    expect(r.bacaanLuar).toBe(0);
  });

  it('3 bacaan cold chain di atas 8°C => 1 episode, menitDiLuar = 3 × 720 = 2160', () => {
    const frekuensi = KONFIG.frekuensiLogSuhuPerHari; // 2 => jarakBacaan 720 menit
    expect(1440 / frekuensi).toBe(720);
    const log: LogSuhu[] = [1, 2, 3].map((i) => ({
      id: `L${i}`,
      sensor: 'Sensor Uji Cold Room',
      zona: 'Cold Chain (2°C - 8°C)',
      suhu: 10,
      kelembaban: 55,
      waktu: `2024-06-15 0${i}:00`,
      status: 'Peringatan Suhu Tinggi',
    }));
    const r = deteksiExcursiRantaiDingin(log, KONFIG);
    expect(r.episode).toHaveLength(1);
    const e = r.episode[0];
    if (!e) throw new Error('episode hilang');
    expect(e.jumlahBacaan).toBe(3);
    expect(e.menitDiLuar).toBe(2160);
    expect(e.arah).toBe('Tinggi');
    expect(e.melewatiAmbang).toBe(true);
    expect(r.wajibKunciColdChain).toBe(true);
  });

  it('satu bacaan tunggal tetap berdurasi minimal 1× jarak bacaan (720 menit)', () => {
    const log: LogSuhu[] = [
      { id: 'S1', sensor: 'Sensor Uji', zona: 'Cold Chain (2°C - 8°C)', suhu: 1.2, kelembaban: 60, waktu: '2024-06-15 01:00', status: 'Peringatan Suhu Rendah' },
    ];
    const r = deteksiExcursiRantaiDingin(log, KONFIG);
    expect(r.episode[0]?.menitDiLuar).toBe(720);
    expect(r.episode[0]?.arah).toBe('Rendah');
    expect(r.episode[0]?.estimasiDurasi).toBe(true);
  });
});

describe('validasiPemindaian — aturan 10 (empat penolakan eksplisit)', () => {
  it('batch tak terdaftar => "Batch Tidak Terdaftar"', () => {
    const r = validasiPemindaian({ daftarBin: INITIAL_LOKASI_BIN, daftarStok: INITIAL_STOK_GUDANG, mode: 'Pengiriman', binDipindai: 'BIN-B02-01-01', nomorBatch: 'LOT-TIDAK-ADA', jumlah: 5 });
    expect(r.hasil).toBe('Batch Tidak Terdaftar');
    expect(r.bolehDiproses).toBe(false);
  });

  it('stok terkunci karantina => "Stok Terkunci Karantina"', () => {
    const r = validasiPemindaian({ daftarBin: INITIAL_LOKASI_BIN, daftarStok: INITIAL_STOK_GUDANG, mode: 'Pengiriman', binDipindai: 'BIN-K02-01-01', nomorBatch: 'LOT-2024-SP08', jumlah: 1 });
    expect(r.hasil).toBe('Stok Terkunci Karantina');
    expect(r.bolehDiproses).toBe(false);
  });

  it('pemindaian sah => "Tervalidasi"', () => {
    const r = validasiPemindaian({ daftarBin: INITIAL_LOKASI_BIN, daftarStok: INITIAL_STOK_GUDANG, mode: 'Pengiriman', binDipindai: 'BIN-B02-01-01', nomorBatch: 'LOT-2024-SP12', jumlah: 5 });
    expect(r.hasil).toBe('Tervalidasi');
    expect(r.bolehDiproses).toBe(true);
  });

  it('jumlah melebihi sisa manifes => "Jumlah Melebihi Manifes"', () => {
    const r = validasiPemindaian({ daftarBin: INITIAL_LOKASI_BIN, daftarStok: INITIAL_STOK_GUDANG, mode: 'Pengiriman', binDipindai: 'BIN-B02-01-01', nomorBatch: 'LOT-2024-SP12', jumlah: 5, qtyManifes: 10, sudahTervalidasi: 8 });
    expect(r.hasil).toBe('Jumlah Melebihi Manifes');
    expect(r.sisaManifes).toBe(2);
  });
});

describe('tentukanTempatSimpan — aturan 3 (directed put-away, prioritas terkecil menang)', () => {
  const args = { daftarAturan: INITIAL_ATURAN_SIMPAN, daftarGudang: INITIAL_GUDANG_FISIK, daftarBin: INITIAL_LOKASI_BIN };

  it('IVD Diagnostik In Vitro diarahkan ke Cold Room GDM-02, bin tercapai terdekat', () => {
    const r = tentukanTempatSimpan({ ...args, kategoriProduk: 'Diagnostik In Vitro', zonaSuhuDibutuhkan: 'Cold Chain (2°C - 8°C)', jumlah: 100 });
    expect(r.sumber).toBe('Aturan');
    expect(r.aturan?.id).toBe('ATR-02');
    expect(r.gudangTujuan?.id).toBe('GDM-02');
    expect(r.bin?.id).toBe('BIN-C01-01-01');
  });

  it('batch recall steril (terikatRecall) menang prioritas => aturan ATR-01 ke Gudang Karantina', () => {
    const r = tentukanTempatSimpan({ ...args, kategoriProduk: 'Non Elektromedik Steril', steril: true, terikatRecall: true, jumlah: 10 });
    expect(r.aturan?.id).toBe('ATR-01');
    expect(r.gudangTujuan?.id).toBe('GDM-03');
  });

  it('penempatan manual tanpa alasan ditolak', () => {
    const r = tentukanTempatSimpan({ ...args, binTujuanManual: 'BIN-B01-03-01', jumlah: 5 });
    expect(r.sumber).toBe('Manual');
    expect(r.penolakan).toContain('alasan');
  });

  it('tanpa aturan yang cocok => "Tidak Ada Aturan Cocok"', () => {
    const r = tentukanTempatSimpan({ ...args, jumlah: 5 });
    expect(r.sumber).toBe('Tidak Ada Aturan Cocok');
    expect(r.penolakan).toBeTruthy();
  });
});
