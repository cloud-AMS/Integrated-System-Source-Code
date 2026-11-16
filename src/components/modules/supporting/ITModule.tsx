import { useState, useEffect, useMemo } from 'react';
import DeveloperNotes from '../../common/DeveloperNotes';
import { db } from '../../../services/pocketbase';
import type { AksesEfektif, LogAuditTrail, UserRole } from '../../../types';
import { 
  Cpu, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  Server,
  FileCode,
  CheckCircle2,
  FileSpreadsheet,
  Filter,
  Search,
  X,
  FileText,
  Info,
  Users,
  RefreshCw,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Layers,
  Lock,
  Cloud,
  ArrowLeftRight,
  Archive
} from 'lucide-react';
import { 
  downloadIso13485AuditCsv, 
  petakanKlausulIso13485 
} from '../../../utils/auditExportIso13485';
import {
  authFetch,
  bacaSesi,
  hubungkanGoogleFirebaseUntukSync,
  punyaIzin,
  type SesiLogin
} from '../../../utils/autentikasi';
import { SEMUA_ID_MODUL } from '../../../utils/hakAkses';
import { useDbTick } from '../../../hooks/useDbSync';
import { verifikasiRantaiHash } from '../../../utils/gudang';
import type { KategoriPenyimpananData } from '../../../utils/dataOrigin';
import UserAccountRolesModule from '../../dashboard/UserAccountRolesModule';
import RbacManagementTab from './it/RbacManagementTab';

interface DbConfigResponse {
  activeDriver: 'firebase' | 'pocketbase';
  updatedAt?: string;
  updatedBy?: string;
  pocketbaseArchived?: boolean;
  pocketbaseUrl?: string;
  firebase?: {
    configured: boolean;
    projectId?: string;
    firestoreDatabaseId?: string;
    authDomain?: string;
  };
  pocketbaseArchive?: {
    archivedAt?: string;
    archivedReason?: string;
    pocketbase?: {
      url?: string;
      proxyPath?: string;
      version?: string;
      binaryPathWindows?: string;
      binaryPathLinux?: string;
      dataDirWindows?: string;
      dataDirLinux?: string;
      collectionsOperational?: string[];
      collectionsMobileSync?: string[];
    };
    expressPersistentStore?: {
      defaultDataDir?: string;
      productionDataDirLinux?: string;
      files?: string[];
    };
  };
}

export type ITSubTabId = 'traceability' | 'audit' | 'user-roles' | 'deployment';

export interface ITModuleProps {
  currentRole?: UserRole;
  currentUserName?: string;
  aksesAktif?: AksesEfektif;
  akunAktifId?: string;
  activeTab?: ITSubTabId;
  onTabChange?: (tab: ITSubTabId) => void;
  sesi?: SesiLogin;
  onPermissionsUpdated?: () => void;
}

export default function ITModule({
  currentRole,
  currentUserName,
  aksesAktif,
  akunAktifId,
  activeTab: activeTabProp,
  onTabChange,
  sesi,
  onPermissionsUpdated
}: ITModuleProps) {
  const bolehRbac = sesi ? punyaIzin(sesi, 'rbac-admin', 'view') : true;
  const [activeTabLokal, setActiveTabLokal] = useState<ITSubTabId>(activeTabProp || 'traceability');
  const activeTab = activeTabProp ?? activeTabLokal;
  const setActiveTab = (tab: ITSubTabId) => {
    setActiveTabLokal(tab);
    onTabChange?.(tab);
  };
  const aksesEfektif: AksesEfektif = aksesAktif ?? {
    aksesPenuh: true,
    modulDiizinkan: [...SEMUA_ID_MODUL],
    sumber: 'akses-penuh'
  };
  const dbTick = useDbTick(['all', 'connection_status', 'sistem_data_manifest']);
  const [auditList, setAuditList] = useState<LogAuditTrail[]>(db.getAuditTrail());
  const [connStatus, setConnStatus] = useState(db.getConnectionStatus());
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Filter & Search Audit Trail
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('Semua');
  const [selectedIntegrityFilter, setSelectedIntegrityFilter] = useState('Semua');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Pusat Pemisahan Data Dummy vs User, Purge & Sync
  const [filterKategoriData, setFilterKategoriData] = useState<'SEMUA' | KategoriPenyimpananData>('SEMUA');
  const [cariKoleksi, setCariKoleksi] = useState('');
  const [hanyaYangAdaIsi, setHanyaYangAdaIsi] = useState(false);
  const [modalPurge, setModalPurge] = useState<'purge' | 'restore' | 'reset' | null>(null);
  const [pertahankanEditUser, setPertahankanEditUser] = useState(true);
  const [pertahankanStrukturGudang, setPertahankanStrukturGudang] = useState(true);
  const [sedangMemprosesPurge, setSedangMemprosesPurge] = useState(false);
  const [sedangSyncManual, setSedangSyncManual] = useState(false);
  const [dbConfigData, setDbConfigData] = useState<DbConfigResponse | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [switchDriverModal, setSwitchDriverModal] = useState<'firebase' | 'pocketbase' | null>(null);
  const [pocketbaseUrlInput, setPocketbaseUrlInput] = useState('http://127.0.0.1:8091');

  // Sesi pengguna aktif untuk atribusi kepatuhan ALCOA+
  const sesiAktif = sesi ?? bacaSesi();
  const namaAdmin = currentUserName || sesiAktif?.namaPengguna || 'Administrator IT / PJT apt. Dewi Kartika, S.Si';
  const peranAdmin = currentRole || sesiAktif?.peran || 'it_admin';

  // Deployment configs
  const [deploymentConfig, setDeploymentConfig] = useState<{
    caddyfile: string;
    nssmCommands: string[];
  }>({
    caddyfile: `# Caddyfile Konfigurasi Reverse Proxy + HTTPS Otomatis
# Lokasi file: C:\\caddy\\Caddyfile
alkes.perusahaan-anda.co.id {
    # Reverse proxy ke dev/prod server port 3000
    reverse_proxy localhost:3000

    # Header Keamanan Standar Medis & Privasi Data
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Penanganan PocketBase websocket & REST API
    handle /api/pocketbase/* {
        reverse_proxy localhost:8090
    }

    log {
        output file C:\\caddy\\logs\\ams_access.log {
            roll_size 20mb
            roll_keep 10
        }
    }
}`,
    nssmCommands: [
      '# 1. Build lebih dulu (hasilkan dist/ untuk aset dan server.js untuk bundel runtime)',
      'cd C:\\inetpub\\ams-alkes',
      'npm ci',
      'npm run build',
      '',
      '# 2. Pasang Node Express Server sebagai Service Windows',
      'nssm install AMS_AppService "C:\\Program Files\\nodejs\\node.exe" "C:\\inetpub\\ams-alkes\\server.js"',
      'nssm set AMS_AppService AppDirectory "C:\\inetpub\\ams-alkes"',
      'nssm set AMS_AppService AppEnvironmentExtra NODE_ENV=production PORT=3000',
      'nssm set AMS_AppService AppStdout "C:\\inetpub\\ams-alkes\\logs\\service_output.log"',
      'nssm set AMS_AppService AppStderr "C:\\inetpub\\ams-alkes\\logs\\service_error.log"',
      'nssm start AMS_AppService',
      '',
      '# 3. Pasang PocketBase Service di Windows Server',
      'nssm install AMS_PocketBase "C:\\pocketbase\\pocketbase.exe" "serve --http=0.0.0.0:8090"',
      'nssm set AMS_PocketBase AppDirectory "C:\\pocketbase"',
      'nssm set AMS_PocketBase AppStdout "C:\\pocketbase\\logs\\pb_output.log"',
      'nssm start AMS_PocketBase',
      '',
      '# 4. Pasang Caddy Web Server sebagai Service',
      'nssm install CaddyWebServer "C:\\caddy\\caddy.exe" "run --config C:\\caddy\\Caddyfile"',
      'nssm start CaddyWebServer'
    ]
  });

  useEffect(() => {
    authFetch('/api/system/deployment-guides')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.caddyfile && data?.nssmCommands) {
          setDeploymentConfig(data);
        }
      })
      .catch(() => {});

    const muatDbConfig = () => {
      authFetch('/api/system/db-config')
        .then(res => (res.ok ? res.json() : null))
        .then((data: DbConfigResponse | null) => {
          if (data?.activeDriver) {
            setDbConfigData(data);
            if (data.pocketbaseUrl) setPocketbaseUrlInput(data.pocketbaseUrl);
          }
        })
        .catch(() => {});
    };
    muatDbConfig();

    const unsub = db.subscribe('audit_trail', () => {
      setAuditList(db.getAuditTrail());
    });
    const unsubConn = db.subscribe('connection_status', () => {
      setConnStatus(db.getConnectionStatus());
    });
    return () => {
      unsub();
      unsubConn();
    };
  }, []);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleExportBackup = () => {
    const data = {
      tanggalEkspor: new Date().toISOString(),
      izinEdar: db.getIzinEdar(),
      sertifikat: db.getSertifikat(),
      stokGudang: db.getStokGudang(),
      layananTeknis: db.getLayananTeknis(),
      betsProduksi: db.getBetsProduksi(),
      capa: db.getCAPA(),
      ktd: db.getLaporanKTD(),
      penjualan: db.getPenjualan(),
      auditTrail: db.getAuditTrail()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMS_Backup_Alkes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Modul unik yang ada di log audit
  const daftarModulUnik = useMemo(() => {
    const setModul = new Set(auditList.map(a => a.modul).filter(Boolean));
    return ['Semua', ...Array.from(setModul).sort()];
  }, [auditList]);

  // Log Audit yang sudah terfilter
  const auditListTerfilter = useMemo(() => {
    return auditList.filter(item => {
      // Filter modul
      if (selectedModuleFilter !== 'Semua' && item.modul !== selectedModuleFilter) {
        return false;
      }
      // Filter status integritas
      if (selectedIntegrityFilter !== 'Semua' && item.statusIntegritas !== selectedIntegrityFilter) {
        return false;
      }
      // Filter kata kunci pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = item.pengguna.toLowerCase().includes(q);
        const matchRole = item.peran.toLowerCase().includes(q);
        const matchModul = item.modul.toLowerCase().includes(q);
        const matchAct = item.aktivitas.toLowerCase().includes(q);
        const matchRef = item.nomorReferensi.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        return matchUser || matchRole || matchModul || matchAct || matchRef || matchId;
      }
      return true;
    });
  }, [auditList, selectedModuleFilter, selectedIntegrityFilter, searchQuery]);

  const ringkasanAsal = useMemo(() => {
    void dbTick;
    return db.getRingkasanAsalData();
  }, [dbTick]);

  const statusRantaiHash = useMemo(() => {
    void dbTick;
    return {
      gudang: verifikasiRantaiHash(db.getJejakPergerakan()),
      jurnal: db.periksaRantaiJurnal()
    };
  }, [dbTick]);

  const koleksiAsalTerfilter = useMemo(() => {
    const q = cariKoleksi.trim().toLowerCase();
    return ringkasanAsal.koleksi.filter((item) => {
      if (filterKategoriData !== 'SEMUA' && item.kategori !== filterKategoriData) return false;
      if (hanyaYangAdaIsi && item.total === 0) return false;
      if (q) {
        return (
          item.label.toLowerCase().includes(q) ||
          item.modul.toLowerCase().includes(q) ||
          item.key.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ringkasanAsal.koleksi, filterKategoriData, hanyaYangAdaIsi, cariKoleksi]);

  /**
   * Fungsi Ekspor Berkas CSV Log Audit Standar ISO 13485:2016
   * Sesuai Klausul 4.2.4 & 4.2.5 (Control of Records) dan prinsip ALCOA+
   */
  const handleExportIso13485Csv = (hanyaTerfilter = false) => {
    const dataTarget = hanyaTerfilter ? auditListTerfilter : auditList;
    if (dataTarget.length === 0) {
      setExportNotice('Tidak ada catatan audit yang tersedia untuk diekspor.');
      setTimeout(() => setExportNotice(null), 4000);
      return;
    }

    const filterLabel = hanyaTerfilter 
      ? `Terfilter: Modul [${selectedModuleFilter}] | Integritas [${selectedIntegrityFilter}] | Kueri [${searchQuery || '-'}]`
      : 'SEMUA MODUL SISTEM (Full Complete QMS Audit Trail)';

    const hasil = downloadIso13485AuditCsv(dataTarget, {
      namaAdmin,
      peranAdmin: String(peranAdmin),
      filterModul: filterLabel,
      nomorKontrolDokumen: 'AMS-QMS-REC-425-IT',
      namaPerusahaan: 'PT ANUGRAHMITRA SELARAS (AMS)'
    });

    // Catat aksi ekspor ke dalam audit trail itu sendiri (Klausul 4.2.5 & FDA 21 CFR Part 11)
    db.logAudit(
      'IT & Traceability',
      `Ekspor Berkas Log Audit Trail CSV Kepatuhan ISO 13485:2016 Klausul 4.2.5 (${hasil.totalExported} catatan)`,
      'AMS-QMS-REC-425-EXP',
      namaAdmin,
      String(peranAdmin)
    );
    setAuditList(db.getAuditTrail());

    setIsExportModalOpen(false);
    setExportNotice(`Berkas CSV "${hasil.filename}" (${hasil.totalExported} baris) berhasil diunduh sesuai standar ISO 13485:2016.`);
    setTimeout(() => setExportNotice(null), 6000);
  };

  const jalankanSinkronManual = async () => {
    if (sedangSyncManual) return;
    setSedangSyncManual(true);
    try {
      const hasil = await db.syncNow();
      setConnStatus(db.getConnectionStatus());
      setExportNotice(
        hasil.ok
          ? `Sinkronisasi selesai (${hasil.uploaded} unggah, ${hasil.downloaded} pembaruan server).`
          : `Sinkronisasi parsial: masih ada ${hasil.remaining} perubahan menunggu koneksi server.`
      );
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setSedangSyncManual(false);
    }
  };

  const eksekusiAksiData = async () => {
    if (!modalPurge || sedangMemprosesPurge) return;
    setSedangMemprosesPurge(true);
    try {
      if (modalPurge === 'purge') {
        const res = await db.purgeDummyData({
          pertahankanEditUser,
          pertahankanStrukturGudang,
          pelaku: namaAdmin,
          peran: String(peranAdmin)
        });
        setExportNotice(res.pesan);
      } else if (modalPurge === 'restore') {
        const res = await db.pulihkanDataDummy(namaAdmin, String(peranAdmin));
        setExportNotice(res.pesan);
      } else if (modalPurge === 'reset') {
        await db.resetToDefaults();
      }
      setAuditList(db.getAuditTrail());
      setConnStatus(db.getConnectionStatus());
      setModalPurge(null);
      setTimeout(() => setExportNotice(null), 7000);
    } finally {
      setSedangMemprosesPurge(false);
    }
  };

  const muatUlangDbConfig = async () => {
    try {
      const res = await authFetch('/api/system/db-config');
      if (res.ok) {
        const data = (await res.json()) as DbConfigResponse;
        setDbConfigData(data);
        if (data.pocketbaseUrl) setPocketbaseUrlInput(data.pocketbaseUrl);
      }
    } catch {
      /* abaikan error sementara */
    }
  };

  const handleHubungkanAtauSyncFirebase = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    try {
      if (!connStatus.firebaseConnected) {
        const res = await hubungkanGoogleFirebaseUntukSync();
        setExportNotice(res.pesan);
      } else {
        const res = await db.syncWithFirebaseCloud();
        setExportNotice(
          res.ok
            ? `${res.pesan} (${res.pulledEntries} koleksi ditarik, ${res.pushedEntries} diunggah, ${res.rolesSynced} peran & ${res.usersSynced} akun tersinkron).`
            : res.pesan
        );
      }
      setConnStatus(db.getConnectionStatus());
      await muatUlangDbConfig();
      setTimeout(() => setExportNotice(null), 6000);
    } finally {
      setCloudBusy(false);
    }
  };

  const handleArsipkanPocketBaseKeCloud = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    try {
      if (!connStatus.firebaseConnected) {
        const authRes = await hubungkanGoogleFirebaseUntukSync();
        if (!authRes.ok) {
          setExportNotice(authRes.pesan);
          setTimeout(() => setExportNotice(null), 6000);
          return;
        }
      }
      await db.archivePocketBaseSettingsToCloud();
      setConnStatus(db.getConnectionStatus());
      setExportNotice('Pengaturan PocketBase (arsip legacy) berhasil dicadangkan ke Firebase Firestore (ams_archives/pocketbase_legacy).');
      setTimeout(() => setExportNotice(null), 6000);
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : 'Gagal mengarsipkan konfigurasi PocketBase ke Firestore.');
      setTimeout(() => setExportNotice(null), 6000);
    } finally {
      setCloudBusy(false);
    }
  };

  const handleUnduhMigrationBundle = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    try {
      const res = await authFetch('/api/system/migration-bundle');
      if (!res.ok) {
        setExportNotice('Gagal mengunduh paket migrasi database dari server.');
        setTimeout(() => setExportNotice(null), 5000);
        return;
      }
      const bundle = await res.json();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AMS_Migration_Bundle_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice('Paket Migrasi Lengkap (Arsip PocketBase + Akun RBAC + Seluruh Data Aplikasi) berhasil diunduh.');
      setTimeout(() => setExportNotice(null), 6000);
    } finally {
      setCloudBusy(false);
    }
  };

  const eksekusiGantiDriver = async () => {
    if (!switchDriverModal || cloudBusy) return;
    setCloudBusy(true);
    try {
      const res = await db.switchDbDriver(
        switchDriverModal,
        switchDriverModal === 'pocketbase' ? pocketbaseUrlInput.trim() : undefined
      );
      setConnStatus(db.getConnectionStatus());
      await muatUlangDbConfig();
      setSwitchDriverModal(null);
      setExportNotice(res.pesan);
      setTimeout(() => setExportNotice(null), 7000);
    } finally {
      setCloudBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <DeveloperNotes
        items={[
          'Jejak audit dan rantai hash jurnal/pergerakan dihitung & disimpan di perangkat (localStorage). Menghapus data situs menghapus catatannya — ini bukan immutable storage di server.',
          'Kecepatan langganan PocketBase yang ditampilkan modul ini adalah hasil pengecekan lokal (health.check), bukan pengukuran SLA server; tanpa server aktif tampil "Mode Cache Lokal".',
          'Ekspor CSV ALCOA+ yang dihasilkan di sini adalah berkas lokal dari data perangkat ini, bukan keluaran sistem teraudit pihak ketiga.',
          'Infrastruktur & kredensial menu "Panduan Deployment" adalah dokumentasi statis dari berkas kode; belum diuji di server produksi nyata.'
        ]}
      />
      {/* Toast Notifikasi Ekspor Berhasil */}
      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button 
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
              Infrastruktur & Ketelusuran Digital
            </span>
            <span className="text-xs text-slate-500">Integritas Data FDA 21 CFR Part 11 & CDAKB</span>
            <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              ISO 13485:2016 Clause 4.2.5
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Information Technology (IT) & Traceability Hub
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Infrastruktur basis data PocketBase 0.28.1 realtime, jejak audit digital tanpa celah manipulasi berstandar ALCOA+, ekspor CSV kepatuhan ISO 13485 untuk inspektur Kemenkes, serta konfigurasi Windows Server NSSM + Caddy reverse proxy HTTPS.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Ekspor ISO 13485 CSV */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Ekspor Log Audit Trail berformat CSV resmi sesuai ketentuan dokumentasi ISO 13485:2016"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Audit Log ISO 13485 (CSV)
          </button>

          {/* Tombol Cadangan JSON */}
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Unduh seluruh cadangan basis data operasional dalam format JSON mentah"
          >
            <Download className="w-4 h-4" />
            Ekspor Cadangan (JSON)
          </button>
        </div>
      </div>

      {/* Connection & Architecture Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 block text-2xs">Driver Database Aktif:</span>
            <span className="font-bold text-slate-900">
              {connStatus.activeDbDriver === 'firebase' ? 'Firebase Firestore (Dev)' : 'PocketBase 0.28.1'}
            </span>
            <span className="text-2xs text-indigo-700 block">
              {connStatus.activeDbDriver === 'firebase'
                ? 'PocketBase Terarsip Aman • Persisten Re-publish'
                : 'Kanal SSE & SQLite Lokal Aktif'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 block text-2xs">Web Server & HTTPS:</span>
            <span className="font-bold text-slate-900">Caddy Reverse Proxy</span>
            <span className="text-2xs text-blue-700 block">Sertifikat SSL Otomatis Let's Encrypt</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 block text-2xs">Layanan Windows Server:</span>
            <span className="font-bold text-slate-900">NSSM (Service Manager)</span>
            <span className="text-2xs text-amber-700 block">Auto-Restart & Startup Otomatis</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('traceability')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'traceability'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Penyimpanan & Sinkronisasi
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Jejak Audit Trail Digital ({auditList.length})
        </button>

        {bolehRbac && (
        <button
          type="button"
          onClick={() => setActiveTab('user-roles')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'user-roles'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Account &amp; Roles (RBAC Server)
        </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('deployment')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'deployment'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Konfigurasi Caddy & NSSM Windows Server
        </button>
      </div>

      {/* Tab 0: Manajemen RBAC Server / User Account & Roles */}
      {activeTab === 'user-roles' && bolehRbac && (
        sesiAktif ? (
          <RbacManagementTab
            sesi={sesiAktif}
            onPermissionsUpdated={onPermissionsUpdated}
          />
        ) : (
          <UserAccountRolesModule
            aksesAktif={aksesEfektif}
            pelakuAktif={namaAdmin}
            akunAktifId={akunAktifId}
          />
        )
      )}

      {/* Tab 1: Storage, Sync & Pemisahan Data Dummy vs User */}
      {activeTab === 'traceability' && (
        <div className="space-y-4">
          {/* Panel Firebase Cloud (Fase Pengembangan) & Arsip PocketBase */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Database Cloud (Firebase) &amp; Arsip Pengaturan PocketBase
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${
                      connStatus.activeDbDriver === 'firebase'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    {connStatus.activeDbDriver === 'firebase'
                      ? 'Aktif: Firebase Firestore (Fase Pengembangan)'
                      : 'Aktif: PocketBase (Mode Lokal/VPS)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                    <Archive className="w-3 h-3" />
                    Pengaturan PocketBase Terarsip
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  Selama fase pengembangan di AI Studio, perubahan akun pengguna, peran RBAC, CMS website, dan data ERP dicerminkan ke <strong>Firebase Firestore</strong> (<code>{connStatus.firebaseProjectId}</code>) agar tidak hilang ketika aplikasi di-republish. Pengaturan PocketBase (<code>{connStatus.pocketbaseUrl}</code>) tetap tersimpan utuh di arsip dan dapat diaktifkan kembali kapan saja.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleHubungkanAtauSyncFirebase()}
                  disabled={cloudBusy}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudBusy ? 'animate-spin' : ''}`} />
                  {connStatus.firebaseConnected ? 'Sinkronkan 2-Arah Firebase' : 'Hubungkan Google Firebase'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSwitchDriverModal(connStatus.activeDbDriver === 'firebase' ? 'pocketbase' : 'firebase')
                  }
                  disabled={cloudBusy}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {connStatus.activeDbDriver === 'firebase'
                    ? 'Kembalikan ke PocketBase'
                    : 'Gunakan Firebase Dev'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Status Sinkronisasi Firebase Cloud</span>
                  <span
                    className={`px-2 py-0.5 rounded text-2xs font-bold ${
                      connStatus.firebaseConnected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {connStatus.firebaseConnected ? 'Google Terhubung' : 'Belum Terhubung'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs text-slate-700">
                  <div>
                    <span className="text-slate-500 block">Project ID Firebase:</span>
                    <span className="font-mono font-semibold text-slate-900">{connStatus.firebaseProjectId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Akun Google Sync:</span>
                    <span className="font-semibold text-slate-900">
                      {connStatus.firebaseEmail || 'Klik Hubungkan Google Firebase'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Database Firestore ID:</span>
                    <span className="font-mono text-slate-800 break-all">{connStatus.firebaseDatabaseId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sinkron Cloud Terakhir:</span>
                    <span className="font-mono text-slate-800">
                      {connStatus.firebaseSyncedAt
                        ? new Date(connStatus.firebaseSyncedAt).toLocaleString('id-ID')
                        : 'Belum disinkronkan sesi ini'}
                    </span>
                  </div>
                </div>
                {connStatus.firebaseSyncError && (
                  <p className="text-2xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                    {connStatus.firebaseSyncError}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Arsip Konfigurasi PocketBase (Legacy)</span>
                  <span className="text-2xs font-mono text-slate-500">
                    v{dbConfigData?.pocketbaseArchive?.pocketbase?.version || '0.28.1'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs text-slate-700">
                  <div>
                    <span className="text-slate-500 block">Endpoint &amp; Proxy:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {dbConfigData?.pocketbaseArchive?.pocketbase?.url || 'http://127.0.0.1:8091'} ({dbConfigData?.pocketbaseArchive?.pocketbase?.proxyPath || '/api/ams-pb'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Koleksi Terdaftar:</span>
                    <span className="font-semibold text-slate-900">
                      {dbConfigData?.pocketbaseArchive?.pocketbase?.collectionsOperational?.length ?? 10} Operasional • {dbConfigData?.pocketbaseArchive?.pocketbase?.collectionsMobileSync?.length ?? 12} Mobile Sync
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Direktori Binary / Data:</span>
                    <span className="font-mono text-slate-800">
                      {dbConfigData?.pocketbaseArchive?.pocketbase?.dataDirWindows || 'C:\\pocketbase-ams\\pb_data'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Arsip Direktori Repo:</span>
                    <span className="font-mono text-slate-800">archive/pocketbase-legacy/</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleArsipkanPocketBaseKeCloud()}
                    disabled={cloudBusy}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-2xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3 h-3" />
                    Cadangkan Arsip ke Firestore
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUnduhMigrationBundle()}
                    disabled={cloudBusy}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-2xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh Paket Migrasi (JSON)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Status Arsitektur &amp; Auto-Sync Real-Time</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perubahan pada seluruh modul otomatis tersimpan lokal dan disinkronkan ke server persisten.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void jalankanSinkronManual()}
                disabled={sedangSyncManual}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sedangSyncManual ? 'animate-spin' : ''}`} />
                {sedangSyncManual ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900">1. Offline-First Cache Layer</span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Antrean perubahan tertunda bertahan lintas-reload di penyimpanan browser hingga server menerima konfirmasi.
                </p>
                <div className="text-2xs text-indigo-800 font-mono">
                  Antrean pending: {connStatus.pendingCount ?? 0} koleksi
                </div>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">2. Server WebSocket &amp; Batch Sync</span>
                  <Server className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Kanal sinkronisasi pada <code>{connStatus.url}</code> (Revisi #{connStatus.revision ?? 0}).
                </p>
                <div className="text-2xs text-blue-800 font-mono">
                  Status: {connStatus.statusLabel}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">3. Integritas Rantai Hash SHA-256</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Jejak pergerakan stok &amp; buku besar jurnal diverifikasi berantai dari genesis saat purge.
                </p>
                <div className="text-2xs font-mono text-emerald-800 space-y-0.5">
                  <div>
                    Pergerakan Gudang: {statusRantaiHash.gudang.utuh ? 'UTUH' : 'PUTUS'} ({statusRantaiHash.gudang.jumlahBaris} baris)
                  </div>
                  <div>
                    Jurnal Keuangan: {statusRantaiHash.jurnal.valid ? 'UTUH' : 'PUTUS'} ({statusRantaiHash.jurnal.jumlahMata} baris)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pusat Pemisahan Data Dummy vs Data Pengguna & Purge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Pemisahan Data Dummy vs Data Input Pengguna (Purge Center)
                  </h3>
                  {ringkasanAsal.manifest.dummyDihapus ? (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Mode Produksi (Dummy Sudah Dibersihkan)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Data Simulasi / Dummy Masih Terpasang
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                  Sistem melacak asal setiap rekaman secara terpisah. Saat <strong>Purge Data Dummy</strong> dijalankan, seluruh contoh bawaan dihapus serempak hingga ke server, sedangkan data baru input pengguna, akun RBAC, Bagan Akun (CoA), tarif pajak, dan pengaturan Website/Quotation/e-Katalog tetap dipertahankan.
                </p>
                {ringkasanAsal.manifest.dummyDihapusPada && (
                  <p className="text-2xs text-slate-500 mt-1 font-mono">
                    Purge terakhir: {new Date(ringkasanAsal.manifest.dummyDihapusPada).toLocaleString('id-ID')} oleh {ringkasanAsal.manifest.dummyDihapusOleh || '-'}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setModalPurge('purge')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge Data Dummy ({ringkasanAsal.totalDummy})
                </button>
                <button
                  type="button"
                  onClick={() => setModalPurge('restore')}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Pulihkan Simulasi
                </button>
                <button
                  type="button"
                  onClick={() => setModalPurge('reset')}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer"
                >
                  Reset Penuh
                </button>
              </div>
            </div>

            {/* 4 Kartu Ringkasan */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                <span className="text-2xs font-semibold text-amber-800 block">Data Dummy Bawaan</span>
                <span className="text-xl font-bold text-amber-950 font-mono">{ringkasanAsal.totalDummy}</span>
                <span className="text-2xs text-amber-700 block mt-0.5">Akan dihapus saat purge</span>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-2xs font-semibold text-emerald-800 block">Data Baru Input Pengguna</span>
                <span className="text-xl font-bold text-emerald-950 font-mono">{ringkasanAsal.totalUserBaru}</span>
                <span className="text-2xs text-emerald-700 block mt-0.5">100% dipertahankan aman</span>
              </div>
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
                <span className="text-2xs font-semibold text-blue-800 block">Seed Diedit Pengguna</span>
                <span className="text-xl font-bold text-blue-950 font-mono">{ringkasanAsal.totalUserDiedit}</span>
                <span className="text-2xs text-blue-700 block mt-0.5">Opsional dipertahankan saat purge</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-2xs font-semibold text-slate-700 block">Master &amp; Konfigurasi Dilindungi</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {ringkasanAsal.totalMasterSistem + ringkasanAsal.totalKonfigurasiUser}
                </span>
                <span className="text-2xs text-slate-500 block mt-0.5">CoA, Pajak, Periode, Situs &amp; RBAC</span>
              </div>
            </div>

            {/* Filter Tabel Asal Data */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cariKoleksi}
                  onChange={(e) => setCariKoleksi(e.target.value)}
                  placeholder="Cari nama koleksi, modul, atau kunci..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <select
                value={filterKategoriData}
                onChange={(e) => setFilterKategoriData(e.target.value as 'SEMUA' | KategoriPenyimpananData)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="SEMUA">Semua Kategori ({ringkasanAsal.koleksi.length})</option>
                <option value="operasional">Data Operasional (Kena Purge)</option>
                <option value="master_sistem">Master Sistem (CoA, Pajak, Konfig)</option>
                <option value="konfigurasi_user">Konfigurasi User (Website, Quotation, Katalog)</option>
              </select>
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hanyaYangAdaIsi}
                  onChange={(e) => setHanyaYangAdaIsi(e.target.checked)}
                />
                <span>Hanya koleksi berisi data</span>
              </label>
            </div>

            {/* Tabel Rincian Koleksi */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Koleksi Data</th>
                    <th className="py-2.5 px-3">Modul</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Dummy</th>
                    <th className="py-2.5 px-3 text-right">User Baru</th>
                    <th className="py-2.5 px-3 text-right">User Diedit</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {koleksiAsalTerfilter.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Tidak ada koleksi yang sesuai filter saat ini.
                      </td>
                    </tr>
                  ) : (
                    koleksiAsalTerfilter.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{row.label}</div>
                          <div className="text-2xs font-mono text-slate-400">{row.key}</div>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{row.modul}</td>
                        <td className="py-2 px-3">
                          {row.kategori === 'operasional' ? (
                            <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {row.strukturGudang ? 'Struktur Gudang' : 'Operasional'}
                            </span>
                          ) : row.kategori === 'master_sistem' ? (
                            <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Master Sistem
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Konfigurasi User
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-700 font-semibold">{row.dummy}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">{row.userBaru}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-700 font-semibold">{row.userDiedit}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-900 font-bold">{row.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          
          {/* ISO 13485 & ALCOA+ Compliance Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <span>Standar Dokumentasi & Pengendalian Catatan ISO 13485:2016 Klausul 4.2.5</span>
                  <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 text-2xs font-bold rounded">
                    ALCOA+ Compliant
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Seluruh interaksi, modifikasi data, dan otorisasi batch alkes dicatat secara kronologis tanpa celah manipulasi. Dokumen wajib disimpan minimal 5 (lima) tahun sesuai masa retensi regulasi alat kesehatan Kemenkes RI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Buka panel ekspor CSV berstandar ISO 13485:2016"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Ekspor CSV (ISO 13485)
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan pengguna, peran, aktivitas, modul, atau no. referensi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Module Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedModuleFilter}
                  onChange={(e) => setSelectedModuleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Semua">Semua Divisi / Modul</option>
                  {daftarModulUnik.filter(m => m !== 'Semua').map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Integrity Filter */}
              <div>
                <select
                  value={selectedIntegrityFilter}
                  onChange={(e) => setSelectedIntegrityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Semua">Semua Status Integritas</option>
                  <option value="Tervalidasi Digital">Tervalidasi Digital (ALCOA+)</option>
                  <option value="Peringatan">Peringatan</option>
                </select>
              </div>

              {/* Quick Export Button */}
              <button
                onClick={() => handleExportIso13485Csv(true)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Unduh instan hasil filter saat ini dalam format CSV ISO 13485"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh CSV ({auditListTerfilter.length})
              </button>
            </div>

            {/* Status Info Filter */}
            {(selectedModuleFilter !== 'Semua' || selectedIntegrityFilter !== 'Semua' || searchQuery) && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  Menampilkan <strong className="text-slate-800">{auditListTerfilter.length}</strong> dari total <strong>{auditList.length}</strong> rekaman audit trail.
                </span>
                <button
                  onClick={() => {
                    setSelectedModuleFilter('Semua');
                    setSelectedIntegrityFilter('Semua');
                    setSearchQuery('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Daftar Catatan Jejak Audit Resmi (Audit Trail Log Table):
              </span>
              <span className="font-mono text-slate-500 text-xs">
                Total: {auditListTerfilter.length} Baris
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-4">Waktu (WIB)</th>
                    <th className="py-3 px-4">Pengguna & Peran</th>
                    <th className="py-3 px-4">Divisi / Modul</th>
                    <th className="py-3 px-4">Aktivitas Operasional</th>
                    <th className="py-3 px-4">Nomor Referensi</th>
                    <th className="py-3 px-4">Perubahan Kolom (Audit Delta)</th>
                    <th className="py-3 px-4">Klausul ISO 13485:2016</th>
                    <th className="py-3 px-4">Integritas Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {auditListTerfilter.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                        Tidak ada rekaman audit trail yang sesuai dengan kriteria filter atau kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    auditListTerfilter.map((log, index) => {
                      const pemetaan = petakanKlausulIso13485(log.modul, log.aktivitas);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 text-xs">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                            {log.waktu}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <div className="font-bold text-slate-900">{log.pengguna}</div>
                            <div className="text-2xs text-slate-500 font-medium">{log.peran}</div>
                          </td>
                          <td className="py-3 px-4 font-sans font-semibold text-blue-800">
                            {log.modul}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-700 min-w-[200px]">
                            {log.aktivitas}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {log.nomorReferensi}
                          </td>
                          <td className="py-3 px-4 font-sans text-xs text-slate-600 min-w-[180px]">
                            {log.perubahan && log.perubahan.length > 0 ? (
                              <div className="space-y-1">
                                {log.perubahan.map((p, pIdx) => (
                                  <div key={pIdx} className="bg-slate-100 p-1 rounded text-2xs border border-slate-200">
                                    <span className="font-bold text-slate-800">{p.kolom}: </span>
                                    <span className="text-rose-600 line-through">{p.nilaiLama || '(kosong)'}</span>
                                    <span className="text-slate-400"> → </span>
                                    <span className="text-emerald-700 font-bold">{p.nilaiBaru}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-2xs">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans min-w-[170px]">
                            <span className="inline-block px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 text-slate-700 border border-slate-200 leading-tight">
                              {pemetaan.clause}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-2xs font-bold flex items-center gap-1 w-fit ${
                              log.statusIntegritas === 'Tervalidasi Digital'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              {log.statusIntegritas}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Caddy + NSSM Deployment */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          
          {/* Caddyfile Box */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-xs text-white">1. Caddyfile (Reverse Proxy + HTTPS Otomatis)</h4>
              </div>
              <button
                onClick={() => handleCopy(deploymentConfig.caddyfile, 'caddy')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedSection === 'caddy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'caddy' ? 'Tersalin' : 'Salin Caddyfile'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {deploymentConfig.caddyfile}
            </pre>
          </div>

          {/* NSSM Commands Box */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white">2. Perintah Instalasi NSSM di Windows Server (Service Background)</h4>
              </div>
              <button
                onClick={() => handleCopy(deploymentConfig.nssmCommands.join('\n'), 'nssm')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedSection === 'nssm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'nssm' ? 'Tersalin' : 'Salin Perintah CMD'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {deploymentConfig.nssmCommands.join('\n')}
            </pre>
          </div>

        </div>
      )}

      {/* Modal Ekspor Log Audit ISO 13485:2016 */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                      ISO 13485:2016 Clause 4.2.5
                    </span>
                    <span className="text-2xs text-slate-400">CDAKB & ALCOA+</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Ekspor Catatan Audit Trail Digital (CSV)
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Box Spesifikasi Dokumen Regulasi */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Spesifikasi Dokumen Pengendalian Catatan (Control of Records):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Nomor Kontrol Dokumen:</span>
                    <span className="font-mono font-bold text-slate-800">AMS-QMS-REC-425-IT</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Standar Kepatuhan:</span>
                    <span className="font-semibold text-slate-800">ISO 13485:2016, CDAKB, US FDA 21 CFR Part 11</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Administrator Pemohon:</span>
                    <span className="font-semibold text-blue-800">{namaAdmin}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Peran & Otoritas:</span>
                    <span className="font-mono text-slate-800">{peranAdmin}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Format Berkas:</span>
                    <span className="text-slate-800">CSV RFC 4180 (UTF-8 BOM, Kompatibel MS Excel)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Masa Retensi Wajib:</span>
                    <span className="text-emerald-700 font-semibold">Min. 5 Tahun dari Tanggal Penyaluran</span>
                  </div>
                </div>
              </div>

              {/* Prinsip ALCOA+ Checklist */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Integritas Data Sesuai Prinsip ALCOA+ Terpenuhi:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Attributable:</strong> Setiap log terikat pengguna & peran.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Legible & Enduring:</strong> Format CSV UTF-8 tahan lama.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Contemporaneous:</strong> Dicatat seketika (WIB & UTC).</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Original & Accurate:</strong> Jejak delta nilai lama vs baru.</span>
                  </div>
                </div>
              </div>

              {/* Pilihan Cakupan Ekspor */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-slate-900 text-xs">Pilih Cakupan Rekaman yang Ingin Diekspor:</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Pilihan 1: Seluruh Log */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">1. Seluruh Log Audit</span>
                      <span className="px-2 py-0.5 rounded text-2xs font-bold bg-blue-100 text-blue-800">
                        {auditList.length} Rekaman
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ekspor dokumen komprehensif mencakup seluruh aktivitas dari seluruh divisi untuk arsip master audit inspeksi tahunan.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExportIso13485Csv(false)}
                      className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Seluruh Log ({auditList.length})
                    </button>
                  </div>

                  {/* Pilihan 2: Log Terfilter */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Log Terfilter Saat Ini</span>
                      <span className="px-2 py-0.5 rounded text-2xs font-bold bg-indigo-100 text-indigo-800">
                        {auditListTerfilter.length} Rekaman
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Hanya mengekspor baris audit yang cocok dengan filter modul ({selectedModuleFilter}), status integritas, dan kueri pencarian.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExportIso13485Csv(true)}
                      disabled={auditListTerfilter.length === 0}
                      className="w-full mt-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Terfilter ({auditListTerfilter.length})
                    </button>
                  </div>

                </div>
              </div>

              {/* Audit trail disclosure notice */}
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Catatan Otomatisasi Regulasi:</strong> Setiap tindakan ekspor berkas audit log akan secara otomatis dicatat ke dalam log audit sistem itu sendiri (nomor referensi <code>AMS-QMS-REC-425-EXP</code>) guna memenuhi prinsip Non-Repudiation pada US FDA 21 CFR Part 11 & ISO 13485.
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Konfirmasi Purge / Pulihkan Simulasi / Reset Penuh */}
      {modalPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  modalPurge === 'restore' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {modalPurge === 'restore' ? <RotateCcw className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {modalPurge === 'purge' && 'Konfirmasi Purge Data Dummy'}
                    {modalPurge === 'restore' && 'Pulihkan Data Simulasi Standar'}
                    {modalPurge === 'reset' && 'Reset Penuh State Aplikasi'}
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Perubahan disinkronkan secara atomik ke server &amp; perangkat lain
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPurge(null)}
                disabled={sedangMemprosesPurge}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              {modalPurge === 'purge' && (
                <>
                  <p>
                    Sistem akan menghapus <strong className="text-rose-700">{ringkasanAsal.totalDummy} rekaman dummy bawaan</strong> dari semua modul operasional sekaligus menyambung ulang rantai hash SHA-256 gudang dan jurnal keuangan.
                  </p>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                    <div className="font-bold">Tetap Dipertahankan 100%:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-2xs">
                      <li><strong>{ringkasanAsal.totalUserBaru}</strong> data baru yang diinput pengguna</li>
                      <li>Bagan Akun (CoA), periode buku terbuka, dan tetapan tarif pajak</li>
                      <li>Seluruh akun RBAC server &amp; akun developer tersembunyi</li>
                      <li>Draf/terbitan Website, identitas Quotation, dan pengaturan e-Katalog PDF</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pertahankanEditUser}
                        onChange={(e) => setPertahankanEditUser(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Pertahankan rekaman bawaan yang sudah pernah diedit oleh pengguna ({ringkasanAsal.totalUserDiedit} rekaman)
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pertahankanStrukturGudang}
                        onChange={(e) => setPertahankanStrukturGudang(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Pertahankan struktur gudang fisik, daftar lokasi rak/bin, dan aturan put-away (isi bin terpakai tetap direset mengikuti stok tersisa)
                      </span>
                    </label>
                  </div>
                </>
              )}

              {modalPurge === 'restore' && (
                <p>
                  Koleksi operasional akan diisi ulang dengan contoh data simulasi awal agar tim dapat melakukan demonstrasi atau uji alur CDAKB/ISO 13485. Pengaturan situs, quotation, RBAC, CoA, dan pajak tetap terjaga.
                </p>
              )}

              {modalPurge === 'reset' && (
                <p className="text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  <strong>Peringatan:</strong> Reset penuh menghapus seluruh state sinkronisasi data aplikasi (kecuali akun &amp; peran RBAC server) lalu memuat ulang halaman ke kondisi awal sistem. Gunakan opsi <strong>Purge Data Dummy</strong> bila Anda hanya ingin membuang contoh dummy tanpa menghapus data input pengguna.
                </p>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalPurge(null)}
                disabled={sedangMemprosesPurge}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void eksekusiAksiData()}
                disabled={sedangMemprosesPurge}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer disabled:opacity-50 ${
                  modalPurge === 'restore'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {sedangMemprosesPurge
                  ? 'Memproses...'
                  : modalPurge === 'purge'
                    ? 'Ya, Purge Data Dummy'
                    : modalPurge === 'restore'
                      ? 'Ya, Pulihkan Simulasi'
                      : 'Ya, Reset Penuh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pengalihan Driver Database */}
      {switchDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {switchDriverModal === 'pocketbase'
                      ? 'Kembalikan Driver ke PocketBase'
                      : 'Aktifkan Mode Firebase Firestore'}
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Pengaturan arsip PocketBase &amp; data aplikasi tetap aman terjaga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSwitchDriverModal(null)}
                disabled={cloudBusy}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              {switchDriverModal === 'pocketbase' ? (
                <>
                  <p>
                    Server Express akan mengaktifkan kembali rute proxy <code>/api/ams-pb</code> menuju layanan PocketBase serta memuat ulang seluruh konfigurasi dari arsip <code>archive/pocketbase-legacy/</code>.
                  </p>
                  <label className="block">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      URL PocketBase Target
                    </span>
                    <input
                      type="text"
                      value={pocketbaseUrlInput}
                      onChange={(e) => setPocketbaseUrlInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                    />
                  </label>
                </>
              ) : (
                <p>
                  Mode pengembangan akan mengarahkan persistensi data lintas re-publish ke <strong>Firebase Firestore</strong> tanpa menghapus arsip konfigurasi PocketBase.
                </p>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSwitchDriverModal(null)}
                disabled={cloudBusy}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void eksekusiGantiDriver()}
                disabled={cloudBusy}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {cloudBusy ? 'Mengalihkan…' : 'Ya, Terapkan Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
