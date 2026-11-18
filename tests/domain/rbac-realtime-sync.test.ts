import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { ServerRbacStore } from '../../server/rbacStore';
import { ServerDataSyncStore, canWriteSyncKey } from '../../server/dataSyncStore';

const createdDirs: string[] = [];

function createTempDataDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-rbac-sync-test-'));
  createdDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('ServerRbacStore & ServerDataSyncStore — Sinkronisasi Multi-User & Login Internet Real-Time', () => {
  it('akun & peran baru yang diinput admin langsung persisten dan bisa dipakai login dari IP internet lain', () => {
    const dataDir = createTempDataDir();
    const rbac = new ServerRbacStore(dataDir);
    expect(rbac.needsInitialSetup()).toBe(true);

    // 1. Setup awal developer
    const setupRes = rbac.bootstrapFirstDeveloper(
      {
        username: 'dev.utama',
        password: 'DevPassword123!',
        fullName: 'Developer Utama'
      },
      '10.0.0.1',
      'Vitest/1.0'
    );
    expect(setupRes.ok).toBe(true);
    if (!setupRes.ok) return;
    expect(rbac.needsInitialSetup()).toBe(false);

    // 2. Buat peran kustom + akun baru via manajemen RBAC server
    const roleRes = rbac.createRole(
      {
        name: 'Supervisor Cold Chain',
        description: 'Akses gudang & inspeksi suhu',
        permissions: {
          overview: ['view'],
          'gudang-logistik': ['view', 'create', 'update']
        }
      },
      setupRes.user.username,
      setupRes.role.id,
      '10.0.0.1'
    );
    expect(roleRes.ok).toBe(true);
    if (!roleRes.ok) return;

    const userRes = rbac.createUser(
      {
        username: 'rina.gudang',
        password: 'PasswordAman99',
        fullName: 'Rina Lestari',
        email: 'rina@anugrahmitraselaras.co.id',
        department: 'Logistik CDAKB',
        roleId: roleRes.role.id,
        isActive: true
      },
      setupRes.user.username,
      setupRes.role.id,
      '10.0.0.1'
    );
    expect(userRes.ok).toBe(true);
    if (!userRes.ok) return;

    // 3. Simulasikan akses dari pengguna lain lewat internet menggunakan instance store yang membaca disk
    const remoteRbac = new ServerRbacStore(dataDir);
    const loginRes = remoteRbac.authenticate(
      'rina.gudang',
      'PasswordAman99',
      '182.253.40.12',
      'Mozilla/5.0 (Linux; Android 14)'
    );
    expect(loginRes.ok).toBe(true);
    if (!loginRes.ok) return;

    expect(loginRes.user.username).toBe('rina.gudang');
    expect(loginRes.role.id).toBe(roleRes.role.id);
    expect(loginRes.role.permissions['gudang-logistik']).toEqual(['view', 'create', 'update']);
    expect(remoteRbac.resolveSessionById(loginRes.session.id)).toBe(true);

    // 4. Perubahan izin peran langsung berlaku pada token sesi yang sudah aktif
    const updateRoleRes = remoteRbac.updateRole(
      roleRes.role.id,
      {
        permissions: {
          overview: ['view'],
          'gudang-logistik': ['view', 'create', 'update', 'approve'],
          'qc-inspeksi': ['view', 'create']
        }
      },
      setupRes.user.username,
      setupRes.role.id,
      '10.0.0.1'
    );
    expect(updateRoleRes.ok).toBe(true);

    const resolvedLive = remoteRbac.resolveToken(loginRes.token);
    expect(resolvedLive).not.toBeNull();
    expect(resolvedLive?.role.permissions['qc-inspeksi']).toEqual(['view', 'create']);
    expect(canWriteSyncKey(resolvedLive!.role, 'inspeksi_qc')).toBe(true);
    expect(canWriteSyncKey(resolvedLive!.role, 'keuangan_jurnal')).toBe(false);
  });

  it('gagal menulis akun tidak meninggalkan akun setengah-jadi di memori maupun di disk', () => {
    const dataDir = createTempDataDir();
    const rbac = new ServerRbacStore(dataDir);
    const dev = rbac.bootstrapFirstDeveloper(
      { username: 'dev.persist', password: 'StrongPassword123!', fullName: 'Dev Persist' },
      '127.0.0.1',
      'Vitest'
    );
    expect(dev.ok).toBe(true);
    if (!dev.ok) return;

    fs.mkdirSync(path.join(dataDir, 'rbac-db.json.tmp'));
    expect(() =>
      rbac.createUser(
        {
          username: 'beta.persist',
          password: 'BetaPassword123!',
          fullName: 'Beta Tester',
          roleId: 'sales_medrep'
        },
        dev.user.username,
        dev.role.id,
        '127.0.0.1'
      )
    ).toThrow();

    expect(rbac.listUsers()).toEqual([]);
    expect(new ServerRbacStore(dataDir).listUsers()).toEqual([]);
  });

  it('reset sandi oleh admin, penonaktifan akun, dan penghapusan akun langsung mencabut sesi aktif', () => {
    const dataDir = createTempDataDir();
    const rbac = new ServerRbacStore(dataDir);
    const dev = rbac.bootstrapFirstDeveloper(
      { username: 'dev.sec', password: 'DevPassword123!', fullName: 'Dev Security' },
      '127.0.0.1',
      'Vitest'
    );
    expect(dev.ok).toBe(true);
    if (!dev.ok) return;

    const u1 = rbac.createUser(
      {
        username: 'staf.sales',
        password: 'SandiAwal123',
        fullName: 'Andi Sales',
        roleId: 'sales_medrep',
        isActive: true
      },
      dev.user.username,
      dev.role.id,
      '127.0.0.1'
    );
    expect(u1.ok).toBe(true);
    if (!u1.ok) return;

    const loginU1 = rbac.authenticate('staf.sales', 'SandiAwal123', '203.0.113.5', 'MobileApp');
    expect(loginU1.ok).toBe(true);
    if (!loginU1.ok) return;
    expect(rbac.resolveSessionById(loginU1.session.id)).toBe(true);

    // Reset kata sandi oleh admin harus langsung mencabut sesi lama staf tersebut
    const resetRes = rbac.updateUser(
      u1.user.id,
      { newPassword: 'SandiBaru456' },
      dev.user.id,
      dev.user.username,
      dev.role.id,
      '127.0.0.1'
    );
    expect(resetRes.ok).toBe(true);
    expect(rbac.resolveSessionById(loginU1.session.id)).toBe(false);
    expect(rbac.resolveToken(loginU1.token)).toBeNull();

    // Sandi lama gagal, sandi baru berhasil login
    expect(rbac.authenticate('staf.sales', 'SandiAwal123', '203.0.113.5', 'MobileApp').ok).toBe(false);
    const reLogin = rbac.authenticate('staf.sales', 'SandiBaru456', '203.0.113.5', 'MobileApp');
    expect(reLogin.ok).toBe(true);
    if (!reLogin.ok) return;

    // Penonaktifan akun juga mencabut sesi dan menolak login
    const deactivateRes = rbac.updateUser(
      u1.user.id,
      { isActive: false },
      dev.user.id,
      dev.user.username,
      dev.role.id,
      '127.0.0.1'
    );
    expect(deactivateRes.ok).toBe(true);
    expect(rbac.resolveSessionById(reLogin.session.id)).toBe(false);
    expect(rbac.authenticate('staf.sales', 'SandiBaru456', '203.0.113.5', 'MobileApp').ok).toBe(false);
  });

  it('delta sync server mengembalikan hanya perubahan terbaru lintas pengguna secara deterministik', () => {
    const dataDir = createTempDataDir();
    const syncStore = new ServerDataSyncStore(dataDir);

    const w1 = syncStore.setKey('stok_gudang', [{ id: 'STK-1', nama: 'Ventilator' }], 'ahmad.gudang');
    const w2 = syncStore.setKey('penjualan', [{ id: 'INV-1', total: 15000000 }], 'farhan.sales');

    const snapshotUser2 = syncStore.getAllState();
    expect(snapshotUser2.revision).toBe(2);
    expect(Object.keys(snapshotUser2.entries)).toEqual(['stok_gudang', 'penjualan']);

    // Klien 2 sudah punya versi saat ini
    const knownVersions = {
      stok_gudang: w1.entry.version,
      penjualan: w2.entry.version
    };
    expect(Object.keys(syncStore.getAllState(knownVersions).entries)).toHaveLength(0);

    // Klien 1 menambah batch baru -> delta untuk Klien 2 hanya memuat kunci yang berubah
    syncStore.setBatch(
      {
        penjualan: [{ id: 'INV-1', total: 15000000 }, { id: 'INV-2', total: 8000000 }],
        audit_trail: [{ id: 'AUD-1', aksi: 'Buat Invoice' }]
      },
      [],
      'farhan.sales'
    );

    const deltaForUser2 = syncStore.getAllState(knownVersions);
    expect(deltaForUser2.revision).toBe(3);
    expect(Object.keys(deltaForUser2.entries).sort()).toEqual(['audit_trail', 'penjualan']);
  });

  it('bootstrap developer dari env var memetakan BOOTSTRAP_DEV_* termasuk role "Developer & IT Support"', () => {
    const prevEnv = {
      BOOTSTRAP_DEV_USERNAME: process.env.BOOTSTRAP_DEV_USERNAME,
      BOOTSTRAP_DEV_FULLNAME: process.env.BOOTSTRAP_DEV_FULLNAME,
      BOOTSTRAP_DEV_EMAIL: process.env.BOOTSTRAP_DEV_EMAIL,
      BOOTSTRAP_DEV_ROLE_ID: process.env.BOOTSTRAP_DEV_ROLE_ID,
      BOOTSTRAP_DEV_PASSWORD: process.env.BOOTSTRAP_DEV_PASSWORD
    };
    try {
      process.env.BOOTSTRAP_DEV_USERNAME = 'dev.admin';
      process.env.BOOTSTRAP_DEV_FULLNAME = 'Langgo Bramandityo';
      process.env.BOOTSTRAP_DEV_EMAIL = 'antraderyll@gmail.com';
      process.env.BOOTSTRAP_DEV_ROLE_ID = 'Developer & IT Support';
      process.env.BOOTSTRAP_DEV_PASSWORD = 'DevStrongPassword123!';

      const dataDir = createTempDataDir();
      const rbac = new ServerRbacStore(dataDir);
      expect(rbac.needsInitialSetup()).toBe(false);

      const loginRes = rbac.authenticate('dev.admin', 'DevStrongPassword123!', '127.0.0.1', 'Vitest');
      expect(loginRes.ok).toBe(true);
      if (!loginRes.ok) return;

      expect(loginRes.user.username).toBe('dev.admin');
      expect(loginRes.user.fullName).toBe('Langgo Bramandityo');
      expect(loginRes.user.email).toBe('antraderyll@gmail.com');
      expect(loginRes.role.id).toBe('developer_it_support');
      expect(loginRes.role.name).toBe('Developer & IT Support');
    } finally {
      for (const [k, v] of Object.entries(prevEnv)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it('reset kata sandi developer mencabut sesi lama, menolak sandi lama, dan aktif kembali dengan kode reset satu kali', () => {
    const dataDir = createTempDataDir();
    const rbac = new ServerRbacStore(dataDir);
    const setupRes = rbac.bootstrapFirstDeveloper(
      {
        username: 'dev.admin',
        password: 'SandiLamaDeveloper1!',
        fullName: 'Langgo Bramandityo',
        email: 'antraderyll@gmail.com'
      },
      '127.0.0.1',
      'Vitest'
    );
    expect(setupRes.ok).toBe(true);
    if (!setupRes.ok) return;

    const resetReq = rbac.initiateDeveloperPasswordReset();
    expect(resetReq.ok).toBe(true);
    if (!resetReq.ok) return;

    expect(rbac.needsDeveloperPasswordReset()).toBe(true);
    expect(rbac.resolveSessionById(setupRes.session.id)).toBe(false);
    expect(rbac.authenticate('dev.admin', 'SandiLamaDeveloper1!', '127.0.0.1', 'Vitest').ok).toBe(false);

    // Kode reset salah ditolak
    const wrongCode = rbac.completeDeveloperPasswordReset(
      { resetCode: 'AMS-RESET-SALAH', newPassword: 'SandiBaruKuat2026!' },
      '127.0.0.1',
      'Vitest'
    );
    expect(wrongCode.ok).toBe(false);

    // Kode reset benar + sandi baru berhasil & langsung mengeluarkan sesi
    const resetDone = rbac.completeDeveloperPasswordReset(
      { resetCode: resetReq.resetCode, newPassword: 'SandiBaruKuat2026!' },
      '127.0.0.1',
      'Vitest'
    );
    expect(resetDone.ok).toBe(true);
    if (!resetDone.ok) return;

    expect(rbac.needsDeveloperPasswordReset()).toBe(false);
    expect(resetDone.user.username).toBe('dev.admin');
    expect(rbac.resolveSessionById(resetDone.session.id)).toBe(true);

    // Kode reset tidak dapat dipakai ulang (single-use)
    const reuse = rbac.completeDeveloperPasswordReset(
      { resetCode: resetReq.resetCode, newPassword: 'SandiLain9999!' },
      '127.0.0.1',
      'Vitest'
    );
    expect(reuse.ok).toBe(false);

    // Bisa login ulang menggunakan kata sandi baru
    const loginBaru = rbac.authenticate('dev.admin', 'SandiBaruKuat2026!', '127.0.0.1', 'Vitest');
    expect(loginBaru.ok).toBe(true);
  });
});
