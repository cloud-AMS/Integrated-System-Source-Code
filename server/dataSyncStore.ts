import fs from 'fs';
import path from 'path';
import type { RbacResourceId, RoleDefinition } from '../src/types/index';
import {
  SEED_DUMMY,
  SEED_SISTEM,
  SEED_IDS_DUMMY,
  adalahDummy,
  PENANDA_SUMBER
} from '../src/data/seedRegistry';

export interface SyncEntry {
  value: unknown;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

interface AppStateDatabase {
  version: number;
  revision: number;
  /** 'seeded' = benih dummy sudah disemai; 'purged' = dummy dibersihkan (go-live), jangan semai lagi. */
  seedState?: 'seeded' | 'purged';
  entries: Record<string, SyncEntry>;
}

export const PUBLIC_SYNC_KEYS = new Set<string>([
  'website_published',
  'website_draft',
  'website_content_v',
  'website_media_v1'
]);

const VALID_KEY_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;

export function isValidSyncKey(key: string): boolean {
  return VALID_KEY_PATTERN.test(key);
}

export function mapSyncKeyToResource(key: string): RbacResourceId {
  if (key.startsWith('website_')) return 'website';
  if (key === 'izin_edar' || key === 'sertifikat') return 'ra-pjt';
  if (key === 'dokumen_mutu' || key === 'capa' || key === 'produk_kembalian' || key === 'audit_internal_iso') {
    return 'qa-mutu';
  }
  if (key === 'inspeksi_qc') return 'qc-inspeksi';
  if (key === 'laporan_ktd' || key === 'penarikan_produk') return 'pms-vigilance';
  if (key === 'stok_gudang' || key === 'log_suhu' || key === 'pest_control' || key.startsWith('gudang_')) {
    return 'gudang-logistik';
  }
  if (key === 'layanan_teknis') return 'teknisi-service';
  if (key === 'bets_produksi') return 'produksi-cpakb';
  if (key === 'pemasok' || key === 'purchase_order') return 'purchasing-procurement';
  if (
    key === 'penjualan' ||
    key.startsWith('sales_') ||
    key.startsWith('surat_') ||
    key.startsWith('listmonk_') ||
    key.startsWith('quotation_')
  ) {
    return 'sales-marketing';
  }
  if (
    key === 'pelatihan' ||
    key === 'pelatihan_personil' ||
    key === 'sertifikasi_pegawai' ||
    key.startsWith('hris_')
  ) {
    return 'hrd-pelatihan';
  }
  if (key === 'transaksi' || key === 'transaksi_keuangan' || key.startsWith('keuangan_')) {
    return 'finance-akuntansi';
  }
  if (key === 'audit_trail') return 'audit-trail';
  if (key === 'rb_akun' || key === 'rb_role') return 'rbac-admin';
  return 'overview';
}

export function canWriteSyncKey(role: RoleDefinition, key: string): boolean {
  // Log audit operasional dicatat otomatis saat user sah beraktivitas di modulnya
  if (key === 'audit_trail') return true;

  const resource = mapSyncKeyToResource(key);
  const perms = role.permissions[resource];
  if (!Array.isArray(perms)) return false;

  if (key === 'website_published') {
    return perms.includes('publish');
  }
  return perms.includes('create') || perms.includes('update') || perms.includes('publish');
}

export function canDeleteSyncKey(role: RoleDefinition, key: string): boolean {
  const resource = mapSyncKeyToResource(key);
  const perms = role.permissions[resource];
  if (!Array.isArray(perms)) return false;
  return perms.includes('delete') || perms.includes('update') || perms.includes('publish');
}

export class ServerDataSyncStore {
  private readonly dbFile: string;
  private state: AppStateDatabase;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.dbFile = path.join(dataDir, 'app-state.json');
    this.state = this.loadState();
  }

  private loadState(): AppStateDatabase {
    if (fs.existsSync(this.dbFile)) {
      try {
        const raw = fs.readFileSync(this.dbFile, 'utf8');
        const parsed = JSON.parse(raw) as Partial<AppStateDatabase>;
        if (parsed && typeof parsed === 'object' && parsed.entries && typeof parsed.entries === 'object') {
          return {
            version: typeof parsed.version === 'number' ? parsed.version : 1,
            revision: typeof parsed.revision === 'number' ? parsed.revision : 0,
            seedState: parsed.seedState === 'purged' || parsed.seedState === 'seeded' ? parsed.seedState : undefined,
            entries: parsed.entries as Record<string, SyncEntry>
          };
        }
      } catch {
        /* fallback ke state kosong bila berkas korup */
      }
    }
    const fresh: AppStateDatabase = { version: 1, revision: 0, entries: {} };
    this.persist(fresh);
    return fresh;
  }

  private persist(next: AppStateDatabase = this.state): void {
    const tmp = `${this.dbFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8');
    fs.renameSync(tmp, this.dbFile);
  }

  public getRevision(): number {
    return this.state.revision;
  }

  public hasKey(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.state.entries, key);
  }

  public getPublicState(): { revision: number; entries: Record<string, SyncEntry> } {
    const out: Record<string, SyncEntry> = {};
    for (const key of PUBLIC_SYNC_KEYS) {
      if (this.state.entries[key]) {
        out[key] = this.state.entries[key];
      }
    }
    return { revision: this.state.revision, entries: out };
  }

  public getAllState(sinceVersionMap?: Record<string, number>): {
    revision: number;
    entries: Record<string, SyncEntry>;
  } {
    if (!sinceVersionMap) {
      return { revision: this.state.revision, entries: { ...this.state.entries } };
    }
    const delta: Record<string, SyncEntry> = {};
    for (const [key, entry] of Object.entries(this.state.entries)) {
      if ((sinceVersionMap[key] ?? 0) < entry.version) {
        delta[key] = entry;
      }
    }
    return { revision: this.state.revision, entries: delta };
  }

  public setKey(
    key: string,
    value: unknown,
    actorUsername: string
  ): { entry: SyncEntry; revision: number } {
    const prev = this.state.entries[key];
    const nextVersion = (prev?.version ?? 0) + 1;
    const nextRevision = this.state.revision + 1;
    const entry: SyncEntry = {
      value,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUsername
    };
    this.state.revision = nextRevision;
    this.state.entries[key] = entry;
    this.persist();
    return { entry, revision: nextRevision };
  }

  public deleteKey(key: string): { deleted: boolean; revision: number } {
    if (!this.hasKey(key)) {
      return { deleted: false, revision: this.state.revision };
    }
    delete this.state.entries[key];
    this.state.revision += 1;
    this.persist();
    return { deleted: true, revision: this.state.revision };
  }

  public resetAll(): number {
    this.state.entries = {};
    // Setelah go-live (purged) reset tidak boleh menghidupkan kembali data dummy.
    if (this.state.seedState !== 'purged') this.state.seedState = undefined;
    this.state.revision += 1;
    this.persist();
    return this.state.revision;
  }

  /**
   * Semai benih dummy (bertanda provenance) + seed sistem sekali saat basis data kosong.
   * Menjadi sumber tunggal data dummy di server sehingga semua user membaca salinan yang sama.
   * Setelah purge (seedState 'purged') tidak pernah menyemai dummy lagi.
   */
  public bootstrapSeed(): { disemai: number; kunci: string[] } {
    if (this.state.seedState === 'purged') return { disemai: 0, kunci: [] };
    const sekarang = new Date().toISOString();
    const kunciBaru: string[] = [];
    const gabung: Record<string, unknown[]> = { ...SEED_SISTEM, ...SEED_DUMMY };
    for (const [key, value] of Object.entries(gabung)) {
      if (this.hasKey(key)) {
        // Rekonsiliasi data lama: tandai rekaman ber-id benih yang belum bertanda provenance.
        const ids = SEED_IDS_DUMMY[key];
        const entry = this.state.entries[key];
        if (ids && Array.isArray(entry.value)) {
          let berubah = false;
          const diratakan = entry.value.map((rec) => {
            if (
              rec &&
              typeof rec === 'object' &&
              (rec as Record<string, unknown>)[PENANDA_SUMBER] === undefined &&
              ids.has((rec as { id?: string }).id ?? '')
            ) {
              berubah = true;
              return { ...(rec as object), [PENANDA_SUMBER]: 'dummy' };
            }
            return rec;
          });
          if (berubah) {
            entry.value = diratakan;
            entry.version += 1;
            entry.updatedAt = sekarang;
            entry.updatedBy = 'system-seed';
            this.state.revision += 1;
          }
        }
        continue;
      }
      this.state.entries[key] = { value, version: 1, updatedAt: sekarang, updatedBy: 'system-seed' };
      this.state.revision += 1;
      kunciBaru.push(key);
    }
    this.state.seedState = 'seeded';
    this.persist();
    return { disemai: kunciBaru.length, kunci: kunciBaru };
  }

  /**
   * Buang seluruh rekaman dummy dari semua koleksi array; data input user tetap utuh.
   * Menandai seedState 'purged' agar bootstrap tidak menyemai dummy lagi setelah go-live.
   */
  public purgeDummy(): { revision: number; dihapus: number; kunci: string[] } {
    const sekarang = new Date().toISOString();
    let dihapus = 0;
    const kunciBerubah: string[] = [];
    for (const [key, entry] of Object.entries(this.state.entries)) {
      if (!Array.isArray(entry.value)) continue;
      const ids = SEED_IDS_DUMMY[key];
      const sebelum = entry.value.length;
      const tersisa = entry.value.filter((rec) => {
        if (adalahDummy(rec)) return false;
        // Jaring pengaman rekaman lama tanpa penanda yang id-nya cocok benih dummy.
        if (ids && rec && typeof rec === 'object' && ids.has((rec as { id?: string }).id ?? '')) return false;
        return true;
      });
      const gone = sebelum - tersisa.length;
      if (gone > 0) {
        entry.value = tersisa;
        entry.version += 1;
        entry.updatedAt = sekarang;
        entry.updatedBy = 'system-purge';
        this.state.revision += 1;
        dihapus += gone;
        kunciBerubah.push(key);
      }
    }
    this.state.seedState = 'purged';
    this.persist();
    return { revision: this.state.revision, dihapus, kunci: kunciBerubah };
  }

  /** Status benih untuk tampilan UI go-live. */
  public getSeedState(): 'seeded' | 'purged' | 'pending' {
    return this.state.seedState ?? 'pending';
  }
}
