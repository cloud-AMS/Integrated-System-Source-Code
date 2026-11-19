import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  INITIAL_IZIN_EDAR,
  INITIAL_JEJAK_PERGERAKAN,
  INITIAL_LOKASI_BIN,
  INITIAL_STOK_GUDANG
} from '../../src/data/initialData';
import {
  INITIAL_COA,
  INITIAL_JURNAL_KEUANGAN,
  INITIAL_TETAPAN_PAJAK,
  INITIAL_VALUASI_BATCH
} from '../../src/data/seedKeuangan';
import { db } from '../../src/services/pocketbase';
import type { IzinEdarAlkes, JurnalKeuangan, RoleDefinition } from '../../src/types';
import { GENESIS_JURNAL, hashJurnal, verifikasiRantaiJurnal } from '../../src/utils/akuntansi';
import {
  bangunUlangRantaiJurnal,
  bangunUlangRantaiPergerakan,
  buatManifestDefault,
  kumpulkanIdSeedDiedit,
  saringHanyaDataUser,
  tentukanAsalRekaman
} from '../../src/utils/dataOrigin';
import { tambahJejakPergerakan, verifikasiRantaiHash } from '../../src/utils/gudang';
import {
  PUBLIC_SYNC_KEYS,
  ServerDataSyncStore,
  canDeleteSyncKey,
  canWriteSyncKey,
  isLegacyRbacSyncKey,
  mapSyncKeyToResource
} from '../../server/dataSyncStore';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe('dataOrigin.ts — klasifikasi asal data & penyaringan selektif', () => {
  it('membedakan rekaman dummy, user-diedit, dan user-baru secara akurat', () => {
    const manifest = buatManifestDefault();
    const dummyItem = { ...INITIAL_IZIN_EDAR[0] };
    const editedItem: IzinEdarAlkes = {
      ...INITIAL_IZIN_EDAR[0],
      keterangan: 'Diperbarui oleh PJT setelah verifikasi AKL'
    };
    const userNewItem: IzinEdarAlkes = {
      ...INITIAL_IZIN_EDAR[0],
      id: 'NIE-USER-001',
      nomorIzinEdar: 'KEMENKES RI AKL 99999999'
    };

    expect(tentukanAsalRekaman('izin_edar', dummyItem, manifest)).toBe('dummy');
    expect(tentukanAsalRekaman('izin_edar', editedItem, manifest)).toBe('user-diedit');
    expect(tentukanAsalRekaman('izin_edar', userNewItem, manifest)).toBe('user-baru');

    const detectedEditedIds = kumpulkanIdSeedDiedit('izin_edar', [dummyItem, editedItem, userNewItem]);
    expect(detectedEditedIds).toEqual([INITIAL_IZIN_EDAR[0].id]);
  });

  it('menggunakan kunci majemuk nomorBatch|kodeSKU untuk keuangan_valuasi_batch', () => {
    const manifest = buatManifestDefault();
    const seedVal = INITIAL_VALUASI_BATCH[0];
    expect(tentukanAsalRekaman('keuangan_valuasi_batch', seedVal, manifest)).toBe('dummy');

    const editedVal = { ...seedVal, asal: 'USER' as const, nilaiPerUnit: seedVal.nilaiPerUnit + 1000 };
    expect(tentukanAsalRekaman('keuangan_valuasi_batch', editedVal, manifest)).toBe('user-diedit');

    const userNewVal = {
      ...seedVal,
      nomorBatch: 'BATCH-USER-2026',
      asal: 'USER' as const
    };
    expect(tentukanAsalRekaman('keuangan_valuasi_batch', userNewVal, manifest)).toBe('user-baru');
  });

  it('mengabaikan perbedaan field terpakai pada gudang_bin dan memakai seededAuditIds pada audit_internal_iso', () => {
    const manifest = buatManifestDefault();
    manifest.seededAuditIds = ['AUD-SEED-001'];

    const binDenganTerpakaiBerubah = {
      ...INITIAL_LOKASI_BIN[0],
      terpakai: INITIAL_LOKASI_BIN[0].terpakai + 50
    };
    expect(tentukanAsalRekaman('gudang_bin', binDenganTerpakaiBerubah, manifest)).toBe('dummy');

    const binDieditNama = {
      ...INITIAL_LOKASI_BIN[0],
      labelLokasi: 'Rak Karantina Diubah User'
    };
    expect(tentukanAsalRekaman('gudang_bin', binDieditNama, manifest)).toBe('user-diedit');

    expect(tentukanAsalRekaman('audit_internal_iso', { id: 'AUD-SEED-001' }, manifest)).toBe('dummy');
    expect(tentukanAsalRekaman('audit_internal_iso', { id: 'AUD-USER-001' }, manifest)).toBe('user-baru');
  });

  it('saringHanyaDataUser menghormati pertahankanEditUser, pertahankanStrukturGudang, serta selalu menjaga master_sistem & konfigurasi_user', () => {
    const manifest = buatManifestDefault();
    const seedDummy = { ...INITIAL_IZIN_EDAR[0] };
    const seedEdited = { ...INITIAL_IZIN_EDAR[1], keterangan: 'Suntingan PJT' };
    const userCreated = { ...INITIAL_IZIN_EDAR[0], id: 'NIE-USER-NEW' };

    const keepEdited = saringHanyaDataUser(
      'izin_edar',
      [seedDummy, seedEdited, userCreated],
      manifest,
      { pertahankanEditUser: true }
    );
    expect(keepEdited.map((x) => x.id)).toEqual([seedEdited.id, userCreated.id]);

    const dropEdited = saringHanyaDataUser(
      'izin_edar',
      [seedDummy, seedEdited, userCreated],
      manifest,
      { pertahankanEditUser: false }
    );
    expect(dropEdited.map((x) => x.id)).toEqual([userCreated.id]);

    // Struktur gudang: dipertahankan jika pertahankanStrukturGudang = true
    const binList = [{ ...INITIAL_LOKASI_BIN[0] }];
    expect(
      saringHanyaDataUser('gudang_bin', binList, manifest, {
        pertahankanEditUser: true,
        pertahankanStrukturGudang: true
      })
    ).toHaveLength(1);
    expect(
      saringHanyaDataUser('gudang_bin', binList, manifest, {
        pertahankanEditUser: true,
        pertahankanStrukturGudang: false
      })
    ).toHaveLength(0);

    // Master sistem & konfigurasi user selalu utuh
    expect(saringHanyaDataUser('keuangan_coa', INITIAL_COA, manifest)).toHaveLength(INITIAL_COA.length);
    expect(saringHanyaDataUser('website_draft', [{ judul: 'Situs PT' }], manifest)).toHaveLength(1);
  });

  it('menyambung ulang rantai hash gudang_pergerakan dan keuangan_jurnal dari genesis dengan hasil valid 100%', () => {
    const pergerakanUser = tambahJejakPergerakan([...INITIAL_JEJAK_PERGERAKAN], {
      waktu: '2026-11-15 09:30',
      kodeSKU: INITIAL_JEJAK_PERGERAKAN[0].kodeSKU,
      namaAlkes: INITIAL_JEJAK_PERGERAKAN[0].namaAlkes,
      nomorBatch: 'BATCH-USER-MOV',
      dariBin: 'INBOUND',
      keBin: INITIAL_LOKASI_BIN[0].id,
      jumlah: 5,
      satuan: INITIAL_STOK_GUDANG[0].satuan,
      tipe: 'Penerimaan',
      pengguna: 'Staf Gudang',
      peran: 'Warehouse',
      dokumenRujukan: 'GRN-USER-001',
      alasan: 'Uji rantai pasca-purge'
    });
    // Ambil hanya baris user (index terakhir), lalu bangun ulang rantai dari genesis
    const sisaUser = [pergerakanUser[pergerakanUser.length - 1]];
    const rebuiltMov = bangunUlangRantaiPergerakan(sisaUser);
    const verifMov = verifikasiRantaiHash(rebuiltMov);
    expect(verifMov.utuh).toBe(true);
    expect(verifMov.mulaiDariGenesis).toBe(true);
    expect(verifMov.jumlahBaris).toBe(1);

    const baseJurnal = INITIAL_JURNAL_KEUANGAN[INITIAL_JURNAL_KEUANGAN.length - 1];
    const jurnalUser: JurnalKeuangan = {
      ...baseJurnal,
      id: 'JRN-USER-001',
      nomorJournal: 'JRN-2026-USER-001',
      hashSebelum: baseJurnal.hash,
      hash: hashJurnal(baseJurnal, baseJurnal.hash)
    };
    const rebuiltJrn = bangunUlangRantaiJurnal([jurnalUser]);
    expect(rebuiltJrn[0].hashSebelum).toBe(GENESIS_JURNAL);
    const verifJrn = verifikasiRantaiJurnal(rebuiltJrn);
    expect(verifJrn.valid).toBe(true);
    expect(verifJrn.sejakGenesis).toBe(true);
    expect(verifJrn.jumlahMata).toBe(1);
  });
});

describe('db.purgeDummyData() & db.pulihkanDataDummy() — isolasi localStorage end-to-end', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    if (originalLocalStorage === undefined) {
      Reflect.deleteProperty(globalThis, 'localStorage');
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true
      });
    }
  });

  it('membersihkan dummy sambil mempertahankan data user baru, editan user, master sistem, konfigurasi situs, & membangun ulang hash chain + kapasitas bin', async () => {
    // 1. Pastikan benih awal termuat
    expect(db.getIzinEdar().length).toBeGreaterThan(0);
    expect(db.getCoA().length).toBe(INITIAL_COA.length);
    expect(db.getTetapanPajak().length).toBe(INITIAL_TETAPAN_PAJAK.length);

    // 2. Simulasikan input user: tambah 1 Izin Edar baru + edit 1 Izin Edar bawaan
    const userIzinBaru: IzinEdarAlkes = {
      ...INITIAL_IZIN_EDAR[0],
      id: 'NIE-USER-REAL-01',
      namaAlkes: 'Ventilator ICU Seri User',
      nomorIzinEdar: 'KEMENKES RI AKL 88888888'
    };
    const izinSekarang = db.getIzinEdar();
    const izinDiedit = { ...izinSekarang[0], keterangan: 'Verifikasi resmi PJT' };
    db.saveIzinEdar([userIzinBaru, izinDiedit, ...izinSekarang.slice(1)]);

    // 3. Tambahkan stok user pada bin pertama & pergerakan user
    const targetBin = INITIAL_LOKASI_BIN[0];
    const stokSekarang = db.getStokGudang();
    db.saveStokGudang([
      ...stokSekarang,
      {
        ...stokSekarang[0],
        id: 'STK-USER-REAL-01',
        nomorBatch: 'BTH-USER-99',
        jumlahStok: 12,
        binId: targetBin.id,
        gudangId: targetBin.gudangId
      }
    ]);

    const movUserList = tambahJejakPergerakan(db.getJejakPergerakan(), {
      waktu: '2026-11-15 10:15',
      kodeSKU: INITIAL_STOK_GUDANG[0].kodeSKU,
      namaAlkes: INITIAL_STOK_GUDANG[0].namaAlkes,
      nomorBatch: 'BTH-USER-99',
      dariBin: 'INBOUND',
      keBin: targetBin.id,
      jumlah: 12,
      satuan: INITIAL_STOK_GUDANG[0].satuan,
      tipe: 'Penerimaan',
      pengguna: 'Kepala Gudang',
      peran: 'Warehouse',
      dokumenRujukan: 'GRN-REAL-001',
      alasan: 'Penerimaan riil user'
    });
    db.saveJejakPergerakan(movUserList);

    // 4. Tambahkan jurnal user di akhir rantai jurnal pada periode terbuka (2024-06)
    const jrnList = db.getJurnalKeuangan();
    const lastJrn = jrnList[jrnList.length - 1];
    const tambahRes = db.tambahJurnalKeuangan(
      {
        nomorJournal: 'JRN-2024-REAL-01',
        tanggalTransaksi: '2024-06-20',
        periode: '2024-06',
        sumberRujukan: lastJrn.sumberRujukan,
        idRujukan: 'DOC-USER-01',
        uraian: 'Jurnal operasional user',
        baris: lastJrn.baris,
        status: 'Posted',
        dibuatOleh: 'Finance Lead',
        peranPembuat: 'Finance',
        tanggalPosting: '2024-06-20'
      },
      {
        langsungPosting: true,
        tanggalPosting: '2024-06-20',
        petugas: 'Finance Lead',
        peran: 'Finance'
      }
    );
    expect(tambahRes.jurnal).not.toBeNull();
    const idJurnalUser = tambahRes.jurnal!.id;

    // 5. Simpan konfigurasi user (katalog & situs web)
    db.saveCatalogSettings({ judulKatalog: 'Katalog Resmi User 2026' });
    db.setSettingJson('quotation_identitas_v1', { namaPerusahaan: 'PT User Medika' });

    // 6. Pantau notifikasi reaktif db.subscribe saat purge berjalan
    let notifikasiIzin = 0;
    let notifikasiAll = 0;
    const unsubIzin = db.subscribe('izin_edar', () => {
      notifikasiIzin += 1;
    });
    const unsubAll = db.subscribe('all', () => {
      notifikasiAll += 1;
    });

    // 7. Jalankan selective purge (mempertahankan edit user + struktur gudang)
    const hasilPurge = await db.purgeDummyData({
      pertahankanEditUser: true,
      pertahankanStrukturGudang: true,
      pelaku: 'PJT Resmi',
      peran: 'PJT'
    });

    unsubIzin();
    unsubAll();

    expect(hasilPurge.ok).toBe(true);
    expect(hasilPurge.terhapusDummy).toBeGreaterThan(0);
    expect(notifikasiIzin).toBeGreaterThan(0);
    expect(notifikasiAll).toBeGreaterThan(0);

    // Manifest terupdate
    const manifest = db.getManifestData();
    expect(manifest.dummyDihapus).toBe(true);
    expect(manifest.dummyDihapusOleh).toBe('PJT Resmi');

    // Izin edar hanya menyisakan user baru + editan user
    const izinPascaPurge = db.getIzinEdar();
    expect(izinPascaPurge.map((x) => x.id)).toEqual(['NIE-USER-REAL-01', INITIAL_IZIN_EDAR[0].id]);

    // Koleksi tanpa input user kosong dan TIDAK re-seed zombie saat dipanggil berulang kali
    expect(db.getKaryawanHRIS()).toEqual([]);
    expect(db.getKaryawanHRIS()).toEqual([]);
    expect(db.getAuditInternal()).toEqual([]);

    // Audit trail tetap mencatat minimal log purge resmi
    expect(db.getAuditTrail().some((l) => l.nomorReferensi.startsWith('PURGE-'))).toBe(true);

    // Kapasitas terpakai bin dihitung ulang dari stok user tersisa (12 unit pada targetBin.id)
    const binPascaPurge = db.getLokasiBin().find((b) => b.id === targetBin.id);
    expect(binPascaPurge?.terpakai).toBe(12);

    // Rantai hash pergerakan & jurnal tetap utuh dari genesis
    const verifMov = verifikasiRantaiHash(db.getJejakPergerakan());
    expect(verifMov.utuh).toBe(true);
    expect(verifMov.mulaiDariGenesis).toBe(true);
    expect(db.getJejakPergerakan().map((m) => m.dokumenRujukan)).toEqual(['GRN-REAL-001']);

    const verifJrn = verifikasiRantaiJurnal(db.getJurnalKeuangan());
    expect(verifJrn.valid).toBe(true);
    expect(verifJrn.sejakGenesis).toBe(true);
    expect(db.getJurnalKeuangan().map((j) => j.id)).toEqual([idJurnalUser]);

    // Master sistem & konfigurasi user tetap utuh 100%
    expect(db.getCoA().length).toBe(INITIAL_COA.length);
    expect(db.getTetapanPajak().length).toBe(INITIAL_TETAPAN_PAJAK.length);
    expect(db.getPeriodeBuku().some((p) => p.status === 'Terbuka')).toBe(true);
    expect(db.getCatalogSettings({ judulKatalog: '' })).toEqual({
      judulKatalog: 'Katalog Resmi User 2026'
    });
    expect(db.getSettingJson<{ namaPerusahaan: string }>('quotation_identitas_v1')?.namaPerusahaan).toBe(
      'PT User Medika'
    );

    // 8. Pulihkan kembali data dummy dan verifikasi kondisi kembali normal
    const hasilRestore = await db.pulihkanDataDummy('PJT Resmi', 'PJT');
    expect(hasilRestore.ok).toBe(true);
    expect(db.getManifestData().dummyDihapus).toBe(false);
    expect(db.getIzinEdar().length).toBe(INITIAL_IZIN_EDAR.length);
    expect(db.getCatalogSettings({ judulKatalog: '' })).toEqual({
      judulKatalog: 'Katalog Resmi User 2026'
    });
  });
});

describe('ServerDataSyncStore & otorisasi kunci sinkronisasi server', () => {
  const tempDirs: string[] = [];

  function createTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-sync-test-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()!;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('setBatch menulis pembaruan dan penghapusan secara atomik, memelihara versi, delta query, dan persistensi disk', () => {
    const dir = createTempDir();
    const store = new ServerDataSyncStore(dir);

    const res1 = store.setBatch(
      {
        izin_edar: [{ id: 'NIE-1' }],
        website_published: { isPublished: true, hero: { imageUrl: 'media:hero-1' } },
        website_draft: { heroTitle: 'Draf privat' },
        website_media_v1: [{ id: 'hero-1', dataUrl: 'data:image/png;base64,abc' }],
        'kunci tidak valid!': { ignored: true }
      },
      [],
      'pjt.admin'
    );

    expect(res1.revision).toBe(1);
    expect(Object.keys(res1.updated)).toEqual([
      'izin_edar',
      'website_published',
      'website_draft',
      'website_media_v1'
    ]);
    expect(res1.updated.izin_edar.version).toBe(1);
    expect(res1.updated.izin_edar.updatedBy).toBe('pjt.admin');

    // Endpoint publik hanya mengembalikan konten terbit; draf dan galeri diambil secara privat/on-demand.
    const publicState = store.getPublicState();
    expect(Object.keys(publicState.entries)).toEqual(['website_published']);
    expect(PUBLIC_SYNC_KEYS.has('izin_edar')).toBe(false);
    expect(publicState.entries.website_draft).toBeUndefined();
    expect(publicState.entries.website_media_v1).toBeUndefined();
    expect(store.getEntry('website_media_v1')?.value).toEqual([
      { id: 'hero-1', dataUrl: 'data:image/png;base64,abc' }
    ]);
    expect(store.getPublicWebsiteMedia('hero-1', publicState.entries.website_published.value)).toMatchObject({
      contentType: 'image/png',
      bytes: Buffer.from('abc', 'base64')
    });
    expect(store.getPublicWebsiteMedia('hero-1', { isPublished: false, hero: { imageUrl: 'media:hero-1' } })).toBeNull();
    expect(store.getPublicWebsiteMedia('unpublished', publicState.entries.website_published.value)).toBeNull();

    // Delta query dengan sinceVersionMap hanya mengembalikan entri yang lebih baru
    const res2 = store.setBatch(
      { izin_edar: [{ id: 'NIE-1' }, { id: 'NIE-2' }] },
      ['website_published'],
      'pjt.admin'
    );
    expect(res2.revision).toBe(2);
    expect(res2.updated.izin_edar.version).toBe(2);
    expect(res2.deleted).toEqual(['website_published']);

    const delta = store.getAllState({ izin_edar: 1, website_draft: 1, website_media_v1: 1 });
    expect(Object.keys(delta.entries)).toEqual(['izin_edar']);
    expect(delta.entries.izin_edar.version).toBe(2);

    // Instansiasi ulang dari disk memastikan persistensi atomik tetap utuh
    const reloaded = new ServerDataSyncStore(dir);
    expect(reloaded.getRevision()).toBe(2);
    expect(reloaded.hasKey('izin_edar')).toBe(true);
    expect(reloaded.hasKey('website_published')).toBe(false);
    expect((reloaded.getAllState().entries.izin_edar.value as unknown[]).length).toBe(2);
  });

  it('mapSyncKeyToResource, canWriteSyncKey, dan canDeleteSyncKey menegakkan batas RBAC dengan tepat', () => {
    expect(mapSyncKeyToResource('izin_edar')).toBe('ra-pjt');
    expect(mapSyncKeyToResource('keuangan_jurnal')).toBe('finance-akuntansi');
    expect(mapSyncKeyToResource('gudang_pergerakan')).toBe('gudang-logistik');
    expect(mapSyncKeyToResource('hris_karyawan')).toBe('hrd-pelatihan');
    expect(mapSyncKeyToResource('website_published')).toBe('website');
    expect(mapSyncKeyToResource('sistem_data_manifest')).toBe('it-traceability');

    const roleGudangTerbatas: RoleDefinition = {
      id: 'staf_gudang_terbatas',
      name: 'Staf Gudang Terbatas',
      description: 'Hanya baca dan tambah data gudang tanpa hapus atau terbit situs',
      isSystem: false,
      permissions: {
        'gudang-logistik': ['view', 'create'],
        website: ['view', 'update']
      },
      updatedAt: '2026-11-15T00:00:00.000Z'
    };

    // Boleh tulis modul gudang & kunci sistem otomatis (audit_trail, sistem_data_manifest)
    expect(canWriteSyncKey(roleGudangTerbatas, 'stok_gudang')).toBe(true);
    expect(canWriteSyncKey(roleGudangTerbatas, 'audit_trail')).toBe(true);
    expect(canWriteSyncKey(roleGudangTerbatas, 'sistem_data_manifest')).toBe(true);

    // website_published membutuhkan izin 'publish'
    expect(canWriteSyncKey(roleGudangTerbatas, 'website_draft')).toBe(true);
    expect(canWriteSyncKey(roleGudangTerbatas, 'website_published')).toBe(false);

    // Tidak boleh tulis modul keuangan maupun menghapus key gudang jika hanya punya ['read', 'create']
    expect(canWriteSyncKey(roleGudangTerbatas, 'keuangan_jurnal')).toBe(false);
    expect(canDeleteSyncKey(roleGudangTerbatas, 'stok_gudang')).toBe(false);
  });

  it('menonaktifkan koleksi RBAC lama agar akun dan role hanya tersimpan di RBAC server', () => {
    const dir = createTempDir();
    const legacyEntry = {
      value: [{ id: 'legacy-user', username: 'admin' }],
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      updatedBy: 'legacy-rbac'
    };
    fs.writeFileSync(
      path.join(dir, 'app-state.json'),
      JSON.stringify({
        version: 1,
        revision: 1,
        entries: { rb_akun: legacyEntry, rb_role: legacyEntry }
      }),
      'utf8'
    );
    const store = new ServerDataSyncStore(dir);
    const fullAccessRole: RoleDefinition = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      isSystem: false,
      permissions: {
        overview: ['view', 'create', 'update', 'delete'],
        'rbac-admin': ['view', 'create', 'update', 'delete']
      },
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    expect(isLegacyRbacSyncKey('rb_akun')).toBe(true);
    expect(store.hasKey('rb_akun')).toBe(false);
    expect(store.getAllState().entries).toEqual({});
    expect(store.getAllState({}).entries).toEqual({});
    expect(canWriteSyncKey(fullAccessRole, 'rb_akun')).toBe(false);
    expect(canDeleteSyncKey(fullAccessRole, 'rb_role')).toBe(false);
    expect(() => store.setBatch({ rb_akun: [] }, [], 'admin')).toThrow(/no longer supported/);
    expect(store.hydrateFromCloud({ rb_role: legacyEntry }).appliedKeys).toEqual([]);
  });
});
