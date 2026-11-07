import { useState } from 'react';
import { 
  Database, 
  Server, 
  ShieldCheck, 
  Layers, 
  Network, 
  Cpu, 
  Activity, 
  Code, 
  Clock, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Copy
} from 'lucide-react';
import { PartitionTableInfo, AuditTrailMedis } from '../../../../types/salesMarketing';

interface DbArchitectureViewProps {
  partitions: PartitionTableInfo[];
  auditLogs: AuditTrailMedis[];
}

export default function DbArchitectureView({
  partitions,
  auditLogs
}: DbArchitectureViewProps) {
  const [activeTab, setActiveTab] = useState<'partitioning' | 'microservices' | 'audit'>('partitioning');
  const [copiedSql, setCopiedSql] = useState(false);

  const sampleSqlDdl = `-- ==============================================================
-- POSTGRESQL 16 TABLE PARTITIONING STRATEGY (MED-TECH ERP)
-- Target: Skalabilitas Masif & Kepatuhan Audit CDAKB Kemenkes RI
-- ==============================================================

-- 1. Master Table: Transaksi Penjualan (Range Partitioning by Quarter)
CREATE TABLE public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_so VARCHAR(64) NOT NULL,
    faskes_id VARCHAR(32) NOT NULL,
    tanggal_order DATE NOT NULL,
    nilai_grand_total NUMERIC(16, 2) NOT NULL,
    status_compliance_cdakb VARCHAR(64) NOT NULL,
    status_order VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (tanggal_order);

-- Partisi Kuartal 4 Tahun 2026 (Read/Write Aktif)
CREATE TABLE public.sales_orders_2026_q4 PARTITION OF public.sales_orders
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Partisi Kuartal 3 Tahun 2026 (Historical Read-Only)
CREATE TABLE public.sales_orders_2026_q3 PARTITION OF public.sales_orders
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');

-- 2. Audit Trail Imutabel Regulasi Medis (Append-Only dengan Hash Kriptografis)
CREATE TABLE public.cdakb_regulatory_audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operator_user VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action_type VARCHAR(32) NOT NULL,
    target_table VARCHAR(64) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    compliance_signature VARCHAR(256) NOT NULL
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sampleSqlDdl);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('partitioning')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'partitioning'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            PostgreSQL Partitioning Strategy
          </button>

          <button
            onClick={() => setActiveTab('microservices')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'microservices'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Network className="w-4 h-4 text-blue-400" />
            Modular Monolith & Event Bus
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Audit Trail Medis CDAKB ({auditLogs.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>PostgreSQL Cluster: Master-Replica Connected (p99 latency 1.4ms)</span>
        </div>
      </div>

      {/* Tab 1: PostgreSQL Partitioning */}
      {activeTab === 'partitioning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Skema Partisi Utama</span>
                <h4 className="text-base font-bold text-emerald-400 mt-1">Range & List Hybrid</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Pemisahan tabel transaksi penjualan per kuartal waktu dan data registri faskes per wilayah operasional distribusi.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800 font-mono">
                Index Scan Optimization: ~92% faster query
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Penyimpanan Terarsip (Cold Data)</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">ReadOnly Partitions</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Data penjualan tahun lampau dikunci menjadi Read-Only untuk mencegah perubahan historis (CDAKB Integrity Protection).
                </p>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold pt-3 border-t border-slate-100">
                Memenuhi retensi dokumen medis 5 tahun
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Konektivitas Read-Replica</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">Master-Slave Pooling</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Laporan BI, Demand Forecasting, dan scraper LPSE diarahkan ke Replica Node untuk menjaga performa server order utama.
                </p>
              </div>
              <div className="text-[11px] text-blue-700 font-semibold pt-3 border-t border-slate-100 font-mono">
                Connection Pool: PgBouncer 128 conns
              </div>
            </div>
          </div>

          {/* Partition Tables View */}
          <div className="space-y-4">
            {partitions.map((pt, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-mono">{pt.namaTabel}</h4>
                    <span className="text-xs text-emerald-700 font-medium">{pt.skemaPartisi}</span>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-mono">
                    Partition Key: {pt.kunciPartisi}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {pt.daftarPartisi.map((sub: PartitionTableInfo['daftarPartisi'][0], sIdx: number) => (
                    <div key={sIdx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 font-mono truncate">{sub.namaPartisi}</span>
                        <span className={`w-2 h-2 rounded-full ${sub.status.includes('Aktif') ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        {sub.rentangOrNilai}
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-700 font-mono pt-1 border-t border-slate-200/60">
                        <span>{sub.jumlahRow.toLocaleString('id-ID')} Baris</span>
                        <span className="font-bold">{sub.ukuranData}</span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded block text-center ${
                        sub.status.includes('Aktif') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* DDL Schema Viewer */}
          <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white">postgres_schema_partitioning.sql</span>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Tersalin!' : 'Salin DDL'}
              </button>
            </div>
            <pre className="text-[11px] font-mono overflow-x-auto text-emerald-300 leading-relaxed max-h-64">
              {sampleSqlDdl}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Microservices & Event Bus */}
      {activeTab === 'microservices' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Arsitektur Modular Monolith & Event-Driven Bus</h3>
              <p className="text-xs text-slate-500">
                Interaksi otomatis modul Sales & Marketing dengan modul WMS Gudang, Purchasing, Regulatory, dan Akuntansi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">Modul Sales & SFA</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">Publisher</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Menerbitkan event: <code className="font-mono bg-emerald-100 px-1 rounded">SalesOrderCreated</code> dan <code className="font-mono bg-emerald-100 px-1 rounded">PreOrderLogged</code>.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs">Modul Warehouse (WMS)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-bold text-[10px]">Subscriber</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Menangkap event SO, otomatis mengunci stok sistem FEFO, dan mencetak lembar Picking List obat/alkes.
                </p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-xs">Regulatory Validator</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 font-bold text-[10px]">Interseptor</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Mencegat alur jika nomor izin edar kedaluwarsa atau faskes tidak memiliki izin operasional sah.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs">Finance & Ledger</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">Consumer</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Memotong saldo plafon kredit faskes secara riil dan menjadwalkan aging piutang berdasarkan TOP.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CDAKB Regulatory Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Log Perubahan Data & Kepatuhan Medis (Audit Trail)</h4>
                <p className="text-[11px] text-slate-500">Mencatat User, Timestamp, Nilai Lama, Nilai Baru, dan Integritas Kepatuhan Medis</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                Anti-Tampering Immutability Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Waktu & IP Address</th>
                    <th className="py-3 px-4">Operator & Jabatan</th>
                    <th className="py-3 px-4">Aksi & Entitas</th>
                    <th className="py-3 px-4">Perubahan Nilai (Old vs New)</th>
                    <th className="py-3 px-4">Catatan Kepatuhan CDAKB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-900 font-semibold block">{log.timestamp}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{log.user}</span>
                        <span className="text-[11px] text-slate-500">{log.role}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.action === 'INSERT'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'VALIDASI_CDAKB'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-1 font-mono">{log.entitas}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {log.oldValue !== '-' && (
                          <div className="text-rose-600 line-through">Lama: {log.oldValue}</div>
                        )}
                        <div className="text-emerald-700 font-bold">Baru: {log.newValue}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {log.catatanKepatuhan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
