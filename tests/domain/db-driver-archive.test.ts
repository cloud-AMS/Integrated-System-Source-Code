import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ServerDbDriverManager } from '../../server/dbDriverManager';
import { ServerDataSyncStore } from '../../server/dataSyncStore';
import { ServerRbacStore } from '../../server/rbacStore';

describe('Arsip PocketBase & Cloud Hydration (Firebase <-> PocketBase)', () => {
  let tmpDataDir: string;
  let tmpRootDir: string;
  const prevEnvDriver = process.env.AMS_DB_DRIVER;

  beforeEach(() => {
    delete process.env.AMS_DB_DRIVER;
    tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-driver-data-'));
    tmpRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-driver-root-'));

    // Salin arsip konfigurasi PocketBase asli dari repo ke root sementara
    const srcArchive = path.resolve(process.cwd(), 'archive', 'pocketbase-legacy', 'pocketbase-config.json');
    const dstDir = path.join(tmpRootDir, 'archive', 'pocketbase-legacy');
    fs.mkdirSync(dstDir, { recursive: true });
    fs.copyFileSync(srcArchive, path.join(dstDir, 'pocketbase-config.json'));
  });

  afterEach(() => {
    if (prevEnvDriver !== undefined) {
      process.env.AMS_DB_DRIVER = prevEnvDriver;
    } else {
      delete process.env.AMS_DB_DRIVER;
    }
    fs.rmSync(tmpDataDir, { recursive: true, force: true });
    fs.rmSync(tmpRootDir, { recursive: true, force: true });
  });

  it('memulai dengan mode firebase dan mengarsipkan seluruh konfigurasi PocketBase tanpa hilang', () => {
    const manager = new ServerDbDriverManager(tmpDataDir, tmpRootDir);
    const summary = manager.getRuntimeSummary();

    expect(summary.activeDriver).toBe('firebase');
    expect(summary.pocketbaseArchived).toBe(true);
    expect(summary.pocketbaseUrl).toBe('http://127.0.0.1:8091');
    expect(summary.pocketbaseArchive.pocketbase.proxyPath).toBe('/api/ams-pb');
    expect(summary.pocketbaseArchive.pocketbase.collectionsOperational).toContain('website_published');
    expect(summary.pocketbaseArchive.pocketbase.collectionsMobileSync).toContain('hris_karyawan');
  });

  it('mempertahankan pengaturan arsip PocketBase saat berpindah antara firebase dan pocketbase', () => {
    const manager1 = new ServerDbDriverManager(tmpDataDir, tmpRootDir);
    const switchedToPb = manager1.switchDriver('pocketbase', 'dev.admin', 'http://127.0.0.1:8091');

    expect(switchedToPb.activeDriver).toBe('pocketbase');
    expect(switchedToPb.pocketbaseUrl).toBe('http://127.0.0.1:8091');
    expect(switchedToPb.pocketbaseArchive.systemdUnit).toContain('pocketbase serve');
    expect(switchedToPb.pocketbaseArchive.caddyfile).toContain('/api/ams-pb/*');

    // Simulasi restart server dengan memuat ulang dari disk
    const manager2 = new ServerDbDriverManager(tmpDataDir, tmpRootDir);
    expect(manager2.getActiveDriver()).toBe('pocketbase');
    expect(manager2.getPocketBaseArchive().pocketbase.collectionsOperational.length).toBeGreaterThan(5);

    const switchedBackFb = manager2.switchDriver('firebase', 'dev.admin');
    expect(switchedBackFb.activeDriver).toBe('firebase');
    expect(switchedBackFb.pocketbaseArchive.pocketbase.url).toBe('http://127.0.0.1:8091');
  });

  it('memulihkan roles, users RBAC, dan app-state ke container baru dari cloud snapshot', () => {
    const rbac = new ServerRbacStore(tmpDataDir);
    const futureTs = new Date(Date.now() + 60_000).toISOString();

    const hydrateRbacRes = rbac.hydrateFromCloud({
      roles: [
        {
          id: 'qa_lead_custom',
          name: 'QA Lead Kustom',
          description: 'Peran kustom hasil migrasi cloud',
          isSystem: false,
          permissions: { 'qa-mutu': ['view', 'create', 'update'] },
          updatedAt: futureTs
        }
      ],
      users: [
        {
          id: 'usr-cloud-1',
          username: 'qa.cloud',
          fullName: 'Sari QA Cloud',
          email: 'sari.qa@ams.co.id',
          roleId: 'qa_lead_custom',
          department: 'Quality Assurance',
          isActive: true,
          isHiddenDeveloper: false,
          passwordHash: 'scrypt$salt$hash',
          createdAt: futureTs,
          updatedAt: futureTs
        }
      ]
    });

    expect(hydrateRbacRes.rolesApplied).toBe(1);
    expect(hydrateRbacRes.usersApplied).toBe(1);
    expect(rbac.listRoles().some((r) => r.id === 'qa_lead_custom')).toBe(true);
    expect(rbac.listUsers().some((u) => u.username === 'qa.cloud')).toBe(true);

    const syncStore = new ServerDataSyncStore(tmpDataDir);
    const hydrateSyncRes = syncStore.hydrateFromCloud({
      website_published: {
        value: { identitas: { namaSingkat: 'AMS Cloud' } },
        version: 3,
        updatedAt: futureTs,
        updatedBy: 'antraderyll@gmail.com'
      },
      'invalid/key': {
        value: { bad: true },
        version: 1,
        updatedAt: futureTs,
        updatedBy: 'attacker'
      }
    });

    expect(hydrateSyncRes.appliedKeys).toEqual(['website_published']);
    const snapshot = syncStore.getAllState();
    expect((snapshot.entries.website_published.value as { identitas: { namaSingkat: string } }).identitas.namaSingkat).toBe(
      'AMS Cloud'
    );
    expect(snapshot.entries['invalid/key']).toBeUndefined();
  });
});
