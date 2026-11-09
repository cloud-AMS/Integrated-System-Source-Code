import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../services/pocketbase';
import type { LogAuditTrail, UserRole } from '../../../types';
import { 
  Cpu, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Server,
  Lock,
  Layers,
  FileCode,
  CheckCircle2,
  FileSpreadsheet,
  Filter,
  Search,
  X,
  Shield,
  FileText,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { 
  downloadIso13485AuditCsv, 
  petakanKlausulIso13485, 
  formatDeltaPerubahan 
} from '../../../utils/auditExportIso13485';
import { bacaSesi } from '../../../utils/autentikasi';

export interface ITModuleProps {
  currentRole?: UserRole;
  currentUserName?: string;
}

export default function ITModule({ currentRole, currentUserName }: ITModuleProps) {
  const [activeTab, setActiveTab] = useState<'traceability' | 'audit' | 'deployment'>('traceability');
  const [auditList, setAuditList] = useState<LogAuditTrail[]>(db.getAuditTrail());
  const [connStatus, setConnStatus] = useState(db.getConnectionStatus());
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Filter & Search Audit Trail
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('Semua');
  const [selectedIntegrityFilter, setSelectedIntegrityFilter] = useState('Semua');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sesi pengguna aktif untuk atribusi kepatuhan ALCOA+
  const sesiAktif = bacaSesi();
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
    fetch('/api/system/deployment-guides')
      .then(res => res.json())
      .then(data => {
        if (data.caddyfile && data.nssmCommands) {
          setDeploymentConfig(data);
        }
      })
      .catch(() => {});

    const unsub = db.subscribe('audit_trail', () => {
      setAuditList(db.getAuditTrail());
    });
    return unsub;
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

  /**
   * Fungsi Ekspor Berkas CSV Log Audit Standar ISO 13485:2016
   * Sesuai Klausul 4.2.4 & 4.2.5 (Control of Records) dan prinsip ALCOA+
   */
  const handleExportIso13485Csv = (hanyaTerfilter = false) => {
    const dataTarget = hanyaTerfilter ? auditListTerfilter : auditList;
    if (dataTarget.length === 0) {
      alert('Tidak ada catatan audit yang tersedia untuk diekspor.');
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
      namaPerusahaan: 'PT ANUGRAH MITRA SELARAS (AMS)'
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

  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan seluruh data simulasi ke pengaturan awal standar?')) {
      db.resetToDefaults();
    }
  };

  return (
    <div className="space-y-6">
      
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
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
              Infrastruktur & Ketelusuran Digital
            </span>
            <span className="text-xs text-slate-500">Integritas Data FDA 21 CFR Part 11 & CDAKB</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
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
            <span className="text-slate-500 block text-[10px]">Basis Data & Kanal Realtime:</span>
            <span className="font-bold text-slate-900">PocketBase 0.28.1</span>
            <span className="text-[10px] text-indigo-700 block">Kanal SSE & SQLite Ringan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Web Server & HTTPS:</span>
            <span className="font-bold text-slate-900">Caddy Reverse Proxy</span>
            <span className="text-[10px] text-blue-700 block">Sertifikat SSL Otomatis Let's Encrypt</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Layanan Windows Server:</span>
            <span className="font-bold text-slate-900">NSSM (Service Manager)</span>
            <span className="text-[10px] text-amber-700 block">Auto-Restart & Startup Otomatis</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('traceability')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'traceability'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Penyimpanan & Sinkronisasi
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Jejak Audit Trail Digital ({auditList.length})
        </button>

        <button
          onClick={() => setActiveTab('deployment')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'deployment'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Konfigurasi Caddy & NSSM Windows Server
        </button>
      </div>

      {/* Tab 1: Storage & Sync Status */}
      {activeTab === 'traceability' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Status Arsitektur Sistem Dual-Layer</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900">1. Offline-First Cache Layer (Browser Storage)</span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Menyimpan seluruh data operasional di memori lokal terenkripsi sehingga sistem gudang dan penerimaan barang tetap dapat bekerja tanpa henti meski koneksi internet terputus.
                </p>
                <div className="text-[10px] text-indigo-800 font-mono">Status: Aktif & Siap Baca-Tulis</div>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">2. PocketBase 0.28.1 Realtime Connector</span>
                  <Server className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Menghubungkan aplikasi ke server PocketBase pada <code>{connStatus.url}</code> untuk sinkronisasi multi-pengguna dan notifikasi instan perubahan batch.
                </p>
                <div className="text-[10px] text-blue-800 font-mono">Konektor: {connStatus.statusLabel}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Kelola data simulasi untuk keperluan demo atau uji coba audit internal:
              </span>
              <button
                onClick={handleResetData}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Reset ke Data Standar
              </button>
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
                  <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 text-[10px] font-bold rounded">
                    ALCOA+ Compliant
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
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
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
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
              <span className="font-mono text-slate-500 text-[11px]">
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
                          <td className="py-3 px-3 text-center text-slate-400 text-[11px]">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                            {log.waktu}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <div className="font-bold text-slate-900">{log.pengguna}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{log.peran}</div>
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
                          <td className="py-3 px-4 font-sans text-[11px] text-slate-600 min-w-[180px]">
                            {log.perubahan && log.perubahan.length > 0 ? (
                              <div className="space-y-1">
                                {log.perubahan.map((p, pIdx) => (
                                  <div key={pIdx} className="bg-slate-100 p-1 rounded text-[10px] border border-slate-200">
                                    <span className="font-bold text-slate-800">{p.kolom}: </span>
                                    <span className="text-rose-600 line-through">{p.nilaiLama || '(kosong)'}</span>
                                    <span className="text-slate-400"> → </span>
                                    <span className="text-emerald-700 font-bold">{p.nilaiBaru}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans min-w-[170px]">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 leading-tight">
                              {pemetaan.clause}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
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
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                      ISO 13485:2016 Clause 4.2.5
                    </span>
                    <span className="text-[10px] text-slate-400">CDAKB & ALCOA+</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-emerald-900">
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {auditList.length} Rekaman
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {auditListTerfilter.length} Rekaman
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
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
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
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

    </div>
  );
}
