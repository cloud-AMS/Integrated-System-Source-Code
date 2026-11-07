import { useState } from 'react';
import { 
  QrCode, 
  Search, 
  AlertOctagon, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Building2, 
  Calendar, 
  FileCheck, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone
} from 'lucide-react';
import { ProductTraceabilityRecord } from '../../../../types/salesMarketing';

interface ProductTraceabilityModuleProps {
  records: ProductTraceabilityRecord[];
  onTriggerRecall: (lotOrSerial: string, reason: string) => void;
}

export default function ProductTraceabilityModule({
  records,
  onTriggerRecall
}: ProductTraceabilityModuleProps) {
  const [activeTab, setActiveTab] = useState<'trace' | 'recall' | 'warranty'>('trace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLotForRecall, setSelectedLotForRecall] = useState<string>('LOT-2025-REAG03');
  const [recallReason, setRecallReason] = useState<string>('Dugaan presipitasi endapan kimia pada larutan konsentrat hemodialisis batch 03');
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [recallSuccessMessage, setRecallSuccessMessage] = useState<string | null>(null);

  const filteredRecords = records.filter(r =>
    r.nomorSeriOrBatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.namaAlkes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.faskesPenerima.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.nomorSO.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExecuteRecall = () => {
    onTriggerRecall(selectedLotForRecall, recallReason);
    setIsRecallModalOpen(false);
    setRecallSuccessMessage(`Simulasi Recall Sukses: Sistem CDAKB telah memetakan seluruh sarana penerima bets ${selectedLotForRecall} dan membekukan sisa stok di seluruh distributor!`);
    setTimeout(() => setRecallSuccessMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'trace'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Batch/Lot & Serial Number Tracking ({records.length})
          </button>

          <button
            onClick={() => setActiveTab('warranty')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'warranty'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Warranty & Instalasi Base (BAST)
          </button>

          <button
            onClick={() => setActiveTab('recall')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'recall'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Simulasi CDAKB Product Recall
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          <span>Standar Ketertelusuran ISO 13485:2016 Klausul 7.5.9</span>
        </div>
      </div>

      {recallSuccessMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm">Peringatan Protokol Recall Aktif!</strong>
            <p className="mt-0.5">{recallSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Tab 1: Batch / Lot & Serial Tracking */}
      {activeTab === 'trace' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor seri, bets, nama alkes, RS..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="text-slate-400">Pencarian Lintas Modul:</span>
              <span className="font-semibold text-emerald-800">Sales Order ↔ Gudang (FEFO) ↔ Faktur ↔ Faskes</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map(rec => (
              <div 
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                      {rec.nomorSeriOrBatch}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rec.statusRecall === 'Aman'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {rec.statusRecall}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                    {rec.tipeTracking}
                  </span>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">
                    {rec.namaAlkes}
                  </h3>

                  <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 p-2 rounded-xl mb-3 border border-emerald-100">
                    NIE: {rec.nomorIzinEdar}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 py-2 border-y border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rumah Sakit Penerima:</span>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[170px]" title={rec.faskesPenerima}>
                        {rec.faskesPenerima}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nomor Sales Order:</span>
                      <span className="font-mono text-slate-700">{rec.nomorSO}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nomor Faktur:</span>
                      <span className="font-mono text-slate-700">{rec.nomorFaktur}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tanggal Pengiriman:</span>
                      <span className="text-slate-700">{rec.tanggalKirim}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Manufaktur: {rec.tanggalManufaktur}</span>
                  {rec.tanggalKedaluwarsa && (
                    <span className="text-amber-700 font-semibold">Exp: {rec.tanggalKedaluwarsa}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Warranty & Installation Base */}
      {activeTab === 'warranty' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nomor Seri & Nama Alkes</th>
                    <th className="py-3 px-4">Rumah Sakit & Nomor BAST</th>
                    <th className="py-3 px-4">Tanggal Instalasi</th>
                    <th className="py-3 px-4">Masa Garansi & Kedaluwarsa</th>
                    <th className="py-3 px-4">Teknisi Instalasi</th>
                    <th className="py-3 px-4">Jadwal PM Pertama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records
                    .filter(r => r.nomorBAST)
                    .map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{rec.nomorSeriOrBatch}</span>
                          <span className="text-[11px] text-slate-600">{rec.namaAlkes}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{rec.faskesPenerima}</span>
                          <span className="text-[10px] font-mono text-emerald-700">{rec.nomorBAST}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {rec.tanggalInstalasi}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {rec.masaGaransiBulan} Bulan Garansi
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Hingga: {rec.akhirGaransi}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {rec.teknisiInstalasi}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-800 font-semibold">
                          {rec.jadwalPMAwal}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Simulasi CDAKB Product Recall */}
      {activeTab === 'recall' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Panel Penarikan Produk Cacat Medis (CDAKB Recall)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mekanisme wajib CDAKB Permenkes 4/2014 & ISO 13485:2016 untuk mengunci dan menarik kembali produk berisiko dalam hitungan detik
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pilih Nomor Bets / Nomor Seri yang Mengalami Defek *
                </label>
                <select
                  value={selectedLotForRecall}
                  onChange={e => setSelectedLotForRecall(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                >
                  <option value="LOT-2025-REAG03">LOT-2025-REAG03 (Hemodialysis Acid Concentrate)</option>
                  <option value="LOT-2026-SYR44">LOT-2026-SYR44 (Auto-Disable Syringe 3ml)</option>
                  <option value="SN-V12-9901">SN-V12-9901 (Patient Monitor V12 Pro)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alasan Teknis Penarikan / Temuan QC *
                </label>
                <textarea
                  rows={3}
                  value={recallReason}
                  onChange={e => setRecallReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                Pemicu recall ini akan otomatis menerbitkan Field Safety Notice (FSN) ke Kementerian Kesehatan RI (e-Watch Alkes) dan mengirimkan broadcast resmi ke seluruh rumah sakit terkait.
              </div>

              <button
                onClick={() => setIsRecallModalOpen(true)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <AlertOctagon className="w-4 h-4" />
                Jalankan Simulasi Penarikan Produk Seketika
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pemetaan Dampak Sebaran Faskes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  Target: {selectedLotForRecall}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Daftar Faskes Penerima Batch Ini:</span>
                  <div className="space-y-1.5 text-slate-200">
                    <div className="flex justify-between">
                      <span className="font-bold">1. RSUD Tarakan Jakarta</span>
                      <span className="font-mono text-emerald-400">120 Galon (INV-2025-06-0310)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">2. RSUP Fatmawati</span>
                      <span className="font-mono text-emerald-400">80 Galon (INV-2025-06-0315)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Blokir Stok di WMS Gudang:</span>
                  <div className="text-rose-400 font-bold flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4" />
                    Auto-Quarantine: 50 Galon di Gudang Dilarang Dijual
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              CDAKB mewajibkan audit ketertelusuran produk dilakukan dalam waktu maksimal 24 jam sejak laporan malfungsi diterima. Sistem ini menyelesaikannya dalam waktu &lt; 1 detik berkat partisi indeks database.
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Recall */}
      {isRecallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                Konfirmasi Pelaksanaan Recall
              </h3>
              <button
                onClick={() => setIsRecallModalOpen(false)}
                className="text-white hover:text-rose-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Anda akan menerbitkan status <strong>RECALL (PENARIKAN PRODUK)</strong> untuk bets <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-bold">{selectedLotForRecall}</code>.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <div>• Mengunci seluruh alokasi FEFO di modul Warehouse.</div>
                <div>• Membuat draf pelaporan ke e-Watch Alkes Kemenkes RI.</div>
                <div>• Mengirim notifikasi penarikan ke seluruh Faskes terkait.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsRecallModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteRecall}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Eksekusi Protokol Recall
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
