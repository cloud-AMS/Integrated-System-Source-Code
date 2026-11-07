import { describe, expect, it } from 'vitest';
import { bentukKanonikPergerakan, hashPergerakan, sha256Hex, verifikasiRantaiHash } from '../../src/utils/gudang';
import { INITIAL_JEJAK_PERGERAKAN } from '../../src/data/initialData';

// Golden baseline aturan 9 (blueprint §3): bentuk kanonik rantai hash adalah kontrak antara
// util M3, penjaga benih, dan seed. Bila refactor mengubah satu karakter rangkaian, test ini gagal.
// Catatan: hash terminal yang dipin berasal dari seed DUMMY INITIAL_JEJAK_PERGERAKAN dan wajib
// diukur ulang pada Fase 7 (hapus data dummy & input data asli).

const GENESIS = '0'.repeat(64);

describe('sha256Hex — vektor uji publik (kunci primitif hash)', () => {
  it('mencocokan vektor sha256("abc")', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('mencocokan vektor sha256 string kosong', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('output 64 karakter heks desimal (256 bit)', () => {
    expect(sha256Hex('rantai-pasok-cdakb')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('bentukKanonikPergerakan + hashPergerakan — kontrak aturan 9', () => {
  const barisPertama = INITIAL_JEJAK_PERGERAKAN[0];

  it('merangkai waktu|kodeSKU|nomorBatch|dariBin->keBin|jumlah|tipe|dokumenRujukan|hashSebelum persis', () => {
    expect(bentukKanonikPergerakan(barisPertama, GENESIS)).toBe(
      '2023-08-10 09:15|STR-BNG-04|LOT-2023-B884|DOCK-01->BIN-D04-02-01|85|Penerimaan|TRM/WH/2023/08/019-1|' + GENESIS
    );
  });

  it('hash baris = sha256(bentuk kanonik) dan jangkar baris pertama = 64 angka nol', () => {
    expect(barisPertama.hashSebelum).toBe(GENESIS);
    expect(hashPergerakan(barisPertama, GENESIS)).toBe(sha256Hex(bentukKanonikPergerakan(barisPertama, GENESIS)));
    expect(hashPergerakan(barisPertama, GENESIS)).toBe(barisPertama.hash);
  });

  it('seluruh 19 baris seed terhitung ulang identik dengan hash tersimpan', () => {
    let sebelumnya = GENESIS;
    for (const baris of INITIAL_JEJAK_PERGERAKAN) {
      expect(baris.hashSebelum).toBe(sebelumnya);
      expect(hashPergerakan(baris, sebelumnya)).toBe(baris.hash);
      sebelumnya = baris.hash;
    }
    expect(sebelumnya).toBe('e5e371028343f0fc68a344723c592c084c6dd732efde306c816b80eb0a9a19d0');
  });
});

describe('verifikasiRantaiHash — deteksi putus rantai & waktu mundur', () => {
  it('rantai seed 19 baris utuh sejak genesis', () => {
    const hasil = verifikasiRantaiHash(INITIAL_JEJAK_PERGERAKAN);
    expect(hasil.utuh).toBe(true);
    expect(hasil.jumlahBaris).toBe(19);
    expect(hasil.mulaiDariGenesis).toBe(true);
    expect(hasil.penyimpangan).toHaveLength(0);
    expect(hasil.hashTerakhir).toBe('e5e371028343f0fc68a344723c592c084c6dd732efde306c816b80eb0a9a19d0');
  });

  it('mendeteksi "Sambungan Putus" saat hashSebelum satu baris diubah', () => {
    const rusak = INITIAL_JEJAK_PERGERAKAN.map((m) => ({ ...m }));
    rusak[1] = { ...rusak[1], hashSebelum: 'f'.repeat(64) };
    const hasil = verifikasiRantaiHash(rusak);
    expect(hasil.utuh).toBe(false);
    expect(hasil.penyimpangan.some((p) => p.jenis === 'Sambungan Putus')).toBe(true);
  });

  it('mendeteksi "Waktu Mundur" saat waktu baris didahului', () => {
    const rusak = INITIAL_JEJAK_PERGERAKAN.map((m) => ({ ...m }));
    rusak[5] = { ...rusak[5], waktu: '2000-01-01 00:00' };
    const hasil = verifikasiRantaiHash(rusak);
    expect(hasil.penyimpangan.some((p) => p.jenis === 'Waktu Mundur')).toBe(true);
  });

  it('mendeteksi "Hash Tidak Cocok" saat isi baris disuntik tetapi sambungan utuh', () => {
    const rusak = INITIAL_JEJAK_PERGERAKAN.map((m) => ({ ...m }));
    rusak[3] = { ...rusak[3], jumlah: rusak[3].jumlah + 1 };
    const hasil = verifikasiRantaiHash(rusak);
    expect(hasil.penyimpangan.some((p) => p.jenis === 'Hash Tidak Cocok')).toBe(true);
    expect(hasil.penyimpangan.every((p) => p.jenis !== 'Sambungan Putus')).toBe(true);
  });

  it('jangkar jendela retensi: rantai yang dipangkas tetap "utuh" tapi mulaiDariGenesis false', () => {
    const jendela = INITIAL_JEJAK_PERGERAKAN.slice(3);
    const hasil = verifikasiRantaiHash(jendela);
    expect(hasil.utuh).toBe(true);
    expect(hasil.mulaiDariGenesis).toBe(false);
    expect(hasil.hashTerakhir).toBe('e5e371028343f0fc68a344723c592c084c6dd732efde306c816b80eb0a9a19d0');
  });
});
