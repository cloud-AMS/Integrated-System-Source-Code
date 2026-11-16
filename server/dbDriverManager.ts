import fs from 'fs';
import path from 'path';

export type ActiveDbDriver = 'firebase' | 'pocketbase';

export interface PocketBaseArchiveConfig {
  schemaVersion: number;
  driver: 'pocketbase';
  archivedAt: string;
  archivedReason: string;
  pocketbase: {
    host: string;
    port: number;
    url: string;
    proxyPath: string;
    allowedProxyRoutes: string[];
    binaryPathWindows: string;
    binaryPathLinux: string;
    dataDirWindows: string;
    dataDirLinux: string;
    migrationFile: string;
    version: string;
    collectionsOperational: string[];
    collectionsMobileSync: string[];
  };
  expressPersistentStore: {
    defaultDataDir: string;
    productionDataDirLinux: string;
    files: string[];
  };
  bootstrapDefaults: {
    username: string;
    fullName: string;
    email: string;
    roleId: string;
  };
  systemdUnit: string;
  nginxProxyBlock: string;
  caddyfile: string;
}

interface DriverRuntimeState {
  activeDriver: ActiveDbDriver;
  updatedAt: string;
  updatedBy: string;
  pocketbaseUrl?: string;
}

const DEFAULT_PB_ARCHIVE: PocketBaseArchiveConfig = {
  schemaVersion: 1,
  driver: 'pocketbase',
  archivedAt: '2026-11-16T10:12:00.000Z',
  archivedReason: 'Fase pengembangan memakai Firebase Firestore agar data tersimpan permanen lintas re-publish AI Studio.',
  pocketbase: {
    host: '127.0.0.1',
    port: 8091,
    url: 'http://127.0.0.1:8091',
    proxyPath: '/api/ams-pb',
    allowedProxyRoutes: ['GET /api/health', 'GET /api/realtime', 'GET /api/collections/<nama>/records'],
    binaryPathWindows: 'C:\\pocketbase-ams\\pocketbase.exe',
    binaryPathLinux: '/opt/pocketbase-ams/pocketbase',
    dataDirWindows: 'C:\\pocketbase-ams\\pb_data',
    dataDirLinux: '/opt/pocketbase-ams/pb_data',
    migrationFile: 'pb_migrations/1735000000_ams_collections.js',
    version: '0.28.1',
    collectionsOperational: [
      'stok_gudang',
      'gudang_pengaturan',
      'sales_unit_serial',
      'sales_skema_harga',
      'sales_kontrak',
      'sales_rebate',
      'izin_edar',
      'penarikan_produk',
      'sales_pengetahuan_produk',
      'website_published'
    ],
    collectionsMobileSync: [
      'hris_karyawan',
      'hris_shift',
      'hris_absensi',
      'hris_cuti',
      'hris_slip_gaji',
      'sales_pelanggan',
      'sales_prospek',
      'sales_kunjungan',
      'sales_pra_order',
      'penjualan',
      'sales_tender',
      'sales_pengetahuan_produk'
    ]
  },
  expressPersistentStore: {
    defaultDataDir: './data',
    productionDataDirLinux: '/var/lib/ams-data',
    files: ['app-state.json', 'rbac-db.json', 'website-published.json', '.session-secret', 'db-driver.json']
  },
  bootstrapDefaults: {
    username: 'dev.admin',
    fullName: 'Langgo Bramandityo',
    email: 'antraderyll@gmail.com',
    roleId: 'Developer & IT Support'
  },
  systemdUnit:
    '[Unit]\nDescription=PocketBase AMS Integrated System\nAfter=network.target\n\n[Service]\nType=simple\nUser=amsadmin\nWorkingDirectory=/opt/pocketbase-ams\nExecStart=/opt/pocketbase-ams/pocketbase serve --http=127.0.0.1:8091\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target',
  nginxProxyBlock:
    "location /api/ams-pb/ {\n    proxy_pass http://127.0.0.1:8091/;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n    proxy_set_header Connection '';\n    proxy_buffering off;\n    proxy_read_timeout 3600s;\n}",
  caddyfile:
    'alkes.perusahaan-anda.co.id {\n    reverse_proxy localhost:3000\n    handle /api/ams-pb/* {\n        uri strip_prefix /api/ams-pb\n        reverse_proxy 127.0.0.1:8091\n    }\n}'
};

export class ServerDbDriverManager {
  private readonly driverFilePath: string;
  private readonly archiveFilePath: string;
  private state: DriverRuntimeState;
  private pbArchive: PocketBaseArchiveConfig;

  constructor(dataDir: string, rootDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.driverFilePath = path.join(dataDir, 'db-driver.json');
    this.archiveFilePath = path.join(rootDir, 'archive', 'pocketbase-legacy', 'pocketbase-config.json');
    this.pbArchive = this.loadArchiveConfig();
    this.state = this.loadRuntimeState();
  }

  private loadArchiveConfig(): PocketBaseArchiveConfig {
    try {
      if (fs.existsSync(this.archiveFilePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.archiveFilePath, 'utf8')) as Partial<PocketBaseArchiveConfig>;
        if (parsed && parsed.pocketbase?.url) {
          return {
            ...DEFAULT_PB_ARCHIVE,
            ...parsed,
            pocketbase: { ...DEFAULT_PB_ARCHIVE.pocketbase, ...parsed.pocketbase },
            expressPersistentStore: {
              ...DEFAULT_PB_ARCHIVE.expressPersistentStore,
              ...(parsed.expressPersistentStore || {})
            },
            bootstrapDefaults: {
              ...DEFAULT_PB_ARCHIVE.bootstrapDefaults,
              ...(parsed.bootstrapDefaults || {})
            }
          };
        }
      }
    } catch {
      /* fallback ke default archive */
    }
    return DEFAULT_PB_ARCHIVE;
  }

  private loadRuntimeState(): DriverRuntimeState {
    const envDriver = (process.env.AMS_DB_DRIVER || '').trim().toLowerCase();
    try {
      if (fs.existsSync(this.driverFilePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.driverFilePath, 'utf8')) as Partial<DriverRuntimeState>;
        if (parsed.activeDriver === 'firebase' || parsed.activeDriver === 'pocketbase') {
          return {
            activeDriver:
              envDriver === 'pocketbase' || envDriver === 'firebase'
                ? (envDriver as ActiveDbDriver)
                : parsed.activeDriver,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            updatedBy: parsed.updatedBy || 'system',
            pocketbaseUrl: parsed.pocketbaseUrl || this.pbArchive.pocketbase.url
          };
        }
      }
    } catch {
      /* fallback */
    }
    const defaultDriver: ActiveDbDriver = envDriver === 'pocketbase' ? 'pocketbase' : 'firebase';
    const initial: DriverRuntimeState = {
      activeDriver: defaultDriver,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      pocketbaseUrl: this.pbArchive.pocketbase.url
    };
    this.persistState(initial);
    return initial;
  }

  private persistState(target: DriverRuntimeState = this.state): void {
    try {
      const tmp = `${this.driverFilePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(target, null, 2), 'utf8');
      fs.renameSync(tmp, this.driverFilePath);
    } catch {
      /* abaikan error read-only fs */
    }
  }

  public getActiveDriver(): ActiveDbDriver {
    return this.state.activeDriver;
  }

  public getPocketBaseUrl(): string {
    return this.state.pocketbaseUrl || this.pbArchive.pocketbase.url;
  }

  public getPocketBaseArchive(): PocketBaseArchiveConfig {
    return this.pbArchive;
  }

  public getRuntimeSummary() {
    return {
      activeDriver: this.state.activeDriver,
      updatedAt: this.state.updatedAt,
      updatedBy: this.state.updatedBy,
      pocketbaseUrl: this.getPocketBaseUrl(),
      pocketbaseArchived: true,
      pocketbaseArchive: this.pbArchive
    };
  }

  public switchDriver(
    driver: ActiveDbDriver,
    actorUsername: string,
    pocketbaseUrl?: string
  ): ReturnType<ServerDbDriverManager['getRuntimeSummary']> {
    this.state = {
      activeDriver: driver,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUsername,
      pocketbaseUrl: pocketbaseUrl?.trim() || this.state.pocketbaseUrl || this.pbArchive.pocketbase.url
    };
    this.persistState();
    return this.getRuntimeSummary();
  }

  public hydrateArchiveFromCloud(
    driver?: ActiveDbDriver,
    pbArchiveOverride?: Partial<PocketBaseArchiveConfig>,
    actorUsername = 'firebase-hydrate'
  ): void {
    if (pbArchiveOverride && pbArchiveOverride.pocketbase?.url) {
      this.pbArchive = {
        ...this.pbArchive,
        ...pbArchiveOverride,
        pocketbase: { ...this.pbArchive.pocketbase, ...pbArchiveOverride.pocketbase }
      };
      try {
        fs.mkdirSync(path.dirname(this.archiveFilePath), { recursive: true });
        fs.writeFileSync(this.archiveFilePath, JSON.stringify(this.pbArchive, null, 2), 'utf8');
      } catch {
        /* abaikan bila fs read-only */
      }
    }
    if (driver === 'firebase' || driver === 'pocketbase') {
      this.state = {
        ...this.state,
        activeDriver: driver,
        updatedAt: new Date().toISOString(),
        updatedBy: actorUsername
      };
      this.persistState();
    }
  }
}
