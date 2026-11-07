import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GENESIS_UJI,
  TITIK_WAKTU,
  rantaiDasar,
  resetUrutanStok
} from './fixtures';
import {
  bentukKanonikPergerakan,
  hashPergerakan,
  sha256Hex,
  tambahJejakPergerakan,
  verifikasiRantaiHash
} from '../../src/utils/gudang';

describe('sha256Hex — keluaran harus identik dengan Node crypto', () => {
  const contoh = [
    '',
    'abc',
    'a',
    'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    'A'.repeat(55),
    'B'.repeat(56),
    'C'.repeat(64),
    'D'.repeat(119),
    'E'.repeat(120),
    ' Bergerak 2026-11-05 | SKU-BASC-001 ↔ Rack',
    '日本語とEmoji🚀'
  ];

  for (const isi of contoh) {
    it(`menyamai createHash untuk input ${JSON.stringify(isi.slice(0, 24))} (${isi.length} byte)`, () => {
      expect(sha256Hex(isi)).toBe(createHash('sha256').update(isi, 'utf8').digest('hex'));
    });
  }

  it('mencocokkan vektor FIPS yang dikenal', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('bentukKanonikPergerakan — urutan field tidak boleh berubah', () => {
  beforeEach(() => resetUrutanStok());

  it('memiliki separator dan urutan persis seperti aturan 9', () => {
    const [baris] = rantaiDasar();
    expect(bentukKanonikPergerakan(baris, GENESIS_UJI)).toBe(
      `${baris.waktu}|${baris.kodeSKU}|${baris.nomorBatch}|${baris.dariBin}->${baris.keBin}|${baris.jumlah}|${baris.tipe}|${baris.dokumenRujukan}|${GENESIS_UJI}`
    );
  });

  it('hashPergerakan = sha256Hex(bentukKanonik)', () => {
    const [baris] = rantaiDasar();
    expect(hashPergerakan(baris, GENESIS_UJI)).toBe(sha256Hex(bentukKanonikPergerakan(baris, GENESIS_UJI)));
  });
});

describe('tambahJejakPergerakan — penomoran dan penyambungan', () => {
  beforeEach(() => resetUrutanStok());

  it('baris pertama menyambung ke genesis dan getId auto MOV-00N', () => {
    const daftar = tambahJejakPergerakan([], {
      waktu: `${TITIK_WAKTU.toISOString().slice(0, 10)} 08:00`,
      kodeSKU: 'SKU-UJI',
      namaAlkes: 'Uji',
      nomorBatch: 'BETS-UJI',
      dariBin: 'TERIMA',
      keBin: 'A-01-01-01',
      jumlah: 1,
      satuan: 'Unit',
      tipe: 'Penerimaan',
      pengguna: 'Siti',
      peran: 'pjt',
      dokumenRujukan: 'DO-1',
      alasan: 'uji'
    });
    expect(daftar[0].id).toBe('MOV-001');
    expect(daftar[0].hashSebelum).toBe(GENESIS_UJI);
    expect(daftar[0].hash).toBe(hashPergerakan(daftar[0], GENESIS_UJI));
  });

  it('tidak memutasi daftar masukan dan id mengikuti panjang antrean', () => {
    const awal = rantaiDasar();
    const tambahan = tambahJejakPergerakan(awal, {
      waktu: '2026-11-05 11:00',
      kodeSKU: 'SKU-BASC-001',
      namaAlkes: 'Basal Camera',
      nomorBatch: 'BETS-B',
      dariBin: 'A-03-02-01',
      keBin: 'DOCK',
      jumlah: 2,
      satuan: 'Unit',
      tipe: 'Pengiriman',
      pengguna: 'Siti',
      peran: 'pjt',
      dokumenRujukan: 'DO/2026/002',
      alasan: 'Baseline pengujian'
    });
    expect(awal).toHaveLength(3);
    expect(tambahan).toHaveLength(4);
    expect(tambahan[3].id).toBe('MOV-004');
    expect(tambahan[3].hashSebelum).toBe(awal[2].hash);
  });
});

describe('verifikasiRantaiHash — deteksi penyimpangan', () => {
  beforeEach(() => resetUrutanStok());

  it('rantai hasil tambahJejakPergerakan utuh sejak genesis', () => {
    const hasil = verifikasiRantaiHash(rantaiDasar());
    expect(hasil.utuh).toBe(true);
    expect(hasil.mulaiDariGenesis).toBe(true);
    expect(hasil.jumlahBaris).toBe(3);
    expect(hasil.penyimpangan).toEqual([]);
    expect(hasil.keterangan).toContain('3 mata rantai utuh sejak genesis');
  });

  it('rantai kosong dilaporkan utuh tanpa baris', () => {
    const hasil = verifikasiRantaiHash([]);
    expect(hasil).toMatchObject({ utuh: true, jumlahBaris: 0, mulaiDariGenesis: true, hashTerakhir: GENESIS_UJI });
    expect(hasil.rentangWaktu).toBe('belum ada pergerakan');
  });

  it('isi baris yang diubah memunculkan Hash Tidak Cocok pada indeks yang tepat', () => {
    const daftar = rantaiDasar();
    daftar[1] = { ...daftar[1], jumlah: 6 };
    const hasil = verifikasiRantaiHash(daftar);
    expect(hasil.utuh).toBe(false);
    expect(hasil.penyimpangan).toHaveLength(1);
    expect(hasil.penyimpangan[0]).toMatchObject({ indeks: 1, jenis: 'Hash Tidak Cocok' });
    expect(hasil.keterangan).toContain('Rantai terputus pada 1 titik');
  });

  it('hashSebelum yang disambung ulang memunculkan Sambungan Putus', () => {
    const daftar = rantaiDasar();
    daftar[2] = { ...daftar[2], hashSebelum: GENESIS_UJI };
    const hasil = verifikasiRantaiHash(daftar);
    expect(hasil.penyimpangan.map((p) => p.jenis)).toEqual(['Sambungan Putus']);
    expect(hasil.penyimpangan[0].indeks).toBe(2);
  });

  it('waktu yang mundur memicu Waktu Mundur sekaligus Hash Tidak Cocok (waktu ikut di-hash)', () => {
    const daftar = rantaiDasar();
    daftar[2] = { ...daftar[2], waktu: '2026-11-05 07:00' };
    const hasil = verifikasiRantaiHash(daftar);
    expect(hasil.penyimpangan.map((p) => p.jenis)).toEqual(['Hash Tidak Cocok', 'Waktu Mundur']);
    expect(hasil.penyimpangan.every((p) => p.indeks === 2)).toBe(true);
  });

  it('pemangkasan retensi tetap terbuktikan lewat jangkar baris tersisa', () => {
    const hasil = verifikasiRantaiHash(rantaiDasar().slice(1));
    expect(hasil.utuh).toBe(true);
    expect(hasil.mulaiDariGenesis).toBe(false);
    expect(hasil.keterangan).toContain('dalam jendela retensi');
  });
});
