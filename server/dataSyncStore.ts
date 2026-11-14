import fs from 'fs';
import path from 'path';
import type { RbacResourceId, RoleDefinition } from '../src/types/index';

export interface SyncEntry {
  value: unknown;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

interface AppStateDatabase {
  version: number;
  revision: number;
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
    this.state.revision += 1;
    this.persist();
    return this.state.revision;
  }
}
